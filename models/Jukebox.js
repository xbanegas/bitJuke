var mongoose = require('mongoose');

// @TODO add spotify username 
var jukeboxSchema = new mongoose.Schema({
  spotify_id: String,
  token: String,
  refresh_token: String,
  name: String
});

module.exports = mongoose.model('Jukebox', jukeboxSchema);