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
        this.on('resource.requested', function(resource) {
            // casper.echo(/\*api.soundcloud.com\*/.test(resource.url));
            if (/api.soundcloud.com.*stream/i.test(resource.url)) {
                streamMp3Address = resource.url;
                this.log('Stream adress: GOTCHA', 'info');
                this.log('Stream adress: ' + streamMp3Address, 'debug');
            }
        });
        this.click('.heroPlayButton');
        this.wait(100);

        this.thenOpen(streamMp3Address, {
            method: 'get',
            headers: {
                "Accept": "application/json, text/javascript, */*; q=0.01"
            }
        }, function() {
            mp3Adress = JSON.parse(this.getPageContent()).http_mp3_128_url;
            this.log('Mp3 adress: GOTCHA', 'info');
            this.log('Mp3 adress: GOTCHA', 'info');

            this.then(function() {
                this.download(mp3Adress, 'sup.mp3');
                this.log('')
            })
        });
    });


    casper.run();
}

openTrack('https://soundcloud.com/buygore/elephant');
