var Stats = require('./stats.js');

var Api = function(app) {
    this.app = app;
    this._setRoutes();
};

Api.prototype._setRoutes = function() {
    this.app.get('/api/stats', function (req, res) {
        res.json(Stats.getAll());
    });

};

// Export
var module
if (module && module.exports) {
    module.exports = Api;
}