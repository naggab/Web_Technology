import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";

var modInstance: MasterOfDisaster;

export default class ResizeScreenTask extends Task {
  checkButton: Button;
  resizeZone: HTMLDivElement;
  textElement: HTMLDivElement;
  bottomRightElement: HTMLDivElement;
  rootContainer: HTMLDivElement;
  result: any = [false, ""];
  selectedFile: any;
  firstClickFlag: boolean = false;
  filesArray: Array<[string, string]> = [];
  currWidth: number;
  currHeight: number;
  targetWidth: number;
  targetHeight: number;
  mouseDown: boolean = false;
  tolerance: number;
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
  initWidth: number;
  initHeight: number;
  errorSound: HTMLAudioElement;
  widthErrorFlag: boolean = false;
  heightErrorFlag: boolean = false;
  resizeObserver: any;
  taskSuccess: boolean = false;

  //mouse:
  currPosX: number;
  currPosY: number;
  staticPosX: number;
  staticPosY: number;

  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.checkButton = this.shadowRoot.getElementById("back-button") as Button;
    this.textElement = this.shadowRoot.getElementById("text") as HTMLDivElement;
    this.rootContainer = this.shadowRoot.querySelector(".root") as HTMLDivElement;
    this.resizeZone = this.shadowRoot.getElementById("resize-zone") as HTMLDivElement;
    this.bottomRightElement = this.shadowRoot.getElementById("bottom-right") as HTMLDivElement;

    const resizeArray: Array<[number, number]> = [
      [380, 166],
      [333, 222],
      [800, 200],
      [900, 250],
    ]; //height width tuple
    modInstance = MasterOfDisaster.getInstance();
    var index = modInstance.getGameSeed() % resizeArray.length;
    var setDimensionFlag: boolean = true;

    this.errorSound = new Audio("/assets/errorSound.mp3");
    this.errorSound.loop = false;

    this.tolerance = 5;
    this.maxHeight = 350;
    this.minHeight = 100;
    this.maxWidth = 1000;
    this.minWidth = 320;
    this.initHeight = 150;
    this.initWidth = 500;
    this.targetWidth = resizeArray[index][0];
    this.targetHeight = resizeArray[index][1];

    this.resizeZone.style.height = this.initHeight + "px";
    this.resizeZone.style.width = this.initWidth + "px";

    this.bottomRightElement.addEventListener("mousedown", this.onMouseDown);
    this.rootContainer.addEventListener("mouseup", (e) => {
      this.mouseDown = false;
    });
    this.bottomRightElement.addEventListener("mouseout", this.onMouseOut);
    this.rootContainer.addEventListener("mousemove", this.onMouseMove);

    var widthMinMax = false;
    var heightMinMax = false;

    this.resizeObserver = new ResizeObserver((entries) => {
      this.currHeight = Math.trunc(entries[0].contentRect.height);
      this.currWidth = Math.trunc(entries[0].contentRect.width);

      if (setDimensionFlag) {
        setDimensionFlag = false;
        this.textElement.innerHTML =
          "Current size: <br>" +
          this.currWidth +
          " x " +
          this.currHeight +
          " px <br>" +
          "Resize to: <br>" +
          this.targetWidth +
          " x " +
          this.targetHeight +
          "px" +
          " [+/-" +
          this.tolerance +
          "]";
      }
      widthMinMax = false;
      heightMinMax = false;
      if (this.currWidth <= this.minWidth) {
        widthMinMax = true;

        this.currWidth = this.minWidth;
        this.resizeZone.style.borderLeftColor = "red";
        this.resizeZone.style.borderRightColor = "red";
        if (this.widthErrorFlag) {
          this.widthErrorFlag = false;
          this.errorSound.play();
        }
      } else if (this.currWidth >= this.maxWidth) {
        widthMinMax = true;
        this.currWidth = this.maxWidth;
        this.resizeZone.style.borderLeftColor = "red";
        this.resizeZone.style.borderRightColor = "red";
        if (this.widthErrorFlag) {
          this.widthErrorFlag = false;
          this.errorSound.play();
        }
      }
      if (this.currHeight <= this.minHeight) {
        heightMinMax = true;
        this.currHeight = this.minHeight;
        this.resizeZone.style.borderTopColor = "red";
        this.resizeZone.style.borderBottomColor = "red";
        if (this.heightErrorFlag) {
          this.heightErrorFlag = false;
          this.errorSound.play();
        }
      } else if (this.currHeight >= this.maxHeight) {
        heightMinMax = true;
        this.currHeight = this.maxHeight;
        this.resizeZone.style.borderTopColor = "red";
        this.resizeZone.style.borderBottomColor = "red";
        if (this.heightErrorFlag) {
          this.heightErrorFlag = false;
          this.errorSound.play();
        }
      }

      if (!heightMinMax) {
        this.resizeZone.style.borderTopColor = "black";
        this.resizeZone.style.borderBottomColor = "black";
        this.heightErrorFlag = true;
      }
      if (!widthMinMax) {
        this.resizeZone.style.borderLeftColor = "black";
        this.resizeZone.style.borderRightColor = "black";
        this.widthErrorFlag = true;
      }
    });

    this.resizeObserver.observe(this.resizeZone);

    this.checkButton.addEventListener("click", this.onButtonClick);
  }
  onUnmounting(): void | Promise<void> {}

  blocked: boolean = false;

  onMouseMove(e: MouseEvent) {
    if (this.blocked) {
      return;
    }
    this.blocked = true;
    setTimeout(() => (this.blocked = false), 15);

    this.currPosX = e.clientX;
    this.currPosY = e.clientY;

    if (this.mouseDown) {
      this.resizeZone.style.width = this.currWidth + (this.currPosX - this.staticPosX) * 2 + "px"; //times2 due to central pos -> updates pixel and puts it into middle
      this.resizeZone.style.height = this.currHeight + (this.currPosY - this.staticPosY) * 2 + "px";
      this.staticPosX = this.currPosX;
      this.staticPosY = this.currPosY;
    }
    this.textElement.innerHTML =
      modInstance.getString().resize_screen_task.current_size_msg +
      "<br>" +
      this.currWidth +
      " x " +
      this.currHeight +
      " px <br>" +
      modInstance.getString().resize_screen_task.resize_to_msg +
      "<br>" +
      this.targetWidth +
      " x " +
      this.targetHeight +
      "px" +
      " [+/-" +
      this.tolerance +
      "]";
  }
  onMouseDown(e: MouseEvent) {
    modInstance.log("bottomRightElement", "mousedown");
    this.mouseDown = true;
    this.staticPosX = this.currPosX;
    this.staticPosY = this.currPosY;
  }
  onMouseOut(e: MouseEvent) {
    this.onMouseMove(e);
  }
  onButtonClick(e: Event) {
    this.resizeZone.style.borderColor = "black";
    if (
      Math.abs(this.currHeight - this.targetHeight) <= this.tolerance &&
      Math.abs(this.currWidth - this.targetWidth) <= this.tolerance
    ) {
      this.textElement.innerHTML = modInstance.getString().resize_screen_task.check_win_msg;
      this.resizeZone.style.background = "green";
      this.taskSuccess = true;
    } else {
      this.textElement.innerHTML = modInstance.getString().resize_screen_task.check_fail_msg;
      this.resizeZone.style.background = "red";
    }
    this.rootContainer.removeEventListener("mousemove", this.onMouseMove);
    this.bottomRightElement.removeEventListener("mousedown", this.onMouseDown);
    this.bottomRightElement.removeEventListener("mouseout", this.onMouseOut);
    this.checkButton.removeEventListener("click", this.onButtonClick);
    this.checkButton.style.display = "none";
    this.resizeObserver.unobserve(this.resizeZone);

    this.finish(this.taskSuccess);
  }
}

customElements.define("resize-screen-task", ResizeScreenTask);
