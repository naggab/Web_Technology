import viewHtml from "./view.html";
import { Task } from "../../task";
import {TextBox} from "../../components/inputBox";

import { Button } from "../../components/button";


export default class SampleTask extends Task {
  loadButton: Button;
  loadInput: TextBox;
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
      this.finish(true);
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
