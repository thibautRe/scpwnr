var express = require('express.io');
var app = express();
var exec = require('child_process').exec;

app.http().io();

var addToQueue = function(req, url) {
    exec('casperjs scpwnr.js ' + url, function(error, stdout, stderr) {
        req.io.emit('song-conversion-finish');
    });
};

app.use(express.static('public'));

// Setup your sessions, just like normal.
// app.use(express.cookieParser())
// app.use(express.session({secret: 'monkey'}))

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html')
});

app.io.route('song-conversion-request', function(req) {
    addToQueue(req, req.data);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

