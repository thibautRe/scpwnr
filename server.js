var express = require('express.io');
var app = express();
var exec = require('child_process').exec;

app.http().io();
app.use(express.static('public'));

var addToQueue = function(req, url) {
    exec('casperjs scpwnr.js --format=type ' + url, function(error, stdout, stderr) {
        var type = stdout.trim();
        req.io.emit('conv-type', {type: type});
    });
};

app.get('/', function (req, res) {
    req.session.loginDate = new Date().toString();
    req.session.name = req.session.loginDate;
    res.sendfile(__dirname + '/public/index.html');
});

app.io.route('conv-request', function(req) {
    addToQueue(req, req.data);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});