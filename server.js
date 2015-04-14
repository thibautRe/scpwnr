// Configuring the Express.io App
var express = require('express.io');
var app = express();
app.http().io();
app.use(express.static('public'));
app.engine('jade', require('jade').__express);

// Configuring the Express API
var Api = require('./src/api');
var api = new Api(app);

// Launching the server
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('SCPWNR* listening at http://%s:%s', host, port);
});