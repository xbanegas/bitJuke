var querystring = require('querystring');
var secrets = require('../config/secrets');

exports.index = function(req, res) {
  var stateKey = req.app.get('stateKey');
  var state = req.app.get('generateRandomString')(16);
  var client_id = secrets.client_id;
  var redirect_uri = secrets.redirect_uri;

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
};
