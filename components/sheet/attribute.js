export class Attributes {
    /** @type {number}*/ strength;
    /** @type {number}*/ agility;
    /** @type {number}*/ resistance;
    /** @type {number}*/ stealth;
    /** @type {number}*/ luck;
    /** @type {number}*/ charisma;
    /** @type {number}*/ inteligence;
    /** @type {number}*/ mind;

    /** @type {() => number} */
    sum() {
        return this.strength + 
            this.agility +
            this.resistance +
            this.stealth +
            this.luck +
            this.charisma +
            this.inteligence +
            this.mind;
    }
}

export class HTMLAttribute extends HTMLElement {
    connectedCallback(){
        const type = this.getAttribute("type");

        this.classList += "cell";
        this.setAttribute("sheet-path", `attribute.${type}`);

        this.innerHTML = `
            <span class="attribute-name">${this.getAttribute("name")}</span>
            <span class="attribute-value">0/5</span>
        `;
    }

    static {
        customElements.define("sheet-attribute", HTMLAttribute);
    }
}
