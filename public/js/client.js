/* global $, io, Handlebars, Firebase */

(function() {
  'use strict';
  var socket = io();
  var num_searches = 0;
  var song_uri = '';

  // Temporarily tying this JS to jukebox page w/ search button
  if ($('.search button')) {
    // Get jukebox name  
    var jukebox_name = window.location.pathname;
    var length_index = jukebox_name.length;
    var name_index = jukebox_name.indexOf('x/');
    jukebox_name =  jukebox_name.substring(name_index + 2, length_index);

    // Render Search Page Templates
    var resultsSource = document.getElementById('results-template').innerHTML,
        resultsTemplate = Handlebars.compile(resultsSource);    
    var queueSource = document.getElementById('queue-template').innerHTML,
        queueTemplate = Handlebars.compile(queueSource);
    var paymentSource = document.getElementById('payment-template').innerHTML,
        paymentTemplate = Handlebars.compile(paymentSource);

    $('.search button').click(function(){
      // Get search term and send to server
      var search_term = $('.search input').val();
      socket.emit('search_request', {jukebox_name: jukebox_name, search_term: search_term});
      return false;
    });

    socket.emit('queue_request', {jukebox_name: jukebox_name});
    socket.on('queue_response', function(tracks){
      console.log(tracks);
      $('.queue').html(queueTemplate(tracks));
    });

    socket.on('search_result', function(results){
      // ++num_searches;
      console.log('received results');
      console.log(results);
      $('.results').html(resultsTemplate(results));
      $('.results button').click(function(){
          song_uri = this.value;
          socket.emit('song_requested', {uri: song_uri});
          $('.result-tracks').hide();
          $('#bid').show();
          $('#bid button').click(function(){
            $('#bid form').hide();
            console.log('tracks');
            var amount = $('#bid input').val();
            socket.emit( 'amount_submitted', {amount: amount} );
            return false;
          });
          return false;
      });
    });
    socket.on('input_address', function(input_address){
      console.log(input_address + 'bitcoin uri...');
    });
    socket.on('payment_info', function(payment_info){
      $('.payment').html(paymentTemplate(payment_info));
      $('.payment button').click(function(){
        $('.payment').hide();
      });
      // fb_queue.push({song_uri: song_uri, input_address: input_address});

    });
  }
})();