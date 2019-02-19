var http = require('http');
var fmodule = require('./filemodule.js');
var index = require('./index.html');

var server = http.createServer(function(req,res){
    res.writeHead(200,{"Content-Type":"text/html"});
    res.end();
});
server.listen(8080);