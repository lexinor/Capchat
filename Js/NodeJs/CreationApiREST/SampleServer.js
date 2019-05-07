var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors');
var jwt = require('jsonwebtoken');

var app = express();
app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url

app.get('/', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send('Bonjour');
});

app.get('/private', function(req, res) {
    res.sendFile( __dirname + "/private/" + "chatmyope.jpg" );
});

app.post('/users', function(req, res) {
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
        var sql = mysql.format("INSERT INTO user (nom, prenom,password) VALUES (?,?,?);", [obj.nom, obj.prenom,obj.password]);
        con.query(sql, function (err, result) {
            console.log(obj.nom);
            if (err) throw err;
            console.log("1 record inserted");
        });
    });
    res.status(200).end('Contact créé' );
});

app.get('/users', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    var con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
      });
      con.connect(function(err) {
        if (err) throw err;
        if(req.query.nom){
            let nom = req.query.nom;
            let sql = mysql.format("SELECT * FROM user WHERE nom = ?",nom);
            con.query(sql, function (err, rows, fields) {
                if (err) throw err;
                console.log(rows);
                res.json(rows);
            });
        }
        else{
            con.query("SELECT * FROM user", function (err, rows, fields) {
                if (err) throw err;
                console.log(rows);
                res.json(rows);
            });
        }
      });
});

app.get('/users/:uId', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    let con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
    });
    con.connect(function(err) {
        if (err) throw err;
        let uId = req.params.uId;
        let sql = mysql.format("SELECT * FROM user WHERE id=?",uId);
        con.query(sql, function (err, rows, fields) {
            if (err) throw err;
            console.log(rows);
            /*for (var row in rows) {
                console.log('Nom : ', rows[row].nom);//Ce n'est pas rigoureux au niveau du for each mais pourquoi ??
                res.write(rows[row].nom+" \n");
            }*/

            res.json(rows);
        });
    });
});

app.delete('/users/:uId', function (req, res) {
    res.setHeader("Content-Type","application/json; charset=utf8");
    let id = req.params.uId;
    let con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
    });
    con.connect(function (err) {
        if(err) throw err;
        let sql = mysql.format("DELETE FROM user WHERE id = ?",id);

        con.query(sql,function (err, result,fields) {
            if(err) throw err;
            res.status(200).end("Nombre de lignes supprimée : " + result.affectedRows);
        });
    });
});

app.put('/users/:uId',function (req,res) {
    res.setHeader("Content-Type","application/json; charset=utf8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));
    let id = req.params.uId;

    let con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
    });

    con.connect(function (err) {
        if(err) throw  err;
        console.log(id);
        console.log(obj);
        let sql = mysql.format("UPDATE user SET nom=?, prenom=?, password=? WHERE id=?",[obj.nom,obj.prenom,obj.password,id]);
        con.query(sql,function (err, result) {
            if(err) throw err;
            res.status(200).end("Nombre de lignes modifiés: " + result.affectedRows);
        })
    })
})

// Authentification

app.get('/auth',function(req,res) {
    console.log(createToken("toto   "));
    res.status(200).end();
})

app.get('/login',function(req,res) {
    res.setHeader("Content-Type","application/json; charset=utf8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));
    let id = req.params.uId;

    let con = mysql.createConnection({
        host: "localhost",
        user: "nodeuser",
        password: "node",
        database: "LicencePro"
    });

    let token = createToken(obj);

    //let sql = "SELECT nom, prenom, password, last_token,FROM user WHERE nom=?, prenom=?, password=?, last_token=?, token_gendate"

    res.status(200).end();
})


// Etape pour token
// 1 - Verif - Token
// 2 - Verif - Couple Token/Username
// 3 - Ok

function createToken(){
    let token = jwt.sign({ data: 'toto', exp: Math.floor(Date.now()/1000+(60*60)) },'secret',{ expiresIn: '1h' });
    return token;
}
/*
function genToken(){
    let tokenSize = 50;
    let token = "";
    let alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < tokenSize; i++){
        token += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return token;
}*/

function setTokenValidity(){

}

app.use(express.static('forms'));
app.use('/static', express.static('public'));

app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu : '+req.originalUrl);
});


app.listen(8080);