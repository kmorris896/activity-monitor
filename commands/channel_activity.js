const chatTable = "chatTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

module.exports = {
  name: 'channel_activity',
  description: 'Watch channel activity',
  execute(msg, logger, docClient) {
    const messageWordCount = msg.content.trim().split(/\s+/).length;

    if (msg.content.startsWith('!') || msg.content.startsWith('.') || msg.author.bot === true) 
      return false;
    
    msg.channel.messages.fetch({ limit: 5 , before: msg.id }).then(function (messages) {
      const nonbot_messages = messages.filter(message => msg.author.bot === false);
      return nonbot_messages.first().createdTimestamp;
    }).then(function (lastChannelMessageDatetime) {
      const lastChannelMessageDelta = msg.createdTimestamp - lastChannelMessageDatetime;

      let chatItem = {
        TableName: chatTable,
        Item: {
          "serverId": msg.guild.id,
          "memberId": msg.author.id,
          "channelId": msg.channel.id,
          "messageWordCount": messageWordCount,
          "messageSnowflake": msg.id,
          "messageLink": msg.url,
          "messageDateTime": msg.createdTimestamp,
          "lastChannelMessageDelta": lastChannelMessageDelta
        }
      }
      
      logger.debug(`serverId: ${msg.guild.id}`);
      logger.debug(`memberId: ${msg.author.id}`);
      logger.debug(`channelId: ${msg.channel.id}`);
      logger.debug(`messageWordCount: ${messageWordCount}`);
      logger.debug(`messageSnowflake: ${msg.id}`);
      logger.debug(`messageLink: ${msg.url}`);
      logger.debug(`messageDateTime: ${msg.createdTimestamp}`);
      logger.debug(`lastChannelMessageDelta: ${lastChannelMessageDelta}`);

      return docClient.put(chatItem, function(err, data) {
        if (err) {
          logger.error("Unable to PUT chat item.  Error JSON: " + JSON.stringify(err, null, 2));
          return true;
        } else {
          logger.debug("chatItem putItem succeeded!");
          return false;
        }
      });
    });
  }
}