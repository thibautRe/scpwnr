var casperModule = require('casper')
var casperOptions = {
    verbose: true,
    logLevel: 'error',
    colorizerType: 'Dummy'
};

// Create casper instance
var casper = casperModule.create(casperOptions);

var captureFolder = 'captures';
var musicFolder = 'music';

var scpwnrClient = require('public/scripts/scpwnr-client.js');

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
                this.capture(captureFolder + '/' +  pageUrl.replace(/\//g, '-') + '.png');
                this.die('No play button found at ' + pageUrl, 1);
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
_open(casper.cli.args[0]);

if (!casper.cli.args.length) {
    casper.log('No arguments given !', 'error');
    casper.exit();
}
else {
    casper.run();
}

