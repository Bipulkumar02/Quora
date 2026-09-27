//account
let accountIcon = document.querySelector(".account-icon");
let accountMenu = document.querySelector(".account-menu");
accountIcon.addEventListener("click",function(){
    if(accountMenu.style.display=="block"){
        accountMenu.style.display="none";
    }else{
        accountMenu.style.display="block";
    }
});