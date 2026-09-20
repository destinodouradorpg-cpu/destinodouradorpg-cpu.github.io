import { Skill } from "./skill.js";
import { Attributes } from "./attribute.js";
import * as SheetDB from "./sheet-database.js"

export class Sheet {
    /** @type {string}*/ id;

    /** @type {string}*/ name;
    /** @type {string}*/ player;
    /** @type {string}*/ race;
    /** @type {string}*/ class;
    /** @type {boolean}*/ isMundane;
    /** @type {boolean}*/ isNecromancer;

    /** @type {string}*/ level;

    /** @type {string}*/ hp_base;
    /** @type {string}*/ hp_bonus;
    /** @type {string}*/ mp_base;
    /** @type {string}*/ mp_bonus;
    /** @type {string}*/ sp_bonus;

    /** @type {File}*/ image;

    /** @type {Attributes}*/ attribute;
    /** @type {Skill[]}*/ skills
    /** @type {(path: string) => any} */
    getPath(path) {
        if (!path.includes(".")) return this[path];

        const split = path.split(".");
        let current = this;

        for (const s of split) current = current[s];
        
        return current;
    }
    
    /** @type {(path: string, value: any) => void} */
    setPath(path, value) {
        const split = path.split(".");
        const last = split[split.length - 1];
        let current = this;

        for (const s of split)
            if (s != last) current = current[s];

        current[last] = value;
        SheetDB.updateSheet(this);
        document.dispatchEvent(new CustomEvent(
            "onSheetUpdate", {detail: {}}
        ))
    }

    /** @type {() => Sheet} */
    static empty() {
        const sheet = new Sheet();
        
        sheet.id = "";
        
        sheet.name = "";
        sheet.player = "";
        sheet.race = "Humano";
        sheet.class = "Alquimista";
        sheet.isMundane = false;
        sheet.isNecromancer = false;

        sheet.level = "0";

        sheet.hp_base = "0";
        sheet.hp_bonus = "0";
        sheet.mp_base = "0";
        sheet.mp_bonus = "0";
        sheet.sp_bonus = "0";

        sheet.image = null;

        sheet.skills = [];
        sheet.attribute = new Attributes();
            sheet.attribute.strength = 1;
            sheet.attribute.agility = 1;
            sheet.attribute.resistance = 1;
            sheet.attribute.stealth = 1;
            sheet.attribute.luck = 1;
            sheet.attribute.charisma = 1;
            sheet.attribute.inteligence = 1;
            sheet.attribute.mind = 1;

        return sheet;
    }
}

/** @type {(data: {}) => Sheet} */
export function fromData(data){
    const sheet = Object.assign(new Sheet(), data);
    sheet.attribute = Object.assign(new Attributes, data["attribute"]);

    for (let i = 0; i < data["skills"].length; i++){
        const skill = data["skills"][i];
        sheet.skills[i] = Object.assign(new Skill(), skill);
    }

    return sheet;
}
