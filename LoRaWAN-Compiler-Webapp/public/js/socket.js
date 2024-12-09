import { loadBar } from "./loadBar.js";

const logContainer = document.getElementById("log-container");

let socket;
let lastParagraph = null;

export function initializeSocket() {
    socket = io.connect(window.location.href);

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
