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
const { Client, Intents, Discord } = require("discord.js");
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
  client.guilds.cache.forEach(function (server) {
    logger.info('Guild ID: ' + server.id);
    setTimeout(checkNewArrivals, 1000, server.id);
  });
  // setInterval(checkNewArrivals, 1000, "704057794571272362");
});

client.on('guildMemberAdd', member => {
  addMember(member);
});

async function checkNewArrivals(guildId) {
  var docClient = await createAwsDynamoDBObject();
  
  const oneDay = 1000 * 60 * 60 * 24; // 1 second * 60 = 1 minute * 60 = 1 hour * 24 = 1 day
  const oneDayAgo = Date.now() - oneDay;
  
  logger.info("Looking for entries less than: " + oneDayAgo);
  logger.info("On server: " + guildId);

  let params = {
    TableName: "joinTable_d8c7c4d5",
    IndexName: "joinTable_joinDateTime",
    KeyConditionExpression: "serverId = :serverId AND joinDateTime < :datetime",
    ExpressionAttributeValues: {
      ":serverId": guildId,
      ":datetime": oneDayAgo
    } 
  };

  // logger.debug(JSON.stringify(params, null, 2));

  docClient.query(params, async function(err, data) {
    data.Items.forEach(async function (member) {
      const dateObject = new Date(member.joinDateTime);
      logger.debug("memberId " + member.memberId + " joined " + dateObject.toLocaleString());

      const guildObject = client.guilds.cache.get(member.serverId);
      if (guildObject.member(member.memberId)) { 
        logger.debug("User still exists on server");
        
        const kickMessage = "Thank you very much for checking us out.  I know life can get busy but since you haven't posted an acceptable intro within 24 hours, I'm giving you a polite nudge.\n\nYou are welcome back anytime by accepting this invite: https://discord.gg/2dXsVsMgUQ";

        await sendDM(member.memberId, kickMessage); 
        await guildObject.member(member.memberId).kick("Kicked for failing to create an intro within 24 hours.");

      } else {
        logger.debug("user is no longer on the server");
      }   
      
      // TODO: Delete user object from database
    });
  });
}

async function sendDM(memberId, message) {
  await client.users.cache.get(memberId).send(message);
}


async function addMember(memberObject) {
  // logger.info(JSON.stringify(memberObject));
  logger.info("SERVER JOIN ON " + memberObject.guild.name + " (" + memberObject.guild.id + ")");
  logger.info("memberObject Name: " + memberObject.displayName);
  logger.info("memberObject ID: " + memberObject.id);
  logger.info("Joined at: " + memberObject.joinedTimestamp);

  let memberItem = {
    TableName: "joinTable_d8c7c4d5",
    Item: {
      "serverId": memberObject.guild.id,
      "memberId": memberObject.id,
      "joinDateTime": memberObject.joinedTimestamp
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
