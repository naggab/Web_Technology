import viewHtml from "./view.html";
import { Task } from "../../task";

export default class FillShapeTask extends Task {
  canvasElement: HTMLCanvasElement;
  test: boolean;
  ctx: CanvasRenderingContext2D;

  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    const rect = this.canvasElement.getBoundingClientRect();

    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    this.test = false;
    // Record the mouse position when it moves.
    // How to attach an detach events?
    // E.g only listen to mouse pos when mouse down...
    ctx.lineWidth = 12;
    this.canvasElement.addEventListener("mousemove", this.onMouseMove);
    this.canvasElement.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      this.test = true;
      const relativeMousePos = this.getMousePos(this.canvasElement, e);
      ctx.beginPath();
      ctx.moveTo(relativeMousePos.x, relativeMousePos.y);
    });
    this.canvasElement.addEventListener("mouseup", (e) => {
      console.log("mouseup");
      ctx.closePath();
      this.test = false;
    });
  }
  onUnmounting(): void | Promise<void> {}

  onMouseMove(e: MouseEvent) {
    if (this.test) {
      const { ctx, getMousePos } = this;
      const clientX = e.clientX;
      const clientY = e.clientY;
      console.log(clientX, clientY);
      const relativeMousePos = getMousePos(this.canvasElement, e);
      ctx.lineTo(relativeMousePos.x, relativeMousePos.y);
      ctx.stroke();
    }
  }
  //Get Mouse Position
  // let m = new Mouse(this.canvasElement);
  // m.startTracking(this.canvasElement);
  getMousePos(canvas: HTMLCanvasElement, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - (rect.left + rect.width / 2),
      y: evt.clientY - (rect.top + rect.height / 2),
    };
  }
}

customElements.define("fill-shape-task", FillShapeTask);

class Mouse {
  canvasElement: HTMLCanvasElement;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;
  }
  startTracking(canvasElement) {
    var clientX = 0.0;
    var clientY = 0.0;
    var test = false;
    canvasElement.addEventListener("mousemove", function (e) {
      if (test) {
        clientX = e.clientX;
        clientY = e.clientY;
        console.log(clientX, clientY);
      }
    });
    canvasElement.addEventListener("mousedown", function (e) {
      console.log("mousedown");
      test = true;
    });
    canvasElement.addEventListener("mouseup", function (e) {
      console.log("mouseup");
      test = false;
    });
  }
}
class Timer {}
