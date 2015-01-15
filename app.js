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
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// var Mopidy = require('mopidy');
var xml2js = require('xml2js');

var username = '12762386';
var password = 'osaslabx9';
var client_id = '4450314dba184de29b310f50fcf39f0b'; // Your client id
var client_secret = '13bcd66e7dd24669b27a3d0fe0161760'; // Your client secret
var uri = 'http://74a39f61.ngrok.com';
var redirect_uri = uri + '/callback'; // Your redirect uri
var blockchain_redirect_uri = uri + '/blockchain';
var pay_redirect_uri = uri + '/add_song';
var btc_address = '1P38omURqPRpJzEiwkxF2nAY5rFHsz9v4h';

var spotify;
var spotify_token;

// var mopidy = new Mopidy({
//   webSocketUrl: "ws://172.16.2.65:6680/mopidy/ws/"
// });


/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var jukeboxController = require('./controllers/jukebox');


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
* Routes
*
**/
app.get('/', homeController.index);

app.get('/jukebox/create', jukeboxController.create);
app.get('/jukebox/name', jukeboxController.getName);
app.post('/jukebox/name', jukeboxController.postName)
app.get('/jukebox/:name', jukeboxController.view);



/*=====================================
=            Spotify Login            =
=====================================*/
// (from https://github.com/spotify/web-api-auth-examples/tree/master/authorization_code)
// probably wont need to be changed, so can skip for now

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        // request.get(options, function(error, response, body) {
        //   console.log(body);
        // });

        var jukebox = new Jukebox({token: access_token, name: ''});
        Jukebox.findOne({ token: access_token }, function(err, existingJukebox) {
          if (existingJukebox) {
            res.redirect('/jukebox/name/?' + 
              querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
            // @TODO redirect to jukebox or naming
            // req.flash('errors', { msg: 'Account with that email address already exists.' });
            return res.redirect('/');
          }
          jukebox.save(function(err) {
            if (err) return next(err);
            res.redirect('/jukebox/name/?' + 
              querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
            // req.logIn(user, function(err) {
              // if (err) return next(err);
              // res.redirect('/');
            // });
          });
        });

        // we can also pass the token to the browser to make requests from there

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});



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

  socket.on('search_request', function(search_term) {
    console.log('search_request');
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