var express = require('express.io');
var app = express();
var exec = require('child_process').exec;

app.http().io();

app.get('/', function (req, res) {
    res.send('Hello World!')
});

app.get('/song', function(req, res) {
    exec('casperjs scpwnr.js ' + req.query.url, function(error, stdout, stderr) {
        console.log('plop');
        res.send(req.query.url);
    });
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});