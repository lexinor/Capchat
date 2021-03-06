let body = document.body;
let compteur = 30;
let width = 100;

AffichageCompteur();
setInterval(Compteur, 1000);
var prgbar = setInterval(ProgressBar, 1000);

window.top.document.getElementById("btnsbmit").style.display = "none";

function Clear() {
    for(let i = 1; i < 10; i++){
        let imgId = "img"+i;
        var img = document.getElementById(imgId);
        document.body.removeChild(img);
        document.getElementById('indice').innerHTML = "";
    }
}

function IsSelectedImgGood(current, singularImage) {

    let msg = document.getElementById('msg');
    let imgUrl = current.src;

    if(imgUrl.includes(singularImage)){
        msg.style.color = "green";
        msg.style.fontSize = "25px";
        msg.textContent = "Well done !";
        if(window.top.document.getElementById("btnsbmit"))
            window.top.document.getElementById("btnsbmit").style.display = "block";
        else
            window.top.document.getElementById("myform").submit();
    }
    else{
        msg.style.color = "red";
        msg.style.fontSize = "25px";
        msg.textContent = "Missed ! Try again ! -3s";
        compteur -= 3;
        width -= 3;
    }
}

function AffichageCompteur() {
    document.getElementById("cpt").textContent = "You've got " + compteur + " seconds remaining to answer";
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
        let msg = document.getElementById('msg');
        msg.style.color = "red";
        msg.style.fontSize = "25px";
        msg.textContent = "Temps écoulé !";
        setTimeout(function(){ location.reload(); }, 1000);
    }
}

function ProgressBar() {
    let bar = document.getElementById("bar");
    if (width >= 0) {
        width -= 3.3;
        bar.style.width = width + '%';
    }
    else {
        clearInterval(prgbar);
        //Clear();
        width = 100;
    }
}