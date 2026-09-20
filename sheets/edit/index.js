import * as SheetDB from "/components/sheet/sheet-database.js"
import {Sheet, fromData} from "/components/sheet/sheet.js"
import "/base.js"
import { formatStringArray } from "/util/json.js";
import { getClassInfo, getRaceInfo, knowlages } from "/components/sheet/data_helper.js";

// ============================
// Init
// ============================
const params = new URLSearchParams(window.location.search);
/** @type {Sheet}*/ let sheet = await new Promise((resolve, reject) => {
    SheetDB.getDB().then((db) => {
        const tx = db.transaction("sheets", "readonly");
        const store = tx.objectStore("sheets");

        const param_id = params.get("id");
        if (!param_id) {reject("Invalid Key");}
        else {
            const request = store.get(param_id);

            request.onsuccess = () => resolve(fromData(request.result));
            request.onerror = () => reject(request.error);
        }
    }).catch(reject);
});

if (sheet === undefined) SheetDB.invalidSheet(`Invalid Sheet ID: ${params.get("id")}`);
SheetDB.WorkingSheet.Set(sheet);

await import("./attributes.js");
await import("./skills.js");

class LabeledNumberInput extends HTMLElement {
    /**@type {(value: string)=>void} */
    setValue(value) {
        const input =
         /**@type {HTMLInputElement} */
         (this.querySelector(`input`));
        input.value = value;
    }

    /**@type {()=>string} */
    getValue() {
        const input =
         /**@type {HTMLInputElement} */
         (this.querySelector(`input`));
        return input.value;
    }

    connectedCallback() {
        const name = this.getAttribute("name");
        this.classList += "label-input-container";

        this.innerHTML = `
            <label for="${name}-input">${name}:</label>
            <input 
                name="${name}-input" 
                type="number"
                pattern="[0-9]"
                class="alt-color font-size-text font-default"
                min="${this.getAttribute("min")?? 0}"
                max="${this.getAttribute("max")?? 99}"
                step="${this.getAttribute("step")?? 1}"
                value="${this.getAttribute("value")?? 0}"
            >
        `;

        if (this.hasAttribute("sheet-path")){
            const path = this.getAttribute("sheet-path");
            if (path === null) {
                console.error(`No Path Attribute On ${this.getAttribute("name")}`);
                return;
            }
            const input = this.querySelector("input");

            this.setValue(sheet.getPath(path));
            input.addEventListener("blur", () => {
                if (this.getValue() == ""){
                    this.setValue("0")
                    sheet.setPath(path, "0");
                };
            })

            input.addEventListener("input", () => {
                const last_v = sheet.getPath(path);
                const new_v = this.getValue();

                if (last_v != new_v && new_v != "")
                    sheet.setPath(path, new_v);
            });
        }
    }

    static {
        customElements.define("lnumber-input", LabeledNumberInput);
    }
}

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
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;

    input.setCustomValidity("");
    
    if (!input.checkValidity()){
        if (input.id == "sheet-level-field"){
            input.setCustomValidity("Nível Tem Que Ser de 0 -> 50");
            input.value = sheet["level"].toString();
        }
    }
});


// ============================
// Linking
// ============================
const sheet_image_img = document.getElementById("sheet-image");

/**@type {(method: () => void) => void} */
function linkSheetUpdate(method) {
    document.addEventListener("onSheetUpdate", method);
    method();
}

function linkElement(
    element,
    setter = (e,v) => {e.value = v},
    getter = (e,l) => {return e.value}
){
    const path = element.getAttribute("sheet-path");
    if (path === null) {
        console.error(`No Path Attribute On ${element.id}`);
        return;
    }

    const sheet_value = sheet.getPath(path);
    setter(element,sheet_value);

    if (getter === undefined) return;
    if (element.nodeName == "INPUT" || element.nodeName == "SELECT"){
        element.addEventListener("input", () => {
            const last_v = sheet.getPath(path);
            const new_v = getter(element, last_v);
            if (last_v != new_v) sheet.setPath(path, new_v);
        })
    }
}

linkElement(document.getElementById("name-field"))
linkElement(document.getElementById("player-field"))
linkElement(document.getElementById("race-selector"))
linkElement(document.getElementById("class-selector"))

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


// Movement Display
linkSheetUpdate(() => {
    document.getElementById("movement-value")
        .innerText = `${4+sheet.getPath("attribute.agility")}m`
});

// HP Display
linkSheetUpdate(() => {
    const base = parseInt(sheet.getPath("hp_base"));
    const bonus = parseInt(sheet.getPath("hp_bonus"));

    document.getElementById("hp-value").innerText = (base + bonus) + "";
})

// MP Display
linkSheetUpdate(() => {
    const base = parseInt(sheet.getPath("mp_base"));
    const bonus = parseInt(sheet.getPath("mp_bonus"));

    document.getElementById("mp-value").innerText = (base + bonus) + "";
})

// SP Display
linkSheetUpdate(() => {
    const bonus = parseInt(sheet.getPath("sp_bonus"));
    document.getElementById("sp-value")
        .innerText = (5 + sheet.getPath("attribute.mind") + bonus) + "";
})

// Race Strength
linkSheetUpdate(() => {
    const element = document.getElementById("race-strength");
    const race = getRaceInfo(sheet);
 
    switch (race.strength.type){
        case "single":
            element.innerText = race.strength.text
            break;
        case "multiple":
            //TODO: MULTIPLE STRENGTH SELECTION
            element.innerText = race.strength.text
            break;
        default: throw Error(`${race.strength.type} Type is not Implemented`)
    }
})

// Race Weakness
linkSheetUpdate(() => {
    const element = document.getElementById("race-weakness");
    const race = getRaceInfo(sheet);
    if (!race) return;

    switch (race.weakness.type){
        case "single":
            element.innerText = race.weakness.text
            break;
        default: throw Error(`${race.weakness.type} Type is not Implemented`)
    }
})

// Class Knowlages
linkSheetUpdate(() => {
    const element = document.getElementById("class-knowlage");
    const sclass = getClassInfo(sheet);
 
    if (sclass && sclass.knowlages?.length != 0){
        element.innerText = formatStringArray(sclass.knowlages);
    } else element.innerText = "---";
})

// Mundane Button
linkElement(
    document.getElementById("mundane-button"),
    (e, v) => e.checked = v,
    (e) => {return e.checked}
)

linkSheetUpdate(() => {
    const button = /** @type {HTMLInputElement} */
        (document.getElementById("mundane-button"));

    const sclass = getClassInfo(sheet);
    if (sclass && sclass.canBeMundane){
        button.disabled = false;
    } else {
        button.disabled = true;
        button.checked = false;

        if (sheet.getPath("isMundane"))
            sheet.setPath("isMundane",false);
    }
})

// Necromencer Button
linkElement(
    document.getElementById("necromancer-button"),
    (e, v) => e.checked = v,
    (e) => {return e.checked}
)

linkSheetUpdate(() => {
    const button = /** @type {HTMLInputElement} */
        (document.getElementById("necromancer-button"));

    const sclass = getClassInfo(sheet);
    if (sclass && sclass.canBeNecromancer){
        button.disabled = false;
    } else {
        button.disabled = true;
        button.checked = false;

        if (sheet.getPath("isNecromancer"))
            sheet.setPath("isNecromancer",false);
    }
})


// Knowlage Selectors
linkSheetUpdate(() => {
    const container = document.getElementById("knowlage-container");
    const sclass = getClassInfo(sheet);

    const knowlage_amount = 
        sclass.knowlagesToLearn + 
        (sheet.isMundane ? 
            sclass.elementsToLearn + (sclass.element == "" ? 0 : 1) :
            0
        );

    let s = ``;
    for (let i = 0; i < knowlage_amount; i++){
        s += `<select class="font-size-text font-default">`;
        s += `<option value="">--Conhecimento--</option>`

        if (sheet.class == "Flecheiro" && i == 0)
            s += `
                <option value="Sobrevivência">Sobrevivência</option>
                <option value="Tática">Tática</option>
            `;
        else if (sheet.class == "Vigarista" && i == 0)
            s += `
                <option value="Comércio">Comércio</option>
                <option value="Crime">Crime</option>
                <option value="Psicologia">Psicologia</option>
            `;
        else {
            for (const n of knowlages)
                s += `<option value="${n}">${n}</option>`;
        }

        s += `</select>`;
    }

    container.innerHTML = s;
})

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
