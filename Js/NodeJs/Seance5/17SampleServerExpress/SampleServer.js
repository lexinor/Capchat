var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();
app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url

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

app.get('/listusers', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    var con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
      });
      con.connect(function(err) {
        if (err) throw err;
        con.query("SELECT * FROM user", function (err, rows, fields) {
          if (err) throw err;
          console.log(rows);
        for (var row in rows) {
            console.log('Nom : ', rows[row].username);//Ce n'est pas rigoureux au nivau du for each mais pourquoi ??
            res.write(rows[row].username+" ");
        }
        res.end('\nEt c\' est tout');
        });
      });
});
app.post('/newcontact', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body, null, "  "));
    var con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
      });
      
      con.connect(function(err) {
        if (err) throw err;
         var sql = mysql.format("INSERT INTO user (username, email,password) VALUES (?,?,?);", [obj.nom, obj.prenom,obj.nom]);
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
        });
      });
res.status(200).end('Contact créé' );
});

app.use(express.static('forms'));
app.use('/static', express.static('public'));


app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu : '+req.originalUrl);
});

app.listen(8080);