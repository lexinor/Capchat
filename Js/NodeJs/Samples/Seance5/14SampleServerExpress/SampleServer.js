var express = require('express');

var app = express();

app.get('/', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send('Vous êtes à l\'entrée');
});

app.get('/sous-sol', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send('Vous êtes au parking là');
});

app.get('/etage/1/bureau', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send('Bienvenue dans mon bureau!');
});

app.get('/batiment/:batimentnum/bureau', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end('Vous êtes dans le batiment n°' + req.params.batimentnum);
});
app.get('/private', function(req, res) {
    res.sendFile( __dirname + "/private/" + "chatmyope.jpg" );
});


app.use(express.static('forms'));
app.use('/static', express.static('public'));

app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu :'+req.originalUrl);
});

app.listen(8080);