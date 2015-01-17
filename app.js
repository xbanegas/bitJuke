'use strict';

var util = require('util');

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var server = http.Server(app);
var io = require('socket.io')(server);
var path = require('path');

var connectAssets = require('connect-assets');
var mongoose = require('mongoose');
var Jukebox = require('./models/Jukebox');

var request = require('request');
var cookieParser = require('cookie-parser');

// var Mopidy = require('mopidy');
var xml2js = require('xml2js');

var secrets = require('./config/secrets');
var spotify = require('./spotify_modules/spotify');


// var mopidy = new Mopidy({
//   webSocketUrl: "ws://172.16.2.65:6680/mopidy/ws/"
// });


/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var callbackController = require('./controllers/callback');
var jukeboxController = require('./controllers/jukebox');
var loginController = require('./controllers/login');
var refreshController = require('./controllers/refresh_token');
var blockchainController = require('./controllers/blockchain');

/**
*
* App Configuration
*
**/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}))
  .use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Connect to MongoDB.
 */
var uristring = 
  process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://localhost/JukeboxMongoose';

mongoose.connect(uristring, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

/**
*
* Spotify Auth Code
*
**/
var generateRandomString = function(length) {
  var text = '', possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return text;
};
app.set('generateRandomString', generateRandomString);
app.set('stateKey', 'spotify_auth_state');

/**
*
* Routes
*
**/
// @TODO put all spotify callbacks in one controller
app.get('/', homeController.index);
app.get('/login', loginController.index);
app.get('/callback', callbackController.index);
app.get('/refresh_token', refreshController.index);
app.get('/jukebox/create', jukeboxController.create);
app.get('/jukebox/name', jukeboxController.getName);
app.post('/jukebox/name', jukeboxController.postName);
app.get('/jukebox/:name', jukeboxController.view);
app.get('/blockchain', blockchainController.index);

// ideally this is what gets called when a payment is just made from wallet or scanned
// should take user back to jukebox queue
// app.get('/add_song', function(req, res){ console.log(req); });

io.on('connection', function (socket){
  // doing this for blockchain broadcast add to queues
  app.set('io', io);

  console.log('socket connection');
  var socket_id = socket.id;

  socket.on('queue_request', function(jukebox_name){
    jukebox_name = jukebox_name.jukebox_name;
    console.log(jukebox_name + ' queue_request');
    Jukebox.findOne({name: jukebox_name}, function(err, jukebox){
      console.log(jukebox);
      if (err) console.log(err);
      if (jukebox){
        var tracks_uri = jukebox.playlist + '/tracks/';
        spotify.getTracks(tracks_uri, jukebox, io, socket_id);
      }
    });
  });

  socket.on('search_request', function(search_data) {
    console.log('search_request');
    var jukebox_name = search_data.jukebox_name;
    var search_term = search_data.search_term;
    // Get spotify credentials using jukebox name
    Jukebox.findOne({name: jukebox_name}, function(err, jukebox){
      if (err) return next(err);
      if (jukebox) { spotify.search(search_term, jukebox, io, socket_id); }
    });
  });

  var blockchain_response = ''; // starts as string, becomes JSON in res.end
  socket.on('song_requested', function(request_data){
    var jukebox_name = request_data.jukebox_name;
    var song_uri = request_data.song_uri;
    var socket_id = socket.id;
    var options = {
      host: 'blockchain.info',
      path: '/api/receive?method=create&address=' + secrets.btc_address + '&callback=' + encodeURIComponent(secrets.blockchain_redirect_uri + '?jukebox=' + jukebox_name + '&song_uri=' + song_uri)
    };
    console.log(options.host + options.path);
    // @TODO Can clean up this section by using request module
    var req = https.get(options, function(res) {
      console.log('new address request');
      console.log('statusCode: ', res.statusCode);
      // console.log("headers: ", res.headers);
      res.on('data', function (chunk) {
        blockchain_response += chunk;
      });
      res.on('end', function (req) {
        blockchain_response = JSON.parse(blockchain_response);
        // console.log(blockchain_response);
      });
      res.on('error', function(error) { console.log(error); });
    }).end();
  });

  socket.on('amount_submitted', function(amount) {
    var socket_id = socket.id;
    var input_address = blockchain_response.input_address;
    amount = amount.amount;
    var input_uri = 'bitcoin:' + input_address + '?amount=' + amount + '&callback=' + encodeURIComponent(secrets.pay_redirect_uri);
    console.log(input_uri);
    // @TODO validate amount 
    io.to(socket_id).emit('payment_info', { input_address: input_address, input_uri: input_uri });
  });

  // socket.on('new_jukebox', function(name){

  // });  


}); // end io

console.log('Listening on 8888');
server.listen(8888);