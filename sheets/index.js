// BUTTON HANDLING
const popup = document.getElementById("create-sheet-prompt");
const sheet_name_field = document.getElementById("sheet-name-field");

document.addEventListener("click", (e) => {
    switch (e.target.id){
        case "sheet-add": 
            popup.style.display = "flex";
            sheet_name_field.value = "";
            break;
        case "dont-create-sheet-button": 
            popup.style.display = "none";
            break;
        case "create-sheet-button":
            createNewSheet().then((sheet) => {
                popup.style.display = "none";
                window.location.href = `/sheets/edit/?id=${encodeURIComponent(sheet.id)}`;
            });

            break;
    };
});

// KEY HANDLING
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (popup.style.display != "none"){
            event.preventDefault();
            popup.style.display = "none";
        }
    }
});

// DB HANDLING
async function getDB() {
    return new Promise((resolve, reject) => {
        const sheetdb_request = indexedDB.open("SheetDatabase", 1);
        sheetdb_request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("sheets")) {
                db.createObjectStore("sheets", {
                    keyPath: "id"
                });
            }
        };

        sheetdb_request.onsuccess = () => resolve(sheetdb_request.result);
        sheetdb_request.onerror = () => reject(sheetdb_request.error);
    });
}

// LOAD EXISTING SHEETS
const template_sheet_element = document.getElementById("sheet-template");
const sheet_container_element = document.getElementById("sheet-container");
async function populateSheetContainer() {
    const sheets = await getAllSheets();
    for (const sheet of sheets){
        const clone = template_sheet_element.content.cloneNode(true);

        const root = clone.querySelector(".sheet");
        const image = clone.querySelector(".sheet-image");
        const text = clone.querySelector(".sheet-text");

        image.src = sheet.image;

        text.textContent = sheet.name;
        root.addEventListener("click", () => {
            window.location.href = `/sheets/edit/?id=${encodeURIComponent(sheet.id)}`;
        });

        sheet_container_element.appendChild(clone);
    }
} populateSheetContainer();

// SHEET HELPERS
const template_sheet = {
    id: 0, name: "", image: "",
    data: {}
}

async function getAllSheets() {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("sheets", "readonly");
        const store = tx.objectStore("sheets");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function createNewSheet() {
    const db = await getDB();
    const new_sheet = structuredClone(template_sheet);
    const name = sheet_name_field.value;

    new_sheet.id = crypto.randomUUID();
    new_sheet.name = name.length == 0 ? "Nova Ficha" : name;
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction("sheets", "readwrite");
        const store = tx.objectStore("sheets");

        const request = store.add(new_sheet);

        request.onsuccess = () => resolve(new_sheet);
        request.onerror = () => reject(request.error);
    });
}