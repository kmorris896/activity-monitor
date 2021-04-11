require("dotenv").config();
var AWS = require("aws-sdk");

console.log("Version: " + AWS.VERSION);


const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
console.log("Setting endpoint: " + awsDynamoDbEndpoint);
// var awsConfig = new AWS.Config();
AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = {
  dynamodb: '2012-08-10'
}

// var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

const params = {
  TableName: "installations",
  Key: {
    "serverId": "752074304224755752"
  }
};

docClient.get(params, function(err, data){
  if (err) {
    console.error("Unable to read item.  Error JSON: ", JSON.stringify(err, null, 2));
  } else { 
    console.log("GetItem succeeded: ", JSON.stringify(data, null, 2));
  }
});
