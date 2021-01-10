const template = document.createElement("template");

import templateHTML from "./template.html";

export class TextBox extends HTMLElement {
  _input: HTMLInputElement;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;

    this._input = shadowRoot.querySelector("#input");
  }
  public getValue() {
    if (this._input) {
      return this._input.value;
    } else {
      return "Unknown";
    }
  }

  static get observedAttributes() {
    return ["type", "value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "type":
        this._input.type = newValue;
        break;
      default:
        break;
    }
  }

  connectedCallback() {
    this._input.addEventListener("change", this.getValue);
  }
}

window.customElements.define("text-box", TextBox);
