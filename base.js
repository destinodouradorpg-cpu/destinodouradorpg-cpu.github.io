const body = document.querySelector("body");

/* Load Menu */
(async () => {
    const menu_file = await fetch("/html/menu.html");
    if (!menu_file.ok) {
        console.log(`Could Not Load Menu File`);
        return;
    }

    const dummy_element = document.createElement("div");
    body.appendChild(dummy_element);

    dummy_element.outerHTML = await menu_file.text();
    
    const menu_element = document.getElementById("menu");
    const menu_button = document.getElementById("menu-button");
    
    menu_button.onclick = () => menu_element.classList.toggle("active");

    document.addEventListener("click", (e) => {
        if (!(e.target instanceof HTMLElement)) return;
        const clicked = e.target;

        if (menu_element.classList.contains("active")){
            if (!menu_element.contains(clicked) && clicked != menu_button){
                menu_element.classList.remove("active");
                e.preventDefault();
            }
        }
    });
})();

/* Load Footer */
(async () => {
    const footer_file = await fetch("/html/footer.html");
    if (!footer_file.ok) {
        console.log(`Could Not Load Footer File`);
        return;
    }

    const footer_element = document.createElement("div");
    body.appendChild(footer_element);
    footer_element.outerHTML = await footer_file.text();
})();