import * as Prompt from "/components/prompts.js"
import * as SheetDB from "/components/sheet/sheet-database.js"
import { Skill, SkillAction, SkillCostType } from "/components/sheet/skill.js";
import { onClick } from "/util/html.js"

// ============================
// PROMPT
// ============================

const skill_prompt = await Prompt.loadPrompt("/html/prompts/skill.html", () => {});
skill_prompt.button("#skill-prompt-close", () => skill_prompt.close());
skill_prompt.addEventListener("on-update", (e) => {
    if (!(e instanceof CustomEvent)) return;
    /** @type {Skill} */
    const skill = e.detail.data.skill;

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
// Classes
// ============================
export class HTMLSKill extends HTMLElement {
    /**@type {() => string} */
    getIDX() {return this.getAttribute("idx");}


    /**@type {(skill: Skill) => void} */
    update(skill){
        if (skill === undefined) return;

        /**@type {HTMLHeadingElement} */
        const name_label = this.querySelector(".name-label");
        /**@type {HTMLSpanElement} */
        const action_label = this.querySelector(".action-label");
        /**@type {HTMLSpanElement} */
        const cost_label = this.querySelector(".cost-label");
        /**@type {HTMLParagraphElement} */
        const description_label = this.querySelector(".description");
        /**@type {HTMLSpanElement} */
        const upgrade_label = this.querySelector(".upgrade-label");

        name_label.innerText = skill.name?? name_label.innerText;
        action_label.innerText = skill.action?? action_label.innerText;
        description_label.innerText = skill.description?? description_label.innerText;
        if (skill.upgrades !== undefined) upgrade_label.innerText = skill.upgrades.toString();

        if (skill.cost !== undefined && skill.cost_type !== undefined)
            cost_label.innerText = `${skill.cost}${skill.cost_type}`
    }

    connectedCallback() {
        this.classList += `cell`;
        this.setAttribute("sheet-path", `skills.${this.getIDX()}`);

        this.innerHTML = `
            <h3 class="text-lines">Habilidade ${this.getIDX()}</h3>
            <div>
                <span>Ação: <span>---</span></span>
                |
                <span>Custo: <span>---</span></span>
            </div>
            <p class="description"></p>
            <span>Melhorias: <span>0</span></span>
        `;
    }

    static {
        customElements.define("sheet-skill", HTMLSKill);
    }
}

class SheetSkillElement extends SheetDB.SheetObject {
    constructor(
        /**@type {HTMLSKill}*/ html_skill,
        /**@type {Skill} */    skill
    ) {
        super(`skills.${html_skill.getIDX()}`);
        this.html_skill = html_skill;
        this.setValue(skill);

        onClick(html_skill, (_) => {
            skill_prompt.open();
            skill_prompt.update({skill: this.skill});
        });
    }

    /**@type {(skill: Skill) => void} */
    setValue(skill){
        this.skill = skill;
        this.html_skill.update(skill);

        skill_prompt.update({
            skill: skill
        });

        super.setValue(skill)
    }
}

// ============================
// Skill Cells
// ============================

/** @type {SheetSkillElement[]} */
let skill_objects = []

/**@type {NodeListOf<HTMLSKill>} */
const skill_cells = document.querySelectorAll("sheet-skill");

for (const element of skill_cells){
    const skill_idx = element.getIDX();
    const path = `skills.${skill_idx}`;

    /**@type {Skill} */
    const value = SheetDB.WorkingSheet.Get()?.getPath(path);
    skill_objects[skill_idx] = new SheetSkillElement(element, value);
}

function updateSkillDispaly(){
    for (const element of skill_cells){
        const skill_idx = parseInt(element.getIDX());
        const level = parseInt(SheetDB.WorkingSheet.Get()?.level);
        const skills_unlocked = 4 + Math.floor(level < 25 ? (level / 5) : (level / 5 - 1));

        element.style.display = skill_idx <= skills_unlocked ? "" : "none";
        
    }
}

document.addEventListener("onSheetUpdate", updateSkillDispaly);
updateSkillDispaly();