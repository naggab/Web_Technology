const template = document.createElement("template");

import templateHTML from "./template.html";
function getValue() {
  this.value = event.target.value;

}

export class TextBox extends HTMLElement {
  label: HTMLLabelElement;
  input: HTMLInputElement;
  error: any;


  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.label = this.shadowRoot.querySelector("label");
    this.input = this.shadowRoot.querySelector("input");
    this.error = this.shadowRoot.querySelector("error");

  }

  static get observedAttributes() {
    return ["label", "type", "error-message"];
}

attributeChangedCallback(name, oldValue, newValue) {
  
  switch (name) {
      case "label":
          this.label.innerText = newValue;
          break;
      case "type":
          this.input.type = newValue;
          break;
      case "error-message":
          this.error.innerText = newValue;
          break;
      default:
          break;
  }
}

connectedCallback() {
       this.input.addEventListener("change", getValue);
  }
}


window.customElements.define("text-box", TextBox);
