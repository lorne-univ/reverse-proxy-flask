import { saveFormData } from "./storage.js";

// Generate random credentials
export const genRandomKey = (size, element) => {
    const key = [...Array(size)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    element.value = key;
    saveFormData(); // saveFormData() after generating a new key
    return key;
};

export const genRandomEUI = (element) => {
    const prefix = "ecdb86fffd";

    const randomSuffix = [...Array(6)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

    const key = prefix + randomSuffix;

    element.value = key;
    saveFormData();
    return key;
};