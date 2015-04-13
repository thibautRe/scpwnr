var express = require('express.io');
var app = express();
var exec = require('child_process').exec;
var Downloader = require('./src/downloader');
var Stats = require('./src/stats');
var Track = require('./public/scripts/track.js');

app.http().io();
app.use(express.static('public'));
app.engine('jade', require('jade').__express);

var conversionID = 0;
var downloader = new Downloader('music');
var stats = new Stats('./stats.json');


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
        var pattern = '(.+)\\|(.+)\\|(.+)\\|(.+)\\|(.*)'
        var regex = new RegExp(pattern, 'gm');
        var goodOutputLines = stdout.match(regex);
        // Remove global for enabling "match" to give capturing groups
        regex = new RegExp(pattern);

        // Filling all tracks with good infos
        for (var i in goodOutputLines) {
            var trackInfos = goodOutputLines[i].match(regex);
            var newTrack = new Track(trackInfos[1], trackInfos[2], trackInfos[3], trackInfos[4], trackInfos[5]);
            tracks.push(newTrack);
        }

        req.io.emit('conv-finish', {
            id: conversionID,
            tracks: tracks
        });

        for (var i in tracks) {
            // Download the track
            downloader.download(tracks[i], conversionID, req, function() {
                stats.set('sessionDownloads', stats.get('sessionDownloads')+1);
                app.io.broadcast('downloadnumber-changed', {
                    sessionDownloads: stats.get('sessionDownloads')
                });
            });
        }

    });
};

app.get('/', function (req, res) {
    res.render('index.jade');
});

app.get('/api/stats', function (req, res) {
    res.json(stats.getAll());
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