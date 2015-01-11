(function() {
    var socket = io();
    var num_searches = 0;
    var song_uri = '';

    var resultsSource = document.getElementById('results-template').innerHTML,
        resultsTemplate = Handlebars.compile(resultsSource);    

    var queueSource = document.getElementById('queue-template').innerHTML,
        queueTemplate = Handlebars.compile(queueSource);

    var fb = new Firebase("https://74a39f61ngrok.firebaseio.com/");
    var fb_queue = fb.child("queue");

    $('.search button').click(function(){
      var search_term = $('.search input').val();
      socket.emit('search_request', {search_term: search_term});
      return false;
    });
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
            amount = $('#bid input').val();
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
      var google_api = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=';
      var input_address = payment_info.input_address;
      var input_uri = payment_info.input_uri;
      $('#bid').append('<iframe width="300" height="300" src="' + google_api + input_uri + '"></iframe>');
      $('#bid').append('<a href="' + input_uri + '">click to donate: ' + input_address +'</a>');

      // fb_queue.push({song_uri: song_uri, input_address: input_address});

    });

    // $(document).ready(function(){
      // fb_queue.on("value", function(snapshot) {
      //   $('.queue').html(queueTemplate(snapshot.val()));
      //   console.log(snapshot.val());
      // });
    // });


})();