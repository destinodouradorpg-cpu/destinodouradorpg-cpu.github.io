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
