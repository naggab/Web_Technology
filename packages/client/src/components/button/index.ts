import templateHTML from "./template.html";

type ButtonStyleType = "red" | "green" | "transparent" | "white";

export class Button extends HTMLElement {
  _a: HTMLAnchorElement;

  static get observedAttributes() {
    return ["label", "styleType"];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._a = shadowRoot.querySelector("a");
  }

  get label() {
    if (this.innerHTML) {
      return this.innerHTML;
    }
    return this.getAttribute("label") || "";
  }

  get styleType(): ButtonStyleType[] {
    const styleList = this.getAttribute("styleType");
    return (styleList.split(",") as ButtonStyleType[]) || ["white"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log("attributeChangedCallback");
    switch (name) {
      case "label":
        this._a.innerHTML = newValue;
        break;
      case "styleType":
        this._a.classList.add(...this.styleType);
      default:
        break;
    }
  }

  connectedCallback() {
    this._a.innerHTML = this.label;
    this._a.classList.add(...this.styleType);
  }
}

customElements.define("apirush-button", Button);
