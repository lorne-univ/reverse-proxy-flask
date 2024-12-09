import { elements } from './elements.js';
import { saveFormData } from './storage.js';

// Display OTAA ABP
export function otaaAbp() {
  if (elements.activationMode.value === "otaa") {
    elements.otaaContainer.style.display = "block";
    elements.abpContainer.style.display = "none";
  } else {
    elements.otaaContainer.style.display = "none";
    elements.abpContainer.style.display = "block";
  }
}

// Payload Hello error
export function helloError() {
  if (elements.hello.checked) {
    [
      elements.temperature,
      elements.humidity,
      elements.cayenne1,
      elements.cayenne2,
    ].forEach((element) => {
      element.disabled = true;
    });

    [
      elements.temperatureLabel,
      elements.humidityLabel,
      elements.cayenne1Label,
      elements.cayenne2Label,
    ].forEach((label) => {
      label.style.color = "#D1D1D1";
    });
  } else {
    [
      elements.temperature,
      elements.humidity,
      elements.cayenne1,
      elements.cayenne2,
    ].forEach((element) => {
      element.disabled = false;
    });

    [
      elements.temperatureLabel,
      elements.humidityLabel,
      elements.cayenne1Label,
      elements.cayenne2Label,
    ].forEach((label) => {
      label.style.color = "#000";
    });
  }
}

// Payload Humidity error
export function humidityError() {
  if (elements.humidity.checked) {
    elements.hello.disabled = true;
    elements.helloLabel.style.color = "#D1D1D1";
  } else if (!elements.temperature.checked && !elements.cayenne1.checked) {
    elements.hello.disabled = false;
    elements.helloLabel.style.color = "#000";
  }
}

// Payload Temperature error
export function temperatureError() {
  if (elements.temperature.checked) {
    elements.hello.disabled = true;
    elements.helloLabel.style.color = "#D1D1D1";
  } else if (!elements.humidity.checked && !elements.cayenne1.checked) {
    elements.hello.disabled = false;
    elements.helloLabel.style.color = "#000";
  }
}

// Payload Cayenne LPP error
export function cayenne1Error() {
  if (elements.cayenne1.checked) {
    elements.hello.disabled = true;
    elements.helloLabel.style.color = "#D1D1D1";
  }
}

// Payload Cayenne LPP error
export function cayenne2Error() {
  if (
    elements.cayenne2.checked &&
    !elements.humidity.checked &&
    !elements.temperature.checked
  ) {
    elements.hello.disabled = false;
    elements.helloLabel.style.color = "#000";
  }
}

// MLR003 Simulation error
export function simOnError() {
  if (elements.simOn.checked) {
    [
      elements.hello,
      elements.temperature,
      elements.humidity,
      elements.cayenne1,
      elements.cayenne2,
    ].forEach((element) => {
      element.disabled = true;
    });

    [
      elements.helloLabel,
      elements.temperatureLabel,
      elements.humidityLabel,
      elements.cayenne1Label,
      elements.cayenne2Label,
    ].forEach((label) => {
      label.style.color = "#D1D1D1";
    });

    [
      elements.hello,
      elements.temperature,
      elements.humidity,
      elements.cayenne1,
    ].forEach((element) => {
      element.checked = false;
    });

    elements.cayenne2.checked = true;

    saveFormData();
  }
}

// MLR003 Simulation error
export function simOffError() {
  if (elements.simOff.checked) {
    [
      elements.hello,
      elements.temperature,
      elements.humidity,
      elements.cayenne1,
      elements.cayenne2,
    ].forEach((element) => {
      element.disabled = false;
    });

    [
      elements.helloLabel,
      elements.temperatureLabel,
      elements.humidityLabel,
      elements.cayenne1Label,
      elements.cayenne2Label,
    ].forEach((label) => {
      label.style.color = "#000";
    });

    elements.hello.checked = true;
    helloError();
    saveFormData();
  }
}
