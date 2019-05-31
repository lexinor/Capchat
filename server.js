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
const request = require('request');

// CAPCHAT STUFF
const pickRandom = require('pick-random');


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

app.get('/capchatold', function(req, res) {
    res.render('capchat_old');
});

app.get('/capchat/:setName', function(req, res) {

    sess = req.session;
    if(sess.token){
        let setName = req.params.setName;
        let options = {
            url: 'http://localhost:8080/imagesets/' + setName,
            headers: {
                'token': sess.token
            }
        };

        // We are calling the API to get the wanted image set
        request(options,(err,response,body) => {
            if(err) throw err;
            let imgSet = JSON.parse(body);

            let setUrl = JSON.parse(JSON.stringify(imgSet))['setUrl'];

            // Now we are going to read all the image for the imageSet
            let filesArray = fs.readdirSync("./public/" + setUrl, { withFileTypes: true });
            filesArray = pickRandom(filesArray, { count: 9} );
            console.log(filesArray);

            res.render('capchat', { setUrl:setUrl, images: filesArray });
        });
    }
    else{
        res.redirect('/login');
    }
});

app.get('/win', function(req, res) {
    res.render('win');
});

app.get('/', function(req, res) {
    res.render('login');
});

app.get('/visitor', function(req, res) {
    sess = req.session;
    if(req.session.token){
        console.log("calling visitor.pug");

        let options = {
            url: 'http://localhost:8080/imagesets',
            headers: {
                'token': sess.token
            }
        };

        // here we call the API to add the imageset
        request(options,(err,response,body) => {
            if (err) throw err;

            let imageSets = JSON.parse(body);
            console.log(imageSets);
            res.render('index', { imageSets: imageSets });
        });
    }
    else{
        res.redirect('/login')
    }
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

    // here we split the theme, because we are sending   idtheme:themeName
    let theme = req.body.theme.split(':');

    let idTheme = theme[0];
    let themeName = theme[1];

    sess = req.session;

    if(sess.token){
        let sentFile = req.files.zipFile;
        let sentFileName = sentFile.name;


        // We move from a temp file to the real directory to save it
        sentFile.mv('./uploads/' + sentFileName, (err) => {
            if(err)
                res.status(500).send(err);

            // Here we unzip the given file in images/setName/
            var stream = fs.createReadStream('./uploads/' + sentFileName).pipe(unzip.Extract({ path: "./public/images/" + themeName + "/" + setName + "/" }));

            stream.on('close', function(){
                // We remove the .zip file in uploads folder
                fsx.removeSync('./uploads/' + sentFileName);

                // we need to come back to upload page to ask the user which one of the pictures is the weird one
                let filesArray = fs.readdirSync("./public/images/" + themeName + "/" + setName + "/", { withFileTypes: true });

                if(filesArray){
                    res.render('upload', {fileList: filesArray, folderurl: "images/" + themeName + "/" + setName + "/", chosenTheme: themeName, themeId: idTheme, setName:setName });
                }
            });
        });
    }
    else{
        res.redirect('/login')
    }
});

app.post('/endUpload', (req, res) => {
    sess = req.session;
    if(req.session.token){
        obj = JSON.parse(JSON.stringify(req.body,null," "));
        let fileList = JSON.parse(JSON.stringify(obj.fileList));
        let singularImage = obj.singular;
        let imgHint = obj.hint;

        // We need to get the Artist ID for the current user
        let options = { url: 'http://localhost:8080/artists/' + sess.login, headers: { 'token': sess.token }};

        // here we call the API to add the imageset
        request(options,(err,response,body) => {
            if(err) throw err;

            let setName = obj.setName;
            let idArtist = JSON.parse(body);
            let themeId = obj.themeId;
            let folderUrl = obj.folderurl;

            let options2 = {
                url: 'http://localhost:8080/imagesets',
                form: {
                    "setName": setName,
                    "setUrl": folderUrl,
                    "themeId": themeId,
                    "artistId": idArtist
                },
                headers: {'Content-Type': 'application/json','token': sess.token }
            };
            request.post(options2, (err,httpResponse,body) => {
                // Then after adding the set
                // We need to add all the images informations in the database

                // We need to get the idSet
                // GETTING THE SET ID //
                let getOption = { url: 'http://localhost:8080/imagesets/'+setName, headers: { 'token': sess.token }};
                request(getOption,(err,response,body) => {

                    let idSet = body;
                    console.log("File List : " + fileList);

                    for(let i = 0; i < fileList.length; i++){
                        console.log("file " + fileList[i]);
                        let optionImg = null;
                        if(singularImage == fileList[i]){
                            optionImg = { url: 'http://localhost:8080/image/', form: {
                                    "nomImg": fileList[i],
                                    "indice": obj.hint,
                                    "idSet": idSet
                                },
                                headers: {
                                    'token': sess.token
                                }
                            };
                        }else{
                            optionImg = { url: 'http://localhost:8080/image/', form: {
                                    "nomImg": fileList[i],
                                    "indice": null,
                                    "idSet": idSet
                                },
                                headers: {
                                    'token': sess.token
                                }
                            };
                        }
                        console.log("optionImg : " + optionImg);
                        if(optionImg != null){

                            // TODO: REPRENDRE ICI -- BESOIN DE FIXER LE FORMAT DE fileList pour pouvoir faire les ajouts en base
                            // Here we call the API to add the image
                            // ADDING THE IMAGES TO THE DATABASE
                            request.post(optionImg,(err,response,body) => {
                                if (err) throw err;

                                console.log(body);
                                res.redirect('/panel');

                            });
                        }
                    }
                })
            });
        });
    }
    else{
        res.redirect('/login')
    }
})

app.get('/panel', function(req, res) {
    sess = req.session;
    if(req.session.token){
        console.log("calling panel.pug");

        var options = {
            url: 'http://localhost:8080/imagesets/artist/' + sess.login,
            headers: {
                'token': sess.token
            }
        };

        request(options,(err,response,body) => {
            if(err) throw err;

            let imgSets = JSON.parse(body);
            //console.log("img sets : " + imgSets);
            res.render('panel', { imageSets: imgSets });
        })
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
            // console.log(token);
            if(uId != null){
                let sql2 = mysql.format("UPDATE user SET last_token=?, date_token=NOW() WHERE uId=?",[token, uId]);
                con.query(sql2, function (err, rows2, fields) {
                    if (err) throw err;
                    if(rows2.affectedRows > 0){
                        console.log("Update success");
                        let sql3 = mysql.format("SELECT * FROM artist WHERE UserId=?",uId);
                        con.query(sql3, function (err, rows3, fields) {
                            if (err) throw err;
                            if(rows3.length > 0){
                                console.log("User is an artist");
                                res.set("token",token);
                                req.session.login = obj.login;
                                req.session.token = token;
                                res.status(200).redirect('/panel');

                            }
                            else{
                                res.set("token",token);
                                req.session.login = obj.login;
                                req.session.token = token;
                                res.status(200).redirect('/visitor');
                                console.log("User is a simple user");
                            }
                        });
                    }
                    else{
                        console.log("Update failed");
                    }
                });
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
            res.json(rows).end();
        });
    }
    else {
        console.log("No token detected");
        res.status(200).end("No token detected");
    }
});

// Get the ID for an Artist by uLogin
app.get('/artists/:uLogin', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        let uLogin = req.params.uLogin;
        let sql = "SELECT idArtist FROM artist, user WHERE user.uLogin=? AND UserId=uId";
        con.query(sql, uLogin, function (err, rows) {
            if (err) throw err;
            console.log(rows[0].idArtist);

            res.set("token",token);
            res.json(rows[0].idArtist).end();
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

    if(token) {
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
                res.json(rows).end();
            }
            else{
                res.set("token",token);
                console.log("Empty theme table");
                res.json(rows).end();
            }
        });
    }
    else {
        console.log("No token detected");
        res.end("No token detected");
    }
});

// Get a theme by ID
app.get('/themes/:idTheme', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];


    if(token || req.session.token){
        let idTheme = req.params.idTheme;
        console.log(idTheme);
        res.set("Content-Type", "application/json; charset=utf-8");
        con.query("SELECT themeName FROM theme WHERE idTheme=?", idTheme,function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                console.log(rows);
                res.set("token",token);
                res.json(rows).end();
            }
            else{
                res.set("token",token);
                console.log("Can't find a theme with this ID");
                res.status(200).end("Can't find a theme with this ID");
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

// Get all infos for one imageset by his name
app.get('/imagesets/:setName', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        res.set("Content-Type", "application/json; charset=utf-8");
        let setName = req.params.setName;
        con.query("SELECT * FROM imageset WHERE setName=?", setName , function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                console.log(rows);
                res.set("token",token);
                res.json(rows[0]).end();
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
                    res.set("token",token);
                    res.json(rows).end();
                }
                else{
                    res.set("token",token);
                    console.log("Empty image set table");
                    res.json(rows).end();
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

app.get('/imagesets/:setName', (req,res) => {
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token){
        let setName = req.params.setName;
        res.set("Content-Type", "application/json; charset=utf-8");

        let sql = "SELECT * FROM `imageset` WHERE setName=?";
        con.query(sql, setName, function (err, rows) {
            if (err) throw err;
            if(rows.length > 0){
                res.set("token",token);
                res.json(rows).end();
            }
            else{
                res.set("token",token);
                console.log("Empty image set table");
                res.json(rows).end();
            }
        });
    }
    else {
        console.log("No token detected");
        res.end("No token detected");
    };
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
                let sql2 = mysql.format("INSERT INTO imageset (setName, setUrl, idTheme, idArtist) VALUES (?,?,?,?);", [obj.setName, obj.setUrl, obj.themeId, obj.artistId]);
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

// IMAGES //

// Add an image

app.post('/image', (req,res)=>{
    let host = req.headers['init'];
    let token = req.headers['token'];

    if(token) {
        res.set("Content-Type", "application/json; charset=utf-8");
        obj = JSON.parse(JSON.stringify(req.body, null, "  "));

        let sql = mysql.format("INSERT INTO image (nomImg, indice, idSet) VALUES (?,?,?);", [obj.nomImg, obj.indice, obj.idSet]);
        con.query(sql, function (err, result) {
            if (err) throw err;
            if (result.affectedRows > 0) {
                console.log(obj.nomImg + " added to image table");
                res.set("token",token);
                res.status(200).end("added image");
            } else {
                console.log("No image added");
                res.set("token",token);
                res.status(200).end("No image added");
            }
        });
    }
    else {
        console.log('No token detected');
        res.status(200).redirect('/login');
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
