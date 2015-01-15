var Jukebox = require('../models/Jukebox');

exports.create = function(req, res) {
  res.render('jukebox/create', {
    title: 'Create'
  });
};

exports.getName = function(req, res) {
  res.render('jukebox/name', {
    title: 'Name'
  });
};

exports.postName = function(req, res) {
  console.log('posting name');
  var spotify_id = req.query.spotify_id;
  var jukebox_name = req.body.name;
  console.log(spotify_id + ' ' + jukebox_name);

  Jukebox.findOne({ spotify_id: spotify_id }, function(err, jukebox) {
    if (jukebox && jukebox_name != 'name') {
      jukebox.name = jukebox_name || '';
      jukebox.save(function(err) {
        if (err) return next(err);
        res.redirect('/jukebox/' + jukebox_name);
      });
    } else {
      res.redirect('/');
    }
  });
};

exports.view = function(req, res) {
  res.render('jukebox/jukebox', {
    title: 'Jukebox'
  });
};