var ko;

var Track = function(scTitle, scArtist, url, coverUrl) {
    if (typeof scTitle == 'object') {
        this.scTitle = scTitle.scTitle;
        this.scArtist = scTitle.scArtist;
        this.url = scTitle.url;
        this.coverUrl = scTitle.coverUrl;
    }
    else {
        this.scTitle = scTitle;
        this.scArtist = scArtist;
        this.url = url;
        this.coverUrl = coverUrl;
    }

    // knockout-related observables & computeds
    if (ko && ko.observable) {
        // not-downloaded, downloading, downloaded
        this.downloadStatus = ko.observable('not-downloaded');
        // 0 - 100
        this.downloadProgress = ko.observable(0);
    }
};

// Track.getCleanInfos()
// ---------------------
// 
//  returns an Object
//      - artist : the true track artist
//      - title : the true track title

Track.prototype.getCleanInfos = function() {
    // If the title is in the form 'artist - title'
    // Test if there's already a separator in title.
    var separators = ['-', '–', '\\|'];
    var regex = '(.+)\\s(?:';
    for (var i in separators) {
        regex += separators[i];
        if (i < separators.length - 1) {
            regex += '|';
        }
    }
    regex += ')\\s(.+)';
    regex = new RegExp(regex);

    var regexResult = this.scTitle.match(regex);
    if (regexResult != null) {
        return {
            title: this._cleanString(regexResult[2]),
            artist: this._cleanString(regexResult[1])
        };
    }

    else {
        return {
            artist: this._cleanString(this.scArtist),
            title: this._cleanString(this.scTitle)
        }
    }
};

// Return the name of the track (used for file names)
Track.prototype.getName = function() {
    var cleanInfos = this.getCleanInfos();
    return cleanInfos['artist'] + ' - ' + cleanInfos['title'];
};

// Return the jpg name of the cover
Track.prototype.getCoverName = function() {
    return this.getMp3Name() + '.jpg';
};

// Clean a string, removing useless stuff
Track.prototype._cleanString = function(string) {
    // Change brackets to parenthesis
    string = string.replace(/[\[\{]/, '(');
    string = string.replace(/[\]\}]/, ')');

    // Remove '/', '"', "*"
    string = string.replace(/\//g, '');
    string = string.replace(/"/g, '');
    string = string.replace(/\*/g, '');

    // remove parenthesis for some useless shit
    var parenthesisTerms = 'FREE|EDM\\.COM|OUT NOW|ORIGINAL MIX';
    var regex = new RegExp('(\\([^\\)]*)?(?:'+parenthesisTerms+')([^\\(]*\\))?', 'ig');
    string = string.replace(regex, '');

    // Remove whitespaces
    string = string.replace(/\s+/g, ' ');

    return string;
};

// NodeJS related
var module;
if (module && module.exports) {
    module.exports = Track;
}