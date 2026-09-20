import { Sheet } from "./sheet.js";
import { getJSON } from "/util/json.js";

export const race_info = await getJSON("/data/races.json");
export const class_info = await getJSON("/data/classes.json");
export const knowlages = await getJSON("/data/knowlages.json");

/**@type {(sheet: Sheet) => object} */
export function getRaceInfo(sheet) {
    return race_info[sheet.getPath("race")];
}

/**@type {(sheet: Sheet) => object} */
export function getClassInfo(sheet) {
    return class_info[sheet.getPath("class")];
}