// ---------- fs Declarations
const { MessageFlags } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  async execute(msg, args) {  
    if(msg.member.permissions.has('ADMINISTRATOR')) {

      // Create a lowercase version of each config option so we can map to them
      const configSettingsOptions = ["hasRole", "kickAnnouncementChannel", "kickMessage", "timeHorizon", "checkInterval", "watchChannel", 'unwatchChannel'];
      let configSettingsObject = {};
      configSettingsOptions.forEach(key => {
        configSettingsObject[key.toLowerCase()] = key;
      });
      
      if (args.length === 0) {
        msg.channel.send(`The current settings are: ${JSON.stringify(msg.client.botConfig[msg.guild.id])}`);
        msg.reply('You must provide a configuration item in order for the command to work.  Please review the documentation for full details.');
      }

      if ((args.length == 1) && configSettingsObject.hasOwnProperty(args[0].toLowerCase())) {
        const configSetting = args[0].toLowerCase();
        const key = configSettingsObject[configSetting];
        msg.client.logger.debug("has command: " + configSetting + " which maps to: " + key);
        
        let replyMessage = "";
        if (msg.client.botConfig[msg.guild.id].hasOwnProperty(key) && (msg.client.botConfig[msg.guild.id][key] !="")) {
          switch (configSetting) {
            case "hasrole":
              replyMessage = "Bot will kick users with the role <@&" + msg.client.botConfig[msg.guild.id][key] + "> within the time horizon.";
              break;
          
            case "kickannouncementchannel":
              replyMessage = "Bot will announce kicks in <#" + msg.client.botConfig[msg.guild.id][key] + ">.";
              break;

            case "kickmessage":
              replyMessage = "Bot will send the following kick message:\n> " + msg.client.botConfig[msg.guild.id][key];
              break;

            case "unwatchchannel":
            case "watchchannel":
              replyMessage = "Bot is watching the following channels for activity: " + msg.client.botConfig[msg.guild.id][key].join("\n");
              break;

            default:
              replyMessage = key + " has value: `" + msg.client.botConfig[msg.guild.id][key] + "`";
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
            msg.client.botConfig[msg.guild.id].hasRole = hasRole.id;
            await saveServerConfig(msg.client);
            return msg.channel.send("Bot will kick users with the role <@&" + msg.client.botConfig[msg.guild.id].hasRole + "> within the time horizon.");
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
            msg.client.botConfig[msg.guild.id].kickAnnouncementChannel = hasChannel.id;
            msg.client.logger.debug("config kickannouncementchannel - hasChannel.id: " + hasChannel.id);
            await saveServerConfig(msg.client);
            return msg.channel.send("Bot will announce kicks in <#" + msg.client.botConfig[msg.guild.id].kickAnnouncementChannel + ">.");
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
          msg.client.botConfig[msg.guild.id].kickMessage = message;
          await saveServerConfig(msg.client);
          return msg.channel.send("Bot will send the following kick message:\n> " + msg.client.botConfig[msg.guild.id].kickMessage);
        } catch(err) {
          msg.client.logger.error("config kickmessage - unable to store config item into database: " + JSON.stringify(err, null, 2));
          return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
        }          
      } else if ((args.length > 1) && (args[0].toLowerCase() == "timehorizon")) {
        msg.client.logger.debug("config timehorizon");
        if (parseTime(args[1]) > 0) {
          try {
            msg.client.botConfig[msg.guild.id].timeHorizon = args[1];
            await saveServerConfig(msg.client);
            return msg.channel.send("Time horizon set to " + args[1] + " = " + parseTime(args[1]) + " milliseconds.");
          } catch(err) {
            msg.client.logger.error("config timehorizon - unable to store config item into database: " + JSON.stringify(err, null, 2));
            return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }          
        } else {
          msg.reply("Please provide a valid time.  Only hour, minute, and second durations are allowed.  Example: `1h30m20s`.");
        }
      } else if ((args.length > 1) && (args[0].toLowerCase() == "checkinterval")) {
        msg.client.logger.debug("config checkinterval");
        if (parseTime(args[1]) > 0) {
          try {
            msg.client.botConfig[msg.guild.id].checkInterval = args[1];
            await saveServerConfig(msg.client);
            if (msg.client.checkNewArrivalInterval.hasOwnProperty(msg.guild.id)) {
              clearInterval(msg.client.checkNewArrivalInterval[msg.guild.id]);
            }
            msg.client.checkNewArrivalInterval[msg.guild.id] = setInterval(msg.client.commands.get('welcome_activity').checkNewArrivals, parseTime(args[1]), msg.guild.id, msg.client);
            return msg.channel.send("checkInterval set to " + args[1] + " = " + parseTime(args[1]) + " milliseconds.");
          } catch(err) {
            msg.client.logger.error("config checkinterval - unable to store config item into database: " + JSON.stringify(err, null, 2));
            return msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }          
        } else {
          msg.reply("Please provide a valid time.  Only hour, minute, and second durations are allowed.  Example: `1h30m20s`.");
        }
      } else if ((args.length > 1) && (args[0].toLowerCase() == "watchchannel")) {
        msg.client.logger.debug("config watchchannel");
        const hasChannel = msg.mentions.channels.first();
        
        if (typeof hasChannel != "undefined") {
          try {
            if (typeof msg.client.botConfig[msg.guild.id].watchChannel == "undefined") {
              msg.client.botConfig[msg.guild.id].watchChannel = [];
            }

            if (msg.client.botConfig[msg.guild.id].watchChannel.indexOf(hasChannel.id) == -1) {
              msg.client.botConfig[msg.guild.id].watchChannel.push(hasChannel.id);
              await saveServerConfig(msg.client);
              return msg.channel.send("Bot will begin watching <#" + hasChannel + ">.");
            } else {
              return msg.channel.send("Bot is already watching <#" + hasChannel + ">.");
            }
          } catch (error) {
            msg.client.logger.error("config watchchannel - unable to store config item into database: " + JSON.stringify(error, null, 2));
            msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }
        }
      } else if ((args.length > 1) && (args[0].toLowerCase() == "unwatchchannel")) {
        msg.client.logger.debug("config unwatchchannel");
        const hasChannel = msg.mentions.channels.first();
        
        if (typeof hasChannel != "undefined") {
          try {
            if (typeof msg.client.botConfig[msg.guild.id].watchChannel == "undefined") {
              msg.channel.send("Bot is not watching any channels.");
            } else {
              if (msg.client.botConfig[msg.guild.id].watchChannel.indexOf(hasChannel) > -1) {
                msg.client.botConfig[msg.guild.id].watchChannel.splice(msg.client.botConfig[msg.guild.id].watchChannel.indexOf(hasChannel), 1);
                await saveServerConfig(msg.client);
                msg.channel.send("Bot will no longer watch <#" + hasChannel + ">.");
              } else {
                msg.channel.send("Bot is not watching <#" + hasChannel + ">.");
              }
            }
          } catch (error) {
            msg.client.logger.error("config watchchannel - unable to store config item into database: " + JSON.stringify(error, null, 2));
            msg.channel.send("Bot was not able to store the config item into the database.  Please contact the bot developer.");
          }
        }
      }
    } else {
      msg.reply('You must be an administrator in order configure the bot.');
    }
  },
  async initializeConfig(client) {
    try {
      const configFile = fs.readFileSync('./config/config.json', 'utf8');
      configJson = JSON.parse(configFile);

      for (let configServerId in configJson) {
        if (client.botConfig.hasOwnProperty(configServerId)) {
          client.logger.info("Re-loading config for server " + configServerId);
          client.botConfig[configServerId] = configJson[configServerId];
        } else {
          client.logger.info("Loading config for server " + configServerId);
          client.botConfig[configServerId] = configJson[configServerId];
        }
        client.logger.debug("config loaded: " + JSON.stringify(client.botConfig[configServerId]));
      }
    } catch (err) {
      client.logger.error("Error loading config file: " + err);
    }
  },
  getMilliseconds(timestr) {
    return parseTime(timestr);
  }
}

function parseTime(timeString) {
  var milliseconds = 0;
  const timeStringLC = timeString.toLowerCase();
  const hours = timeStringLC.match(/^(\d+)\s*h/);
  const minutes = timeStringLC.match(/^(\d+)\s*m/);
  const seconds = timeStringLC.match(/^(\d+)\s*s/);

  if (hours) { milliseconds += parseInt(hours[1]) * 3600000; }
  if (minutes) { milliseconds += parseInt(minutes[1]) * 60000; }
  if (seconds) { milliseconds += parseInt(seconds[1]) * 1000; }

  return milliseconds;
}

async function saveServerConfig(client) {
  client.logger.debug("About to save the following config: " + typeof client.botConfig);
  fs.writeFile("./config/config.json", JSON.stringify(client.botConfig, null, 2), function(err) {
    if (err) {
      client.logger.error(err);
    } else {
      client.logger.debug("The file was saved!");
    }
  });
}