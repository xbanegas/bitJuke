var querystring = require('querystring');
var request = require('request');
var Jukebox = require('../models/Jukebox');
var secrets = require('../config/secrets');

exports.index = function(req, res) {
  var stateKey = req.app.get('stateKey');
  var client_id = secrets.client_id;
  var client_secret = secrets.client_secret;
  var redirect_uri = secrets.redirect_uri;
  // your application reqs refresh and access tokens
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
      form: { code: code, redirect_uri: redirect_uri, grant_type: 'authorization_code' },
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
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
        // @TODO maybe use this to create the playlist?
        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          var spotify_id = body.id;
          // See if spotify ID in database
          Jukebox.findOne({ spotify_id: spotify_id }, function(err, existingJukebox) {
            // IF jukebox exists and doesn't have a name, take to naming endpoint
            if (existingJukebox && existingJukebox.name == '') {
              res.redirect('/jukebox/name/?' + 
                querystring.stringify({
                spotify_id: spotify_id
              }));
            // ELSE make a new jukebox and take to naming endpoint
            } else { 
              var jukebox = new Jukebox({spotify_id: spotify_id, token: access_token, name: '', refresh_token: refresh_token});
              jukebox.save(function(err) {
                if (err) return next(err);
                res.redirect('/jukebox/name/?' + 
                  querystring.stringify({
                  spotify_id: spotify_id,
                }));
              });
            }
          });
        });
      // ELSE IF the authentication fails
      } else {
        res.redirect('/#' +
          querystring.stringify({
          error: 'invalid_token'
        }));
      }
    });
  }
}