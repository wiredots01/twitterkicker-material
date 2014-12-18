
var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);
var Twit = require('twit');
var searches = {};

var T = new Twit({
  consumer_key: 'VpgVzSVn21lClmIDivvWVyvo7',
  consumer_secret: '86lTAdvSmRIYkr0qtF653bNlN7evoEuXsBLX0oGcKO5wTA1i2U',
  access_token: '50889551-ONCha9BGaDUS8FG1Guct1tC7CPnny2HeVyorKirIW',
  access_token_secret: 'k03njPj8ecSRXhos6A8PMVwLlhf540zbPPL6zP4IIQRJN'
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Sockets
io.on('connection', function(socket) {
  searches[socket.id] = {};
  socket.on('q', function(q) {

    if (!searches[socket.id][q]) {
      console.log('New Search >>', q);

      var stream = T.stream('statuses/filter', {
        track: q
      });

      stream.on('tweet', function(tweet) {
        //console.log(q, tweet.id);
        socket.emit('tweet_' + q, tweet);
      });

      stream.on('limit', function(limitMessage) {
        console.log('Limit for User : ' + socket.id + ' on query ' + q + ' has rechead!');
      });

      stream.on('warning', function(warning) {
        console.log('warning', warning);
      });

      // https://dev.twitter.com/streaming/overview/connecting
      stream.on('reconnect', function(request, response, connectInterval) {
        console.log('reconnect :: connectInterval', connectInterval)
      });

      stream.on('disconnect', function(disconnectMessage) {
        console.log('disconnect', disconnectMessage);
      });

      searches[socket.id][q] = stream;
    }
  });

  socket.on('remove', function(q) {
    searches[socket.id][q].stop();
    delete searches[socket.id][q];
    console.log('Removed Search >>', q);
  });

  socket.on('disconnect', function() {
    for (var k in searches[socket.id]) {
      searches[socket.id][k].stop();
      delete searches[socket.id][k];
    }
    delete searches[socket.id];
    console.log('Removed All Search from user >>', socket.id);
  });

});

server.listen(3000);
console.log('Server listening on port 3000');