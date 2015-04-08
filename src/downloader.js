var https = require('https');
var fs = require('fs');
var url = require('url');

var Downloader = function() {};

// Downloads track (MP3 + cover)
Downloader.prototype.download = function(track) {
    var downloader = this;
    downloader._downloadMp3(track, function() {
        downloader._downloadCover(track, function() {
            console.log("allDownloaded");
        });
    });
};

// Downloads MP3
Downloader.prototype._downloadMp3 = function(track, callback) {
    this._download(track.url, track.getName() + ".mp3", callback);
};

// Downloads cover
Downloader.prototype._downloadCover = function(track, callback) {
    this._download(track.coverUrl, track.getName() + ".jpg", callback);
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
    module.exports = new Downloader();
}

