require("dotenv").config();

// ---------- Winston Logger Declarations
const winston = require('winston');
var log_level = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: log_level,
  transports: [
    new winston.transports.Console({format: winston.format.combine(winston.format.colorize(), winston.format.simple())}),
    new winston.transports.File({filename: 'logs/combined.log'})
  ]
});

// ---------- Discord.js Declarations
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection();
client.botConfig = {};    // Holds the bot configuration
client.checkNewArrivalInterval = {};  // Holds the interval for checking for new arrivals
client.logger = logger;

// ---------- sqlite Declarations
const sqlite3 = require("better-sqlite3");

try {
  client.db = new sqlite3(process.env.DBFILE, {fileMustExist: true});
  logger.info("Connected to Database: " + process.env.DBFILE);
} catch (connectErr) {
  // This really isn't working yet.  Will fix in a future version
  try {
    require('./lib/create-db.js') 
  } catch (createErr) {
    logger.error("Error creating database: " + createErr);
  }
}


// ---------- Load Commands
const botCommands = require('./commands');
Object.keys(botCommands).map(key => {
  client.logger.debug("Loading command: " + key);
  client.commands.set(botCommands[key].name, botCommands[key]);
});

// ---------- Start Bot
const TOKEN  = process.env.TOKEN;
var   PREFIX = "";
client.login(TOKEN);

client.once('ready', () => {
  logger.info(`Running version: ${process.env.SEMVER} - sha: ${process.env.GIT_COMMIT}`);
  logger.info(`npm version: ${process.env.npm_package_version}`);
  logger.info(`Logged in as ${client.user.tag}!`);
  PREFIX = "<@!" + client.user.id + ">";

  // ---------- Load Bot Config
  client.commands.get('config').initializeConfig(client);
  client.guilds.cache.forEach(function (server) {
    logger.info('Guild ID: ' + server.id);

    // Check newArrivals 
    var interval = 1000 * 60 * 60; // 1 second * 60 = 1 minute * 60 = 1 hour -- Default
    if (client.botConfig[server.id].hasOwnProperty('checkInterval')) {
      interval = client.commands.get('config').getMilliseconds(client.botConfig[server.id].checkInterval);
    } 

    client.logger.debug("Creating interval for " + interval + " milliseconds");
    client.checkNewArrivalInterval[server.id.toString()] = setInterval(client.commands.get('welcome_activity').checkNewArrivals, interval, server.id, client);
    client.commands.get('welcome_activity').checkNewArrivals(server.id, client);
  });

  client.user.setActivity('server activity 👀.', { type: 'WATCHING' });
  logger.info("Ready.");
});

client.on('messageCreate', message => {
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.substring(PREFIX.length + 1).split(/ +/);
    const command = args.shift().toLowerCase();
    logger.info(`Called command: ${command}`);

    if (command == "checknewarrivals") 
      client.commands.get('welcome_activity').checkNewArrivals(message.guild.id, client);
    else if (command == "reloadconfig")
      client.commands.get('config').initializeConfig(client);
    else if (client.commands.has(command)) {
      try {
        client.commands.get(command).execute(message, args);
      } catch (error) {
        logger.error(`Failed to execute command ${command}.  ${error}`);
      }
    // If the command doesn't exist, silently return
    } else if (!client.commands.has(command)) {
      client.logger.debug("Command does not exist."); 
      return;
    }
    
  } else if ((message.author.id != client.user.id) &&
            (message.author.bot == false) &&
            client.botConfig.hasOwnProperty(message.guild.id) && 
            client.botConfig[message.guild.id].hasOwnProperty("watchChannel") && 
            (client.botConfig[message.guild.id].watchChannel.indexOf(message.channel.id) >= 0)) {
    client.commands.get('channel_activity').execute(message);
      
  } else {
    logger.debug("Ignoring message: " + message.content);
  }
});

client.on('guildMemberAdd', member => {
  client.commands.get('welcome_activity').addMember(member, logger);
});
