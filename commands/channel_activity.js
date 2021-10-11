require('../');

module.exports = {
  name: 'channel_activity',
  description: 'Watch channel activity',
  async execute(msg) {
    const logger = msg.client.logger;
    const messageWordCount = msg.content.trim().split(/\s+/).length;

    if (msg.content.startsWith('!') || msg.content.startsWith('.') || msg.author.bot === true) 
      return false;
    
    msg.channel.messages.fetch({ limit: 5 , before: msg.id }).then(function (messages) {
      const nonbot_messages = messages.filter(message => msg.author.bot === false);
      return nonbot_messages.first().createdTimestamp;
    }).then(function (lastChannelMessageDatetime) {
      const lastChannelMessageDelta = msg.createdTimestamp - lastChannelMessageDatetime;
      const userLastMessageDelta = getUserLastMessageDelta(msg);

      logger.debug(`serverId: ${msg.guild.id}`);
      logger.debug(`memberId: ${msg.author.id}`);
      logger.debug(`channelId: ${msg.channel.id}`);
      logger.debug(`messageWordCount: ${messageWordCount}`);
      logger.debug(`messageSnowflake: ${msg.id}`);
      logger.debug(`messageLink: ${msg.url}`);
      logger.debug(`messageDateTime: ${msg.createdTimestamp}`);
      logger.debug(`lastChannelMessageDelta: ${lastChannelMessageDelta}`);

      let chatItem = [
        msg.guild.id,
        msg.id,
        msg.channel.id,
        lastChannelMessageDelta,
        msg.author.id,
        msg.createdTimestamp,
        msg.url,
        messageWordCount,
        userLastMessageDelta
      ];

      try {
        const info = msg.client.db.prepare(`INSERT INTO chatTable (serverId, messageId, channelId, 
          lastChannelMessageDelta, memberId, messageDateTime, messageLink, messageWordCount, userLastMessageDelta) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(chatItem);
        logger.info('New message added to chatTable');
      } catch (err) {
            logger.error(err);
      }
    });
  },
  async getUserActivity(msg) {
    let userActive = false;

    // Only check user activity if the user is NOT currently active 
    // and doesn't have an ignorable role
    if ((msg.member.roles.cache.some(role => role.id === msg.client.botConfig[msg.guild.id].chatActivity.roles.active) === false) &&
        (msg.member.roles.cache.some(memberRole => msg.client.botConfig[msg.guild.id].chatActivity.roles.ignoreAny.some(ignoreRole => ignoreRole.id === memberRole.id)) === false)) {
      userActive = await getUserHistory(msg);
      
      if (userActive === true) {
        msg.client.logger.info(`getUserHistory: adding active role for ${msg.author.id}`)
        msg.member.roles.add(msg.client.botConfig[msg.guild.id].chatActivity.roles.active);
        if (msg.client.botConfig[msg.guild.id].chatActivity.roles.hasOwnProperty("inactive") 
            && msg.client.botConfig[msg.guild.id].chatActivity.roles.inactive.length > 0) {
          msg.client.logger.info(`getUserHistory: removing inactive role from ${msg.author.username}`);
          msg.member.roles.remove(msg.client.botConfig[msg.guild.id].chatActivity.roles.inactive);
        }
      }
    }
  
    return userActive;
  }
}

async function getUserLastMessageDelta(msg) {
  const logger = msg.client.logger;
  const row = msg.client.db.prepare(`SELECT messageDateTime FROM chatTable 
    WHERE serverId = ? AND memberId = ? ORDER BY messageDateTime DESC LIMIT 1;`).get(msg.guild.id, msg.author.id);

  var userLastMessageDelta = 604800000;
  if (typeof row !== 'undefined') {
    userLastMessageDelta = msg.createdTimestamp - row.messageDateTime;
  }

  logger.debug(`Last message delta for ${msg.author.username} is ${userLastMessageDelta}`);
  return userLastMessageDelta;
}

async function getUserHistory(msg) {
  let userActive = false;
  const logger = msg.client.logger;
  const row = msg.client.db.prepare(`
    SELECT COUNT(messageId) AS MESSAGES
        , AVG(messageWordCount) AS AVG_WORDS
    FROM chatTable
    WHERE 
          serverId = ? 
      AND memberId = ?
      AND DATETIME(messageDateTime/1000, 'unixepoch') >= DATE('now', '-30 minutes');`).get(msg.guild.id, msg.author.id);

  if (typeof row === 'undefined') {
    logger.error("getUserHistory: Database return undefined.");
  } else {
    logger.debug(`getUserHistory: ${row.MESSAGES} messages with an average of ${row.AVG_WORDS} in the last 30 minutes.`);
    if ((row.MESSAGES >= 5) && (row.AVG_WORDS >= 5)) {
      logger.debug(`getUserHistory: returning true`);
      userActive = true;
    }
  }

  return userActive;
}