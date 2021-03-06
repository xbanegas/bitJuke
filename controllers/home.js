var Jukebox = require('../models/Jukebox');
var _ = require('lodash');

exports.index = function(req, res) {
  'use strict';
  Jukebox.find({}, function(err, jukebox) {
    var jukebox_names = _.pluck(jukebox, 'name');
    res.render('home', {
      title: 'Home',
      jukebox_names: jukebox_names
    });
  });
};