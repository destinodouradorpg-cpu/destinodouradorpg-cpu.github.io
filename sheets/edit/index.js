document.addEventListener("keydown", (e) => {
    if (e.target.nodeName == "INPUT") {
        const input = e.target;
        if (e.key === "Enter") {input.blur();}

        if (e.target.type == "number"){
            const key = e.key;
            if (key.length == 1 && key.match("[a-zA-Z]")) {
                e.preventDefault();
                return;
            }
        
            if (key == "Backspace" || key == "Delete") return;

            const num = parseInt(input.value);
            if (num > 50) {input.value = "50";}
            else if (num < 0) {input.value = "0";}
            else if (isNaN(num)) {input.value = "";}
        }
    }
});