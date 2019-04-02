const http = require('http');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json()); // pour supporter json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',function (req, res) {
    GetImgCount();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send();
});

app.listen(8080);


function GetImgCount() {
    fs.readdir( "./neutres" , function(err, files){
        let img = [];
        for (var i = 0; i < files.length;i++){
            img.push(files[i]);
        }
        console.log(img);
    });
}