CREATE TABLE IF NOT EXISTS joinTable ( 
    joinTableId   INTEGER PRIMARY KEY AUTOINCREMENT
  , serverId      TEXT
  , memberId      TEXT
  , joinDateTime  INTEGER);

CREATE TABLE IF NOT EXISTS chatTable (
    chatTableId       INTEGER PRIMARY KEY AUTOINCREMENT
  , serverId          TEXT
  , messageId         TEXT
  , channelId         TEXT
  , lastChannelMessageDelta   INTEGER
  , memberId          TEXT
  , messageDateTime   INTEGER
  , messageLink       TEXT
  , messageWordCount  TEXT
  , userLastMessageDelta      INTEGER);
  