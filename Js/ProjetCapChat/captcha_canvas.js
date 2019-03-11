let body = document.body;
// On créer 9 Canvas et on leur met un attribut onclick
function CreateCanvas() {
    let count = 0;
    let selectedImages = GetRandomImg();

    for (var i = 1; i < 10;i++)
    {
        let newCan = document.createElement("canvas");
        let attr = document.createAttribute('onclick');
        attr.value = "IsSelectedImgGood(this);";
        newCan.setAttributeNode(attr);
        newCan.width = 200;
        newCan.height = 200;
        newCan.id = "can" + i;
        body.appendChild(newCan);
        count += 1;
        if(count == 3){
            var br = document.createElement('br');
            body.appendChild(br);
            count = 0;
        }
        AddImageToCanvas(newCan.id, selectedImages);
    }
}

// On essaye d'ajouter les images dans les canvas
function AddImageToCanvas(canId, selectedImages) {
    let can = document.getElementById(canId);
    let currentCtx = can.getContext('2d');
    currentCtx.translate(0,0);

    let img = new Image(50,50);
    img.src = "./neutres/" + selectedImages[0] + ".jpg";
    currentCtx.drawImage(img,0,0);
    selectedImages.splice(0,1);
}

function GetRandomImg() {
    let idImgTab = [0,1,2,3,4,5,6,7,8,9,10,11,12];
    let selectedImg = [];

    for(let i = 0; i < 9; i ++)
    {
        let tabSize = idImgTab.length;
        let randId = Math.floor(Math.random() * tabSize);
        //console.log("Tour : " + i);
        //console.log("nbChoisi : " + idImgTab[randId]);
        selectedImg.push(idImgTab[randId]);
        //console.log("idImgTab : " + idImgTab);
        //console.log("selectedImgTab : " + selectedImg);
        idImgTab.splice(randId,1);
    }
    return selectedImg;
}

function IsSelectedImgGood(img) {
    var id = img.getAttribute('id');
    window.alert('Image ' + id);
}