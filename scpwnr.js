var casperModule = require('casper')
var casperOptions = {
    verbose: true,
    logLevel: 'error',
    colorizerType: 'Dummy',
    pageSettings: {
        webSecurityEnabled: false
    }
};

// Create casper instance
var casper = casperModule.create(casperOptions);
casper.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0');

var captureFolder = 'captures';
var musicFolder = 'music';

var scpwnrClient = require('public/scripts/scpwnr-client.js');
var Track = require('public/scripts/track.js');



var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
};

var currentPwnr = {
    songsDownloaded: []
};

var openTrack = function(pageUrl) {
    casper.then(function() {
        var streamMp3Address = '';
        var mp3Adress = '';
        var titleText = '';
        var artistText = '';
        var albumText = '';

        if (/\/sets\/(.*)/.test(pageUrl)) {
            albumText = /\/sets\/(.*)/.exec(pageUrl)[1];
        }

        this.thenOpen(pageUrl);
        this.then(function() {
            // Attach event on resource request
            this.on('resource.requested', function(resource) {
                if (/api.soundcloud.com.*stream/i.test(resource.url)) {
                    streamMp3Address = resource.url;
                    this.log('*** Stream adress: GOTCHA', 'info');
                    this.log('*** Stream adress: ' + streamMp3Address, 'debug');
                }
            });

            // Click on the play button
            this.waitForSelector('.heroPlayButton', function() {
                this.click('.heroPlayButton');

                // Retrieve the MP3 informations
                // Retrive the title
                if (this.exists('.soundTitle__titleHero')) {
                    titleText = this.getElementInfo('.soundTitle__titleHero').text.trim();
                }
                // Retrieve the artist
                if (this.exists('.soundTitle__usernameHero')) {
                    artistText = this.getElementInfo('.soundTitle__usernameHero').text.trim();
                }       

                // Open the stream MP3 address
                if (streamMp3Address == '') {
                    this.die('No stream found', 1);
                }
                this.thenOpen(streamMp3Address, {
                    method: 'get',
                    headers: {
                        "Accept": "application/json, text/javascript, */*; q=0.01"
                    }
                }, function() {

                    // Get the MP3 address
                    mp3Adress = JSON.parse(this.getPageContent()).http_mp3_128_url;
                    this.log('*** Mp3 adress: GOTCHA', 'info');
                    this.log('*** Mp3 adress: ' + mp3Adress, 'info');

                    // Download the mp3
                    this.then(function() {
                        var newTrack = new Track(titleText, artistText, mp3Adress);

                        var pathToFile = '';
                        if (!albumText) {
                            path = musicFolder + '/' + newTrack.getMp3Name();
                        }
                        else {
                            path = musicFolder + '/' + albumText + '/' + newTrack.getMp3Name();
                        }

                        this.download(mp3Adress, path);
                        currentPwnr.songsDownloaded.push(newTrack);
                    })
                });
            }, function() {
                this.die('No play button found at ' + pageUrl, 1);
            }, 5000);
        });
    });
};

var openSet = function(setUrl) {
    casper.thenOpen(setUrl);
    casper.then(function() {
        var setLinks = this.evaluate(function() {
            var setLinks = [];
            var listNodes = document.querySelectorAll('.listenDetails__trackList .trackItem__trackTitle');
            for (var i = 0; i < listNodes.length; i++) {
                setLinks.push(listNodes[i].href);
            }
            return setLinks;
        });

        if (setLinks.length == 0) {
            this.die("No song(s) in set found !", 1);
        }

        for (var i in setLinks) {
            openTrack(setLinks[i]);
        }
    });
};

var openUserlist = function(userlistUrl) {
    casper.thenOpen(userlistUrl);
    casper.then(function() {
        var linkList = this.evaluate(function() {
            var linkList = [];
            var listNodes = document.querySelectorAll('.userStreamItem a.soundTitle__title');

            for (var i = 0; i < listNodes.length; i++)  {
                linkList.push(listNodes[i].href);
            }

            return linkList;
        });

        if (linkList.length == 0) {
            this.die("No song(s) in userlist found !");
        }

        for (var i in linkList) {
            _open(linkList[i]);
        }
    });
};

// URL can be anything (a set, a userlist or a track)
var _open = function(url) {
    var type;
    if (casper.cli.options.type === undefined) {
        type = scpwnrClient.getUrlType(url);
    }
    else {
        type = casper.cli.options.type;
    }

    if (type == 'track') {
        openTrack(url);
    }
    else if (type == 'set') {
        openSet(url);
    }
    else if (type == 'user') {
        openUserlist(url);
    }

    casper.then(function() {
        if (casper.cli.options.format == 'server') {
            for (var i in currentPwnr.songsDownloaded) {
                var track = currentPwnr.songsDownloaded[i];
                var trackInfos = track.getCleanInfos();
                console.log(trackInfos.artist + '|' + trackInfos.title + '|' + track.url);
            }
        }
    });
};


casper.start();

// Open all the arguments in command line
_open(scpwnrClient.getCleanedUrl(casper.cli.args[0]));

if (!casper.cli.args.length) {
    casper.log('No arguments given !', 'error');
    casper.exit();
}
else {
    casper.run();
}

