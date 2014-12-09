var show = function(_object) {
    console.log(JSON.stringify(_object, undefined, 4));
}

var creationOptions = {
    verbose: true,
    logLevel: 'debug'
}

var openTrack = function(pageUrl) {
    var casper = require('casper').create(creationOptions);

    var streamMp3Address = '';
    var mp3Adress = '';

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
                this.download(mp3Adress, 'sup.mp3');
            })
        });
    });


    casper.run();
}

openTrack('https://soundcloud.com/buygore/elephnt');
