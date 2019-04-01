const express = require('express');
const fs = require('fs');
const app =  express();

app.use(express.static("./"));

app.get("/", function (req, res) {
    res.send('index.html');
});

app.get("/img", function (req, res) {
   getAllImages();
    res.send();
});

app.listen(3000, function () {
    console.log("Listening to port 3000");
})


function getAllImages() {
    let imagesList;
    
    fs.readFile("./neutres", function (err, data) {
        
    })
}