require("dotenv").config();

// Winston Logger Declarations
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({format: winston.format.combine(winston.format.colorize(), winston.format.simple())}),
    new winston.transports.File({filename: 'logs/combined.log'})
  ]
});

const TOKEN = process.env.TOKEN;
// const PREFIX = '&';

// Discord.js Declarations
const { Client, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

// Start Bot
client.login(TOKEN);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  logger.info("")
});

client.on('guildMemberAdd', member => {
  logger.info(JSON.stringify(member));
  logger.info("SERVER JOIN ON " + member.guild.name + " (" + member.guild.id + ")");
  logger.info("Member Name: " + member.displayName);
  logger.info("Member ID: " + member.id);
  logger.info("Joined at: " + member.joinedTimestamp);

});



function loadServerConfig(serverId) {
  var AWS = require("aws-sdk");
  console.log("Version: " + AWS.VERSION);

  const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
  logger.debug("Setting endpoint: " + awsDynamoDbEndpoint);
  // var awsConfig = new AWS.Config();
  AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
  AWS.config.apiVersions = { dynamodb: '2012-08-10' };

  // var dynamodb = new AWS.DynamoDB();
  var docClient = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: "installations",
    Key: {
      "serverId": serverId
    }
  };

  docClient.get(params, function(err, data){
    if (err) {
      console.error("Unable to read item.  Error JSON: ", JSON.stringify(err, null, 2));
    } else { 
      console.log("GetItem succeeded: ", JSON.stringify(data, null, 2));
      return data;
    }
  });
}