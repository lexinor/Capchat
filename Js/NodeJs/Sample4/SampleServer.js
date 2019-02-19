var http = require('http');
var url = require('url');
var querystring = require('querystring');

var server = http.createServer(function(req,res){
    
    var params = querystring.parse(url.parse(req.url).query);
    res.writeHead(200,{"Content-Type":"text/plain;charset=utf-8"});
    if('prenom' in params && 'nom' in params){
        res.write('Vous vous appelez ' + params['prenom'] + ' ' + params['nom']);
    }
    else{
        res.write('Vous devez bien avoir un nom et un prénom ?');
    }
    res.end();
});
server.listen(8080);
