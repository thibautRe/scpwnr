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
Downloader.prototype.download = function(track, conversionID, req, callback) {
    var downloader = this;

    // Test if the download is feasible
    if (track.url == "undefined") {
        req.io.emit('down-error', {
            id: conversionID,
            name: track.getName()
        });
        return;
    }

    // Make the album directory if needed
    if (track.albumText) {
        try {
            fs.mkdirSync(path.join(downloader.baseDirectory, track.getFilefriendlyAlbumtext()));
        }
        catch (e) {
            if (e.code != "EEXIST") {
                console.log("Error making album dir : ", e);
            }
        }
    }

    downloader._downloadMp3(track, function() {
        downloader._downloadCover(track, function() {
            var options = {
                attachments: [path.join(downloader.baseDirectory, track.getFilefriendlyAlbumtext(), track.getFilefriendlyName() + '.jpg')]
            };

            ffmetadata.write(path.join(downloader.baseDirectory, track.getFilefriendlyAlbumtext(), track.getName() + '.mp3'), {}, options, function(err) {
                if (err) console.log('Error writing cover art : ' + track.getName());

                // Remove the cover-art file
                fs.unlink(path.join(downloader.baseDirectory, track.getFilefriendlyAlbumtext(), track.getFilefriendlyName() + '.jpg'));

                // Download is finished
                req.io.emit('down-finish', {
                    id: conversionID,
                    name: track.getName()
                });

                // Download complete callback
                if (callback) callback();
            });
        });
    }, function(progress) {
        req.io.emit('down-progress', {
            id: conversionID,
            name: track.getName(),
            progress: progress
        });
    });
};

// Downloads MP3
Downloader.prototype._downloadMp3 = function(track, callback, progressCallback) {
    this._download(track.url, path.join(this.baseDirectory, track.getFilefriendlyAlbumtext(), track.getName() + '.mp3'), callback, progressCallback);
};

// Downloads cover
Downloader.prototype._downloadCover = function(track, callback) {
    this._download(track.coverUrl, path.join(this.baseDirectory, track.getFilefriendlyAlbumtext(), track.getFilefriendlyName() + '.jpg'), callback);
};

// Downloads a file using HTTPS.get
Downloader.prototype._download = function(file_url, path, callback, progressCallback) {
    var file = fs.createWriteStream(path);
    https.get(file_url, function(res) {
        var contentLength = res.headers['content-length'];
        var contentDownloaded = 0;
        res.on('data', function(data) {
            file.write(data);
            contentDownloaded += data.length;
            if (progressCallback) {
                progressCallback(contentDownloaded*100/contentLength);
            }
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
    module.exports = new Downloader('music');
}

