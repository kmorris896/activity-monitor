require("dotenv").config();

// ---------- Winston Logger Declarations
const winston = require('winston');
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({format: winston.format.combine(winston.format.colorize(), winston.format.simple())}),
    new winston.transports.File({filename: 'logs/combined.log'})
  ]
});

// ---------- DynamoDB Declarations
var AWS = require("aws-sdk");
logger.info("AWS SDK Version: " + AWS.VERSION);

const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
logger.debug("Setting endpoint: " + awsDynamoDbEndpoint);

AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = { dynamodb: '2012-08-10' };
var docClient = new AWS.DynamoDB.DocumentClient(); // Deprecating soon


// ---------- Discord.js Declarations
const { Client, Intents, Discord } = require("discord.js");
const DiscordCollection = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new DiscordCollection.Collection();
client.botConfig = new DiscordCollection.Collection();
client.dynamoClient = new AWS.DynamoDB.DocumentClient();
client.logger = logger;

// ---------- Load Commands
const botCommands = require('./commands');
Object.keys(botCommands).map(key => {
  client.commands.set(botCommands[key].name, botCommands[key]);
});

// ---------- Start Bot
const TOKEN = process.env.TOKEN;
var   PREFIX = "";
client.login(TOKEN);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  PREFIX = "<@!" + client.user.id + ">";

  client.guilds.cache.forEach(function (server) {
    logger.info('Guild ID: ' + server.id);
    client.botConfig[server.id] = new DiscordCollection.Collection();
    client.commands.get('config').getServerConfig(server.id, client, logger, docClient);

    // Check newArrivals every hour
    const interval = 1000 * 60 * 60; // 1 second * 60 = 1 minute * 60 = 1 hour
    client.botConfig[server.id].newArrivalInterval = setInterval(client.commands.get('welcome_activity').checkNewArrivals, interval, server.id, client, logger, docClient);
    client.commands.get('welcome_activity').checkNewArrivals(server.id, client, logger, docClient);
  });
  logger.info("Ready.");
});

client.on('message', message => {
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.substring(PREFIX.length + 1).split(/ +/);
    const command = args.shift().toLowerCase();
    logger.info(`Called command: ${command}`);

    if (command == "checknewarrivals") 
      client.commands.get('welcome_activity').checkNewArrivals(message.guild.id, client, logger, docClient);

    // If the command doesn't exist, silently return
    if (!client.commands.has(command)) return;

    try {
      client.commands.get(command).execute(message, args);
    } catch (error) {
      logger.error(`Failed to execute command ${command}.  ${error}`);
    }

  } else if ((message.channel.id == "752154612798062612") || (message.channel.id == "752462096104423536") 
           ||(message.channel.id == "704057794571272366")) {
    client.commands.get('channel_activity').execute(message, logger, docClient);
  } else {
    logger.debug(message.content);
  }
});

client.on('guildMemberAdd', member => {
  client.commands.get('welcome_activity').addMember(member, logger, docClient);
});
