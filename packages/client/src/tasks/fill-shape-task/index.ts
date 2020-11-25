import viewHtml from "./view.html";

export class FillShapeTask extends HTMLElement {
  loadButton: HTMLAnchorElement;
  serverResponseSpan: HTMLSpanElement;
  canvasElement: HTMLCanvasElement;
  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.loadButton = this.shadowRoot.getElementById("load-button_1") as HTMLAnchorElement;
    this.serverResponseSpan = this.shadowRoot.getElementById("fill-shape") as HTMLSpanElement;
    this.loadButton.onclick = this.loadFromServer.bind(this);

    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    var ctx = this.canvasElement.getContext("2d");
    ctx.beginPath();
    ctx.arc(50, 50, 40, 0, 2 * Math.PI);
    ctx.stroke();

    

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

customElements.define("fill-shape-task", FillShapeTask);
