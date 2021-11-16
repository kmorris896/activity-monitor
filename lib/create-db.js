const fs = require('fs');
const sqlite3 = require('better-sqlite3');
const { debugPort } = require('process');

if (process.env.hasOwnProperty('DBFILE') && fs.existsSync(process.env.DBFILE)) {
  try {
    let db = new sqlite3(process.env.DBFILE, {readonly: true, fileMustExist: true});
    console.log('Connected to the database.');
  } catch (err) {
    console.error('Could not connect to the database.');
  };
} else if (process.env.hasOwnProperty('DBFILE') === true) {
  let db = new sqlite3(process.env.DBFILE);
  console.log("Creating database: " + process.env.DBFILE);
    
  var info = db.prepare(`CREATE TABLE IF NOT EXISTS joinTable ( 
      joinTableId   INTEGER PRIMARY KEY AUTOINCREMENT
    , serverId      TEXT
    , memberId      TEXT
    , joinDateTime  INTEGER)`).run();
  
  console.log("Created joinTable: " + JSON.stringify(info));

  info = db.prepare(`CREATE TABLE IF NOT EXISTS chatTable (
      chatTableId       INTEGER PRIMARY KEY AUTOINCREMENT
    , serverId          TEXT
    , messageId         TEXT
    , channelId         TEXT
    , lastChannelMessageDelta   INTEGER
    , memberId          TEXT
    , messageDateTime   INTEGER
    , messageLink       TEXT
    , messageWordCount  INTEGER
    , userLastMessageDelta      INTEGER
    , madeActive        INTEGER DEFAULT 0)`).run();

  console.log("Created chatTable: " + JSON.stringify(info));
} else {
  console.error('No database file specified.');
}
