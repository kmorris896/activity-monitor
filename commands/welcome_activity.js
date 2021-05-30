// ---------- DynamoDB Configuration
const joinTable   = "joinTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

module.exports = {
  name: 'welcome_activity',
  description: 'Welcome Activity Monitor',

  addMember(memberObject, logger, docClient) {
    // logger.info(JSON.stringify(memberObject));
    logger.info("SERVER JOIN ON " + memberObject.guild.name + " (" + memberObject.guild.id + ")");
    logger.info("memberObject Name: " + memberObject.displayName);
    logger.info("memberObject ID: " + memberObject.id);
    logger.info("Joined at: " + memberObject.joinedTimestamp);

    let memberItem = {
      TableName: joinTable,
      Item: {
        "serverId": memberObject.guild.id,
        "memberId": memberObject.id,
        "joinDateTime": memberObject.joinedTimestamp
      }
    }
    
    logger.info("Adding to DynamoDB...");

    docClient.put(memberItem, function(err, data) {
      if (err) {
        logger.error("Unable to PUT item. Error JSON: " + JSON.stringify(err, null, 2));
      } else {
        logger.debug("putItem succeeded: " + JSON.stringify(data, null, 2));
      }
    });
  },

  checkNewArrivals(guildId, client, logger, docClient) {
    const oneDay = 1000 * 60 * 60 * 24; // 1 second * 60 = 1 minute * 60 = 1 hour * 24 = 1 day
    const timeHorizon = Date.now() - oneDay;
    
    logger.info("Looking for entries less than: " + timeHorizon);
    logger.info("On server: " + guildId);
  
    let params = {
      TableName: joinTable,
      IndexName: "joinTable_joinDateTime",
      KeyConditionExpression: "serverId = :serverId AND joinDateTime < :datetime",
      ExpressionAttributeValues: {
        ":serverId": guildId,
        ":datetime": timeHorizon
      } 
    };
  
  
    docClient.query(params, async function(err, data) {
      if (err) {
        logger.error("Unable to query DynamoDB: " + JSON.stringify(err, null, 2));
        return 0;
      }
  
      logger.debug("Items retrieved: " + data.Items.length);
      data.Items.forEach(async function (member) {
        let deleteJoinEntry = false;
        const dateObject = new Date(member.joinDateTime);
        logger.debug("memberId " + member.memberId + " joined " + dateObject.toLocaleString());
  
        const guildObject = client.guilds.cache.get(member.serverId);
        if (guildObject.member(member.memberId)) {
          if (client.botConfig[member.serverId].has("hasRole") &&
            (guildObject.member(member.memberId).roles.cache.some(role => role.id === client.botConfig[member.serverId].get("hasRole")))) {
              logger.info("User still exists on server and has the role and has been on the server for the allotted time.");
              
              const kickMessage = "Thank you very much for checking us out.  I know life can get busy but since you haven't posted an acceptable intro within 24 hours, I'm giving you a polite nudge.\n\nYou are welcome back anytime by accepting this invite: https://discord.gg/2dXsVsMgUQ";
              
              const dmStatus = await sendDM(member.memberId, kickMessage); 
              const kickStatus = await guildObject.member(member.memberId).kick("Kicked for failing to create an intro within 24 hours.");
              deleteJoinEntry = kickStatus.deleted;
          } else {
            logger.info("User exists but doesn't have the role anymore.  Nothing left to do except delete the entry.");
            deleteJoinEntry = true;
          }
        } else {
          logger.info("User is no longer on the server.");
          deleteJoinEntry = true;
        }   
        
        if (deleteJoinEntry) {
          const deleteParams = {
            TableName: joinTable,
            Key: {
              "serverId": member.serverId,
              "memberId": member.memberId
            }
          };
  
          docClient.delete(deleteParams, function(err, data) {
            if (err) {
              logger.error("Unable to DELETE item. Error JSON: " + JSON.stringify(err, null, 2));
            } else {
              logger.debug("deleteItem succeeded: " + JSON.stringify(data, null, 2));
            }
          });
        } else {
          logger.info("User could not be deleted.");
        }
      });
    });
  
  }
};