var mongoose = require('mongoose');

var jukeboxSchema = new mongoose.Schema({
  token: String,
  name: String
});

module.exports = mongoose.model('Jukebox', jukeboxSchema);