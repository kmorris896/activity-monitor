const chatTable = "chatTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

module.exports = {
  name: 'channel_activity',
  description: 'Watch channel activity',
  execute(msg) {
    const logger = msg.client.logger;
    const messageWordCount = msg.content.trim().split(/\s+/).length;

    if (msg.content.startsWith('!') || msg.content.startsWith('.') || msg.author.bot === true) 
      return false;
    
    msg.channel.messages.fetch({ limit: 5 , before: msg.id }).then(function (messages) {
      const nonbot_messages = messages.filter(message => msg.author.bot === false);
      return nonbot_messages.first().createdTimestamp;
    }).then(function (lastChannelMessageDatetime) {
      const lastChannelMessageDelta = msg.createdTimestamp - lastChannelMessageDatetime;
      const userLastMessageDelta = getUserLastMessageDelta(msg, logger);

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
  }
}

function getUserLastMessageDelta(msg, logger) {
  const row = msg.client.db.prepare(`SELECT messageDateTime FROM chatTable 
    WHERE serverId = ? AND memberId = ? ORDER BY messageDateTime DESC LIMIT 1;`).get(msg.guild.id, msg.author.id);

  var userLastMessageDelta = 604800000;
  if (typeof row !== 'undefined') {
    userLastMessageDelta = msg.createdTimestamp - row.messageDateTime;
  }

  logger.debug(`Last message delta for ${msg.author.username} is ${userLastMessageDelta}`);
  return userLastMessageDelta;
}