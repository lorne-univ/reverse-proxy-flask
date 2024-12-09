// main.js
import { initializeEventListeners } from './eventListeners.js';
import { initializeSocket } from './socket.js';

document.addEventListener("DOMContentLoaded", () => {
    initializeSocket();
    initializeEventListeners();
});                                                                                                                                                                