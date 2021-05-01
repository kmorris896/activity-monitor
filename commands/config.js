module.exports = {
  name: 'config',
  description: 'Configure the bot',
  execute(msg, args) {
    if (args[0] == "hasrole") {
      const hasRole = msg.mentions.roles.first();

      if (typeof hasRole != "undefined") {
        const configItem = {
          TableName: "configTable_d8c7c4d5",
          Item: {
            "serverId": msg.guild.id,
            "hasRole": hasRole.id
          }
        }
        
        putItem(configItem);
        const returnObject = {"hasRole": hasRole};
        return returnObject;
    
      } else {
        msg.channel.send("`hasrole` requires a role as an argument.")
      }
    }
  }
}

function putItem(params) {
  console.log(JSON.stringify(params, null, 2));
}