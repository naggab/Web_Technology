import templateHTML from "./template.html";
import { Languages, MasterOfDisaster } from "../../masterOfDisaster";

type footerType = "dark" | "light";

export class Footer extends HTMLElement {
  _footer: HTMLElement;
  _changeLanguage: any;
  _mod: MasterOfDisaster;
  _shadowRoot: ShadowRoot;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = templateHTML;

    this._footer = this._shadowRoot.querySelector("#footer");
    this._changeLanguage = this._shadowRoot.querySelector("#change-language");
    this._changeLanguage.onclick = this.changeLanguage.bind(this, false);
  }

  static get observedAttributes() {
    return ["styletype"];
  }

  get styletype(): footerType[] {
    const styleList = this.getAttribute("styletype");
    return (styleList.split(",") as footerType[]) || ["light"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "styletype":
        this._footer.className = "";
        this._footer.classList.add(...this.styletype);
        break;
      default:
        break;
    }
  }
  public changeLanguage(firstLaunch: boolean) {
    this._mod = MasterOfDisaster.getInstance();
    if (!firstLaunch) {
      if (this._mod.getLanguage() == "English") {
        this._mod.setLanguage("German");
      } else {
        this._mod.setLanguage("English");
      }
    }

    this._changeLanguage.innerHTML = this._mod.getString().general.changeLanguage;
  }
  connectedCallback() {
    this._footer.classList.add(...this.styletype);
  }
}

customElements.define("out-footer", Footer);
