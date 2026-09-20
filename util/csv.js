//@ts-ignore
import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm"

/**@type {(path: string)=>Promise<object>} */
export async function getCSV(path) {
    return new Promise((resolve, reject) => {
        Papa.parse(path, {
            download: true, header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: (err) => reject(err)
        })
    })
}

/**@type {(field:string, key:string, csv: object[]) => object | null} */
export function getFieldOfKey(field, key, csv){
    return csv.find((i) => i[field] == key)?? null;
}