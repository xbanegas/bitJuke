/* global $, io, Handlebars, Firebase */

(function() {
  'use strict';
  var socket = io();
  var num_searches = 0;
  var song_uri = '';

  // var resultsSource = document.getElementById('results-template').innerHTML,
  //     resultsTemplate = Handlebars.compile(resultsSource);    

  // var queueSource = document.getElementById('queue-template').innerHTML,
  //     queueTemplate = Handlebars.compile(queueSource);

  // var paymentSource = document.getElementById('payment-template').innerHTML,
  //     paymentTemplate = Handlebars.compile(paymentSource);

  // var fb = new Firebase("https://74a39f61ngrok.firebaseio.com/");
  // var fb_queue = fb.child("queue");

  $('.search button').click(function(){
    var search_term = $('.search input').val();
    socket.emit('search_request', {search_term: search_term});
    return false;
  });

  // $('form.create button').click(function(){
  //   var name = $('form.create input').val();
  //   $(this).parent().hide();
  // });

  socket.on('search_result', function(results){
    ++num_searches;
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

  // $(document).ready(function(){
    // fb_queue.on("value", function(snapshot) {
    //   $('.queue').html(queueTemplate(snapshot.val()));
    //   console.log(snapshot.val());
    // });
  // });


})();