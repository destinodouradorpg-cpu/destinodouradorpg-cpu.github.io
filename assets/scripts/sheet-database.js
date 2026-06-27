// =============================
// CLASSES
// =============================

export class SheetAttributes {
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

export class SheetSkills {

}

export class Sheet {
    /** @type {string}*/ id;

    /** @type {string}*/ name;
    /** @type {string}*/ player;
    /** @type {string}*/ race;
    /** @type {string}*/ class;
    /** @type {number}*/ level;

    /** @type {File}*/ image;

    /** @type {SheetAttributes}*/ attribute;
    /** @type {SheetSkills}*/ skills;

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
        updateSheet(this);
    }

    /** @type {() => Sheet} */
    static empty() {
        const sheet = new Sheet();
        
        sheet.id = "";
        
        sheet.name = "";
        sheet.player = "";
        sheet.race = "";
        sheet.class = "";
        sheet.level = 0;

        sheet.image = null;

        sheet.skills = {};
        sheet.attribute = new SheetAttributes();
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
    sheet.attribute = Object.assign(new SheetAttributes, data["attribute"]);
    sheet.skills = Object.assign(new SheetSkills(), data["skills"]);

    return sheet;
}

/**@type {IDBDatabase} */
let loaded_db = undefined;

/**@type {() => Promise<IDBDatabase>} */
export async function getDB() {
    if (loaded_db !== undefined) return loaded_db;
    return new Promise((resolve, reject) => {
        const sheetdb_request = indexedDB.open("SheetDatabase", 1);
        sheetdb_request.onupgradeneeded = (event) => {
            if (!(event.target instanceof IDBRequest)) return;

            /**@type {IDBDatabase} */
            const db = event.target.result;

            if (!db.objectStoreNames.contains("sheets")) {
                db.createObjectStore("sheets", {
                    keyPath: "id"
                });
            }
        };
        
        sheetdb_request.onsuccess = () => {
            resolve(sheetdb_request.result)
            loaded_db = sheetdb_request.result;
        };
        
        sheetdb_request.onerror = () => reject(sheetdb_request.error);
    });
}

export class SheetElement {
    /** @type {Sheet}*/ sheet;
    /** @type {string}*/ path_id;

    constructor(
        /** @type {Sheet} */ sheet,
        /** @type {string} */ path_id
    ) {
        this.sheet = sheet;
        this.path_id = path_id;
    }

    /** @type {(value: any) => void} */
    setValue(value) {
        this.sheet.setPath(this.path_id, value);
        const event = new CustomEvent("sheet-element", {detail: {
            object: this,
            path_id : this.path_id,
            value : value
        }})

        document.dispatchEvent(event);
    }

    getValue() {return this.sheet.getPath(this.path_id);}
}

// =============================
// FUNCTIONS
// =============================

/**@type {() => Promise<Sheet[]>} */
export async function getAllSheets() {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("sheets", "readonly");
        const store = tx.objectStore("sheets");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**@type {(sheet: Sheet) => Promise<void>} */
export async function updateSheet(sheet) {
    const db = await getDB();
    const tx = db.transaction("sheets", "readwrite");
    const store = tx.objectStore("sheets");

    store.put(sheet);

    await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

/** @type {(error: string) => Promise<void>} */
export async function invalidSheet(error) {
    await alert("ID De Ficha Invalida!");
    window.location.href = "/sheets";
}