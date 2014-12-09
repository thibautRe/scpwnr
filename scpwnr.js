var casper = require('casper').create(creationOptions);
casper.start()


var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
}

var creationOptions = {
    verbose: true,
    logLevel: 'error'
}

var cleanMp3Name = function(mp3Name) {
    // remove parenthesis for some useless shit
    var parenthesisTerms = 'FREE|EDM\\.COM|OUT NOW|ORIGINAL MIX';
    var regex = new RegExp('((?:\\(|\\[)[^\\]\\)]*)?(?:'+parenthesisTerms+')([^\\[\\(]*(?:\\)|\\]))?', 'ig');
    var mp3Name = mp3Name.replace(regex, '');

    return mp3Name.trim();
};

var getMp3Name = function(title, artist) {
    var name = artist + ' - ' + title;
    // If the title is in the form 'artist - title'
    if (/\s-\s/.test(title)) {
        name = title;
    }

    return cleanMp3Name(name);
};

var openTrack = function(pageUrl) {

    casper.then(function() {
        var streamMp3Address = '';
        var mp3Adress = '';
        var titleText = '';
        var artistText = '';

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
            if (!this.exists('.heroPlayButton')) {
                this.log('No play button found', 'error');
                return;
            }
            this.click('.heroPlayButton');
            this.wait(100);

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
                    this.download(mp3Adress, getMp3Name(titleText, artistText)+ '.mp3');
                })
            });
        });
    });
};


openTrack('https://soundcloud.com/firepowerrecs/2-phaseone-touching-the-stars?in=firepowerrecs/sets/phaseone-touching-the-stars');
openTrack('https://soundcloud.com/your-ol-lady/autodidakt-kroyclub-popo-your-ol-lady-remix');

casper.run();