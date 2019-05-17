var http = require('http');

var server = http.createServer(function(req,res)
{
    res.writeHead(200, {"Content-Type":"text/html"}); // Entête, Code 200 = Ok
    res.end('Salut tout le monde !'); // Contenu
});
server.listen(8080);