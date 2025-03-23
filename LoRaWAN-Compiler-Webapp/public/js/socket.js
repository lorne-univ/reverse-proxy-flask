import { loadBar } from "./loadBar.js";
import { elements } from "./elements.js";

const logContainer = elements.console;

let socket;
let lastParagraph = null;

export function initializeSocket() {
    socket = io(window.location.location, { path:  window.location.pathname+`socket.io` });

    socket.on("compilation_log", (data) => {
        loadBar(data.message);

        const p = document.createElement("p");
        p.textContent = data.message;

        if (lastParagraph) {
            lastParagraph.removeAttribute("id");
        }

        p.setAttribute("id", "container-id");

        lastParagraph = p;

        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    });
}

export { socket };
