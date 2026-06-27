import * as Prompt from "/assets/scripts/prompts.js"
import * as SheetDB from "/assets/scripts/sheet-database.js"
import "/assets/scripts/init.js"

// BUTTON HANDLING
const popup = await Prompt.loadPrompt("/assets/html/prompts/create-sheet.html", () => {});

popup.addEventListener("on-open", () => {
    const name_field = popup.base.querySelector("#sheet-name-field");
    if (name_field instanceof HTMLInputElement)
        name_field.value = "";
})

popup.button("#create-sheet-button", async () => {
    const db = await SheetDB.getDB();
    const sheet = SheetDB.Sheet.empty();

    const name_field = popup.base.querySelector("#sheet-name-field")
    if (!(name_field instanceof HTMLInputElement)){
        console.error("Name Field Is Not A HTMLInputElement");
        return;
    }

    const name = name_field.value;

    sheet.id = crypto.randomUUID();
    sheet.name = name.length == 0 ? "Nova Ficha" : name;
    
    const tx = db.transaction("sheets", "readwrite");
    const store = tx.objectStore("sheets");

    const request = store.add(sheet);

    request.onerror = () => console.error(request.error);
    request.onsuccess = () => {
        window.location.href = `/sheets/edit/?id=${encodeURIComponent(sheet.id)}`;
    };
})

popup.button("#dont-create-sheet-button", () => {popup.close();})

const add_sheet_button = document.getElementById("sheet-add");
add_sheet_button.addEventListener("click", () => popup.open())

// Populate Sheets
const template_sheet_element = document.getElementById("sheet-template");
const sheet_container_element = document.getElementById("sheet-container");

if (!(template_sheet_element instanceof HTMLTemplateElement))
    throw new Error("sheet-template is missing or not a template element");

const sheets = await SheetDB.getAllSheets();

for (const sheet of sheets){
    const clone =
        /**@type {HTMLElement} */
        (template_sheet_element.content.cloneNode(true));

    const root = clone.querySelector(".sheet");
    const image = clone.querySelector(".sheet-image");
    const text = clone.querySelector(".sheet-text");

    if (image instanceof HTMLImageElement)
        image.src = URL.createObjectURL(sheet.image);

    text.textContent = sheet.name;
    root.addEventListener("click", () => {
        window.location.href = `/sheets/edit/?id=${encodeURIComponent(sheet.id)}`;
    });

    sheet_container_element.appendChild(clone);
}