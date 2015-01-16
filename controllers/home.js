var Jukebox = require('../models/Jukebox');
var _ = require('lodash');

exports.index = function(req, res) {
  'use strict';
  Jukebox.find({}, function(err, jukebox){
    console.log('hello home');
    var jukebox_names = _.pluck(jukebox, 'name');
    console.log(jukebox_names);
    // @TODO lodash to get jukebox names?
    res.render('home', {
      title: 'Home',
      jukebox_names: jukebox_names
    });
  });
};