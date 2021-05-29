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
  }
};