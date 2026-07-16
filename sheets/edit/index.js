import * as Prompt from "/components/prompts.js"
import * as SheetDB from "/components/sheet/sheet-database.js"

import {Sheet, fromData} from "/components/sheet/sheet.js"
import { HTMLSKill, Skill, SkillAction, SkillCostType } from "/components/sheet/skill.js"
import { getCSV, getFieldOfKey } from "/components/csvdata.js"

import "/base.js"

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

const race_characteristics = await getCSV("/data/races.csv");

// ============================
// Classes
// ============================

class SheetAttributeElement extends SheetDB.SheetElement {
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

class SheetSkillElement extends SheetDB.SheetElement {
    constructor(
        sheet, path_id, element_btn,
        skill
    ) {
        super(sheet, path_id);
        this.element_btn = element_btn;
        this.skill = skill;

        onClick(element_btn, (_) => {
            skill_prompt.open();
            skill_prompt.update({skill: this.skill});
        });
    }
}

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
                class="alt-color font-size-text old-standard-tt-regular"
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
// PROMPTS
// ============================

const attribute_prompt = await Prompt.loadPrompt("/html/prompts/attribute.html", () => {});
attribute_prompt.button("#attribute-prompt-close", () => attribute_prompt.close())
attribute_prompt.addEventListener("on-update", (e) => {
    if (!(e instanceof CustomEvent)) return;
    const data = e.detail.data;

    attribute_prompt.find("#attribute-name").innerText = data.attribute_name;
    attribute_prompt.find("#attribute-value").innerText = `${data.attribute_value}/5`;
    attribute_prompt.base.setAttribute("attribute-key", data.attribute_key)
})

const skill_prompt = await Prompt.loadPrompt("/html/prompts/skill.html", () => {});
skill_prompt.button("#skill-prompt-close", () => skill_prompt.close());
skill_prompt.addEventListener("on-update", (e) => {
    if (!(e instanceof CustomEvent)) return;
    const data = e.detail.data;
    const skill = /** @type {Skill} */ (data.skill);

    skill_prompt.find("#skill-name-field")["value"] =
        skill == undefined ? "" : skill.name?? "";
    skill_prompt.find("#skill-description-field")["value"] =
        skill == undefined ? "" : skill.description?? "";

    skill_prompt.find("#skill-action-field")["value"] =
        skill == undefined ? SkillAction.FREE : skill.action?? SkillAction.FREE;
    skill_prompt.find("#skill-cost-type-field")["value"] =
        skill == undefined ? SkillCostType.MP : skill.cost_type?? SkillCostType.MP;
    skill_prompt.find("#skill-cost-field")["value"] =
        skill == undefined ? 0 : skill.cost?? 0;
    skill_prompt.find("#skill-upgrade-field")["value"] =
        skill == undefined ? 0 : skill.upgrades?? 0;
})

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

function onClick(elem, func) {elem.addEventListener("click", func);}

function linkElement(element, supplier, getter){
    const path = element.getAttribute("sheet-path");
    if (path === null) {
        console.error(`No Path Attribute On ${element.id}`);
        return;
    }

    const sheet_value = sheet.getPath(path);
    supplier(element,sheet_value);

    if (getter === undefined) return;
    if (element.nodeName == "INPUT", element.nodeName == "SELECT"){
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

linkElement(
    document.getElementById("race-selector"),
    (e, v) => e.value = v,
    (e) => {return e.value;}
)

linkElement(
    document.getElementById("class-selector"),
    (e, v) => e.value = v,
    (e) => {return e.value;}
)

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
    const obj = getFieldOfKey("race", sheet.getPath("race"), race_characteristics);
    element.innerText = obj == null? "---" : obj.strength;
})

// Race Weakness
linkSheetUpdate(() => {
    const element = document.getElementById("race-weakness");
    const obj = getFieldOfKey("race", sheet.getPath("race"), race_characteristics);
    element.innerText = obj == null? "---" : obj.weakness;
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

// ============================
// Attribute Cells
// ============================    
let attribute_objects = {};

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

// Init Attributes
const attribute_cells = document.querySelectorAll("sheet-attribute");

// @ts-ignore Collection Error
for (const element of attribute_cells){
    const attribute_key = element.getAttribute("sheet-path");
    const attribute_btn_name = element.querySelector(".attribute-name");

    const value = sheet.getPath(attribute_key);

    attribute_objects[attribute_key] = new SheetAttributeElement(
        sheet, attribute_key, element,
        attribute_btn_name.innerText, value
    );

    const attribute_btn_value = element.querySelector(".attribute-value");
    attribute_btn_value.innerText = `${value}/5`;
}

// ============================
// Skill Cells
// ============================

/** @type {SheetSkillElement[]} */
let skill_objects = []
const skill_cells = document.querySelectorAll("sheet-skill");

// @ts-ignore Collection Error
for (const element of skill_cells){
    const skill_idx = element.getAttribute("idx");
    const path = `skills.${skill_idx}`;
    const value = /**@type {Skill} */ (sheet.getPath(path));

    skill_objects[skill_idx] = new SheetSkillElement(
        sheet, path, element,
        value
    );

    if (value === undefined) continue;

    const name_label = element.querySelector(".name-label");
    const action_label = element.querySelector(".action-label");
    const cost_label = element.querySelector(".cost-label");
    const description_label = element.querySelector(".description");
    const upgrade_label = element.querySelector(".upgrade-label");

    name_label.innerText = value.name?? name_label.innerText;
    action_label.innerText = value.action?? action_label.innerText;
    description_label.innerText = value.description?? description_label.innerText;
    if (value.upgrades !== undefined) upgrade_label.innerText = value.upgrades.toString();

    if (value.cost !== undefined && value.cost_type !== undefined)
        cost_label.innerText = `${value.cost}${value.cost_type}`
}
