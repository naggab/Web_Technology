import viewHtml from "./view.html";
import { Task } from "../../task";

export default class SampleTask extends Task {
  loadButton: HTMLAnchorElement;
  serverResponseSpan: HTMLSpanElement;
  counter: number = 0;

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.loadButton = this.shadowRoot.getElementById("load-button") as HTMLAnchorElement;
    this.serverResponseSpan = this.shadowRoot.getElementById("sample-task-server-response") as HTMLSpanElement;
    this.loadButton.onclick = this.loadFromServer.bind(this);
  }

  onUnmounting(): void | Promise<void> {}

  async loadFromServer() {
    this.counter++;
    if (this.counter > 5) {
      this.finish(true);
    }
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
