const body = document.querySelector("body");

/** @type {(prompt_file : string, init: (base: HTMLElement) => void) => Promise<PromptObject>} */
export async function loadPrompt(prompt_file, init){
    const html = await fetch(prompt_file);
    if (!html.ok) {
        console.log(`Invalid Prompt File Path ${prompt_file}`);
        return;
    }

    const element = document.createElement("div");
    body.appendChild(element);
    element.innerHTML = await html.text();

    return new PromptObject(element, init);
}

export class PromptEventInit extends CustomEvent {
    
}

export class PromptObject extends EventTarget {
    /**@type {Map<String, PromptObject>} */
    static prompts = new Map();

    /**@type {PromptObject[]}*/
    static open_prompts = [];

    static {
        document.addEventListener("keydown", (e) => {
            if (e.key != "Escape") return;
            const idx = this.open_prompts.length - 1;
            if (idx >= 0) this.open_prompts[idx].close();
        });
    }

    /** @type {HTMLElement} */ base;

    constructor(
        /**@typedef {HTMLElement}*/ base,
        /**@typedef {(base : HTMLElement) => void}*/ init
    ){
        super();
        this.base = base;
        this.base.style.display = "none";

        if (init !== undefined) init(base);
    }

    /**@type {() => void} */
    close() {
        PromptObject.open_prompts.pop();
        this.base.style.display = "none";
        this.dispatchEvent(new CustomEvent("on-close"));
    }
    
    /**@type {() => void} */
    open() {
        this.base.style.display = "flex";
        PromptObject.open_prompts.push(this)
        this.dispatchEvent(new CustomEvent("on-open"));
    }

    /**@type {(data: {}) => void} */
    update(data) {this.dispatchEvent(new CustomEvent("on-update", {detail: {data: data}}));}

    /**@type {(query: string, on_click : (e : PointerEvent, element: HTMLElement) => void) => void})} */
    button(query, on_click){
        const element = this.find(query);
        element.addEventListener("click", (e) => {
            if (e instanceof PointerEvent)
                on_click(e, this.base);
        });
    }

    /**@type {(query: string) => HTMLElement})} */
    find(query){
        const element = this.base.querySelector(query);
        if (element !== null) return (/** @type {HTMLElement}*/ (element));
        else throw new Error(`Element of Query is Null ${query}`);
    }
}