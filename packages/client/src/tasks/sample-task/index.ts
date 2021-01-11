import viewHtml from "./view.html";
import { Task } from "../../task";

import { Button } from "../../components/button";
import "../../components/textBox";
import "../../components/slider_switch";

export default class SampleTask extends Task {
  loadButton: Button;
  serverResponseSpan: HTMLSpanElement;
  counter: number = 0;

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    //this.loadTextInput = this.shadowRoot.getElementById("load-input") as TextBox;
    this.loadButton = this.shadowRoot.getElementById("load-button") as Button;
    this.serverResponseSpan = this.shadowRoot.getElementById("sample-task-server-response") as HTMLSpanElement;
    this.loadButton.onclick = this.loadFromServer.bind(this);
  }

  onUnmounting(): void | Promise<void> {}

  async loadFromServer() {
    this.counter++;
    if (this.counter > 5) {
      this.finish(true,1);
    }
    this.loadButton.setAttribute("label", "loading...");

    try {
      const response = await fetch("/api/test");
      this.serverResponseSpan.innerText = await response.text();
      this.loadButton.setAttribute("label", "Reload");
    } catch (e) {
      this.serverResponseSpan.innerText = "<Error>";
      this.loadButton.setAttribute("label", "Retry");
    }
  }
}

customElements.define("sample-task", SampleTask);
