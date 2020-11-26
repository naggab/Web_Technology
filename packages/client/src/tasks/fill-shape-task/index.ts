import viewHtml from "./view.html";
import { Task } from "../../task";

export default class FillShapeTask extends Task {
  loadButton: HTMLAnchorElement;
  serverResponseSpan: HTMLSpanElement;
  counter: number = 0;
  canvasElement: HTMLCanvasElement;
  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.loadButton = this.shadowRoot.getElementById("load-button") as HTMLAnchorElement;
    this.serverResponseSpan = this.shadowRoot.getElementById("fill-shape-task") as HTMLSpanElement;
    this.loadButton.onclick = this.loadFromServer.bind(this);
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    var ctx = this.canvasElement.getContext("2d");
    ctx.beginPath();
    ctx.arc(200, 200, 80, 0, 2 * Math.PI);
    ctx.stroke();

    var clientX = 0.0;
     var clientY = 0.0;
     // Record the mouse position when it moves.
     this.canvasElement.addEventListener('mousemove', function(e) {
      clientX = e.clientX;
      clientY = e.clientY;
      console.log(clientX,clientY);
      
    });
  
  //Get Mouse Position
  function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
      };
  }
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

customElements.define("fill-shape-task", FillShapeTask);

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}