// ---------- DynamoDB Declarations
var AWS = require("aws-sdk");
const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
console.log("Setting endpoint: " + awsDynamoDbEndpoint);

AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = { dynamodb: '2012-08-10' };
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  execute(msg, args) {
    if (args[0] == "hasrole") {
      const hasRole = msg.mentions.roles.first();

      if (typeof hasRole != "undefined") {
        const configItem = {
          TableName: "configTable_d8c7c4d5",
          Item: {
            "serverId": msg.guild.id,
            "hasRole": hasRole.id
          }
        }
        
        docClient.put(configItem, function(err, data) {
          if (err) {
            console.error("Unable to PUT item. Error JSON:" + JSON.stringify(err, null, 2));
          } else {
            console.debug("putItem succeeded:" + JSON.stringify(data, null, 2));
            msg.client.botConfig[msg.guild.id].set("hasRole", hasRole.id);
            return msg.channel.send("Bot will kick users with the role <@&" + hasRole.id + "> within the timeframe.");
          }
        });
      } else {
        if (msg.client.botConfig[msg.guild.id].has("hasRole")) {
          return msg.channel.send("Bot has been configured to kick users with the role <@&" + msg.client.botConfig[msg.guild.id].get("hasRole") + ">");
        } else {
          return msg.channel.send("Bot has not been configured to look for a role.");
        } 
      }
    }
  }
}
