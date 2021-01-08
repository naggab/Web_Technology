import templateHTML from "./template.html";

type footerType = "dark" | "light";

export class Footer extends HTMLElement {
  _footer: HTMLElement;
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._footer = shadowRoot.getElementById("footer");
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
  connectedCallback() {
    this._footer.classList.add(...this.styletype);
  }
}

customElements.define("out-footer", Footer);
