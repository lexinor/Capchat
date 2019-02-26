var body = document.body;
// On créer 9 Canvas et on leur met un attribut onclick
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
        AddImageToCanvas(newCan.id);
    }

}

// On essaye d'ajouter les images dans les canvas
function AddImageToCanvas(canId) {
    let selectedImages = GetRandomImg();
    let can = document.getElementById(canId);
    let currentCtx = can.getContext('2d');

    var img = new Image();
    img.src = "neutres/" + selectedImages[0] + ".jpg";
    currentCtx.drawImage(img,0,0);
    selectedImages.splice(0,1);
}

function GetRandomImg() {
    let idImgTab = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    let selectedImg = [];

    for(var i = 0; i < 9;i ++)
    {
        let tabSize = idImgTab.length;
        let randId = Math.floor(Math.random() * tabSize);
        //console.log("idImgTab : " + idImgTab);
        //console.log("nbChoisi : " + idImgTab[randId]);
        //console.log("selectedImgTab : " + selectedImg);
        selectedImg.push(idImgTab[randId]);
        idImgTab.splice(randId,1);
    }
    //window.alert(selectedImg);

    return selectedImg;
}

function IsSelectedImgGood(img) {
    var id = img.getAttribute('id');
    window.alert('Image ' + id);
}