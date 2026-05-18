document.addEventListener("click", (e) => {
    if (e.target.id === "menu-button") {
    const menu = document.getElementById("menu");
    e.target.classList.toggle("active");
    menu.classList.toggle("active");
    }
});