var body = document.body;
function CreateCanvas() {
    var count = 0;
    for (var i = 1; i < 10;i++)
    {
        var newCan = document.createElement("canvas");
        var attr = document.createAttribute('onclick');
        attr.value = "IsSelectedImgGood(this);";
        newCan.setAttributeNode(attr);
        newCan.width = 50;
        newCan.height = 50;
        newCan.id = "can" + i;
        body.appendChild(newCan);
        count += 1;
        if(count == 3){
            var br = document.createElement('br');
            body.appendChild(br);
            count = 0;
        }
    }

}

function IsSelectedImgGood(img) {
    var id = img.getAttribute('id');
    window.alert('Image ' + id);
}