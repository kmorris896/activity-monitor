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
var docClient = new AWS.DynamoDB.DocumentClient();


// ---------- Discord.js Declarations
const { Client, Intents, Discord } = require("discord.js");
const DiscordCollection = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new DiscordCollection.Collection();
client.botConfig = new DiscordCollection.Collection();

// ---------- Load Commands
const botCommands = require('./commands');
Object.keys(botCommands).map(key => {
  client.commands.set(botCommands[key].name, botCommands[key]);
});

// ---------- Start Bot
const TOKEN = process.env.TOKEN;
const PREFIX = "<@!771919023792979989>";
client.login(TOKEN);

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`);

  client.guilds.cache.forEach(function (server) {
    logger.info('Guild ID: ' + server.id);
    client.botConfig[server.id] = new DiscordCollection.Collection();
    getServerConfig(server.id);

    // Check newArrivals every hour
    const interval = 1000 * 60 * 60; // 1 second * 60 = 1 minute * 60 = 1 hour
    client.botConfig[server.id].newArrivalInterval = setInterval(checkNewArrivals, interval, server.id);
    checkNewArrivals(server.id);
  });
  logger.info("Ready.")
});

client.on('message', message => {
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.substring(PREFIX.length + 1).split(/ +/);
    const command = args.shift().toLowerCase();
    logger.info(`Called command: ${command}`);

    if (command == "checknewarrivals") checkNewArrivals(message.guild.id);

    // If the command doesn't exist, silently return
    if (!client.commands.has(command)) return;

    try {
      client.commands.get(command).execute(message, args);
    } catch (error) {
      logger.error(`Failed to execute command ${command}.  ${error}`);
    }

  } else {
    logger.debug(message.content);
  }
});

client.on('guildMemberAdd', member => {
  addMember(member);
});

async function checkNewArrivals(guildId) {  
  const oneDay = 1000 * 60 * 60 * 24; // 1 second * 60 = 1 minute * 60 = 1 hour * 24 = 1 day
  const timeHorizon = Date.now() - oneDay;
  
  logger.info("Looking for entries less than: " + timeHorizon);
  logger.info("On server: " + guildId);

  let params = {
    TableName: "joinTable_d8c7c4d5",
    IndexName: "joinTable_joinDateTime",
    KeyConditionExpression: "serverId = :serverId AND joinDateTime < :datetime",
    ExpressionAttributeValues: {
      ":serverId": guildId,
      ":datetime": timeHorizon
    } 
  };


  docClient.query(params, async function(err, data) {
    if (err) {
      logger.error("Unable to query DynamoDB: " + JSON.stringify(err, null, 2));
      return 0;
    }

    logger.error("Items retrieved: " + data.Items.length);
    data.Items.forEach(async function (member) {
      let deleteJoinEntry = false;
      const dateObject = new Date(member.joinDateTime);
      logger.debug("memberId " + member.memberId + " joined " + dateObject.toLocaleString());

      const guildObject = client.guilds.cache.get(member.serverId);
      if (guildObject.member(member.memberId)) {
        if (client.botConfig[member.serverId].has("hasRole") &&
          (guildObject.member(member.memberId).roles.cache.some(role => role.id === client.botConfig[member.serverId].get("hasRole")))) {
            logger.info("User still exists on server and has the role and has been on the server for the allotted time.");
            
            const kickMessage = "Thank you very much for checking us out.  I know life can get busy but since you haven't posted an acceptable intro within 24 hours, I'm giving you a polite nudge.\n\nYou are welcome back anytime by accepting this invite: https://discord.gg/2dXsVsMgUQ";

            const dmStatus = await sendDM(member.memberId, kickMessage); 
            const kickStatus = await guildObject.member(member.memberId).kick("Kicked for failing to create an intro within 24 hours.");
            deleteJoinEntry = kickStatus.deleted;
        } else {
          logger.info("User exists but doesn't have the role anymore.  Nothing left to do except delete the entry.");
          deleteJoinEntry = true;
        }
      } else {
        logger.info("User is no longer on the server.");
        deleteJoinEntry = true;
      }   
      
      if (deleteJoinEntry) {
        const deleteParams = {
          TableName: "joinTable_d8c7c4d5",
          Key: {
            "serverId": member.serverId,
            "memberId": member.memberId
          }
        };

        deleteItem(deleteParams);
      } else {
        logger.info("User could not be deleted.");
      }
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

async function getServerConfig(serverId) {
  const configParams = {
    TableName: "configTable_d8c7c4d5",
    Key: {
      "serverId": serverId.toString()
    }
  }

  const data = await docClient.get(configParams).promise();
  if (data.hasOwnProperty("Item") && data.Item.hasOwnProperty("hasRole")) {
    logger.debug("getServerConfig hasRole = " + data.Item.hasRole);
    client.botConfig[serverId].set("hasRole", data.Item.hasRole);
  } else {
    logger.debug("getItem returned empty");
  }
}

async function putItem(params) {
  logger.debug("Putting into table: " + params.TableName);
  logger.debug(JSON.stringify(params, null, 2));
  docClient.put(params, function(err, data) {
    if (err) {
      logger.error("Unable to PUT item. Error JSON: " + JSON.stringify(err, null, 2));
    } else {
      logger.debug("putItem succeeded: " + JSON.stringify(data, null, 2));
    }
  });
} 

async function deleteItem(params) {
  logger.debug("Deleting from table: " + params.TableName);
  logger.debug(JSON.stringify(params, null, 2));
  docClient.delete(params, function(err, data) {
    if (err) {
      logger.error("Unable to DELETE item. Error JSON: " + JSON.stringify(err, null, 2));
    } else {
      logger.debug("deleteItem succeeded: " + JSON.stringify(data, null, 2));
    }
  });
}
