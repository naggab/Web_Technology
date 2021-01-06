const template = document.createElement("template");

import templateHTML from "./template.html";

export class TextBox extends HTMLElement {
  label: any;
  $input: any;
  static get observedAttributes() {
    return ["label"];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "label":
        if (this.label) {
          this.label.innerText = newValue;
        }
        break;
      default:
        break;
    }
  }
}

window.customElements.define("text-box", TextBox);
