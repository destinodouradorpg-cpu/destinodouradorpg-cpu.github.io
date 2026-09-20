/**@type {(file: string) => Promise<object>} */
export async function getJSON(file) {
    const resp = await fetch(file);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json()
}

/** @type {(arr : string[]) => string} */
export function formatStringArray(arr){
    let r = "";
    for (const s of arr) r += ", " + s;
    return r.substring(2)
}