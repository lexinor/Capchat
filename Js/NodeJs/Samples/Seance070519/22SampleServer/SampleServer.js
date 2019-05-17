var http = require('http');
http.createServer(function (req, res) {
    var host = req.headers['something']; //sinon l'objet Header n'est pas construit
    var userAgent = req.headers['token']; 
     console.log(userAgent);
  res.end("done");
}).listen(8080);