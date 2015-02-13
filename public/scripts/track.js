var Track = function(scTitle, scArtist, url) {
    this.scTitle = scTitle;
    this.scArtist = scArtist;
    this.url = url;
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

// Return the mp3 name of the track
Track.prototype.getMp3Name = function() {
    var cleanInfos = this.getCleanInfos();
    return cleanInfos['artist'] + ' - ' + cleanInfos['title'] + '.mp3';
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

    return string.trim();
};

// NodeJS related
var module;
if (module && module.exports) {
    module.exports = Track;
}