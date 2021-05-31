// ---------- DynamoDB Configuration
const configTable = "configTable_" + process.env.DYNAMODB_TABLE_IDENTIFIER;

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  async execute(msg, args) {  
    if(msg.member.hasPermission('ADMINISTRATOR')) {
      const configSetting = args[0].toLowerCase();

      let configSettingsObject = {};
      for (const key in msg.client.botConfig[msg.guild.id].get("config")) {
        configSettingsObject[key.toLowerCase()] = key;
      }

      if ((args.length == 1) && configSettingsObject.hasOwnProperty(configSetting)) {
        const key = configSettingsObject[configSetting];
        msg.client.logger.debug("has command: " + configSetting + " which maps to: " + key);
        
        let replyMessage = "";
        if (msg.client.botConfig[msg.guild.id].get("config").hasOwnProperty(key) && (msg.client.botConfig[msg.guild.id].get("config")[key] !="")) {
          switch (configSetting) {
            case "hasrole":
              replyMessage = "Bot will kick users with the role <@&" + msg.client.botConfig[msg.guild.id].get("config")[key] + "> within the time horizon.";
              break;
          
            case "kickannouncementchannel":
              replyMessage = "Bot will announce kicks in <#" + msg.client.botConfig[msg.guild.id].get("config")[key] + ">.";
              break;

            case "kickmessage":
              replyMessage = "Bot will send the following kick message:\n> " + msg.client.botConfig[msg.guild.id].get("config")[key];
              break;

            default:
              replyMessage = key + " has value: `" + msg.client.botConfig[msg.guild.id].get("config")[key] + "`";
              break;
          }
        } else {
          replyMessage = key + " has not been defined.";
        }

        msg.channel.send(replyMessage);
      }

      if ((args.length > 1) && (args[0].toLowerCase() == "hasrole")) {
        msg.client.logger.debug("config hasrole");
        const hasRole = msg.mentions.roles.first();
  
        if (typeof hasRole != "undefined") {
          try {
            msg.client.botConfig[msg.guild.id].get("config").hasRole = hasRole.id;
            await saveConfig(msg.guild.id, msg.client);
            return msg.channel.send("Bot will kick users with the role <@&" + msg.client.botConfig[msg.guild.id].get("config").hasRole + "> within the time horizon.");
          } catch(err) {
            msg.client.logger.error("config hasrole - unable to store config item into database: " + JSON.stringify(err, null, 2));
            return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }          
        }
      } else if ((args.length > 1) && (args[0].toLowerCase() == "kickannouncementchannel")) {
        msg.client.logger.debug("config kickannouncementchannel");
        const hasChannel = msg.mentions.channels.first();

        if (typeof hasChannel != "undefined") {
          try {
            msg.client.botConfig[msg.guild.id].get("config").kickAnnouncementChannel = hasChannel.id;
            await saveConfig(msg.guild.id, msg.client);
            return msg.channel.send("Bot will announce kicks in <#" + msg.client.botConfig[msg.guild.id].get("config").kickAnnouncementChannel + ">.");
          } catch(err) {
            msg.client.logger.error("config kickAnnouncementChannel - unable to store config item into database: " + JSON.stringify(err, null, 2));
            return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }          
        }
      } else if ((args.length > 1) && (args[0].toLowerCase() == "kickmessage")) {
        msg.client.logger.debug("config kickmessage");
        const PREFIX = "<@!" + msg.client.user.id + "> config " + args[0] + " ";
        const message = msg.content.substring(PREFIX.length)

        try {
          msg.client.botConfig[msg.guild.id].get("config").kickMessage = message;
          await saveConfig(msg.guild.id, msg.client);
          return msg.channel.send("Bot will send the following kick message:\n> " + msg.client.botConfig[msg.guild.id].get("config").kickMessage);
        } catch(err) {
          msg.client.logger.error("config kickmessage - unable to store config item into database: " + JSON.stringify(err, null, 2));
          return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
        }          
      }
    } else {
      msg.reply('You must must be an administrator in order configure the bot.')
    }
  },

  async getServerConfig(serverId, client) {
    const configParams = {
      TableName: configTable,
      Key: {
        "serverId": serverId.toString()
      }
    }
  
    try {
      const data = await client.dynamoClient.get(configParams).promise();

      if (data.hasOwnProperty("Item") && data.Item.hasOwnProperty("hasRole")) {
        client.logger.debug("DEPRECATION ALERT: getServerConfig hasRole detected.  Converting to config object");
        client.botConfig[serverId].set("config", convertToConfigObject(serverId, data.Item.hasRole, client));
      } else if (data.hasOwnProperty("Item") && data.Item.hasOwnProperty("config")) {
        client.logger.debug("Setting server Config to DynamoDB stored values.");
        client.botConfig[serverId].set("config", data.Item.config);
        client.logger.debug("config: " + JSON.stringify(client.botConfig[serverId].get("config")));
      } else {
        client.logger.debug("getItem returned empty");
      }    
    } catch(err) {
      client.logger.error("getServerConfig - Unable to read item.  Error JSON: " + JSON.stringify(err, null, 2));
    };

  }
}

async function convertToConfigObject(serverId, hasRole_IN, logger) {
  const configObject = {
    "hasRole": hasRole_IN,
    "checkInterval": "1h",
    "timeHorizon": "24h",
    "kickMessage": "",
    "kickAnnouncementChannel": ""
  };

  client.botConfig[serverId].set("config", configObject);

  try{
    await saveConfig(serverId, client);
  } catch(err) {
    logger.error("Unable able to save config after converting hasRole to Config Object.");
    logger.error(JSON.stringify(err, null, 2));
  }

  return configMap; 
}

async function saveConfig(serverId, client) {
  client.logger.debug("Saving Config for " + serverId)
  const configItem = {
    TableName: configTable,
    Item: {
      "serverId": serverId,
      "config": client.botConfig[serverId].get("config")
    }
  }
  
  client.logger.debug(JSON.stringify(configItem));
  try {
    const results = await client.dynamoClient.put(configItem).promise();
    return results;
  } catch (err) {
    client.logger.error("config.js - saveConfig - Error saving config: " + JSON.stringify(err, null, 2));
  }
  
}
