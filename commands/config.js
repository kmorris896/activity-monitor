// ---------- DynamoDB Configuration
const configTable = "configTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

// ---------- DynamoDB Declarations
var docClient = require("../lib/dynamoDB.js");
// var AWS = require("aws-sdk");
// const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
// console.log("Setting endpoint: " + awsDynamoDbEndpoint);

// AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
// AWS.config.apiVersions = { dynamodb: '2012-08-10' };
// var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  execute(msg, args) {
    if(msg.member.hasPermission('ADMINISTRATOR')) {
      if (args[0].toLowerCase() == "hasrole") {
        const hasRole = msg.mentions.roles.first();
  
        if (typeof hasRole != "undefined") {
          const configItem = {
            TableName: configTable,
            Item: {
              "serverId": msg.guild.id,
              "hasRole": hasRole.id
            }
          }
          
          docClient.putItem(configItem, msg.client.logger);
          // docClient.put(configItem, function(err, data) {
          //   if (err) {
          //     console.error("Unable to PUT item. Error JSON:" + JSON.stringify(err, null, 2));
          //   } else {
          //     console.debug("putItem succeeded:" + JSON.stringify(data, null, 2));
          //     msg.client.botConfig[msg.guild.id].set("hasRole", hasRole.id);
          //     return msg.channel.send("Bot will kick users with the role <@&" + hasRole.id + "> within the timeframe.");
          //   }
          // });
        } else {
          if (msg.client.botConfig[msg.guild.id].has("hasRole")) {
            return msg.channel.send("Bot has been configured to kick users with the role <@&" + msg.client.botConfig[msg.guild.id].get("hasRole") + ">");
          } else {
            return msg.channel.send("Bot has not been configured to look for a role.");
          } 
        }
      }
    } else {
      msg.reply('You must must be an administrator in order configure the bot.')
    }
  },
  getServerConfig(serverId, client, logger, docClient) {
    const configParams = {
      TableName: configTable,
      Key: {
        "serverId": serverId.toString()
      }
    }
  
    docClient.get(configParams, function(err, data) {
      if (err) {
        logger.error("Unable to read item.  Error JSON: " + JSON.stringify(err, null, 2));
      } else {
        if (data.hasOwnProperty("Item") && data.Item.hasOwnProperty("hasRole")) {
          logger.debug("DEPRECATION ALERT: getServerConfig hasRole detected.  Converting to config object");
          client.botConfig[serverId].set("config", convertToConfigObject(serverId, data.Item.hasRole, docClient));
        } else {
          logger.debug("getItem returned empty");
        }  
      }
    });
  }
}

function convertToConfigObject(serverId, hasRole_IN, docClient) {
  const configObject = {
    "hasRole": hasRole_IN,
    "checkInterval": "1h",
    "timeHorizon": "24h",
    "kickMessage": "",
    "kickAnnouncementChannel": ""
  };

  const configItem = {
    TableName: configTable,
    Item: {
      "serverId": serverId,
      "config": configObject
    }
  }
  
  docClient.put(configItem, function(err, data) {
    if (err) {
      console.error("Unable to PUT item. Error JSON:" + JSON.stringify(err, null, 2));
    } else {
      console.debug("putItem succeeded:" + JSON.stringify(data, null, 2));
    }
  });

  return configObject;
}
