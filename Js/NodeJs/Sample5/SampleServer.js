let http = require('http');
let fs = require('fs');

let handleRequest = (request, response) => {
    response.writeHead(200,{
        "Content-Type":"text/html"
    });
    fs.readFile('../../ampoule.html',null,function(error,data){
        if(error)
        {
            response.writeHead(404);
            response.write('Whoops ! Fichier Inconnu!');
        } else{
            response.write(data);
        }
        response.end();
    })

}

http.createServer(handleRequest).listen(8080);
