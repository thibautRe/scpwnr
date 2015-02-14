# SCPWNR*

Soundcloud Pwnr*. Helper to download songs from [Soundcloud](http://soundcloud.com)


## Features

- Downloads and saves songs from Soundcloud on your local computer
- Can download and entire set or artist tracklist
- Intelligent parsing of artist and title
- User-friendly web interface

The downloaded music is saved in ./music folder. Make sure SCPWN* has
the correct access rights to write here.

## Installation

Install casperjs and phantomjs

```bash
sudo npm install -g phantomjs
sudo npm install -g casperjs
```


### Command line usage

```bash
casperjs scpwnr.js (options)
```

Where options are the Soundcloud URL you want to pwn. It can be :
- A track URL
- A Set URL
- A Profile URL


### User-friendly web interface

```bash
npm install
node server.js
```

This will setup a server on port 3000, so that you can multi-thread
your downloads.