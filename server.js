let express = require('express');
let bodyParser = require('body-parser');
let mysql = require('mysql');
let cors = require('cors');
let jwt = require('jsonwebtoken');
let pug = require('pug/lib');
let crypto = require('crypto');
let hash = crypto.createHash('sha256');

let app = express();
app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url
app.set('view engine', 'pug');

let con = mysql.createConnection({
    host: "localhost",
    user: "nodeuser",
    password: "node",
    database: "capchat"
});

app.get('/', function(req, res) {
    console.log("calling index.pug");
    res.render('index', { pageTitle: "Projet Capchat" });
});



app.get('/users', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    con.connect(function(err) {
        if (err) throw err;
            con.query("SELECT * FROM user", function (err, rows, fields) {
                if (err) throw err;
                console.log(rows);
                res.json(rows);
            });
    });
});

app.post('/users', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body, null, "  "));

    let hashPass = crypto.createHash('md5').update(obj.pass).digest('hex');

    con.connect(function(err) {
        if (err) throw err;

        var sql = mysql.format("INSERT INTO user (uLogin, uPass, uMail) VALUES (?,?,?);", [obj.login, hashPass, obj.mail]);
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
    con.connect(function(err) {
        if (err) throw err;
        if(req.query.login){
            let login = req.query.login;
            let sql = mysql.format("SELECT * FROM user WHERE uLogin = ?",login);
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
    con.connect(function(err) {
        if (err) throw err;
        let uId = req.params.uId;
        let sql = mysql.format("SELECT * FROM user WHERE uId=?",uId);
        con.query(sql, function (err, rows, fields) {
            if (err) throw err;
            console.log(rows);
            res.json(rows);
        });
    });
});

app.delete('/users/:uId', function (req, res) {
    res.setHeader("Content-Type","application/json; charset=utf8");
    let id = req.params.uId;

    con.connect(function (err) {
        if(err) throw err;
        let sql = mysql.format("DELETE FROM user WHERE uId = ?",id);

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

    con.connect(function (err) {
        if(err) throw  err;
        let sql = mysql.format("UPDATE user SET uLogin=?, uPass=?, uMail=? WHERE uId=?",[obj.login,obj.pass,obj.mail,id]);
        con.query(sql,function (err, result) {
            if(err) throw err;
            res.status(200).end("Nombre de lignes modifiés: " + result.affectedRows);
        })
    })
});

app.get('/ando', (req,res) => {
});

app.get('/login', (req,res) => {
    res.render('login');
});

app.post('/login', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));

    /*let hashPass = crypto.createHash('md5').update(obj.pass).digest('hex');
    console.log("MD5 hash : " + hash);*/

    con.connect(function(err) {
        if (err) throw err;
        let sql = mysql.format("SELECT * FROM user WHERE uLogin=? and uPass=?",[obj.login, obj.pass]);
        con.query(sql, function (err, rows, fields) {
            if (err) throw err;
            console.log(Date.now());
            let token = jwt.sign({ data: Date.now() }, 'secret', { expiresIn: '1h' });
            console.log(token);
            res.setHeader("token",token);
            res.json(rows);
        });
    });
});


app.use(express.static('forms'));
app.use(express.static('public'));

app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu : '+req.originalUrl);
});

app.listen(8080);
