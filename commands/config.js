// ---------- fs Declarations
const fs = require("fs");


module.exports = {
  name: 'config',
  description: 'Configure the bot',
  execute(msg, args) {
    if (args[0] == "hasrole") {
      const hasRole = msg.mentions.roles.first();

      // If there is a role mentioned, store it in the config
      if (typeof hasRole != "undefined") {
        msg.client.botConfig[msg.guild.id].set("hasRole", hasRole.id);
        msg.channel.send("Bot will kick users with the role <@&" + hasRole.id + "> within the timeframe.");
        this.saveServerConfig(msg.guild.id, msg.client);
      } else {
        if (msg.client.botConfig[msg.guild.id].has("hasRole")) {
          return msg.channel.send("Bot has been configured to kick users with the role <@&" + msg.client.botConfig[msg.guild.id].get("hasRole") + ">");
        } else {
          return msg.channel.send("Bot has not been configured to look for a role.");
        } 
      }
    }
  },
  initializeConfig(client, logger) {
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
