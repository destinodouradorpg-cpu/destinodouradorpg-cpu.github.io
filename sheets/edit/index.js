import * as Prompt from "/assets/scripts/prompts.js"
import * as SheetDB from "/assets/scripts/sheet-database.js"
import "/assets/scripts/init.js"

// ============================
// MISC
// ============================

const params = new URLSearchParams(window.location.search);

const attribute_prompt = await Prompt.loadPrompt("/assets/html/prompts/attribute.html", () => {});
attribute_prompt.addEventListener("on-update", (e) => {
    if (!(e instanceof CustomEvent)) return;
    const data = e.detail.data;

    attribute_prompt.find("#attribute-name").innerText = data.attribute_name;
    attribute_prompt.find("#attribute-value").innerText = `${data.attribute_value}/5`;
    attribute_prompt.base.setAttribute("attribute-key", data.attribute_key)
})

function onClick(elem, func) {elem.addEventListener("click", func);}

// ============================
// Init
// ============================
/** @type {SheetDB.Sheet}*/ let sheet = await new Promise((resolve, reject) => {
    SheetDB.getDB().then((db) => {
        const tx = db.transaction("sheets", "readonly");
        const store = tx.objectStore("sheets");

        const param_id = params.get("id");
        const request = store.get(param_id);

        request.onsuccess = () => resolve(SheetDB.fromData(request.result));
        request.onerror = () => reject(request.error);
    }).catch(reject)
});
if (sheet === undefined) SheetDB.invalidSheet(`Invalid Sheet ID: ${params.get("id")}`);


// ============================
// Global Event Listeners
// ============================
document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.nodeName == "INPUT") {
        const input = e.target;
        if (e.key === "Enter") {input.blur();}
    }
});

document.addEventListener("input", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.nodeName == "INPUT"){
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;

        input.setCustomValidity("");
        
        if (!input.checkValidity()){
            if (input.id == "sheet-level-field"){
                input.setCustomValidity("Nível Tem Que Ser de 0 -> 50");
                input.value = sheet["level"].toString();
            }
        }
    }
});


// ============================
// Linking
// ============================
const sheet_image_img = document.getElementById("sheet-image");

function linkElement(element, supplier, getter){
    const path = element.getAttribute("sheet-path");
    if (path === null) {
        console.error(`No Path Attribute On ${element.id}`);
        return;
    }

    const sheet_value = sheet.getPath(path);
    supplier(element,sheet_value);

    if (getter === undefined) return;
    if (element.nodeName == "INPUT"){
        element.addEventListener("input", () => {
            const last_v = sheet.getPath(path);
            const new_v = getter(element, last_v);
            if (last_v != new_v) sheet.setPath(path, new_v);
        })
    }
}

linkElement( // Character Name Field
    document.getElementById("name-field"),
    (e, v) => e.value = v,
    (e) => {return e.value;}
);

linkElement( // Character Player Field
    document.getElementById("player-field"),
    (e, v) => e.value = v,
    (e) => {return e.value;}
);

linkElement( // Character Image View
    sheet_image_img, 
    (e, v) => {
        if (!v) return;

        try {
            const sheet_image = URL.createObjectURL(v);
            if (sheet_image !== undefined) e.src = sheet_image;
        } catch(err) {console.error(`${v}:: ${err}`);}
    }, undefined
)

linkElement( // Character Level
    document.getElementById("sheet-level-field"),
    (e, v) => {e.value = v;},
    (e, l) => {const v = parseInt(e.value); return v ? v : l;}
)


// ============================
// Image Button
// ============================
const sheet_image_button = document.getElementById("sheet-image-input");

sheet_image_img.addEventListener("click", (e) => sheet_image_button.click());
sheet_image_button.addEventListener('change', (event) => {
    // @ts-ignore
    const file = event.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    // @ts-ignore
    sheet_image_img.src = imageUrl;
    
    sheet.setPath("image", file);
});

// ============================
// Attribute Cells
// ============================    
let attribute_objects = {};
class SheetAttribute extends SheetDB.SheetElement {
    constructor(
        sheet, path_id, element_btn,
        name, value
    ) {
        super(sheet, path_id);
        
        this.element_btn = element_btn;
        this.name = name;
        this.value = value;

        onClick(element_btn, (_) => {
            attribute_prompt.open();
            attribute_prompt.update({
                attribute_key : this.path_id,
                attribute_name : this.name,
                attribute_value : this.value
            });
        });
    }

    getValue(){return this.value;}
    setValue(value) {
        this.value = value;
        const attribute_btn_value = this.element_btn.querySelector(".attribute-value");
        attribute_btn_value.innerText = `${this.value}/5`;

        attribute_prompt.update({
            attribute_key : this.path_id,
            attribute_name : this.name,
            attribute_value : this.value
        });

        super.setValue(value);
    }

}

// Adding Value
attribute_prompt.button("#attribute-prompt-add", (_e, element) => {
    const attribute_key = element.getAttribute("attribute-key");
    const obj = attribute_objects[attribute_key];
    if (obj.getValue() != 5 && sheet.attribute.sum() < 21)
        obj.setValue(obj.value + 1);
});

// Subtracting Value
attribute_prompt.button("#attribute-prompt-sub", (_, element) => {
    const attribute_key = element.getAttribute("attribute-key");
    const obj = attribute_objects[attribute_key];
    if (obj.getValue() > 1) obj.setValue(obj.value - 1);
});

// Close Button
attribute_prompt.button("#attribute-prompt-close", () => attribute_prompt.close())

// Movement Display Listener
document.addEventListener("sheet-element", (e) => {
    if (!(e instanceof CustomEvent)) return;
    const path_id = e.detail.path_id;
    if (path_id == "attribute.agility"){
        document.getElementById("movement-value")
            .innerText = `${4+e.detail.object.getValue()}m`
    }
});

// Init Attributes
const attribute_cells = document.getElementsByClassName("attribute-cell");

// @ts-ignore Collection Error
for (const element of attribute_cells){
    const attribute_key = element.getAttribute("sheet-path");
    const attribute_btn_name = element.querySelector(".attribute-name");

    const value = sheet.getPath(attribute_key);

    attribute_objects[attribute_key] = new SheetAttribute(
        sheet, attribute_key, element,
        attribute_btn_name.innerText, value
    );

    // Innit 'sheetElement' Event Listeners
    attribute_objects[attribute_key].setValue(
        attribute_objects[attribute_key].getValue()
    );

    const attribute_btn_value = element.querySelector(".attribute-value");
    attribute_btn_value.innerText = `${value}/5`;
}

// ============================
// Skill Cells
// ============================

let skill_objects = {}
class SheetSkill extends SheetDB.SheetElement {
    constructor(
        sheet, path_id, element_btn,
        name, value
    ) {
        super(sheet, path_id);
        this.element_btn = element_btn;
        this.name = name;
        this.value = value;

        onClick(element_btn, (_) => {
            // attr
            // attribute_prompt.open({
            //     attribute_key : this.path_id,
            //     attribute_name : this.name,
            //     attribute_value : this.value
            // });
        });
    }
}

const skill_cells = document.getElementsByClassName("skill-cell");

// @ts-ignore Collection Error
for (const element of skill_cells){
    
}