import viewHtml from "./view.html";

export class GamePlayground extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log(GamePlayground.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
  }

  disconnectedCallback() {
    console.log(GamePlayground.name, "disconnected from DOM");
  }
}

customElements.define("game-playground", GamePlayground);
