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
  var access_token = req.query.access_token;
  var jukebox_name = req.body.name;

  Jukebox.findOne({ token: access_token }, function(err, jukebox) {
    if (jukebox && jukebox_name != 'name') {
      jukebox.name = jukebox_name || '';
      jukebox.save(function(err) {
        if (err) return next(err);
        res.redirect('jukebox/' + jukebox_name);
      });
    }
    res.redirect('/');
  });
};

exports.view = function(req, res) {
  res.render('jukebox/jukebox', {
    title: 'Jukebox'
  });
};