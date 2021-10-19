require('../');

module.exports = {
  name: 'channel_activity',
  description: 'Watch channel activity',
  async execute(msg) {
    const logger = msg.client.logger;
    const messageWordCount = msg.content.trim().split(/\s+/).length;

    if (msg.content.startsWith('!') || msg.content.startsWith('.') || msg.author.bot === true) 
      return false;
    
    msg.channel.messages.fetch({ limit: 5 , before: msg.id }).then(function (messages) {
      const nonbot_messages = messages.filter(message => msg.author.bot === false);
      return nonbot_messages.first().createdTimestamp;
    }).then(async function (lastChannelMessageDatetime) {
      const lastChannelMessageDelta = msg.createdTimestamp - lastChannelMessageDatetime;
      const userLastMessageDelta = await getUserLastMessageDelta(msg);
      let userActive = await getUserActivity(msg);

      if (userActive === true) 
        userActive = 1;
      else
        userActive = 0;

      logger.debug(`serverId: ${msg.guild.id}`);
      logger.debug(`memberId: ${msg.author.id}`);
      logger.debug(`channelId: ${msg.channel.id}`);
      logger.debug(`messageWordCount: ${messageWordCount}`);
      logger.debug(`messageSnowflake: ${msg.id}`);
      logger.debug(`messageLink: ${msg.url}`);
      logger.debug(`messageDateTime: ${msg.createdTimestamp}`);
      logger.debug(`lastChannelMessageDelta: ${lastChannelMessageDelta}`);
      logger.debug(`userActive: ${userActive}`);

      let chatItem = [
        msg.guild.id,
        msg.id,
        msg.channel.id,
        lastChannelMessageDelta,
        msg.author.id,
        msg.createdTimestamp,
        msg.url,
        messageWordCount,
        userLastMessageDelta,
        userActive
      ];

      try {
        const info = msg.client.db.prepare(`INSERT INTO chatTable (serverId, messageId, channelId, 
          lastChannelMessageDelta, memberId, messageDateTime, messageLink, messageWordCount, userLastMessageDelta, madeActive) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(chatItem);
        logger.info('New message added to chatTable');
      } catch (err) {
        logger.error('channelActivity.execute: ' + err.message + '\n' + err.stack);
      }

    });
  },
}

async function getUserActivity(msg) {
  msg.client.logger.info(`channel_activity.getUserActivity: ` + msg.author.username);
  let userActive = false;

  msg.client.logger.info(`channel_activity.getUserActivity: checking activity...`);
  userActive = await getUserHistory(msg);

  // Only change user activity role if they are not already active and 
  // doesn't have an ignorable role
  msg.client.logger.debug('channel_activity.getUserActivity: Has active role test: ' + msg.member.roles.cache.some(role => role.id === msg.client.botConfig[msg.guild.id].chatActivity.roles.active));
  msg.client.logger.debug('channel_activity.getUserActivity: Has ignorable role test: ' + msg.member.roles.cache.some(memberRole => msg.client.botConfig[msg.guild.id].chatActivity.roles.ignoreAny.some(ignoreRole => ignoreRole.id === memberRole.id)));
  msg.client.logger.debug('channel_activity.getUserActivity: Is this message considered active: ' + userActive);

  if ((msg.member.roles.cache.some(role => role.id === msg.client.botConfig[msg.guild.id].chatActivity.roles.active) === false) &&
      (msg.member.roles.cache.some(memberRole => msg.client.botConfig[msg.guild.id].chatActivity.roles.ignoreAny.some(ignoreRole => ignoreRole.id === memberRole.id)) === false) &&
      (userActive === true)) {

    msg.client.logger.info(`channel_activity.getUserActivity: adding active role for ${msg.author.username}`)
    msg.member.roles.add(msg.client.botConfig[msg.guild.id].chatActivity.roles.active);

    // Remove inactive role if the user has it
    if (msg.client.botConfig[msg.guild.id].chatActivity.roles.hasOwnProperty("inactive") 
        && msg.client.botConfig[msg.guild.id].chatActivity.roles.inactive.length > 0) {
      msg.client.logger.info(`getUserHistory: removing inactive role from ${msg.author.username}`);
      msg.member.roles.remove(msg.client.botConfig[msg.guild.id].chatActivity.roles.inactive);
    }
  }

  return userActive;
}


async function getUserLastMessageDelta(msg) {
  const logger = msg.client.logger;
  const row = msg.client.db.prepare(`SELECT messageDateTime FROM chatTable 
    WHERE serverId = ? AND memberId = ? ORDER BY messageDateTime DESC LIMIT 1;`).get(msg.guild.id, msg.author.id);

  var userLastMessageDelta = 604800000;
  if (typeof row !== 'undefined') {
    userLastMessageDelta = msg.createdTimestamp - row.messageDateTime;
  }

  logger.debug(`Last message delta for ${msg.author.username} is ${userLastMessageDelta}`);
  return userLastMessageDelta;
}

async function getUserHistory(msg) {
  const logger = msg.client.logger;
  let userActive = false;

  logger.info('channel_activity.getUserHistory: checking bot config...');
  if (msg.client.botConfig[msg.guild.id].hasOwnProperty('chatActivity') &&
      msg.client.botConfig[msg.guild.id].chatActivity.hasOwnProperty("activeQuery") && 
      msg.client.botConfig[msg.guild.id].chatActivity.activeQuery.hasOwnProperty("columns") &&
      (msg.client.botConfig[msg.guild.id].chatActivity.activeQuery.columns.length > 0)) {
    const attributeResults = await activityQuery(msg.client.botConfig[msg.guild.id].chatActivity.activeQuery, {"dbClient": msg.client.db, "logger": msg.client.logger, "guildId": msg.guild.id, "memberId": msg.author.id});
    
    logger.debug(`channel_activity.getUserHistory: attributeResults: ${attributeResults}`);
    if (attributeResults.every(result => result === true)) {
      logger.debug(`getUserHistory: attributeResults returning true`);
      userActive = true;
    }
  }

  return userActive;
}

async function activityQuery(queryObject, data) {
  const logger = data.logger;
  const mathParser = require('expr-eval').Parser;

  let columns = "";
  let where = "1 = 1";
  
  let results = [];
  logger.debug('channel_activity.activityQuery: ' + JSON.stringify(queryObject, null, 2));

  if (queryObject.hasOwnProperty("columns") && (queryObject.columns.length > 0))
    columns = queryObject.columns.join(', ');

  if (queryObject.hasOwnProperty("where") && (queryObject.where.length > 0))
    where = queryObject.where.join(' AND ');
  
  // prepare escapes strings for us to make it safe to run.
  const row = data.dbClient.prepare(`
    SELECT ${columns}
    FROM chatTable
    WHERE 
          serverId = ? 
      AND memberId = ?
      AND ${where};`).get(data.guildId, data.memberId);

  if (typeof row === 'undefined') {
    logger.error("channel_activity.activityQuery: Database return undefined.");
  } else {
    logger.debug(`channel_activity.activityQuery: Data returned.`);

    if (queryObject.hasOwnProperty("attributes") &&
       (queryObject.attributes.length > 0)) {
      const permittedOperators = ['==', '>', '<', '>=', '<='];
      const parser = new mathParser();

      queryObject.attributes.forEach(attribute => {
        if (permittedOperators.includes(attribute.operator) && row.hasOwnProperty(attribute.column)) {
          const columnValue = row[attribute.column] || 0;
          const evalString = `${columnValue} ${attribute.operator} ${attribute.value}`;
          results.push(parser.evaluate(evalString));
          logger.debug('channel_activity.getUserHistory.queryObject.forEach(): evalString: ' + evalString + ' result: ' + results[results.length - 1]);
          
        }  
      });
    }
  }

  return results;
}
