var casper = require('casper').create({
    verbose: true,
    logLevel: 'error'
});
casper.start()

var captureFolder = 'captures';
var musicFolder = 'music';

var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
};

var cleanMp3Name = function(mp3Name) {
    // Change brackets to parenthesis
    mp3Name = mp3Name.replace(/[\[\{]/, '(');
    mp3Name = mp3Name.replace(/[\]\}]/, ')');

    // Remove '/'
    mp3Name = mp3Name.replace(/\//g, '');

    // remove parenthesis for some useless shit
    var parenthesisTerms = 'FREE|EDM\\.COM|OUT NOW|ORIGINAL MIX';
    var regex = new RegExp('(\\([^\\)]*)?(?:'+parenthesisTerms+')([^\\(]*\\))?', 'ig');
    mp3Name = mp3Name.replace(regex, '');

    return mp3Name.trim();
};

var getMp3Name = function(title, artist) {
    var name = artist + ' - ' + title;
    // If the title is in the form 'artist - title'
    if (/\s-\s/.test(title)) {
        name = title;
    }
    else if (/\s\|\s/.test(title)) {
        name = title.replace(/\s\|\s/, ' - ');
    }

    return cleanMp3Name(name);
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
            this.wait(1000);
            if (!this.exists('.heroPlayButton')) {
                this.log('No play button found at ' + pageUrl, 'error');
                this.capture(captureFolder + '/' +  pageUrl.replace(/\//g, '-') + '.png');
                return;
            }
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
                this.log('No stream found', 'error');
                return;
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
                    var pathToFile = '';
                    if (!albumText) {
                        path = musicFolder + '/' + getMp3Name(titleText, artistText)+ '.mp3'
                    }
                    else {
                        path = musicFolder + '/' + albumText + '/' + getMp3Name(titleText, artistText)+ '.mp3'
                    }
                    this.download(mp3Adress, path);
                })
            });
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

        console.log('Found ' + setLinks.length + ' song(s)');

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

        console.log('Found ' + linkList.length + ' track(s) or set(s)');

        for (var i in linkList) {
            _open(linkList[i]);
        }
    });
};

// URL can be anything (a set, a userlist or a track)
var _open = function(url) {
    // If it is a userlist
    //  https://soundcloud.com/thenoisyfreaks
    //  https://soundcloud.com/thenoisyfreaks/
    if (!/soundcloud\.com\/.*\/[\S]/.test(url)) {
        casper.log('*** Open userlist', 'info');
        openUserlist(url);
    }

    // If it is a set
    // https://soundcloud.com/thenoisyfreaks/sets/straight-life-album
    else if (/\/sets\//.test(url) && !/(\?in=).*\/sets\//.test(url)) {
        casper.log('*** Open set', 'info');
        openSet(url);
    }

    // It is a track
    else {
        casper.log('*** Open track', 'info');
        openTrack(url);
    }
};

// openTrack('https://soundcloud.com/firepowerrecs/2-phaseone-touching-the-stars?in=firepowerrecs/sets/phaseone-touching-the-stars');
// openTrack('https://soundcloud.com/airbattle/runwithme');

_open('https://soundcloud.com/stelouse/sets/the-city-ep');

// openUserlist('https://soundcloud.com/brandon-zeier');
casper.run();