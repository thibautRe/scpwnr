# SCPWNR*

Soundcloud Downloader. Helper to download songs from [Soundcloud](http://soundcloud.com)

[Screencap](https://raw.github.com/thibautRe/scpwnr/master/screencapture.png)

## Disclaimer

This code is provided as as a Proof-of-concept, and for demonstration only. Keep in mind that illegal download is bad for artist creation, and remember to always support the artists you love.


## Features

- Downloads and saves songs from Soundcloud on your local computer
- Downloads the cover of the tracks and integrates it in the mp3
- Can download and entire set or artist tracklist
- Intelligent parsing of artist and title
- User-friendly web interface

The downloaded music is saved in ./music folder. Make sure SCPWNR has
the correct access rights to write here.

## Installation

Install casperjs, phantomjs and ffmpeg

```bash
sudo npm install -g phantomjs
sudo npm install -g casperjs
sudo apt-get install ffmpeg
```

Install the npm dependencies and launch the serveur

```bash
npm install
node server.js
```

Then you can visit http://localhost:3000 to have access to the
web front-end interface