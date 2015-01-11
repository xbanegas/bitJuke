(function() {
    var socket = io();
    var num_searches = 0;

    var resultsSource = document.getElementById('results-template').innerHTML,
    resultsTemplate = Handlebars.compile(resultsSource);

    $('.search button').click(function(){
      var search_term = $('.search input').val();
      socket.emit('search_request', {search_term: search_term});
      return false;
    });
    socket.on('search_result', function(results){
      ++num_searches;
      console.log('received results');
      // $('.results').html(results.result);
      console.log(results);
      $('.results').html(resultsTemplate(results));
      $('.results button').click(function(){
          var uri = this.value;
          socket.emit('song_requested', {});
      });
    });

})();