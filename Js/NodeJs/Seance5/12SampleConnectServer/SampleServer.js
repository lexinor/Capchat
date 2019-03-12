var connect = require("connect"),
serveStatic = require('serve-static');
var bodyParser = require('body-parser')
var app = connect();


app
 .use(serveStatic("forms"))
 .use (function (req,res)
   {
   
       res.write("hello");
       console.log(req.url);
       res.end(bodyParser.stringify(req.body));
     res.statusCode = 200;
    })
   .listen(3031);

console.log("Serveur est en marche");
