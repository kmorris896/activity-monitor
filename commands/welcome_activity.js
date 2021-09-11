  module.exports = {
  name: 'welcome_activity',
  description: 'Welcome Activity Monitor',

  addMember(memberObject) {
    const logger = memberObject.client.logger;
    // logger.info(JSON.stringify(memberObject));
    logger.info("SERVER JOIN ON " + memberObject.guild.name + " (" + memberObject.guild.id + ")");
    logger.info("memberObject Name: " + memberObject.displayName);
    logger.info("memberObject ID: " + memberObject.id);
    logger.info("Joined at: " + memberObject.joinedTimestamp);

    const values = [memberObject.guild.id, memberObject.id, memberObject.joinedTimestamp]
    let query = "INSERT INTO joinTable (serverId, memberId, joinDateTime) VALUES (?, ?, ?)";
    
    try {
      const info = memberObject.client.db.prepare(query).run(values);
      logger.debug(`Row(s) inserted into joinTable: ${info.changes}`);
    } catch (err) {
      return logger.error(err.message);
    }
  },

  async checkNewArrivals(guildId, client) {
    const oneDay = 1000 * 60 * 60 * 24; // 1 second * 60 = 1 minute * 60 = 1 hour * 24 = 1 day
    var delta = oneDay;

    if (client.botConfig[guildId].hasOwnProperty('timeHorizon')) {
      delta = client.commands.get('config').getMilliseconds(client.botConfig[guildId].timeHorizon);
    }

    var timeHorizon = Date.now() - delta;
    
    client.logger.info("Looking for entries less than: " + timeHorizon);
    client.logger.info("Delta: " + delta);
    client.logger.info("On server: " + guildId);

    let query = "SELECT * FROM joinTable WHERE serverId = ? AND joinDateTime < " + timeHorizon;
    const allRows = await client.db.prepare(query).all(guildId);
    client.logger.info("checkNewArrivals: Found " + allRows.length + " entries");
    for (let i = 0; i < allRows.length; i++) {
      const member = allRows[i];
      let deleteJoinEntry = false;
      const dateObject = new Date(member.joinDateTime);
      client.logger.info("memberId " + member.memberId + " joined " + dateObject.toLocaleString());
      const guildObject = client.guilds.cache.get(member.serverId);
      if (guildObject.member(member.memberId)) {
        if (client.botConfig[member.serverId].has("hasRole") &&
          (guildObject.member(member.memberId).roles.cache.some(role => role.id === client.botConfig[member.serverId].get("hasRole")))) {
            client.logger.debug("User still exists on server and has the role and has been on the server for the allotted time.");
            
            const kickMessage = client.botConfig[member.serverId].kickMessage;
            
            const dmStatus = await client.users.cache.get(member.memberId).send(kickMessage);
            if (typeof dmStatus.id == "string") {
              const kickStatus = await guildObject.member(member.memberId).kick();
              deleteJoinEntry = kickStatus.deleted;
            } 
        } else {
          client.logger.info("User exists but doesn't have the role anymore.  Nothing left to do except delete the entry.");
          deleteJoinEntry = true;
        }
      } else {
        client.logger.info("User is no longer on the server.");
        deleteJoinEntry = true;
      }   
      
      if (deleteJoinEntry) {
        let deleteQuery = "DELETE FROM joinTable WHERE serverId = ? AND memberId = ?";
        try {
          const info = client.db.prepare(deleteQuery).run(member.serverId, member.memberId);
          client.logger.debug(`deleteJoinEntry: Row(s) updated: ${this.changes}`);
        } catch (err) {
          return logger.error(err.message);
        }
      } else {
        client.logger.info("User could not be deleted.");
      }
    }  
  }
};
