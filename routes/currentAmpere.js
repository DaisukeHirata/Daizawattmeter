"use strict";
 
var mongoose = require('mongoose');
 
// Default Schemaを取得
var Schema = mongoose.Schema;
 
// Defaultのスキーマから新しいスキーマを定義
var CurrentAmpere = new Schema({
    ampere: Number 
}, { collection: 'currentAmpere' });

// Defaultのスキーマから新しいスキーマを定義
var NatureRemo = new Schema({
    humidity: Number,
    illuminance: Number,
    temperature: Number
}, { collection: 'natureRemo' });
 
// モデル化。model('[登録名]', '定義したスキーマクラス')
mongoose.model('CurrentAmpere', CurrentAmpere);
mongoose.model('NatureRemo', NatureRemo);

var CurrentAmpere;
var NatureRemo;

// mongodb://[hostname]/[dbname]
mongoose.connect('mongodb://localhost/dhmongo');
 
// mongoDB接続時のエラーハンドリング
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to 'dhmongo' database");
  // 定義したときの登録名で呼び出し
  CurrentAmpere = mongoose.model('CurrentAmpere');
  NatureRemo = mongoose.model('NatureRemo');
});

exports.index = function(req, res){
  res.render('index', { title: 'index' } );
};
 
exports.findLast = function(req, res) {
  console.log('Getting CurrentAmpere');

  CurrentAmpere.findOne().sort({'$natural':-1}).exec(function(err, results) {
    if (!err) {
      console.log('Success: Getting currentAmpere');
      res.json(results.ampere/10.0);
    } else {
      res.send({'error': 'An error has occurred'});
    }
  });
};

exports.findLastNatureRemo = function(req, res) {
  console.log('Getting NatureRemo');

  NatureRemo.findOne().sort({'$natural':-1}).exec(function(err, results) {
    if (!err) {
      console.log('Success: Getting NatureRemo');
      res.json({humidity: results.humidity,
                illuminance: results.illuminance,
                temperature: results.temperature/10.0});
    } else {
      res.send({'error': 'An error has occurred'});
    }
  });
};

exports.findLastN = function(req, res) {
  console.log('Getting Last N Ampere');
  console.log(req.query); // for logging
  var n = 10;
  if (req.query.n) {
    n = Number(req.query.n);
  }
  CurrentAmpere.find().sort({'$natural':-1}).limit(n).exec(function(err, results) {
    if (!err) {
      console.log('Success: Getting Last N Ampere');
      res.json( results.map(function(item){ return item.ampere/10.0 }) );
    } else {
      res.send({'error': 'An error has occurred'});
    }
  });
};

exports.update = function(req, res) {
  req.socket.setTimeout(Number.MAX_SAFE_INTEGER);

  var stream;
  CurrentAmpere.findOne().sort({'$natural':-1}).exec(function(err, item){
    if(err){
      console.log(err);
    }
    stream = CurrentAmpere.find().gt('_id', item._id).sort({'$natural': 1}).tailable().stream();
    var messageCount = 0;

    stream.on("error", function(err) {
      console.log("Mongo Error: " + err);
    });

    stream.on('data', function(doc){
      messageCount++;
      //console.log(messageCount);
      res.write('id: ' + messageCount + '\n');
      var msg = JSON.stringify({
        ampere: doc.ampere/10.0,
      });
      res.write("data: "+msg+"\n\n");
    });

    stream.on('close', function(){
      console.log("Mongo closed");
    });
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');
 
  req.on("close", function() {
    stream.destroy();
    console.log("Client disconnected.");
  });
};

exports.updateNatureRemo = function(req, res) {
  req.socket.setTimeout(Number.MAX_SAFE_INTEGER);

  var stream;
  NatureRemo.findOne().sort({'$natural':-1}).exec(function(err, item){
    if(err){
      console.log(err);
    }
    stream = NatureRemo.find().gt('_id', item._id).sort({'$natural': 1}).tailable().stream();
    var messageCount = 0;

    stream.on("error", function(err) {
      console.log("Mongo Error: " + err);
    });

    stream.on('data', function(doc){
      messageCount++;
      //console.log(messageCount);
      res.write('id: ' + messageCount + '\n');
      var msg = JSON.stringify({
        humidity: doc.humidity+13,
        illuminance: doc.illuminance,
        temperature: doc.temperature/10.0
      });
      res.write("data: "+msg+"\n\n");
    });

    stream.on('close', function(){
      console.log("Mongo closed");
    });
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');

  req.on("close", function() {
    stream.destroy();
    console.log("Client disconnected.");
  });
};