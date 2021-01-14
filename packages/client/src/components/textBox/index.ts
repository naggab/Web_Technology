import templateHTML from "./template.html";

type StyleType = "transparent" | "black";
type InputType = "text" | "number";

export class TextBox extends HTMLElement {
  _input: HTMLInputElement;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;

    this._input = shadowRoot.querySelector("#input");
  }
  public getValue(): string {
    if (this._input) {
      return this._input.value;
    } else {
      return null;
    }
  }
  public setType(type: InputType) {
    this._input.type = type;
  }
  public setValue(value: string) {
    this._input.value = value;
  }
  public setHint(text: string) {
    this._input.placeholder = text;
  }

  get hint() {
    return this.getAttribute("hint") || "";
  }

  get styletype(): StyleType[] {
    const styleList = this.getAttribute("styletype");
    return styleList.split(",") as StyleType[];
  }

  get type(): InputType {
    return this.getAttribute("type") as InputType;
  }

  static get observedAttributes() {
    return ["styletype", "hint", "type"];
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
      case "type":
        this._input.type = newValue;
        break;
      default:
        break;
    }
  }

  connectedCallback() {
    this._input.addEventListener("change", this.getValue);
    this._input.classList.add(...this.styletype);
    this._input.placeholder = this.hint;
    this._input.type = this.type;
  }
}

window.customElements.define("text-box", TextBox);
