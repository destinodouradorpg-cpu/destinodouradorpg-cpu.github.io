import * as Prompt from "/components/prompts.js"
import * as SheetDB from "/components/sheet/sheet-database.js"
import { onClick } from "/util/html.js"

// ============================
// Prompt
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


// ============================
// HTML
// ============================
export class HTMLAttribute extends HTMLElement {
    /**@type {() => string} */
    getType() {return this.getAttribute("type");}

    /**@type {() => string} */
    getName() {return this.getAttribute("name");}

    /**@type {(val: string) => void} */
    setValue(val) {
        /** @type {HTMLSpanElement} */
        (this.querySelector(".attribute-value")
        ).innerText = `${val}/5`;
    }

    connectedCallback(){
        this.classList += "cell";
        this.setAttribute("sheet-path", `attribute.${this.getType()}`);

        this.innerHTML = `
            <span class="attribute-name">${this.getName()}</span>
            <span class="attribute-value">0/5</span>
        `;
    }

    static {
        customElements.define("sheet-attribute", HTMLAttribute);
    }
}

class AttributeObject extends SheetDB.SheetObject {
    constructor(
        /**@type {HTMLAttribute}*/ html_element,
        /**@type {number}*/        value
    ) {
        super(`attribute.${html_element.getType()}`);
        
        this.html_element = html_element;
        this.value = value;

        html_element.setValue(this.value + "");
        onClick(html_element, (_) => {
            attribute_prompt.open();
            attribute_prompt.update({
                attribute_key : this.html_element.getType(),
                attribute_name : this.html_element.getName(),
                attribute_value : this.value
            });
        });
    }

    getValue() {return this.value;}
    /**@type {(value : number) => void} */
    setValue(value) {
        this.value = value;
        this.html_element.setValue(value + "");
        
        attribute_prompt.update({
            attribute_key : this.html_element.getType(),
            attribute_name : this.html_element.getName(),
            attribute_value : this.value
        });

        super.setValue(value);
    }

}

// ============================
// Attribute Cells
// ============================    
/**@type {Map<string, AttributeObject>} */
let attribute_objects = new Map;

// Adding Value
attribute_prompt.button("#attribute-prompt-add", (_e, element) => {
    const attribute_key = element.getAttribute("attribute-key");
    const obj = attribute_objects.get(attribute_key);

    if (obj.getValue() != 5 && SheetDB.WorkingSheet.Get()?.attribute.sum() < 21)
        obj.setValue(obj.value + 1);
});

// Subtracting Value
attribute_prompt.button("#attribute-prompt-sub", (_, element) => {
    const attribute_key = element.getAttribute("attribute-key");
    const obj = attribute_objects.get(attribute_key);

    if ((obj.getValue()) > 1) obj.setValue(obj.value - 1);
});

// Init Attributes
/**@type {NodeListOf<HTMLAttribute>} */
const attribute_cells = document.querySelectorAll("sheet-attribute")

for (const element of attribute_cells){
    const attribute_type = element.getType();
    const value = SheetDB.WorkingSheet.Get()?.getPath(`attribute.${attribute_type}`);

    attribute_objects.set(attribute_type, new AttributeObject(element, value));
}