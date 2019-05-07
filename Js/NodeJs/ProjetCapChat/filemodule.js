var fs = require('fs');

function GetAllImages(path)
{
    var files = fs.readdirSync(path);

    return files;
}


exports.GetAllImages = GetAllImages;