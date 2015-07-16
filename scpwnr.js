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

// Will contain all the pwnd songs
var currentPwnr = [];

var openTrack = function(pageUrl) {
    casper.then(function() {
        var streamMp3Address = '';
        var mp3Adress = '';
        var titleText = '';
        var artistText = '';
        var albumText = '';

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
            var selectors = ['.soundTitle.single', '.soundTitle.soundTitle_hero', '.fullListenHero .soundTitle'];
            this.waitForSelector(selectors.join(','), function() {

                // Retrieve true parent selector
                var parentSelector = '';
                for (var i in selectors) {
                    if (this.exists(selectors[i])) {
                        parentSelector = selectors[i];
                        break;
                    }
                }

                // Click on the button
                this.click(parentSelector + ' button');

                // Retrieve the MP3 informations
                // Retrive the title
                titleText = this.getElementInfo(parentSelector + ' .soundTitle__title').text.trim();
                // Retrieve the artist
                artistText = this.getElementInfo(parentSelector + ' .soundTitle__username').text.trim();

                // Get the album text if it exists
                if (this.exists('.inPlaylist__title')) {
                    albumText = this.getElementInfo('.inPlaylist__title').text.trim();
                }

                // Open the stream MP3 address
                if (streamMp3Address == '') {
                    this.die('No stream found', 1);
                }

                // Retrieve cover Art
                var coverSelector = ".fullListenHero__artwork span.sc-artwork, .listenInfo span.sc-artwork";
                // Retrieve cover style attr
                var coverStyle = this.getElementAttribute(coverSelector, 'style');
                // Retrieve cover url
                var coverUrl = /background(?:-\w*)?:\s?url\((?:"|')?(.*\.jpg)(?:"|')?\)/g.exec(coverStyle)[1];

                // Retrieve MP3 Stream Addresses
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
                    var newTrack = new Track(titleText, artistText, mp3Adress, coverUrl, albumText);
                    currentPwnr.push(newTrack);
                });
            }, function() {
                this.capture(captureFolder + '/' +  pageUrl.replace(/[\/:]/g, '-') + '.png');
                this.die('No play button found at ' + pageUrl, 1);
            }, 2000);
        });
    });
};

var openSet = function(setUrl) {
    casper.thenOpen(setUrl);
    casper.then(function() {
        var setLinks = this.evaluate(function() {
            var setLinks = [];
            var listNodes = document.querySelectorAll('.listenDetails__trackList .trackItem__trackTitle, .listenDetails__trackList .trackItemWithEdit__trackTitle');
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

};


casper.start();

// Open all the arguments in command line
_open(scpwnrClient.getCleanedUrl(casper.cli.args[0]));

// Print the results
casper.then(function() {
    // Server format
    if (casper.cli.options.format == 'server') {
        for (var i in currentPwnr) {
            var track = currentPwnr[i];
            console.log(track.scTitle + '|' + track.scArtist + '|' + track.url + '|' + track.coverUrl + '|' + track.albumText);
        }
    }
});

if (!casper.cli.args.length) {
    casper.log('No arguments given !', 'error');
    casper.exit();
}
else {
    casper.run();
}

