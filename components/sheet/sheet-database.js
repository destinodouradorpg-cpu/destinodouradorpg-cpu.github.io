import {Sheet} from "./sheet.js"

// =============================
// CLASSES
// =============================

export class SheetObject {
    /** @type {string}*/ path_id;

    constructor(
        /** @type {string} */ path_id
    ) {this.path_id = path_id;}

    /** @type {(value: any) => void} */
    setValue(value) {WorkingSheet.Get()?.setPath(this.path_id, value);}
    getValue() {return WorkingSheet.Get()?.getPath(this.path_id);}
}

// =============================
// FUNCTIONS
// =============================

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

export class WorkingSheet {
    /**@type {Sheet | undefined} */
    static current;

    /**@type {() => Sheet | undefined} */
    static Get() {return this.current;}

    /**@type {(Sheet) => void} */
    static Set(sheet) {this.current = sheet;}
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