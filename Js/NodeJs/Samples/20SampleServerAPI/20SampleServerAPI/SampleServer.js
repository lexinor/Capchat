
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors'); //pour que le client Swagger fonctionne en cross domain
var jwt = require('jsonwebtoken');//npm install jsonwebtoken

var app = express();
app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url
app.use(cors());

app.get('/', function(req, res) {
    // Juste pour l'accueil
    console.log("demande du manifeste");
     res.sendFile( __dirname + "/api/" + "openapi.yaml" );
});

app.post('/TryLogin', function(req, res) {
  // Tentative de login (appelé par login.html)
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  obj = JSON.parse(JSON.stringify(req.body, null, "  "));
  //On verifie l'identité de 'utilisateur et on génère le token
  var user={nom:obj.nom,naprenom:obj.prenom};
  //Expiration fixee à une heure
  var token=jwt.sign({exp:Math.floor(Date.now()/1000+(60*60)),data:user},'MysecretKey');
  res.json(token);
});

app.post('/VerifyToken', function(req, res) {
  // Tentative de login (appelé par sendtoken.html)
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  obj = JSON.parse(JSON.stringify(req.body, null, "  "));
var token=obj.tokenvalue;
  console.log(token);
  jwt.verify(token, 'MysecretKey', function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Authentif échouée.' });
     res.status(200).send(decoded);
  });
 
});

app.get('/users', function(req, res) {  
  console.log("all users");
  // requête pour récupérer tous. les utilisateurs
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
      res.json(rows);
      });
    });
});


app.get('/users/:id', function(req, res) {  
  // requête pour récupérer un utilisateur
  var TheId=req.params.id;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  var con = mysql.createConnection({
      host: "localhost",
      user: "nodeuser",
      password: "node",
      database: "LicencePro"
    });
    con.connect(function(err) {
      if (err) throw err;
      var sql = 'SELECT * FROM user WHERE id = ?';
      con.query(sql, [TheId],function (err, rows, fields) {
        if (err) throw err;
      res.json(rows);
      });
    });
});
app.post('/users', function(req, res) {  
    // requête pour insérer un utilisateur
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  obj = JSON.parse(JSON.stringify(req.body, null, "  "));
  console.log(obj);
  var con = mysql.createConnection({
      host: "localhost",
      user: "nodeuser",
      password: "node",
      database: "LicencePro"
    });
    
    con.connect(function(err) {
      if (err) throw err;
       var sql = mysql.format("INSERT INTO user (username, email,password) VALUES (?,?,?);", [obj.username, obj.email,obj.password]);
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
      });
    });
res.status(200).end("Inserted");
});

app.put('/users/:id', function(req, res) {  
  var TheId=req.params.id;
  // requête pour mettre à jour un utilisateur
  obj = JSON.parse(JSON.stringify(req.body, null, "  "));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  var con = mysql.createConnection({
      host: "localhost",
      user: "nodeuser",
      password: "node",
      database: "LicencePro"
    });
    con.connect(function(err) {
      if (err) throw err;
      var sql = 'UPDATE user SET username= ?, email=?, password=? WHERE id = ?';
      con.query(sql, [obj.username, obj.email,obj.password,TheId],function (err, rows, fields) {
        if (err) throw err;
        res.status(200).end("Updated");
      });
    });
});
app.delete('/users/:id', function(req, res) { 
  var TheId=req.params.id; 
  // requête pour supprimer un utilisateur
  var con = mysql.createConnection({
    host: "localhost",
    user: "nodeuser",
    password: "node",
    database: "LicencePro"
  });
  con.connect(function(err) {
    if (err) throw err;
    var sql = 'DELETE FROM user WHERE id = ?';
    con.query(sql, [TheId],function (err, rows, fields) {
      if (err) throw err;
      res.status(200).end("Deleted");
    });
  });
});


app.use(express.static('forms'));
app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Adresse inconnue :'+req.originalUrl);
});

app.listen(8080);