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

var spotify;
var spotify_token;

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


app.get('/blockchain', function(req, res){
  console.log('response from blockchain received');
  console.log(req.query);
  // res.send('hello callback world');
  // @TODO spotify add to queue
  // var options = {
  //   host: 'blockchain.info',
  //   path: '/api/receive?method=create&address=' + btc_address + '&callback=' + encodeURIComponent(redirect_uri)
  // };
  // var req = https.get(options, function(res) {

  // };
});

app.get('/add_song', function(req, res){
  console.log(req);
});


function spotifyCreatePlaylist() {
  // @TODO get username
  var username;
  console.log('creating playlist');
  var options = {
    host: 'api.spotify.com',
    path: '/v1/users/' + username + '/playlists',
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + spotify_token },
  };
  var req = https.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  req.write('{"name":"A New Playlist", "public":false}"');
  req.end();
}

// function spotifyAddTrack(){
  // https://api.spotify.com/v1/users/' + user_data.id + '/playlists/' + playlist_id + '/tracks'
// };

io.on('connection', function (socket){
  console.log('socket connection');
  var socket_id = socket.id;


  socket.on('search_request', function(search_data) {
    console.log('search_request');
    var jukebox_name = search_data.jukebox_name;
    var search_term = search_data.search_term;
    // Get spotify credentials using jukebox name
    Jukebox.findOne({name: jukebox_name}, function(err, jukebox){
      var spotify_id = jukebox.spotify_id;
      var access_token = jukebox.token;
      var refresh_token = jukebox.refresh_token;
      var search_results;
      function searchCallback(error, response, body) {
        console.log('making search request');
        console.log(response);
        if (!error && response.statusCode == 200) {
          console.log('search success');
          var search_results = JSON.parse(body);
          io.to(socket_id).emit('search_result', search_results);
        } else { console.log('search fail'); }
      }

      // If jukebox exists, perform search and return results
      if (jukebox) {
        var search_options = {
          url: 'https://api.spotify.com/v1/search?q=' + search_term + '&type=album,track,artist',
          headers: { 'Authorization': 'Bearer ' + access_token },
          method: 'GET'
        };
        // make search request
        request(search_options, searchCallback);
        // request.post(options, function(err,response,body){
          // console.log('making request');

          // if (response.statusCode) { 
          //   var body_data = JSON.parse(body); 
          //   console.log(body_data);
          // }
          // IF current access token is expired grab a new one
          // if (body.error.status == 401) {
          //   var refresh_options = {
          //     url: secrets.url + '/refresh_token/?' + refresh_token
          //   };
          //   request.get(refresh_options, function(rfsh_err, rfsh_response, rfsh_body){
          //     console.log(rfsh_response);
          //   });
          // }
        // });
      }
    });

    // spotify.search(search_term.search_term, function(err, xml){
    //   if (err) {throw err;}
    //   // @TODO remove this and place elsewhere for speed?
    //   var parser = new xml2js.Parser();
    //   parser.on('end', function (data) {
    //     io.to(socket_id).emit('search_result', data.result);
    //   });
    //   parser.parseString(xml);
    // });
  });

  var blockchain_response = ''; // starts as string, becomes JSON in res.end
  socket.on('song_requested', function(uri){
    var socket_id = socket.id;
    var options = {
      host: 'blockchain.info',
      path: '/api/receive?method=create&address=' + btc_address + '&callback=' + encodeURIComponent(blockchain_redirect_uri)
    };
    console.log(options.host + options.path);
    
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
    var input_uri = 'bitcoin:' + input_address + '?amount=' + amount + '&callback=' + encodeURIComponent(pay_redirect_uri);
    console.log(input_uri);
    // @TODO validate amount 
    io.to(socket_id).emit('payment_info', { input_address: input_address, input_uri: input_uri });
  });

  socket.on('new_jukebox', function(name){

  });  


}); // end io

console.log('Listening on 8888');
server.listen(8888);