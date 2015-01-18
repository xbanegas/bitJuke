var request = require('request');
var Jukebox = require('../models/Jukebox');
var secrets = require('../config/secrets');

// spotifySearch
// refreshToken
// spotifyGetTracks

module.exports.search = search;
module.exports.refreshToken = refreshToken;
module.exports.getTracks = getTracks;
module.exports.addTrack = addTrack;
module.exports.createPlaylist = createPlaylist;

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
      // console.log(tracks_response);
      io.to(socket_id).emit('queue_response', {tracks: tracks_response});
    // ELSE IF token expired refresh it
    } else if (response.statusCode === 401 || response.statusCode === 400) {
      console.log('token expired');
      refreshToken(jukebox, refresh_token, getTracks);
    } else { console.log('tracks retrieval fail'); }
  }
}

function addTrack(track_id, jukebox, io) {
  var spotify_id = jukebox.spotify_id;
  var playlist_uri = jukebox.playlist;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var jukebox_name = jukebox.name;
  console.log(jukebox);
  var options = {
    url: playlist_uri + '/tracks?uris=spotify:track:' + track_id,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true,
    method: 'POST'
  };
  request(options, addTrackCallback);

  function addTrackCallback(error, response, body) {
    console.log('adding tracks POST');
    // console.log(body);  
    if (!error && response.statusCode === 200 || response.statusCode === 201) {
      console.log('tracks POST success');
      // @TODO make rooms and broadcast only to sockets associated with that jukebox
      io.emit('song_added', {jukebox_name: jukebox_name});
    // ELSE IF token expired refresh it
    } else if (response.statusCode === 401 || response.statusCode === 400 || response.statusCode === 403) {
      console.log('token expired');
      // @TODO allow for refresh token 
      // refreshToken(jukebox, refresh_token);
    } else { console.log('add track fail'); console.log(body); }
  }
}

function createPlaylist(playlist_name, jukebox, res) {
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
      jukebox.playlist_id = body.id;
      jukebox.save(function(err) {
        if (err) return next(err);
        res.redirect('/jukebox/' + jukebox.name + '/admin');
      });
    // ELSE IF token expired refresh it
    } else if (response.statusCode === 401 || response.statusCode === 400) {
      console.log('token expired');
      refreshToken(jukebox, refresh_token, createPlaylist);
    } else { console.log('search fail'); }
  }
}

// @TODO third param repeat callback
function refreshToken(jukebox, refresh_token) {
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