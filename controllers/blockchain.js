module.exports.index = function(req, res) {
  'use strict';
  
  console.log('response from blockchain received');
  console.log(getDate());
  console.log(req.query);

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
  // @TODO spotify add to queue

};