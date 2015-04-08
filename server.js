var express = require('express.io');
var app = express();
var exec = require('child_process').exec;
var downloader = require('./src/downloader');

app.http().io();
app.use(express.static('public'));

var conversionID = 0;

var addToQueue = function(req, url, conversionID) {
    exec('casperjs scpwnr.js --log-level=error --format=server ' + url, function(error, stdout, stderr) {
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

        var tracks = [];

        // Go through all good lines in console output, to retrieve artist|title|url
        var pattern = '(.+)\\|(.+)\\|(.+)\\|(.+)'
        var regex = new RegExp(pattern, 'gm');
        var goodOutputLines = stdout.match(regex);
        // Remove global for enabling "match" to give capturing groups
        regex = new RegExp(pattern);
        // Filling all tracks with good infos
        for (var i in goodOutputLines) {
            var trackInfos = goodOutputLines[i].match(regex);
            tracks.push({
                scArtist: trackInfos[1],
                scTitle: trackInfos[2],
                url: trackInfos[3],
                coverUrl: trackInfos[4]
            });

            downloader._download(trackInfos[3], 'title.mp3', function() {
                console.log('download over');
            });
        }

        req.io.emit('conv-finish', {
            id: conversionID,
            tracks: tracks
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
    req.io.emit('conv-begin', {
        id: conversionID, url: req.data.url
    });
    addToQueue(req, req.data.url, conversionID);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});