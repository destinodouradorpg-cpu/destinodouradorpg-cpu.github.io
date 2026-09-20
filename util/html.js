/**@type {(elem: HTMLElement, func: () => void) => void} */
export function onClick(elem, func) {elem.addEventListener("click", func);}
