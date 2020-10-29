import viewHtml from "./view.html";

export class DemoTask extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log(DemoTask.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
  }

  disconnectedCallback() {
    console.log(DemoTask.name, "disconnected from DOM");
  }
}

customElements.define("demo-task", DemoTask);
