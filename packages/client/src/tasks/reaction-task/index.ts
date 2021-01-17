import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { concat, times } from "lodash";
import { Collection } from "konva/types/Util";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { debugPrint } from "../../screens/in-game/game-playground";

export default class ReactionTask extends Task {
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
  modInstance: MasterOfDisaster;

  constructor(props) {
    super(props);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.modInstance = MasterOfDisaster.getInstance();
    this.canvasElement = this.shadowRoot.getElementById("reactionCanvas") as HTMLCanvasElement;
    this.infoElement = this.shadowRoot.querySelector(".info") as HTMLElement;
    this.checkButton = this.shadowRoot.getElementById("check-button") as Button;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    this.tolerance = 400; // in ms
    const canvasPanel = this.canvasElement.getBoundingClientRect(); //get size according to html spec
    this.btnEnabled = true;
    var seed = MasterOfDisaster.getInstance().getGameSeed();

    this.checkButton.addEventListener("mousedown", (c) => {
      c.preventDefault();
      if (!this.timeAtStart) {
        this.infoElement.innerHTML = this.modInstance.getString().timer_tasks.not_started;
        if (this.timerTimeout) clearTimeout(this.timerTimeout);
        //this.failTimeout = setTimeout(this.taskFailed.bind(this), 1500);
        this.infoElement.style.color = "red";
        this.btnEnabled = false;
        this.checkButton.style.display = "none";
        this.taskFailed();
      } else if (this.btnEnabled) {
        this.timeAtClick = performance.now();
        var dif = this.timeAtClick - this.timeAtStart;
        this.modInstance.log("dif = " + dif);
        var result = dif - this.tolerance;
        this.modInstance.log("result = " + Math.abs(result));
        if (result < 0) {
          this.infoElement.innerHTML =
            this.modInstance.getString().timer_tasks.your_reaction +
            ": " +
            (dif / 1000).toFixed(3) +
            "s - " +
            this.modInstance.getString().timer_tasks.success;
          this.infoElement.style.color = "green";
          //this.successTimeout = setTimeout(this.taskSuccess.bind(this), 1500);
          this.btnEnabled = false;
          this.checkButton.style.display = "none";
          this.taskSuccess();
        } else {
          this.infoElement.innerHTML =
            this.modInstance.getString().timer_tasks.you_were +
            " " +
            Math.abs(result / 1000).toFixed(3) +
            " " +
            this.modInstance.getString().timer_tasks.too_slow;
          this.drawRect();
          this.infoElement.style.color = "red";
          this.btnEnabled = false;
          this.checkButton.style.display = "none";
          //this.failTimeout = setTimeout(this.taskFailed.bind(this), 1500);
          this.taskFailed();
        }
      }
    });

    var timeToStart = ((seed % 3) + 2) * 1000;
    if (timeToStart > 7000 || timeToStart < 3000) timeToStart = 3000;
    this.modInstance.log(timeToStart + " ms until the box turns green");
    this.infoElement.innerHTML = this.modInstance.getString().timer_tasks.reaction_info;
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

customElements.define("reaction-task", ReactionTask);
