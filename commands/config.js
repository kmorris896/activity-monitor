// ---------- DynamoDB Configuration
const configTable = "configTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  async execute(msg, args) {
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

          try {
            await msg.client.dynamoClient.put(configItem);
            msg.client.botConfig[msg.guild.id].config.set("hasRole", hasRole.id);
            return msg.channel.send("Bot will kick users with the role <@&" + hasRole.id + "> within the time horizon.");
          } catch(err) {
            msg.client.logger.error(JSON.stringify(err, null, 2));
            return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }          
        } else {
          if (msg.client.botConfig[msg.guild.id].config.has("hasRole")) {
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
  async getServerConfig(serverId, client, logger) {
    const configParams = {
      TableName: configTable,
      Key: {
        "serverId": serverId.toString()
      }
    }
  
    try {
      const data = await client.dynamoClient.get(configParams).promise();
      if (data.hasOwnProperty("Item") && data.Item.hasOwnProperty("hasRole")) {
        logger.debug("DEPRECATION ALERT: getServerConfig hasRole detected.  Converting to config object");
        client.botConfig[serverId].set("config", convertToConfigObject(serverId, data.Item.hasRole, logger));
      } else {
        logger.debug("getItem returned empty");
      }    
    } catch(err) {
      logger.error("getServerConfig - Unable to read item.  Error JSON: " + JSON.stringify(err, null, 2));
    };

  }
}

function convertToConfigObject(serverId, hasRole_IN, logger) {
  const configObject = {
    "hasRole": hasRole_IN,
    "checkInterval": "1h",
    "timeHorizon": "24h",
    "kickMessage": "",
    "kickAnnouncementChannel": ""
  };

  try{
    saveConfig(serverId, configObject);
  } catch(err) {
    logger.error("Unable able to save config after converting hasRole to Config Object.");
    logger.error(JSON.stringify(err, null, 2));
  }

  return configObject; 
}

function saveConfig(serverId, configObject) {
  const configItem = {
    TableName: configTable,
    Item: {
      "serverId": serverId,
      "config": configObject
    }
  }
  
  docClient.putItem(configItem);
}