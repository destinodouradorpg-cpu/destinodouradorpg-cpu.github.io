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