var util = require('util');

var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var server = http.Server(app);
var io = require('socket.io')(server);

var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// var Mopidy = require('mopidy');
var xml2js = require('xml2js');
var Spotify = require('spotify-web');

var username = '12762386';
var password = 'nofreem1nd';
var client_id = '0ac7bdea5e14428c9884c3c933a304bd'; // Your client id
var client_secret = '5e313bf5c84c478597175653cf557a9e'; // Your client secret
var redirect_uri = 'http://74a39f61.ngrok.com'; // Your redirect uri
var btc_address = '12q9g98HoFzpTqDaHQo3Ey6ufTMbhCL44u';

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/callback', function(req, res){
  console.log('response from blockchain received');
  console.log(req);
});


io.on('connection', function (socket){
  console.log('socket connection');
  var socket_id = socket.id;

  socket.on('search_request', function(search_term) {
    Spotify.login(username, password, function (err, spotify) {
      if (err) throw err;
      // console.log(spotify.settings.credentials);
      spotify.search(search_term.search_term, function(err, xml){
        if (err) throw err;
        // @TODO remove this and place elsewhere for speed?
        spotify.disconnect();
        var parser = new xml2js.Parser();
        parser.on('end', function (data) {
          io.to(socket_id).emit('search_result', data.result);
        });
        parser.parseString(xml);
      });
    });
  });

  var str = '';
  socket.on('song_requested', function(){
    var socket_id = socket.id;
    var options = {
      host: 'blockchain.info',
      path: '/api/receive?method=create&address=' + btc_address + '&callback=' + encodeURIComponent(redirect_uri)
    };
    console.log(options.host + options.path);
    
    var req = https.get(options, function(res) {
      console.log('new address request');
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);
      res.on('data', function (chunk) {
        str += chunk;
      });
      res.on('end', function (req) {
        // console.log(req.data);
        console.log(str);
        str = JSON.parse(str);
        io.to(socket_id).emit('dest_address', {dest_address: str.destination});
      });
      res.on('error', function(error) { console.log(error); });
    }).end();


    

  });


}); // end io


// function createPlaylist(){
   // https://api.spotify.com/v1/users/' + user_data.id + '/playlists'
// };
// function addTrack(){
  // https://api.spotify.com/v1/users/' + user_data.id + '/playlists/' + playlist_id + '/tracks'
// };


console.log('Listening on 8888');
server.listen(8888);


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

// var generateRandomString = function(length) {
//   var text = '';
//   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

//   for (var i = 0; i < length; i++) {
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return text;

// };

// var stateKey = 'spotify_auth_state';

// var mopidy = new Mopidy({
//   webSocketUrl: "ws://172.16.2.65:6680/mopidy/ws/"
// });





// app.get('/login', function(req, res) {

//   var state = generateRandomString(16);
//   res.cookie(stateKey, state);

//   // your application requests authorization
//   var scope = 'user-read-private user-read-email playlist-modify playlist-modify-private';
//   res.redirect('https://accounts.spotify.com/authorize?' +
//     querystring.stringify({
//       response_type: 'code',
//       client_id: client_id,
//       scope: scope,
//       redirect_uri: redirect_uri,
//       state: state
//     }));
// });

// app.get('/callback', function(req, res) {

//   // your application requests refresh and access tokens
//   // after checking the state parameter

//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   var storedState = req.cookies ? req.cookies[stateKey] : null;

//   if (state === null || state !== storedState) {
//     res.redirect('/#' +
//       querystring.stringify({
//         error: 'state_mismatch'
//       }));
//   } else {
//     res.clearCookie(stateKey);
//     var authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       form: {
//         code: code,
//         redirect_uri: redirect_uri,
//         grant_type: 'authorization_code'
//       },
//       headers: {
//         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
//       },
//       json: true
//     };

//     request.post(authOptions, function(error, response, body) {
//       if (!error && response.statusCode === 200) {

//         var access_token = body.access_token,
//             refresh_token = body.refresh_token;

//         var options = {
//           url: 'https://api.spotify.com/v1/me',
//           headers: { 'Authorization': 'Bearer ' + access_token },
//           json: true
//         };

//         // use the access token to access the Spotify Web API
//         request.get(options, function(error, response, body) {
//           console.log(body);
//         });

//         // we can also pass the token to the browser to make requests from there
//         res.redirect('/#' +
//           querystring.stringify({
//             access_token: access_token,
//             refresh_token: refresh_token
//           }));
//       } else {
//         res.redirect('/#' +
//           querystring.stringify({
//             error: 'invalid_token'
//           }));
//       }
//     });
//   }
// });

// app.get('/refresh_token', function(req, res) {

//   // requesting access token from refresh token
//   var refresh_token = req.query.refresh_token;
//   var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
//     form: {
//       grant_type: 'refresh_token',
//       refresh_token: refresh_token
//     },
//     json: true
//   };

//   request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       var access_token = body.access_token;
//       res.send({
//         'access_token': access_token
//       });
//     }
//   });
// });


