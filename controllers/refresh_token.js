var request = require('request');
var secrets = require('../config/secrets');

module.exports.index = function(req, res){
  'use strict';
  var client_id = secrets.client_id;
  var client_secret = secrets.client_secret;
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    // @TODO implement this safety measure more?
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true,
    method: 'POST'
  };

  request(authOptions, function(error, response, body) {
    console.log('requesting token');
    if (!error && response.statusCode === 200) {
      console.log('token response: ');
      console.log(body);
      var access_token = body.access_token;
      res.send({ access_token: access_token });
    } else {
      console.log('token refresh fail');
      console.log('body');
    }
  });
};