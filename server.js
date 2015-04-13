var express = require('express.io');
var app = express();

var Api = require('./src/api');

app.http().io();
app.use(express.static('public'));
app.engine('jade', require('jade').__express);

var api = new Api(app);

app.get('/', function (req, res) {
    res.render('index.jade');
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('SCPWNR listening at http://%s:%s', host, port);
});