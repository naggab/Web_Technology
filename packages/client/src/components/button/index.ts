import templateHTML from "./template.html";

type ButtonStyleType = "red" | "green" | "transparent" | "white" | "black";

export class Button extends HTMLElement {
  _a: HTMLAnchorElement;

  static get observedAttributes() {
    return ["styletype", "label"];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._a = shadowRoot.querySelector("a");
  }
  public setLabel(text) {
    this._a.innerHTML = text;
  }
  get label() {
    if (this.innerHTML) {
      return this.innerHTML;
    }
    return this.getAttribute("label") || "";
  }

  get styletype(): ButtonStyleType[] {
    const styleList = this.getAttribute("styletype");
    return (styleList.split(",") as ButtonStyleType[]) || ["white"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "label":
        this._a.innerHTML = newValue;
        break;
      case "styletype":
        this._a.className = "";
        this._a.classList.add(...this.styletype);
        break;
      default:
        break;
    }
  }

  connectedCallback() {
    this._a.innerHTML = this.label;
    this._a.classList.add(...this.styletype);
  }
}

customElements.define("apirush-button", Button);
