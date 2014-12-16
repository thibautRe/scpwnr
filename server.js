var express = require('express.io');
var app = express();
var exec = require('child_process').exec;

app.http().io();
app.use(express.static('public'));

var conversionID = 0;

var addToQueue = function(req, url, conversionID) {
    exec('casperjs scpwnr.js --log-level=error ' + url, function(error, stdout, stderr) {
        // Emit an error if conversion script fails
        if (error != null) {
            req.io.emit('conv-error', {
                id: conversionID,
                consoleMsg: {
                    stdout: stdout,
                    stderr: stderr
                }
            });
            return;
        }

        req.io.emit('conv-finish', {
            id: conversionID
        });
    });
};

app.get('/', function (req, res) {
    req.session.loginDate = new Date().toString();
    req.session.name = req.session.loginDate;
    res.sendfile(__dirname + '/public/index.html');
});

app.io.route('conv-request', function(req) {
    conversionID++;
    req.io.emit('conv-begin', {id: conversionID});
    addToQueue(req, req.data.url, conversionID);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});