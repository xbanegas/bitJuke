var spotify = require('../spotify_modules/spotify');
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
    title: 'Name',
    csrfToken: req.csrfToken()
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
        var args = {
          jukebox_name: jukebox_name,
          jukebox: jukebox,
          res: res
        };
        spotify.createPlaylist(args);
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

exports.admin = function(req, res) {
  console.log(req.session.jukebox);
  res.render('jukebox/admin', {
    playlist_id: req.session.jukebox.playlist_id,
    spotify_id: req.session.jukebox.spotify_id
  });
};