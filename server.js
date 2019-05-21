const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const jwt = require('jsonwebtoken'
);
const pug = require('pug/lib');

const crypto = require('crypto');
const hash = crypto.createHash('sha256');

const app = express();

app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(session({ secret: "toto", resave: false, saveUninitialized: false, cookie: { maxAge: 6000} }));

// Infos : https://stackoverflow.com/questions/23566555/whats-difference-with-express-session-and-cookie-session
// Infos : https://stackoverflow.com/questions/40755622/how-to-use-session-variable-with-nodejs


const con = mysql.createConnection({
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
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        res.setHeader("Content-Type", "application/json; charset=utf-8");
       //con.connect(function(err) {
       //    if (err) throw err;
            con.query("SELECT * FROM user", function (err, rows) {
                if (err) throw err;
                console.log(rows);
                res.json(rows);
                res.end("Sucess");
            });
        //});
        //res.end("Fin de req");
    }
    else {
        res.end("no token");
    }

});

app.post('/users', function(req, res) {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        obj = JSON.parse(JSON.stringify(req.body, null, "  "));

        //let hashPass = crypto.createHash('md5').update(obj.pass).digest('hex');

        //con.connect(function(err) {
        //    if (err) throw err;

        let sql = mysql.format("INSERT INTO user (uLogin, uPass, uMail) VALUES (?,?,?);", [obj.login, obj.pass, obj.mail]);
        con.query(sql, function (err, result) {
            console.log(obj.login);
            if (err) throw err;
            if (result.affectedRows > 0) {
                console.log("1 record inserted");
                res.end();
            } else {
                console.log("0 record inserted");
                res.end();
            }
        });
    }
    else {
        res.end("no token");
    }
    //});
});

app.get('/users', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    //con.connect(function(err) {
    //    if (err) throw err;
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
    //});
});

app.get('/users/:uId', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    //con.connect(function(err) {
    //    if (err) throw err;
        let uId = req.params.uId;
        let sql = mysql.format("SELECT * FROM user WHERE uId=?",uId);
        con.query(sql, function (err, rows, fields) {
            if (err) throw err;
            console.log(rows);
            res.json(rows);
        });
    //});
});

app.delete('/users/:uId', function (req, res) {
    let host = req.headers['init'];
    let token = req.headers['token'];
    if(token){
        console.log("Token detected");
        res.setHeader("Content-Type","application/json; charset=utf8");
        let id = req.params.uId;
        console.log("ID : " + id);

        //con.connect(function (err) {
        //    if(err) throw err;
            let sql = mysql.format("DELETE FROM user WHERE uId = ?",id);

            con.query(sql,function (err, result,fields) {
                if(err) throw err;
                if(result.affectedRows > 0)
                    res.status(200).end("Nombre de lignes supprimées : " + result.affectedRows);
                else
                    res.status(200).end("Aucune lignes supprimées")
            });
        //});
    }
    else {
        res.render('login');
    }
});

app.put('/users/:uId',function (req,res) {
    res.setHeader("Content-Type","application/json; charset=utf8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));
    let id = req.params.uId;

    //con.connect(function (err) {
    //    if(err) throw  err;
        let sql = mysql.format("UPDATE user SET uLogin=?, uPass=?, uMail=? WHERE uId=?",[obj.login,obj.pass,obj.mail,id]);
        con.query(sql,function (err, result) {
            if(err) throw err;
            res.status(200).end("Nombre de lignes modifiés: " + result.affectedRows);
        })
    //})
});

app.get('/tests', (req,res) => {
    var isTokenOk = checkToken(req);
    console.log(checkToken(req).then((result) => {
        return result;
    }));

    if(isTokenOk)
        res.end("Token ok");
    else
        res.end("Token not ok")
});



async function checkToken(req){
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        let sql = mysql.format("SELECT * FROM user WHERE last_token=?",token);
        con.query(sql,function (err, rows) {
            if(err) throw err;
            if(rows.length > 0){
                console.log(rows[0].token_date);
                return true;
            }
            else{
                return false;
            }
        })
    }
    else{
        return false;
    }
}


app.get('/login', (req,res) => {
    res.render('login');
});

app.post('/login', function(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));

    let uId = null;
    let sql = mysql.format("SELECT * FROM user WHERE uLogin=? and uPass=?",[obj.login, obj.pass]);
    con.query(sql, function (err, rows, fields) {
        if (err) throw err;
        if(rows.length){
            console.log("sent data : " + obj.toString());
            console.log(rows[0].uId);
            uId = rows[0].uId;
            console.log(uId);


            let token = jwt.sign({ data: Date.now() }, 'secret', { expiresIn: '1h' });
            console.log(token);
            console.log(uId);
            if(uId != null){
                let sql2 = mysql.format("UPDATE user SET last_token=?, date_token=NOW() WHERE uId=?",[token, uId]);
                con.query(sql2, function (err, rows, fields) {
                    if (err) throw err;
                    if(rows.affectedRows > 0){
                        console.log("Update success");
                    }
                    else{
                        console.log("Update failed");
                    }
                });
                res.setHeader("token",token);
                res.status(200).end("Vous êtes connecté");
            }
            else{
                res.status(200).end("Erreur lors de la connexion")
            }

        }
        else{
            console.log("No account found");
        }
    });



});

app.use(express.static('forms'));
app.use(express.static('public'));

app.use(function(req, res, next){
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu : '+req.originalUrl);
});

app.listen(8080);
