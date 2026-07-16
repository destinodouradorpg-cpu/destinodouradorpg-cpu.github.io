    /** @enum {string} */
export const SkillAction = Object.freeze({
    FREE: "Livre",
    MOVEMENT: "Movimento",
    BONUS: "Bônus",
    MAIN: "Principal"
})

/** @enum {string} */
export const SkillCostType = Object.freeze({
    HP: "PV",
    MP: "PE",
    SP: "PS"
})

export class Skill {
    /** @type {SkillAction}*/ action;
    /** @type {SkillCostType}*/ cost_type;
    /** @type {number}*/ cost;

    /** @type {string}*/ name;
    /** @type {string}*/ description;
    /** @type {number}*/ upgrades;
}

export class HTMLSKill extends HTMLElement {
    

    connectedCallback() {
        const skill_idx = this.getAttribute("idx");

        this.classList += `cell`;
        this.setAttribute("sheet-path", `skills.${skill_idx}`);

        this.innerHTML = `
            <h3 class="text-lines">Habilidade ${skill_idx}</h3>
            <div>
                <span>Ação: <span>---</span></span>
                |
                <span>Custo: <span>---</span></span>
            </div>
            <p></p>
            <span>Melhorias: <span>0</span></span>
        `;
    }

    static {
        customElements.define("sheet-skill", HTMLSKill);
    }
}