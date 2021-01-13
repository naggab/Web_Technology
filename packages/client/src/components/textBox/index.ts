const template = document.createElement("template");

import templateHTML from "./template.html";

type InputType = "transparent";

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
  public setValue(value) {
    this._input.value = value;
  }
  public setHint(text) {
    this._input.placeholder = text;
  }

  get hint() {
    return this.getAttribute("hint") || "";
  }

  static get observedAttributes() {
    return ["styletype", "hint"];
  }

  get styletype(): InputType[] {
    const styleList = this.getAttribute("styletype");
    return styleList.split(",") as InputType[];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "styletype":
        this._input.className = "";
        this._input.classList.add(...this.styletype);
        break;
      case "hint":
        this._input.placeholder = newValue;
        break;
      default:
        break;
    }
  }

  connectedCallback() {
    this._input.addEventListener("change", this.getValue);
    this._input.classList.add(...this.styletype);
    this._input.placeholder = this.hint;
  }
}

window.customElements.define("text-box", TextBox);
