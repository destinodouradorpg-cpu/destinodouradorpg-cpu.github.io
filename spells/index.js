//@ts-ignore
import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";
import "/assets/scripts/init.js";

const filterIds = [
    "Elements", "Name", "Degree", "Cost",
    "Duration", "Time", "Range", "Requirements"
];

document.addEventListener("input", (e) => {
    const element = e.target;
    if (!(element instanceof HTMLInputElement)) return;
    if (filterIds.some((s) => element.id === s))
        filterTable();
});

Papa.parse("/assets/data/spells.csv", {
    download: true, header: false,
    skipEmptyLines: true,
    complete: (results) => buildTable(results.data)
});

/**@type {(data: any) => void} */
function buildTable(data) {
    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = "";

    for (let i = 1; i < data.length; i++) {
        let row = "<tr>";

        Object.values(data[i]).forEach(col => {
            row += `<td>${col}</td>`;
        });

        row += "</tr>";
        tbody.innerHTML += row;
    }
}

/**@type {() => void} */
function filterTable() {
    const filters = filterIds.map(id => {
        const element = document.getElementById(id);
        if (element instanceof HTMLInputElement)
            return normalize(element.value)
        else return null;
    });

    const rows = document.querySelectorAll("#table tbody tr");
    rows.forEach(row => {
        if (!(row instanceof HTMLElement)) return;
        const cols = row.querySelectorAll("td");

        let match = true;
        for (let i = 0; i < filters.length; i++) {
            const cellText = normalize(cols[i].textContent);
            const filter = filters[i];

            if (!filter) continue;

            // Spell Element Filter
            if (i === 0){
                const terms = filter.split(",").map(t => t.trim()).filter(Boolean);
                const elementMatch = terms.some(term => cellText.includes(term));
                if (!elementMatch) {
                    match = false;
                    break;
                }
            }

            // Spell Grade Filter
            else if (i === 2) {
                if (!compareNumber(cellText, filter)){
                    match = false;
                    break;
                }
            }

            // Spell Requirement Filter
            else if (i === 7) {
                const terms = filter.split(",").map(t => t.trim()).filter(Boolean);
                const requirementMatch = terms.every(term => cellText.includes(term));
                if (!requirementMatch) {
                    match = false;
                    break;
                }
            }
            
            // Default Filter Behavior
            else {
                if (!cellText.includes(filter)) {
                    match = false;
                    break;
                }
            }
        }

        row.style.display = match ? "" : "none";
  });
}

/**@type {(type: string) => string} */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")                
    .replace(/[\u0300-\u036f]/g, "");
}

/**@type {(cellValue: string, filterValue: string) => boolean} */
function compareNumber(cellValue, filterValue) {
    const num = parseFloat(cellValue);

    if (isNaN(num)) return false;

    filterValue = filterValue.trim();

    if (filterValue.startsWith(">=")) {
        return num >= parseFloat(filterValue.slice(2));
    }
    if (filterValue.startsWith("<=")) {
        return num <= parseFloat(filterValue.slice(2));
    }
    if (filterValue.startsWith(">")) {
        return num > parseFloat(filterValue.slice(1));
    }
    if (filterValue.startsWith("<")) {
        return num < parseFloat(filterValue.slice(1));
    }
    if (filterValue.startsWith("=")) {
        return num === parseFloat(filterValue.slice(1));
    }

    return num === parseFloat(filterValue);
}