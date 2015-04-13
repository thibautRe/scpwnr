var fs = require('fs');

var Stats = function(filename) {
    this.filename = filename;
    this.data = {
        'sessionDownloads': 0
    };
    this._loadSync();
};

// Get a value
Stats.prototype.get = function(key) {
    return this.data[key];
};

// synchronous set + save
Stats.prototype.set = function(key, value) {
    this.data[key] = value;
    this._saveSync();
};

// Synchronous load
Stats.prototype._loadSync = function() {
    var data = fs.readFileSync(this.filename, {
        encoding: 'utf-8'
    });

    // Empty file
    if (data != "") {
        this.data = JSON.parse(data);
    }
};

// synchronous save
Stats.prototype._saveSync = function() {
    fs.writeFileSync(this.filename, JSON.stringify(this.data));
};


// Export
var module
if (module && module.exports) {
    module.exports = Stats;
}