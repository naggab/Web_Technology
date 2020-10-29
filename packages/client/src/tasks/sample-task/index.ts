import viewHtml from "./view.html";

export class SampleTask extends HTMLElement {
  loadButton: HTMLAnchorElement;
  serverResponseSpan: HTMLSpanElement;
  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.loadButton = this.shadowRoot.getElementById("load-button") as HTMLAnchorElement;
    this.serverResponseSpan = this.shadowRoot.getElementById("sample-task-server-response") as HTMLSpanElement;
    this.loadButton.onclick = this.loadFromServer.bind(this);
  }

  async loadFromServer() {
    this.loadButton.innerText = "loading ...";
    try {
      const response = await fetch("/api/test");
      this.serverResponseSpan.innerText = await response.text();
      this.loadButton.innerText = "Reload";
    } catch (e) {
      this.serverResponseSpan.innerText = "<Error>";
      this.loadButton.innerText = "Retry";
    }
  }
}

customElements.define("sample-task", SampleTask);
