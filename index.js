require("dotenv").config();
var BOT_CONFIG = {
  "servers": {}
};

// Winston Logger Declarations
const winston = require('winston');
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({format: winston.format.combine(winston.format.colorize(), winston.format.simple())}),
    new winston.transports.File({filename: 'logs/combined.log'})
  ]
});


// Discord.js Declarations
const { Client, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

// Start Bot
const TOKEN = process.env.TOKEN;
// const PREFIX = '&';
client.login(TOKEN);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  // loadServerConfig().then(function() {
  //   logger.info("Configuration Loaded.");
  // });
  logger.info("Ready.")
  // setTimeout(checkNewArrivals, 1000);
});

client.on('guildMemberAdd', member => {
  addMember(member);
});

async function checkNewArrivals() {
  var docClient = await createAwsDynamoDBObject();
  
  const oneDay = 1000 * 60 * 60 * 24; // 1 second * 60 = 1 minute * 60 = 1 hour * 24 = 1 day
  const oneDayAgo = Date.now() - oneDay;
  logger.info("Looking for entries less than: " + oneDayAgo);

  let params = {
    TableName: "joinTable_" + memberObject.guild.id,
    KeyConditionExpression: "joinDateTime < :datetime",
    ExpressionAttributeValues: {
      ":datetime": oneDayAgo
    } 
  };

  docClient.query(params, function(err, data) {
    logger.info(JSON.stringify(data, null, 2));
  });

}

async function addMember(memberObject) {
  // logger.info(JSON.stringify(memberObject));
  logger.info("SERVER JOIN ON " + memberObject.guild.name + " (" + memberObject.guild.id + ")");
  logger.info("memberObject Name: " + memberObject.displayName);
  logger.info("memberObject ID: " + memberObject.id);
  logger.info("Joined at: " + memberObject.joinedTimestamp);

  let memberItem = {
    TableName: "joinTable_" + memberObject.guild.id,
    Item: {
      "joinDateTime": memberObject.joinedTimestamp,
      "memberId": memberObject.id
    }
  }
  
  logger.info("Adding to DynamoDB...");
  putItem(memberItem);
}



async function putItem(params) {
  var docClient = await createAwsDynamoDBObject();

  logger.debug("Putting into table: " + params.TableName);
  logger.debug(JSON.stringify(params, null, 2));
  docClient.put(params, function(err, data) {
    if (err) {
      logger.error("Unable to PUT item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      logger.debug("putItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
} 


async function loadServerConfig() {
  var docClient = await createAwsDynamoDBObject();

  const params = {
    TableName: "installations",
  };

  docClient.scan(params, function(err, data){
    if (err) {
      console.error("Unable to read item.  Error JSON: ", JSON.stringify(err, null, 2));
    } else { 
      data.Items.forEach(element => {
        BOT_CONFIG.servers[element.serverId] = element;
      });

      console.log("GetItem succeeded.  Number of Servers: ", Object.keys(BOT_CONFIG.servers));
      console.log(JSON.stringify(BOT_CONFIG.servers, null, 2));
      return data;
    }
  });
}

async function createAwsDynamoDBObject() {
  var AWS = require("aws-sdk");
  console.log("AWS SDK Version: " + AWS.VERSION);

  const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
  logger.debug("Setting endpoint: " + awsDynamoDbEndpoint);
  // var awsConfig = new AWS.Config();
  AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
  AWS.config.apiVersions = { dynamodb: '2012-08-10' };

  // var dynamodb = new AWS.DynamoDB();
  var docClient = new AWS.DynamoDB.DocumentClient();

  return docClient;
}
