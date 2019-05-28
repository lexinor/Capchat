const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const jwt = require('jsonwebtoken');
const pug = require('pug');

const crypto = require('crypto');
const hash = crypto.createHash('sha256');

// Handling files
const unzip = require('unzip');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const fsx = require('fs-extra');


const app = express();

app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //  pour supporter  encoded url
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(session({ secret: "toto", resave: false, saveUninitialized: false, cookie: { maxAge: 900000 } })); // 900000 = 15 min

// default options
app.use(fileUpload());

// Infos : https://stackoverflow.com/questions/23566555/whats-difference-with-express-session-and-cookie-session
// Infos : https://stackoverflow.com/questions/40755622/how-to-use-session-variable-with-nodejs

var sess;

const con = mysql.createConnection({
    host: "localhost",
    user: "nodeuser",
    password: "node",
    database: "capchat"
});

// BASIC NAVIGATION PAGES //

app.get('/', function(req, res) {
    res.render('login');
});

app.get('/login', (req,res) => {
    res.render('login');
});

app.get('/register', (req,res) => {
    res.render('register');
});

app.get('/upload', (req,res) => {
    sess = req.session;
    if(sess.token){
        con.query("SELECT * FROM theme", function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                let themeList = Array.from(rows);
                res.render('upload', { header: "Upload your image set", themeList: themeList });
            }
            else{
                console.log("Empty theme table");
                res.status(200).end("No themes");
            }
        });
    }
    else{
        res.redirect('/login')
    }
});


// Get the zip, unzip it to the uploads/user/ folder
//
// Move the files into the images/themeName/imageSetName
// Add the files in the database

app.post('/upload', (req,res) => {
    let setName = req.body.setName;
    let idTheme = req.body.theme;
    console.log(req.body);

    let uploadDir = "./uploads/";

    sess = req.session;

    if(sess.token){
        let sentFile = req.files.zipFile;
        let sentFileName = sentFile.name;


        // We move from a temp file to the real directory to save it
        sentFile.mv('./uploads/' + sentFileName, (err) => {
            if(err)
                res.status(500).send(err);

            let userUploadDir = uploadDir + sess.login;

            // Here we unzip the given file in images/setName/
            var stream = fs.createReadStream('./uploads/' + sentFileName).pipe(unzip.Extract({ path: './images/' + setName }));

            stream.on('close', function(){
                // We remove the .zip file in uploads folder
                fsx.removeSync('./uploads/' + sentFileName);

                // we need to come back to upload page to ask the user which one of the pictures is the weird one
                let filesArray = fs.readdirSync('./images/' + setName + "/", { withFileTypes: true });

                if(filesArray){

                    console.log("filesArray " + filesArray);

                    res.render('upload', {fileList: filesArray, folderurl: "/images/" + setName + "/"});
                }
            });



        });
    }
    else{
        res.redirect('/login')
    }
});

app.get('/panel', function(req, res) {
    sess = req.session;
    if(req.session.token){
        console.log("calling panel.pug");
        res.render('panel');
    }
    else{
        res.redirect('/login')
    }

});

app.get('/destroy', (req, res) => {
    if(req.session){
        req.session.destroy((err) => {
            console.log('Session destroyed');
            res.redirect('/');
        })
    }
    else{
        console.log('No session detected');

        res.redirect('/login');
    }
});

// OTHER ACTIONS //

// -------- LOGIN-IN -------- //

app.post('/login', function(req, res) {
    res.set("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body,null," "));

    let uId = null;
    let sql = mysql.format("SELECT * FROM user WHERE uLogin=? and uPass=?",[obj.login, obj.pass]);
    con.query(sql, function (err, rows, fields) {
        if (err) throw err;
        if(rows.length > 0){
            console.log(rows[0].uId);
            uId = rows[0].uId;

            let token = jwt.sign({ data: Date.now() }, 'secret', { expiresIn: '1h' });
            console.log(token);
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
                res.set("token",token);
                req.session.login = obj.login;
                req.session.token = token;
                res.status(200).redirect('/panel');
            }
            else{
                res.status(200).redirect('/');
            }
        }
        else{
            console.log("No account found");
            res.status(200).redirect('/');
        }
    });
});

// -------- ARTISTS -------- //

// List all artists (ID, Nom)
app.get('/artists', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        res.set("Content-Type", "application/json; charset=utf-8");
        con.query("SELECT idArtist, uLogin FROM artist, user WHERE UserId=uId", function (err, rows) {
            if (err) throw err;
            console.log(rows);
            res.set("token",token);
            res.json(rows);
            res.status(200).end("Sucess");
        });
    }
    else {
        console.log("No token detected");
        res.status(200).end("No token detected");
    }
});

// Add an Artist
app.post('/artists', (req, res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token != "" || req.session.token) {
        res.set("Content-Type", "application/json; charset=utf-8");
        obj = JSON.parse(JSON.stringify(req.body, null, "  "));
        console.log("login : " + obj.login);

        let sql = mysql.format("SELECT uId FROM user WHERE uLogin=?",[obj.login]);
        con.query(sql, function (err, result) {
            console.log("rows " + result);
            if(result.length) {
                console.log(result[0].uId);
                uId = result[0].uId;

                let sql2 = mysql.format("INSERT INTO artist (UserId) VALUES (?);", [uId]);
                con.query(sql2, function (err, result) {
                    console.log(obj.login);
                    if (err) throw err;
                    if (result.affectedRows > 0) {
                        console.log(obj.login + " added as an artist");
                        res.set("token",token);
                        res.status(200).end("Artist added");
                    } else {
                        res.set("token",token);
                        console.log("No artist added");
                        res.status(200).end("No artist added");
                    }
                });
                res.set("token",token);
                res.status(200).end("Artist not added");
            }
            else{
                console.log("Cannot find the requested user");
                res.status(200).redirect('/')
            }
        });
    }
    else {
        console.log('No token detected');
        res.status(200).redirect('/login');
    }
});

// -------- THEMES -------- //

// List all themes
app.get('/themes', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token || req.session.token){
        res.set("Content-Type", "application/json; charset=utf-8");
        con.query("SELECT * FROM theme", function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                console.log(rows);
                res.set("token",token);
                res.json(rows);
                res.status(200).end("Sucess");
            }
            else{
                res.set("token",token);
                console.log("Empty theme table");
                res.status(200).end("No themes");
            }
        });
    }
    else {
        console.log("No token detected");
        res.end("No token detected");
    }
});

// Add a Theme
app.post('/themes', (req, res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token) {
        res.set("Content-Type", "application/json; charset=utf-8");
        obj = JSON.parse(JSON.stringify(req.body, null, "  "));

        let sql = mysql.format("SELECT * FROM theme WHERE themeName=?",[obj.themeName]);
        con.query(sql, function (err, result) {
            if(result.length == 0) {

                let sql2 = mysql.format("INSERT INTO theme (themeName) VALUES (?);", [obj.themeName]);
                con.query(sql2, function (err, result) {
                    if (err) throw err;
                    if (result.affectedRows > 0) {
                        console.log(obj.themeName + " added as a theme");
                        res.set("token",token);
                        res.status(200).end(obj.themeName + " added as a theme");
                    } else {
                        console.log("No theme added");
                        res.status(200).end("No theme added");
                    }
                });
                res.set("token",token);
                res.status(200).end("Theme added");
            }
            else{
                console.log("Theme already exists");
                res.set("token",token);
                res.status(200).redirect('/')
            }
        });
    }
    else {
        console.log('No token detected');
        res.status(200).redirect('/login');
    }
});

// -------- IMAGE SET -------- //

// List all imageSets (ID, Nom, idtheme, idartiste, urlusage)
app.get('/imagesets', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];
    console.log("headers : " + req.get('token'));

    if(token){
        res.set("Content-Type", "application/json; charset=utf-8");
        con.query("SELECT * FROM imageset", function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                console.log(rows);
                res.set("token",token);
                res.json(rows);
                res.status(200).end("Sucess");
            }
            else{
                res.set("token",token);
                console.log("Empty theme table");
                res.status(200).end("No themes");
            }
        });
    }
    else {
        console.log("No token detected");
        res.end("No token detected");
    }


});

// List all imageSets (ID, Nom, idtheme, idartiste, urlusage) for an Artist
app.get('/imagesets/artist/:artistName', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    let artistName = req.params.artistName;
    if(artistName){
        if(token){
            res.set("Content-Type", "application/json; charset=utf-8");

            let sql = "SELECT * FROM `imageset` WHERE imageset.idArtist=(SELECT artist.idArtist FROM user, artist WHERE user.uLogin=? AND user.uId=artist.UserId)";
            con.query(sql, [artistName], function (err, rows) {
                if (err) throw err;
                if(rows.length > 0){
                    console.log(rows);
                    res.set("token",token);
                    res.json(rows);
                    res.status(200).end("Sucess");
                }
                else{
                    res.set("token",token);
                    console.log("Empty image set table");
                    res.status(200).end("No image set recieved");
                }
            });
        }
        else {
            console.log("No token detected");
            res.end("No token detected");
        }
    }
    else{
        console.log("No artist name detected");
        res.status(200).redirect('/');
    }
});

// List all imageSets (ID, Nom, idtheme, idartiste, urlusage) for a Theme
app.get('/imagesets', (req,res) => {

});

// Add imageSet
app.post('/imagesets', (req,res)=>{
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token) {
        res.set("Content-Type", "application/json; charset=utf-8");
        obj = JSON.parse(JSON.stringify(req.body, null, "  "));

        let sql = mysql.format("SELECT * FROM imageset WHERE setName=? AND idTheme=? AND idArtist=?",[obj.setName, obj.themeId, obj.artistId] );
        con.query(sql, function (err, result) {
            if(result.length == 0) {

                let sql2 = mysql.format("INSERT INTO imageset (setName, idTheme, idArtist) VALUES (?,?,?);", [obj.setName, obj.themeId, obj.artistId]);
                con.query(sql2, function (err, result) {
                    if (err) throw err;
                    if (result.affectedRows > 0) {
                        console.log(obj.setName + " added as image set");
                        res.set("token",token);
                        res.status(200).end("Added image set");
                    } else {
                        console.log("No image set added");
                        res.set("token",token);
                        res.status(200).end("No image set added");
                    }
                });
                res.set("token",token);
                res.status(200).end("Image set added");
            }
            else{
                res.set("token",token);
                console.log("Image set already exists");
                res.status(200).redirect('/')
            }
        });
    }
    else {
        console.log('No token detected');
        res.status(200).redirect('/login');
    }
});

// Edit Nom, idTheme of imageSet
app.put('/imagesets/:idTheme', (req,res)=>{

});

// Delete an Image Set
app.delete('/imagesets/:setName', (req, res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    let setName = req.params.setName;
    if(setName){
        if(token){
            console.log("Token detected");
            res.set("Content-Type","application/json; charset=utf8");

            let sql = mysql.format("DELETE FROM imageset WHERE setName=?",setName);
            con.query(sql,function (err, result,fields) {
                if(err) throw err;
                if(result.affectedRows > 0){
                    console.log(setName + " has been successfully deleted ");
                    res.set("token",token);
                    res.status(200).end("Nombre de lignes supprimées : " + result.affectedRows);
                }
                else{
                    res.set("token",token);
                    console.log("Not able to delete the image set");
                    res.status(200).end("Aucune lignes supprimées");
                }
            });
        }
        else {
            console.log("No token detected");
            res.render('login');
        }
    }
    else{
        console.log("No image set name detected");
        res.status(200).redirect('/');
    }
});



// OLD METHODS //

app.get('/users', function(req, res) {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        res.set("Content-Type", "application/json; charset=utf-8");
        con.query("SELECT * FROM user", function (err, rows) {
            if (err) throw err;
            console.log(rows);
            res.json(rows);
            res.end("Sucess");
        });
    }
    else {
        console.log("No token detected");
        res.end("No token detected");
    }
});

app.post('/users', function(req, res) {
    res.set("Content-Type", "application/json; charset=utf-8");
    obj = JSON.parse(JSON.stringify(req.body, null, "  "));

    //let hashPass = crypto.createHash('md5').update(obj.pass).digest('hex');

    let sql = mysql.format("INSERT INTO user (uLogin, uPass, uMail) VALUES (?,?,?);", [obj.login, obj.pass, obj.mail]);
    con.query(sql, function (err, result) {
        console.log(obj.login);
        if (err) throw err;
        if (result.affectedRows > 0) {
            console.log("1 record inserted");
            res.status(200).redirect('/login');
        } else {
            console.log("0 record inserted");
            res.status(200).redirect('/register');
        }
    });
});

app.get('/users', function(req, res) {
    res.set("Content-Type", "application/json; charset=utf-8");
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
    res.set("Content-Type", "application/json; charset=utf-8");
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
        res.set("Content-Type","application/json; charset=utf8");
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
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        res.set("Content-Type","application/json; charset=utf8");
        obj = JSON.parse(JSON.stringify(req.body,null," "));
        let id = req.params.uId;

        let sql = mysql.format("UPDATE user SET uLogin=?, uPass=?, uMail=? WHERE uId=?",[obj.login,obj.pass,obj.mail,id]);

        con.query(sql,function (err, result) {
            if(err) throw err;
            if(result.affectedRows > 0){
                console.log(obj.login + " successfully modified");
                res.status(200).end("Nombre de lignes modifiés: " + result.affectedRows);
            }
            else{
                res.status(200).end("Aucune lignes modifiés : " + result.affectedRows);
            }
        })
    }
    else {
        console.log("No token detected");
        res.status(200).redirect('/login');
    }
});


app.use(express.static('public'));
app.use(express.static('images'));

app.use(function(req, res, next){
    res.set("Content-Type", "application/json; charset=utf-8");
    res.status(404).send('Lieu inconnu : '+req.originalUrl);
});

app.listen(8080);
