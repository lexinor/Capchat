var http = require('http'),
    fileSystem = require('fs'),
    path = require('path');

http.createServer(function(request, response) {
    var filePath = path.join("./fileupload/", 'ProjetCap.pdf');
    var stat = fileSystem.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    // On remplace le eventhandler classique par un readStream.pipe()
    readStream.pipe(response);
})
.listen(8080);