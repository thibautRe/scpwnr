var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
}

var creationOptions = {
    verbose: true,
    logLevel: 'error'
}

var getMp3Name = function(title, artist) {
    return artist + ' - ' + title;
};

var openTrack = function(pageUrl) {
    var casper = require('casper').create(creationOptions);

    var streamMp3Address = '';
    var mp3Adress = '';
    var titleText = '';
    var artistText = '';

    casper.start(pageUrl);
    casper.then(function() {
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
    casper.run();
};

openTrack('https://soundcloud.com/shirobon/shibuya');
