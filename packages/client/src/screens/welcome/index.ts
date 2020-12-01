import templateHTML from "./template.html";

export class Welcome extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
  }

  connectedCallback() {}
}

customElements.define("welcome-screen", Welcome);
