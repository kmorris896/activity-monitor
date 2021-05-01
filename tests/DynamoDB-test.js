require("dotenv").config();

// Winston Logger Declarations
const winston = require('winston');
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({format: winston.format.combine(winston.format.colorize(), winston.format.simple())}),
    new winston.transports.File({filename: 'logs/combined.log'})
  ]
});

logger.info("Creating AWS SDK Object");
var AWS = require("aws-sdk");
console.log("AWS SDK Version: " + AWS.VERSION);
AWS.config.getCredentials(function(err) {
  if(err) logger.error(err.stack);
  else {
    logger.info("Access key: " + AWS.config.credentials.accessKeyId);
  }
});
const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
logger.debug("Setting endpoint: " + awsDynamoDbEndpoint);

// var awsConfig = new AWS.Config();
AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.logger = console;

var docClient = new AWS.DynamoDB.DocumentClient();



logger.info("# ----- configTable_d8c7c4d5 :: Test 1 ----- #");
logger.info("Getting items in configTable_d8c7c4d5:")

const configParams = {
  TableName: "configTable_d8c7c4d5",
  Key: {
    "serverId": "704057794571272362"
  }
}

docClient.get(configParams, function(err, data) {
  if (err) {
    logger.error("Unable to get.  Error JSON: " + JSON.stringify(err, null, 2));
  } else {
    logger.info("get succeeded: " + JSON.stringify(data, null, 2));
  }
});


// logger.info("# ----- joinTable_d8c7c4d5 :: Test 1 ----- #");
// logger.info("Getting items in joinTable_d8c7c4d5:")

// const joinParams = {
//   TableName: "joinTable_d8c7c4d5",
//   Key: {
//     "serverId": "704057794571272362",
//     "memberId": "789560582164316170"
//   }
// }

// docClient.get(configParams, function(err, data) {
//   if (err) {
//     logger.error("Unable to get.  Error JSON: ", JSON.stringify(err, null, 2));
//   } else {
//     logger.info("get succeeded:", JSON.stringify(data, null, 2));
//   }
// });





// async function getItem(params) {
//   var docClient = await createAwsDynamoDBObject();

//   logger.debug("Getting from table: " + params.TableName);
//   logger.debug(JSON.stringify(params, null, 2));
//   docClient.get(params, function(err, data) {
//     if (err) {
//       logger.error("Unable to GET item. Error JSON:", JSON.stringify(err, null, 2));
//     } else {
//       logger.debug("getItem succeeded:", JSON.stringify(data, null, 2));
//       return data;
//     }
//   });
// } 


// async function putItem(params) {
//   var docClient = await createAwsDynamoDBObject();

//   logger.debug("Putting into table: " + params.TableName);
//   logger.debug(JSON.stringify(params, null, 2));
//   docClient.put(params, function(err, data) {
//     if (err) {
//       logger.error("Unable to PUT item. Error JSON:", JSON.stringify(err, null, 2));
//     } else {
//       logger.debug("putItem succeeded:", JSON.stringify(data, null, 2));
//     }
//   });
// } 

// async function deleteItem(params) {
//   var docClient = await createAwsDynamoDBObject();

//   logger.debug("Deleting from table: " + params.TableName);
//   logger.debug(JSON.stringify(params, null, 2));
//   docClient.delete(params, function(err, data) {
//     if (err) {
//       logger.error("Unable to DELETE item. Error JSON:", JSON.stringify(err, null, 2));
//     } else {
//       logger.debug("deleteItem succeeded:", JSON.stringify(data, null, 2));
//     }
//   });
// }


// async function createAwsDynamoDBObject() {
//   var AWS = require("aws-sdk");
//   console.log("AWS SDK Version: " + AWS.VERSION);

//   const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
//   logger.debug("Setting endpoint: " + awsDynamoDbEndpoint);
//   // var awsConfig = new AWS.Config();
//   AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
//   AWS.config.apiVersions = { dynamodb: '2012-08-10' };

//   // var dynamodb = new AWS.DynamoDB();
//   var docClient = new AWS.DynamoDB.DocumentClient();

//   return docClient;
// }