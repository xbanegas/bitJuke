var spotify = require('../spotify_modules/spotify');
var Jukebox = require('../models/Jukebox');


module.exports.index = function(req, res) {
  'use strict';
  // @TODO verify req is from blockchain.info
  console.log('response from blockchain received');
  console.log(getDate());
  console.log(req.query.song_uri);

  var io = res.app.get('io');
  var song_uri = req.query.song_uri;
  var jukebox_name = req.query.jukebox_name;

  console.log(req.query);

  Jukebox.findOne({name: jukebox_name}, function(err, jukebox){
    if (err) next(err);
    if (jukebox) { 
      var args = {
        song_uri: song_uri,
        jukebox: jukebox,
        io: io
      };
      spotify.addTrack(args); 
    }
  });

  res.send('*ok*');

  function addZero(i) { if (i < 10) { i = "0" + i; } return i; }
  function getDate() {
      var d = new Date();
      var x = '';
      var h = addZero(d.getHours());
      var m = addZero(d.getMinutes());
      var s = addZero(d.getSeconds());
      x = h + ":" + m + ":" + s;
      return x;
  }

};