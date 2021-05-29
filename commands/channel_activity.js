// ---------- DynamoDB Declarations
var AWS = require("aws-sdk");
const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
console.log("Setting endpoint: " + awsDynamoDbEndpoint);

AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = { dynamodb: '2012-08-10' };
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
  name: 'channel_activity',
  description: 'Watch channel activity',
  execute(logger, msg) {
    const messageWordCount = msg.content.trim().split(/\s+/).length;
    
    msg.channel.messages.fetch({ limit: 5 , before: msg.id }).then(function (messages) {
      const nonbot_messages = messages.filter(message => msg.author.bot === false);
      return nonbot_messages.first().createdTimestamp;
    }).then(function (lastChannelMessageDatetime) {
      const lastChannelMessageDelta = msg.createdTimestamp - lastChannelMessageDatetime;
      logger.debug(`serverId: ${msg.guild.id}`);
      logger.debug(`memberId: ${msg.author.id}`);
      logger.debug(`channelId: ${msg.channel.id}`);
      logger.debug(`messageWordCount: ${messageWordCount}`);
      logger.debug(`messageSnowflake: ${msg.id}`);
      logger.debug(`messageLink: ${msg.url}`);
      logger.debug(`messageDateTime: ${msg.createdTimestamp}`);
      logger.debug(`lastChannelMessageDelta: ${lastChannelMessageDelta}`);
    })

  }
}