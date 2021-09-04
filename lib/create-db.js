const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

if (fs.existsSync(process.env.DBFILE)) {
  let db = new sqlite3.Database(process.env.DBFILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });
} else {
  let db = new sqlite3.Database(process.env.DBFILE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });
    
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS configTable (
      configTableId INTEGER PRIMARY KEY
    , serverId      TEXT
    , configSetting TEXT
    , configValue   TEXT)`)
    .run(`CREATE TABLE IF NOT EXISTS joinTable ( 
      joinTableId   INTEGER PRIMARY KEY
    , serverId      TEXT
    , memberId      TEXT
    , joinDateTime  INTEGER)`)
    .run(`CREATE TABLE IF NOT EXISTS chatTable (
      chatTableId       INTEGER PRIMARY KEY
    , serverId          TEXT
    , messageId         TEXT
    , channelId         TEXT
    , lastChannelMessageDelta   INTEGER
    , memberId          TEXT
    , messageDateTime   INTEGER
    , messageLink       TEXT
    , messageWordCount  TEXT)`);
  });
}
