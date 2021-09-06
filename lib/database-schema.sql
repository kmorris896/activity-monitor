CREATE TABLE IF NOT EXISTS configTable (
    configTableId INTEGER PRIMARY KEY
  , serverId      TEXT
  , configSetting TEXT
  , configValue   TEXT);

CREATE TABLE IF NOT EXISTS joinTable ( 
    joinTableId   INTEGER PRIMARY KEY
  , serverId      TEXT
  , memberId      TEXT
  , joinDateTime  INTEGER);

CREATE TABLE IF NOT EXISTS chatTable (
    chatTableId       INTEGER PRIMARY KEY
  , serverId          TEXT
  , messageId         TEXT
  , channelId         TEXT
  , lastChannelMessageDelta   INTEGER
  , memberId          TEXT
  , messageDateTime   INTEGER
  , messageLink       TEXT
  , messageWordCount  TEXT
  , userLastMessageDelta      INTEGER);
  