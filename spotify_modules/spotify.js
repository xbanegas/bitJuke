var request = require('request');
var Jukebox = require('../models/Jukebox');
var secrets = require('../config/secrets');

module.exports.createPlaylist = createPlaylist;
module.exports.refreshToken = refreshToken;
module.exports.getTracks = getTracks;
module.exports.search = search;
module.exports.addTrack = addTrack;

function search(args) {

  // use original request terms or after token refresh
  var search_term = args['search_term'],
    io = args['io'],
    socket_id = args['socket_id'];

  var jukebox = args['jukebox'];
  var spotify_id = jukebox.spotify_id,
    access_token = jukebox.token,
    refresh_token = jukebox.refresh_token;

  var search_options = {
    url: 'https://api.spotify.com/v1/search?q=' + search_term + '&type=album,track,artist',
    headers: { 'Authorization': 'Bearer ' + access_token },
    method: 'GET'
  };

  console.log('access_token: ' + access_token);
  console.log(search_options);


  // make the request
  request(search_options, searchCallback);

  function searchCallback(error, response, body) {
    console.log('making search request');
    if (!error && response.statusCode === 200) {
      console.log('search success');
      var search_results = JSON.parse(body);
      io.to(socket_id).emit('search_result', search_results);
    } else {
      console.log('token error during search');
      // console.log('token error response:');
      // console.log(response);
      refreshToken(search, args); 
    }
  }
}

function getTracks(args) {
  var tracks_uri = args['tracks_uri'];
  var io = args['io'];
  var socket_id = args['socket_id'];
  var jukebox = args['jukebox'];
  var spotify_id = jukebox.spotify_id;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var search_options = {
    url: tracks_uri,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true,
    method: 'GET',
  };

  // make the request
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
      refreshToken(getTracks, args);
    } else { console.log('tracks retrieval fail'); }
  }
}

function addTrack(args) {
  var track_id = args['tracks_id'];
  var jukebox = args['jukebox'];
  var io = args['io'];
  var spotify_id = jukebox.spotify_id;
  var playlist_uri = jukebox.playlist;
  var access_token = jukebox.token;
  var refresh_token = jukebox.refresh_token;
  var jukebox_name = jukebox.name;
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
      refreshToken(addTrack, args);
    } else { console.log('add track fail'); console.log(body); }
  }
}

function createPlaylist(args) {
  var playlist_name = args['playlist_name'];
  var jukebox = args['jukebox'];
  var res = args['res'];
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
      refreshToken(createPlaylist, args);
    } else { console.log('search fail'); }
  }
}


function refreshToken(callback, args) {
  console.log('::::: refreshing token')
  var jukebox = args['jukebox'];
  var refresh_token = jukebox.refresh_token;
  var refresh_uri = secrets.uri + '/refresh_token?refresh_token=' + refresh_token;

  request(refresh_uri, function(error, response, body){
    if (!error && response.statusCode === 200) {
      console.log('::::: token refreshed');
      var new_token = JSON.parse(body).access_token;
      jukebox.token = new_token;
      jukebox.save(function(error){
        if (error) return next(error);
        console.log('::::: new token saved');
        callback(args);
      });
    } else {
      console.log('::::: refresh failed');
      console.log(error);
    }
  });
}