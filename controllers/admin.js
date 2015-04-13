var Jukebox = require('../models/Jukebox');
var _ = require('lodash');


exports.index = function(req, res) {
  Jukebox.find({}, function(err, jukebox) {
    var jukebox_names = _.pluck(jukebox, 'name');
    res.render('admin', {
      title: 'Admin',
      jukebox_names: jukebox_names
    });
  });
};