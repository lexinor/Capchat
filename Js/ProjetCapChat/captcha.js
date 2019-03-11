let body = document.body;

function InitCaptcha() {
    let count = 0;
    let selectedImg = SelectRandImg();
    for (let i = 1; i < 10;i++)
    {
        let img = document.createElement("img");
        let attr = document.createAttribute("onclick");
        attr.value = "IsSelectedImgGood(this);";
        img.setAttributeNode(attr);

        img.id = "img" + i;
        img.width = 100;
        img.height = 100;
        let randImg = Math.floor(Math.random() * selectedImg.length);
        img.src = selectedImg[randImg];
        selectedImg.splice(randImg,1);
        body.appendChild(img);
        count += 1;
        if(count == 3){
            var br = document.createElement('br');
            body.appendChild(br);
            count = 0;
        }
    }
}

function SelectRandImg() {
    let imgArray = [0,1,2,3,4,5,6,7,8,9,10,11,12];
    let randSing = Math.floor(Math.random() * 13);

    let selectedImgUrl = [];

    for(let i = 0; i < 9; i++){
        if(i == 0){
            selectedImgUrl.push("./singuliers/" + imgArray[randSing] + ".jpg");
            imgArray.splice(randSing, 1);
        }
        else {
            let randImg = Math.floor(Math.random() * imgArray.length);
            selectedImgUrl.push("./neutres/" + randImg + ".jpg");
            imgArray.splice(randImg, 1);
        }
    }
    return selectedImgUrl;
}

function IsSelectedImgGood(img) {
    let id = img.getAttribute('id');
    let imgUrl = img.src;

    if(imgUrl.includes("singuliers")){
        setTimeout(function(){ alert("Bien joué"); location.reload();}, 1);
    }
    else
        window.alert("Raté ! Essaye encore :) !");
}