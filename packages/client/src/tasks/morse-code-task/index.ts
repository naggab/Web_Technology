import viewHtml from "./view.html";
import { Task } from "../../task";

import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { range } from "lodash";

export default class MorseCodeTask extends Task {
  controlButton: Button;
  canvasElement: HTMLCanvasElement;
  info: HTMLElement;
  audioElement: HTMLAudioElement;
  panel: HTMLDivElement;
  ctx: CanvasRenderingContext2D;
  ctxAnimtated: CanvasRenderingContext2D;
  curPixelX: number;
  offsetX: number;
  offsetY: number;
  morseGapPx: number;
  morseLinePx: number;
  morseDotPx: number;

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.controlButton = this.shadowRoot.getElementById("control-button") as Button;
    const controlButton = this.controlButton;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.info = this.shadowRoot.getElementById("info") as HTMLElement;
    this.audioElement = this.shadowRoot.querySelector("audio") as HTMLAudioElement;
    const audioElement = this.audioElement;
    this.panel = this.shadowRoot.getElementById("panel") as HTMLDivElement;
    const panel = this.panel;
    //audio
    var audioContext = new AudioContext();
    var o = audioContext.createOscillator();
    o.type = "sine";
    o.frequency.value = 0;
    o.connect(audioContext.destination);

    const infoHeading = this.info;
    this.ctx = this.canvasElement.getContext("2d");
    this.ctxAnimtated = this.canvasElement.getContext("2d");
    const canvasElement = this.canvasElement;
    const ctx = this.ctx;
    const ctxAnimtated = this.ctxAnimtated;
    ctx.lineWidth = 10;
    this.curPixelX = 0;
    var mouseDown: boolean = false;
    this.morseGapPx = 20;
    const morseGapPx = this.morseGapPx;
    this.morseLinePx = 40;
    this.morseDotPx = 15;
    this.offsetY = 130;

    const pattern: Array<Array<number>> = [
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0],
    ]; //0=Space 1=SOS, 2=ABC, 3=HI
    const patternDescr: Array<string> = ["SOS", "ABC", "HI"]; //0=Space 1=SOS, 2=ABC, 3=HI
    var index = MasterOfDisaster.getInstance().getGameSeed() % pattern.length;

    this.info.innerHTML = "Morse:" + " '" + patternDescr[index] + "'";
    var binaryArray = this.getBinaryPattern(pattern[index], this.morseLinePx, this.morseDotPx, this.morseGapPx);
    this.offsetX = this.canvasElement.width / 2 - binaryArray.length / 2;
    const offsetX = this.offsetX;
    var pixelIndex = Math.trunc(this.offsetX * 0.5); //start with the cursor between the code and the left border

    this.drawCode(pattern[index], this.offsetX, this.offsetY, this.morseLinePx, this.morseDotPx, this.morseGapPx);
    var morseArray = [];
    var firstClick = true;
    var animitionFinish = false;
    var tupleResult: [boolean, string, number];

    //variable to set interval
    var updateData: any;

    //animation:
    var animation: any;

    const calcPrec = this.calcPrecision;

    function updateRectPos() {
      ctxAnimtated.clearRect(pixelIndex - 1, 160, 2, 30);
      ctxAnimtated.fillRect(pixelIndex, 160, 2, 30);

      animation = requestAnimationFrame(updateRectPos); // call requestAnimationFrame again to animate next frame
    }
    function shiftIndex() {
      //sometimes frame update not accurate, some cursor visible, therefore delete extra when shifting, solved the case
      ctxAnimtated.clearRect(pixelIndex - 1, 160, 2, 30);
      if (mouseDown && pixelIndex > offsetX && pixelIndex <= offsetX + binaryArray.length) {
        ctx.beginPath();
        ctx.moveTo(pixelIndex - 1, 175);
        ctx.lineTo(pixelIndex, 175);
        ctx.stroke();
        ctx.closePath();
        morseArray.push(1);
        o.frequency.value = 600;
      } else if (pixelIndex > offsetX && pixelIndex <= offsetX + binaryArray.length) {
        morseArray.push(0);
        o.frequency.value = 0;
      } else {
        o.frequency.value = 0;
      }
      pixelIndex += 1;
      if (pixelIndex > offsetX * 1.5 + binaryArray.length) {
        cancelAnimationFrame(animation);
        animitionFinish = true;
        tupleResult = calcPrec(morseArray, binaryArray);
        infoHeading.innerHTML = tupleResult[1];
        infoHeading.style.color = tupleResult[0] ? "green" : "red";
        o.stop();
        audioElement.pause();
        controlButton.style.display = "block";
        clearInterval(updateData);
      }
    }
    panel.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      mouseDown = true;
    });
    panel.addEventListener("mouseup", (e) => {
      console.log("mouseup");
      mouseDown = false;
    });

    controlButton.addEventListener("click", (e) => {
      if (firstClick) {
        audioElement.play();
        requestAnimationFrame(updateRectPos);
        firstClick = false;
        o.start();

        controlButton.style.display = "none";
        controlButton.setAttribute("label", "Back");
        var i = 0;
        updateData = setInterval(shiftIndex, 5);
      } else if (!firstClick && animitionFinish) {
        this.finish(tupleResult[0], 1 + (1 - tupleResult[2] / 100));
      }
    });
  }

  onUnmounting(): void | Promise<void> {}

  drawCode(pattern: Array<number>, offsetX: number, offsetY: number, linePx: number, dotPx, gapPx: number) {
    const gapConst = gapPx;
    gapPx = 0;
    pattern = pattern.map((x) => (x == 1 ? (x = linePx) : (x = dotPx))); //encode pattern to real pixel
    for (var element of pattern) {
      this.stroke(element, gapPx + offsetX, offsetY);
      gapPx += gapConst + element + offsetX;
      offsetX = 0; //only first time
    }
  }
  getBinaryPattern(pattern: Array<number>, linePx: number, dotPx, gapPx: number): Array<number> {
    var checkPattern: Array<number> = [];
    const gapConst = gapPx;
    //check pattern [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,...] //1...pixel filled, 0...not
    //add gap before first signal:
    //range(gapConst).forEach(x => checkPattern.push(0))
    //add line, dot, gap
    pattern = pattern.map((x) => (x == 1 ? (x = linePx) : (x = dotPx))); //encode pattern to real pixel
    for (var element of pattern) {
      range(element).forEach((x) => checkPattern.push(1));
      range(gapConst).forEach((x) => checkPattern.push(0));
    }
    range(gapConst).forEach((x) => checkPattern.pop());
    return checkPattern;
  }
  stroke(lengthPx: number, offsetX: number, offsetY: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, offsetY);
    this.ctx.lineTo(offsetX + lengthPx, offsetY);
    this.ctx.stroke();
    this.ctx.closePath();
  }
  createRect(xPos, yPos) {
    this.ctxAnimtated.fillRect(xPos, yPos, 4, 20);
  }
  deleteRect(xPos, yPos) {
    this.ctxAnimtated.clearRect(xPos - 2, yPos, 4, 20);
  }
  calcPrecision(morseArray: Array<number>, checkArray: Array<number>): [boolean, string, number] {
    var cntCorrectLineDot = 0;
    var cntCorrectGap = 0;
    var cntTotalGap = 0;
    var cntTotalLineDot = 0;
    //length of both arrays is equal!
    for (var i = 0; i < checkArray.length; i++) {
      //correct morse
      if (checkArray[i] == morseArray[i] && morseArray[i] == 1) {
        cntCorrectLineDot++;
      }
      if (checkArray[i] == morseArray[i] && morseArray[i] == 0) {
        cntCorrectGap++;
      }
      //get total gap/lineDot
      if (checkArray[i] == 0) {
        cntTotalGap++;
      }
      if (checkArray[i] == 1) {
        cntTotalLineDot++;
      }
    }
    console.log("correct line dot", cntCorrectLineDot, cntTotalLineDot);
    console.log("correct gap", cntCorrectGap, cntTotalGap);

    var result = ((cntCorrectLineDot / cntTotalLineDot) * 100) / 2 + ((cntCorrectGap / cntTotalGap) * 100) / 2;
    var message: any;

    if (result < 80) {
      message = [false, "Signal incomplete. (<80%)", 0];
    } else {
      message = [true, "Accuracy: " + result.toFixed(1) + " %", result.toFixed(1)];
    }

    return message;
  }
  /*
addLabel(ctx:CanvasRenderingContext2D, label: string, morsePixel: number)
{
    ctx.font = "30px Arial";
    
    
    var labels:Array<any> = label.split('');
    var segment = morsePixel / labels.length;
    var offset=segment/2;
    console.log(labels.length ,morsePixel,segment)
    for(var elem of labels){
        ctx.fillText(elem, this.canvasElement.width/2-morsePixel/2 + offset, this.offsetY-30); 
        segment*=2;
    }
    
}*/
}

customElements.define("morse-code-task", MorseCodeTask);
