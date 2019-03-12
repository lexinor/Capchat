var connect = require("connect");
var url = require('url');
var app = connect();

function sayHello(req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.write('Premiere reponse. ');
    res.write('Seconde reponse. ');
    res.end("Et c'est fini");
}

function loggingMiddleware(req, res, next) {
    console.log("La métode postée est " + req.method );
    console.log("L'url demandée est " + req.url );
    var queryData = url.parse(req.url, true).query;
    console.log("Les paramètres sont : " + queryData.name );
    next();
}

app
   .use(loggingMiddleware)
   .use(sayHello)
   .listen(3031);

console.log("Serveur est en marche");