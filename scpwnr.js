var captureFolder = 'captures';
var musicFolder = 'music';

var Spooky = require('spooky');
var spooky = new Spooky({
    child: {
        transport: 'http'
    },
    casper: {
        verbose: true,
        logLevel: 'error'
    }
}, function (err) {
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
    }

    spooky.start('');
    var urls = [
        'https://soundcloud.com/mrbillstunes/gourmet-everything'
    ]

    // Open all the arguments in command line
    for (var i in urls) {
        _open(spooky, urls[i]);
    }

    spooky.run();
});

var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
};

var cleanMp3Name = function(mp3Name) {
    // Change brackets to parenthesis
    mp3Name = mp3Name.replace(/[\[\{]/, '(');
    mp3Name = mp3Name.replace(/[\]\}]/, ')');

    // Remove '/', '"'
    mp3Name = mp3Name.replace(/\//g, '');
    mp3Name = mp3Name.replace(/"/g, '');

    // remove parenthesis for some useless shit
    var parenthesisTerms = 'FREE|EDM\\.COM|OUT NOW|ORIGINAL MIX';
    var regex = new RegExp('(\\([^\\)]*)?(?:'+parenthesisTerms+')([^\\(]*\\))?', 'ig');
    mp3Name = mp3Name.replace(regex, '');

    return mp3Name.trim();
};

var getMp3Name = function(title, artist) {
    var name = artist + ' - ' + title;

    // If the title is in the form 'artist - title'
    // Test if there's already a separator in title.
    var separators = ['-', '–', '\\|'];
    var regex = '';
    for (var i in separators) {
        regex += '(?:\\s'+separators[i]+'\\s)';
        if (i < separators.length - 1) {
            regex += '|';
        }
    }
    regex = new RegExp(regex);
    if (regex.test(title)) {
        name = title.replace(regex, ' - ');
    }

    return cleanMp3Name(name);
};

var openTrack = function(spooky, pageUrl) {
    spooky.then(function() {
        console.log('DEBUG');
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
                    console.log('*** Stream adress: GOTCHA');
                    console.log('*** Stream adress: ' + streamMp3Address);
                }
            });

            // Click on the play button
            this.wait(1000);
            if (!this.exists('.heroPlayButton')) {
                console.log('No play button found at ' + pageUrl);
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
                console.log('No stream found');
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
                console.log('*** Mp3 adress: GOTCHA');
                console.log('*** Mp3 adress: ' + mp3Adress);

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

var openSet = function(spooky, setUrl) {
    spooky.thenOpen(setUrl);
    spooky.then(function() {
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

var openUserlist = function(spooky, userlistUrl) {
    spooky.thenOpen(userlistUrl);
    spooky.then(function() {
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
var _open = function(spooky, url) {
    // If it is a userlist
    //  https://soundcloud.com/thenoisyfreaks
    //  https://soundcloud.com/thenoisyfreaks/
    if (!/soundcloud\.com\/.*\/[\S]/.test(url)) {
        console.log('*** Open userlist');
        openUserlist(spooky, url);
    }

    // If it is a set
    // https://soundcloud.com/thenoisyfreaks/sets/straight-life-album
    else if (/\/sets\//.test(url) && !/(\?in=).*\/sets\//.test(url)) {
        console.log('*** Open set');
        openSet(spooky, url);
    }

    // It is a track
    else {
        console.log('*** Open track');
        openTrack(spooky, url);
        console.log('debug2');
    }
};
