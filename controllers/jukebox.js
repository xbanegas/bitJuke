var Jukebox = require('../models/Jukebox');
var request = require('request');

exports.create = function(req, res) {
  'use strict';
  res.render('jukebox/create', {
    title: 'Create'
  });
};

exports.getName = function(req, res) {
  'use strict';
  res.render('jukebox/name', {
    title: 'Name'
  });
};

exports.postName = function(req, res) {
  'use strict';
  console.log('posting name');
  var spotify_id = req.query.spotify_id;
  var jukebox_name = req.body.name;
  console.log(spotify_id + ' ' + jukebox_name);
  // IF jukebox exists, name it
  Jukebox.findOne({ spotify_id: spotify_id }, function(err, jukebox) {
    if (jukebox && jukebox_name != 'name') {
      jukebox.name = jukebox_name || '';
      jukebox.save(function(err) {
        if (err) return next(err);
        // create spotify playlist of same name & redirect
        spotifyCreatePlaylist(jukebox_name, jukebox, res);
      });
    } else {
      res.redirect('/');
    }
  });
};

exports.view = function(req, res) {
  var jukebox_name = req.params.name;
  res.render('jukebox/jukebox', {
    title: jukebox_name
  });
};

function spotifyCreatePlaylist(playlist_name, jukebox, res) {
  var spotify_id = jukebox.spotify_id;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var search_options = {
    url: 'https://api.spotify.com/v1/users/' + spotify_id + '/playlists',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true,
    method: 'POST',
    body: {name: playlist_name, public: true}
  };
  request(search_options, playlistCallback);

  function playlistCallback(error, response, body) {
    console.log('making playlist creation POST');
    if (!error && response.statusCode === 200 || response.statusCode === 201) {
      console.log('playlist creation success');
      var playlist_response = body;
      jukebox.playlist = body.href;
      jukebox.save(function(err) {
        if (err) return next(err);
        res.redirect('/jukebox/' + jukebox.name);
      });
    // ELSE IF token expired refresh it
    } else if (response.statusCode === 401 || response.statusCode === 400) {
      console.log('token expired');
      refreshToken(jukebox, refresh_token, spotifyCreatePlaylist);
    } else { console.log('search fail'); }
  }
}

function refreshToken(jukebox, refresh_token, callback){
  var refresh_uri = secrets.uri + '/refresh_token?refresh_token=' + refresh_token;
  request(refresh_uri, function(error, response, body){
    if (!error && response.statusCode === 200) {
      console.log('token refreshed');
      var new_token = JSON.parse(body).access_token;
      console.log(new_token);
      jukebox.token = new_token;
      jukebox.save(function(error){
        if (error) return next(error);
        console.log('new token saved');
        callback(jukebox.name, jukebox);
      });
    }
  });
}