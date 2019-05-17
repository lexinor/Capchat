
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "nodeuser",
  password: "node",
  database: "LicencePro"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "INSERT INTO user (username, email,password) VALUES ('toto', 'toto@toto.fr','pass')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
});