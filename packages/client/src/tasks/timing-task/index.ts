import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { concat, times } from "lodash";
import { Collection } from "konva/types/Util";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { debugPrint } from "../../screens/in-game/game-playground";

export default class TimingTask extends Task {
  canvasElement: HTMLCanvasElement;
  infoElement: HTMLElement;
  checkButton: Button;
  ctx: CanvasRenderingContext2D;
  timeAtStart: DOMHighResTimeStamp;
  timeAtClick: DOMHighResTimeStamp;
  tolerance: number;
  timeToEnd: number;
  failTimeout: any;
  successTimeout: any;
  timerTimeout: any;
  btnEnabled: boolean;

  constructor(props) {
    super(props);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.canvasElement = this.shadowRoot.getElementById("timingCanvas") as HTMLCanvasElement;
    this.infoElement = this.shadowRoot.querySelector(".info") as HTMLElement;
    this.checkButton = this.shadowRoot.getElementById("check-button") as Button;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    this.tolerance = 800; // in ms
    const canvasPanel = this.canvasElement.getBoundingClientRect(); //get size according to html spec
    this.btnEnabled = true;
    var seed = MasterOfDisaster.getInstance().getGameSeed();

    this.checkButton.addEventListener("mousedown", (c) => {
      if (this.btnEnabled) this.timeAtClick = performance.now();
    });

    this.checkButton.addEventListener("mouseup", (c) => {
      c.preventDefault();
      if (!this.timeAtStart || !this.timeToEnd) {
        this.infoElement.innerHTML = "Timer has not started yet. Try again!";
        if (this.timerTimeout) clearTimeout(this.timerTimeout);
        this.failTimeout = setTimeout(this.taskFailed.bind(this), 1500);
      } else if (this.btnEnabled) {
        var dif = this.timeAtClick - this.timeAtStart;
        debugPrint("dif = " + dif);
        var result = dif - this.timeToEnd;
        debugPrint("result = " + Math.abs(result));
        if (Math.abs(dif - this.timeToEnd) < this.tolerance) {
          this.infoElement.innerHTML =
            "Target time: " +
            (this.timeToEnd / 1000).toFixed(1) +
            " - Your time: " +
            (dif / 1000).toFixed(1) +
            " - Success!";
          //this.successTimeout = setTimeout(this.taskSuccess.bind(this), 1500);
          this.taskSuccess();
          this.btnEnabled = false;
        } else {
          this.infoElement.innerHTML =
            "You were " +
            Math.abs(result / 1000).toFixed(1) +
            (result > 0 ? " seconds too slow!" : " seconds too fast!") +
            " Try again!";
          this.drawRect();
          this.btnEnabled = false;
          //this.failTimeout = setTimeout(this.taskFailed.bind(this), 1500);
          this.taskFailed();
        }
      }
    });

    var timeToStart = ((seed % 3) + 2) * 1000;
    if (timeToStart > 7000 || timeToStart < 1000) timeToStart = 3000;
    debugPrint(timeToStart + " ms until the box turns green");
    this.timeToEnd = ((((seed + 3) % 5) * Math.PI) / 2) * 1000; // Number between ~ 1 and 7
    if (this.timeToEnd > 7000 || this.timeToEnd < 1000) this.timeToEnd = 3000;
    debugPrint(this.timeToEnd + " ms to click after start");
    this.infoElement.innerHTML =
      "Press the button " + (this.timeToEnd / 1000).toFixed(1) + " seconds after the box turns green!";
    this.timerTimeout = setTimeout(this.startTimer.bind(this), timeToStart);

    this.drawRect();
  }
  onUnmounting(): void | Promise<void> {
    this.clearTimeouts();
  }

  clearTimeouts() {
    if (this.successTimeout) clearTimeout(this.successTimeout);
    if (this.failTimeout) clearTimeout(this.failTimeout);
    if (this.timerTimeout) clearTimeout(this.timerTimeout);
  }

  taskFailed() {
    this.clearTimeouts();
    this.finish(false, 1);
  }

  taskSuccess() {
    this.clearTimeouts();
    this.finish(true, 1);
  }

  startTimer() {
    this.drawRect("#009900");
    this.timeAtStart = performance.now();
  }

  drawRect(color?: string) {
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = color ? color : "#b32d00"; //"#009900";
    this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.ctx.closePath();
    this.ctx.stroke();
  }
}

customElements.define("timing-task", TimingTask);
