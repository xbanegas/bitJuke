var request = require('request');
var Jukebox = require('../models/Jukebox');
var secrets = require('../config/secrets');

// spotifySearch
// refreshToken
// spotifyGetTracks

module.exports.search = search;
module.exports.refreshToken = refreshToken;
module.exports.getTracks = getTracks;

function search(search_term, jukebox, io, socket_id) {
  var spotify_id = jukebox.spotify_id;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var search_options = {
    url: 'https://api.spotify.com/v1/search?q=' + search_term + '&type=album,track,artist',
    headers: { 'Authorization': 'Bearer ' + access_token },
    method: 'GET'
  };
  request(search_options, searchCallback);

  function searchCallback(error, response, body) {
    console.log('making search request');
    if (!error && response.statusCode === 200) {
      console.log('search success');
      var search_results = JSON.parse(body);
      io.to(socket_id).emit('search_result', search_results);
      // If token expired refresh it
    } else if (response.statusCode === 401) {
      console.log('token expired');
      refreshToken(jukebox, refresh_token);
    } else { console.log('search fail'); }
  }
}

function refreshToken(jukebox, refresh_token){
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
      });
    }
  });
}

function getTracks(tracks_uri, jukebox, io, socket_id) {
  var spotify_id = jukebox.spotify_id;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var search_options = {
    url: tracks_uri,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true,
    method: 'GET',
  };
  request(search_options, tracksCallback);

  function tracksCallback(error, response, body) {
    console.log('making playlist tracks GET');
    if (!error && response.statusCode === 200 || response.statusCode === 201) {
      console.log('tracks retrieve success');
      var tracks_response = body;
      console.log(tracks_response);
      io.to(socket_id).emit('queue_response', {tracks: tracks_response});
    // ELSE IF token expired refresh it
    } else if (response.statusCode === 401 || response.statusCode === 400) {
      console.log('token expired');
      refreshToken(jukebox, refresh_token, getTracks);
    } else { console.log('tracks retrieval fail'); }
  }
}