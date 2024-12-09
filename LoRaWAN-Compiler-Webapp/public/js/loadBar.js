import { numberOfFirmware } from './compiler.js';

// Global variables
let currentProgress = 0;
let currentProgressMultiple = 0;
let currentFirmware = 1;
let currentStep = 0;
let previousStep = null;

export function loadBar(message) {
    const progressBar = document.querySelector(".load-bar-progress");
    const p = document.querySelector(".load-bar-container p");

    const regex = /\[CC\]\s+(\w+)/;
    let progressPercentage = currentProgress
    let maxStep = numberOfFirmware * 5;

    if (regex.test(message)) {
        const match = message.match(regex);
        if (match) {
            const step = match[1];
            if ((previousStep !== step) && (step === 'Core' || step === 'Drivers' || step === 'LoRaWAN' || step === 'Middlewares')) {
                previousStep = step;
                currentStep++;
            }
            if (step === 'Startup') {
                progressPercentage = 0 / numberOfFirmware + currentProgressMultiple;
                p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Creating files';
            } else if (step === 'Core') {
                progressPercentage = 20 / numberOfFirmware + currentProgressMultiple;
                p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Compiling Core files';
            } else if (step === 'Drivers') {
                progressPercentage = 40 / numberOfFirmware + currentProgressMultiple;
                p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Compiling Drivers';
            } else if (step === 'LoRaWAN') {
                progressPercentage = 60 / numberOfFirmware + currentProgressMultiple;
                p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Compiling LoRaWAN files';
            } else if (step === 'Middlewares') {
                progressPercentage = 80 / numberOfFirmware + currentProgressMultiple;
                p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Compiling Middlewares';
            }
        }
    } else if (message.includes('Finished building')) {
        progressPercentage = 100 / numberOfFirmware + currentProgressMultiple;
        currentStep++;
        p.textContent = currentStep + '/' + maxStep + ' Firmware n°' + currentFirmware + ' : Finished';
        currentProgressMultiple += 100 / numberOfFirmware;
        currentFirmware++;
    }
    currentProgress = progressPercentage;

    progressBar.style.transition = 'width 1s ease';
    progressBar.style.width = `${progressPercentage}%`;
}

export function resetProgressBar() {
    const progressBar = document.querySelector(".load-bar-progress");
    const p = document.querySelector(".load-bar-container p");
    progressBar.style.width = "0%";
    p.textContent = '';
    currentProgress = 0;
    currentProgressMultiple = 0;
    currentFirmware = 1;
    currentStep = 0;
    previousStep = null;
}

export function showLoadBar() {
    resetProgressBar();
    const compileButton = document.getElementById('generate-firmware');
    const loadBarContainer = document.querySelector('.load-bar-container');

    compileButton.style.display = 'none';
    loadBarContainer.style.display = 'flex';
}

export function hideLoadBar() {
    const compileButton = document.getElementById('generate-firmware');
    const loadBarContainer = document.querySelector('.load-bar-container');
    loadBarContainer.style.display = 'none';
    compileButton.style.display = 'flex';

    /*
    setTimeout(() => {
        loadBarContainer.style.display = 'none';
        compileButton.style.display = 'flex';
    }, 2000);
    */
}