let body = document.body;
let compteur = 30;

AffichageCompteur();
setInterval(Compteur,1000);

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
            let indices = ReturnTips();
            selectedImgUrl.push("./singuliers/" + imgArray[randSing] + ".jpg");
            imgArray.splice(randSing, 1);
            ShowIndice(randSing);
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

    var msg = document.getElementById('msg');
    let id = img.getAttribute('id');
    let imgUrl = img.src;

    if(imgUrl.includes("singuliers")){
        msg.style.color = "green";
        msg.style.fontSize = "25px";
        msg.textContent = "Bien joué !";
        setTimeout(function(){ location.reload(); }, 1000);
    }
    else{
        msg.style.color = "red";
        msg.style.fontSize = "25px";
        msg.textContent = "Raté ! Essaye encore :) ! -3s";
        compteur -= 3;
    }
}

function ShowIndice(idTips) {
    let indices = ReturnTips();
    let indice = document.getElementById('indice');
    indice.textContent = indices[idTips];
}

function AffichageCompteur() {
    document.getElementById("cpt").textContent = "Il vous reste " + compteur + " secondes pour répondre au captcha";
}

function Compteur() {
    if(compteur > 0)
    {
        AffichageCompteur();
        compteur -= 1;
        AffichageCompteur();
    }
    else
    {
        compteur = 30;
        setTimeout(function(){ alert("Temps écoulé"); location.reload();}, 1);
    }
}

function ReturnTips() {
    let indices = [];
    indices[0] = "Deux yeux, c'est bien démodé !";
    indices[1] = "C'est encore le chat qui porte le chapeau";
    indices[2] = "Saurez-vous reconnaître le chat de Thomas Pesquet ?";
    indices[3] = "C'est la reine d'Angleterre qui a perdu son chat";
    indices[4] = "Saurez vous reconnaître un chat amoureux ?";
    indices[5] = "Quel type de chat se cache derrière ses moustaches  ?";
    indices[6] = "Chat du grand bleu ";
    indices[7] = "Mon chat est une fausse blonde";
    indices[8] = "Ne confondons pas une salicorne et un chat-licorne ! ";
    indices[9] = "Ce chat là a fait une croix sur son oeil";
    indices[10] = "Après les gilets jaunes, voici les foulards rouges";
    indices[11] = "Ce chat là a oublié de se faire vacciner contre la grippe";
    indices[12] = "Chaussez vos lunettes et montrez-moi le chat myope ?";
    indices[13] = "Après la fiancée du pirate, voici le chat du corsaire";
    return indices;
}