// ---------- DynamoDB Declarations
var AWS = require("aws-sdk");
const awsDynamoDbEndpoint = "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com";
console.log("Setting endpoint: " + awsDynamoDbEndpoint);

AWS.config.update({endpoint: awsDynamoDbEndpoint, region: process.env.AWS_REGION});
AWS.config.apiVersions = { dynamodb: '2012-08-10' };
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
  name: 'config',
  description: 'Configure the bot',
  
  async putItem(itemParams) {
    try {
      const data = await docClient.put(itemParams).promise();
      if (data) {
        console.debug("putItem to table: " + itemParams.TableName);
        console.debug("putItem succeeded: " + JSON.stringify(data, null, 2));
        return data;
      }
    } catch (err) {
        console.error("dynamoDB.js - Unable to PUT item into table " + itemParams.TableName + ". Error JSON:" + JSON.stringify(err, null, 2));
        return err;
    }
  },

  async getItem(itemParams) {
    try {
      const data = await docClient.get(itemParams).promise();
      if (data.hasOwnProperty("Item")) {
        return data;
      }
    } catch (err) {
        console.error("dynamoDB.js - Unable to READ item in table " + itemParams.TableName + ".  Error JSON: " + JSON.stringify(err, null, 2));
    };
  }
}
