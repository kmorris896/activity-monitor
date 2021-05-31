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
  
  putItem(itemParams) {
    docClient.put(itemParams, function(err, data) {
      console.debug("putItem to table: " + itemParams.TableName);
      if (err) {
        console.error("Unable to PUT item. Error JSON:" + JSON.stringify(err, null, 2));
      } else {
        console.debug("putItem succeeded:" + JSON.stringify(data, null, 2));
        return data;
      }
    });
  },

  getItem(itemParams) {
    docClient.get(itemParams, function(err, data) {
      if (err) {
        console.error("Unable to read item.  Error JSON: " + JSON.stringify(err, null, 2));
      } else {
        if (data.hasOwnProperty("Item")) {
          return data;
        } else {
          console.debug("getItem returned empty");
          return null;
        }  
      }
    });
  }
}
