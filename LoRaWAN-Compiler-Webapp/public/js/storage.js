import { elements } from './elements.js';
import { genRandomEUI, genRandomKey } from './generators.js';
import { otaaAbp } from './formHandlers.js';

// Save form data to localStorage
export function saveFormData() {
  const formData = {
    activationMode: elements.activationMode.value,
    class: elements.class.value,
    spreadingFactor: elements.spreadingFactor.value,
    adaptativeDr: document.querySelector('input[name="adaptative-dr"]:checked')
      .value,
    confirmation: document.querySelector('input[name="confirmation"]:checked')
      .value,
    appPort: elements.appPort.value,
    sendMode: document.querySelector('input[name="send-mode"]:checked').value,
    frameDelay: elements.frameDelay.value,
    hello: elements.hello.checked,
    temperature: elements.temperature.checked,
    humidity: elements.humidity.checked,
    cayenneLpp: document.querySelector('input[name="cayenne-lpp"]:checked')
      .value,
    devEui: elements.devEui.value,
    appKey: elements.appKey.value,
    appEui: elements.appEui.value,
    devAddr: elements.devAddr.value,
    nwkSKey: elements.nwksKey.value,
    appSKey: elements.appsKey.value,
    adminAppKey: elements.adminAppKey.value,
    mlrSim: document.querySelector('input[name="mlr003-sim"]:checked').value,
    mlrAppPort: elements.mlrAppPort.value,
  };
  localStorage.setItem("formData", JSON.stringify(formData));
}

// Restore form data from localStorage
export function restoreFormData() {
  const savedData = localStorage.getItem("formData");
  if (savedData) {
    const formData = JSON.parse(savedData);

    elements.activationMode.value = formData.activationMode || "otaa";
    elements.class.value = formData.class || "class_a";
    elements.spreadingFactor.value = formData.spreadingFactor || "7";
    document.querySelector(
      `input[name="adaptative-dr"][value="${formData.adaptativeDr || "off"}"]`
    ).checked = true;
    document.querySelector(
      `input[name="confirmation"][value="${formData.confirmation || "off"}"]`
    ).checked = true;
    elements.appPort.value = formData.appPort || "15";
    document.querySelector(
      `input[name="send-mode"][value="${formData.sendMode || "every-frame-delay"
      }"]`
    ).checked = true;
    elements.frameDelay.value = formData.frameDelay || "10";
    elements.hello.checked = formData.hello || false;
    elements.temperature.checked = formData.temperature || false;
    elements.humidity.checked = formData.humidity || false;
    document.querySelector(
      `input[name="cayenne-lpp"][value="${formData.cayenneLpp || "disabled"}"]`
    ).checked = true;
    elements.devEui.value =
      formData.devEui || genRandomEUI(elements.devEui);
    elements.appKey.value =
      formData.appKey || genRandomKey(32, elements.appKey);
    elements.appEui.value =
      formData.appEui || genRandomKey(16, elements.appEui);
    elements.devAddr.value =
      formData.devAddr || genRandomKey(8, elements.devAddr);
    elements.nwksKey.value =
      formData.nwkSKey || genRandomKey(32, elements.nwksKey);
    elements.appsKey.value =
      formData.appSKey || genRandomKey(32, elements.appsKey);
    elements.adminAppKey.value =
      formData.adminAppKey || genRandomKey(32, elements.adminAppKey);
    document.querySelector(
      `input[name="mlr003-sim"][value="${formData.mlrSim || "off"}"]`
    ).checked = true;
    elements.mlrAppPort.value = formData.mlrAppPort || "30";
  }
  otaaAbp();
}