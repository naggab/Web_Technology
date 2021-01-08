import templateHTML from "./template.html";

export class toggleSwitch extends HTMLElement {
  constructor() {
    super();
  }

  get leftposition() {
    return this.hasAttribute("leftposition");
  }
  get value() {
    return this.hasAttribute("value");
  }
  get checked() {
    return this.hasAttribute("checked");
  }

  connectedCallback() {
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
  }
}

window.customElements.define("toggle-switch", toggleSwitch);
