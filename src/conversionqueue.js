var exec = require('child_process').exec;
var stats = require('./stats.js');
var downloader = require('./downloader');

var Track = require('../public/scripts/track.js');

var ConversionQueue = function() {};

ConversionQueue.prototype.add = function(req, url, conversionID, callback) {
    exec('casperjs scpwnr.js --log-level=error --format=server ' + url, function(error, stdout, stderr) {
        // Emit an error if conversion script fails
        if (error != null) {
            req.io.emit('conversion-error', {
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

        req.io.emit('conversion-finish', {
            id: conversionID,
            tracks: tracks
        });

        for (var i in tracks) {
            // Download the track
            downloader.download(tracks[i], conversionID, req, callback);
        }

    });
};

var module;
if (module && module.exports) {
    module.exports = new ConversionQueue();
}