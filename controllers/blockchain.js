var spotify = require('../spotify_modules/spotify');
var Jukebox = require('../models/Jukebox');


module.exports.index = function(req, res) {
  'use strict';
  // @TODO verify req is from blockchain.info
  var io = res.app.get('io');
  var song_uri = req.query.song_uri;
  var jukebox_name = req.query.jukebox;

  console.log('::::: response from blockchain received at ' + getDate() + ' for song_uri ' + req.query.song_uri + ':');
  console.log(req.query);

  Jukebox.findOne({name: jukebox_name}, function(err, jukebox){
    console.log(err);
    console.log(jukebox);

    if (err) next(err);
    if (jukebox) { 
      console.log('firing spotify addTrack from blockchain');
      var args = {
        song_uri: song_uri,
        jukebox: jukebox,
        io: io
      };
      spotify.addTrack(args); 
    }
    res.send('*ok*');
  });


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