// ---------- fs Declarations
const fs = require("fs");

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  async execute(msg, args) {  
    if(msg.member.hasPermission('ADMINISTRATOR')) {

      let configSettingsObject = {};
      for (const key in msg.client.botConfig[msg.guild.id].get("config")) {
        configSettingsObject[key.toLowerCase()] = key;
      }

      if (args.length === 0) {
        msg.reply('You must provide a configuration item in order for the command to work.  Please review the documentation for full details.');
      }
      if ((args.length == 1) && configSettingsObject.hasOwnProperty(args[0].toLowerCase())) {
        const configSetting = args[0].toLowerCase();
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
      msg.reply('You must be an administrator in order configure the bot.');
    }
  },
  async initializeConfig(client, logger) {
    try {
      const configFile = fs.readFileSync('./config/config.json', 'utf8');
      configJson = JSON.parse(configFile);

      for (let configServerId in configJson) {
        if (client.botConfig.hasOwnProperty(configServerId)) {
          logger.info("Re-loading config for server " + configServerId);
          client.botConfig[configServerId] = configJson[configServerId];
        } else {
          logger.info("Loading config for server " + configServerId);
          client.botConfig[configServerId] = configJson[configServerId];
        }
      }
    } catch (err) {
      logger.error("Error loading config file: " + err);
    }
  },
  getServerConfig(serverId, client, logger) {
      if (configJson.hasOwnProperty(serverId)) {
        logger.debug("Found config for server " + serverId);
        client.botConfig[serverId] = configJson[serverId];
      } else {
        logger.debug("No config exists for server " + serverId);
      }
  },
  saveServerConfig(client, logger) {
    fs.writeFile("./config/config.json", JSON.stringify(client.botConfig, null, 2), function(err) {
      if (err) {
        logger.error(err);
      } else {
        logger.debug("The file was saved!");
      }
    });
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
