var express = require('express.io');
var app = express();
var exec = require('child_process').exec;

app.http().io();

app.get('/', function (req, res) {
    res.send('Hello World!')
});

app.get('/song', function(req, res) {
    res.sendfile(__dirname + '/public/test.html');

    exec('casperjs scpwnr.js ' + req.query.url, function(error, stdout, stderr) {
        console.log('Download complete');
        req.io.broadcast('song-conversion-finish');
    });
});

app.io.route('song-conversion-finish', function(req) {
    req.io.respond({
        'song-conversion-finish': 'FINITO'
    });
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});