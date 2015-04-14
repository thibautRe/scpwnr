var stats = require('./stats.js');
var conversionQueue = require('./conversionqueue.js');

var Api = function(app) {
    this.app = app;
    this._setRoutes();
};

Api.prototype._setRoutes = function() {
    var api = this;

    // /
    this.app.get('/', function (req, res) {
        res.render('index.jade');
    });
    
    // /api/stats
    this.app.get('/api/stats', function (req, res) {
        res.json(stats.getAll());
    });

    // /api/conversion-request
    this.app.io.route('/api/conversion-request', function(req, res) {
        stats.increment('sessionConversions');
        var session = stats.get('sessionConversions');
        conversionQueue.add(req, req.data.url, session, function() {
            stats.increment('sessionDownloads');
            api.app.io.broadcast('downloadnumber-changed', {
                sessionDownloads: stats.get('sessionDownloads')
            });
        });
        req.io.emit('conversion-begin', {
            id: session, url: req.data.url
        });
    });

};

// Export
var module
if (module && module.exports) {
    module.exports = Api;
}