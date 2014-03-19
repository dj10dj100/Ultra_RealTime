/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var path = require('path');
var port = 3700;
var app = express();
var sentiment = require('sentiment');
var twitter = require('ntwitter');

var tweeter = new twitter({
    consumer_key: 'UhyoD8hqCs1WhzGEPPeapw',
    consumer_secret: 'A1XGSmoZTWAku7EYumLFiAvTcAfIBK4LhLFi68Bcc',
    access_token_key: '92585654-SYUiVstwH0etrIoSVyEq9tFPTx7Ut1Dh8IgrfknLb',
    access_token_secret: '9bBcN0n6xfPBRKE94kFQ4OwxLhZIOdWpeDBbnzI1N5p31'
});


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
var io = require('socket.io').listen(app.listen(port));


app.get('/', routes.index);
app.get('/users', user.list);


io.sockets.on('connection',

    function(socket) {

        tweeter.stream('statuses/filter', {
                track: ['ultra2014', 'ultramusicfestival', 'umf2014', 'ultra music festival', 'ultra 2014', ' umf 2014', 'miami']
            },
            function(stream) {

                if (stream) {
                    stream.on('data', function(data) {

                        getSentiment(data, function(content, result) {

                            socket.emit('tweets-present', {
                                info: content
                            });

                            if (result) {

                                sentimentScore += result.score;
                                var current_score = sentimentScore / totalTweets;
                                socket.emit('sentiment-update', {
                                    info: current_score
                                });
                                totalTweets++;
                            }
                        });
                    });

                    stream.on('error', function(data) {
                        console.log(data);
                    });

                    socket.on('disconnect', function() {
                        stream.destroy
                    });
                }
            });



    } // function socket
);

var totalTweets = 0;
var sentimentScore = 0;

function getSentiment(data, callback) {

    sentiment(data['text'], function(err, result) {
        data['sentiment'] = result.score;
        callback(data, result);
    });

}