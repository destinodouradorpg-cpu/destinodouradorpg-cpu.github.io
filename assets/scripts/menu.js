document.addEventListener("click", (e) => {
    const menu = document.getElementById("menu");
    const clicked = e.target;

    if (clicked.id === "menu-button") {
        menu.classList.toggle("active");
    }

    if (menu.classList.contains("active")){
        if (!menu.contains(clicked) && clicked.id != "menu-button"){
            menu.classList.toggle("active");
        }
    }
});