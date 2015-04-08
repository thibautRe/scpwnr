var https = require('https');
var fs = require('fs');
var url = require('url');
var path = require('path');
var ffmetadata = require('ffmetadata');

var Downloader = function(baseDirectory) {
    if (baseDirectory === undefined) baseDirectory = "";
    this.baseDirectory = baseDirectory;
};

// Downloads track (MP3 + cover)
Downloader.prototype.download = function(track, callback) {
    var downloader = this;
    downloader._downloadMp3(track, function() {
        downloader._downloadCover(track, function() {
            var options = {
                attachments: [path.join(downloader.baseDirectory, track.getName() + '.jpg')]
            };

            ffmetadata.write(path.join(downloader.baseDirectory, track.getName() + '.mp3'), {}, options, function(err) {
                if (err) console.log('Error writing cover art');
                else if (callback) {
                    callback();
                }
            });
        });
    });
};

// Downloads MP3
Downloader.prototype._downloadMp3 = function(track, callback) {
    this._download(track.url, path.join(this.baseDirectory, track.getName() + '.mp3'), callback);
};

// Downloads cover
Downloader.prototype._downloadCover = function(track, callback) {
    this._download(track.coverUrl, path.join(this.baseDirectory, track.getName() + '.jpg'), callback);
};

// Downloads a file using HTTPS.get
Downloader.prototype._download = function(file_url, path, callback) {
    var file = fs.createWriteStream(path);
    https.get(file_url, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            if (callback)
                callback();
        });
    });
};

// NodeJS related
var module;
if (module && module.exports) {
    module.exports = Downloader;
}

