import viewHtml from "./view.html";
import { Task } from "../../task";

import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { range } from "lodash";

export default class MorseCodeTask extends Task {
  controlButton: Button;
  canvasElement: HTMLCanvasElement;
  info: HTMLElement;
  ctx: CanvasRenderingContext2D;
  ctxAnimtated: CanvasRenderingContext2D;
  curPixelX: number;
  offsetX: number;
  morseGapPx: number;
  morseLinePx: number;
  morseDotPx: number;
 
  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.controlButton = this.shadowRoot.getElementById("control-button") as Button;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.info = this.shadowRoot.getElementById("info") as HTMLElement;
    const infoHeading = this.info;
    this.ctx = this.canvasElement.getContext("2d");
    this.ctxAnimtated = this.canvasElement.getContext("2d");
    const canvasElement = this.canvasElement;
    const ctx = this.ctx;
    const ctxAnimtated = this.ctxAnimtated;
    ctx.lineWidth = 3;
    this.curPixelX = 0;
    var mouseDown:boolean=false;
    this.offsetX = 100;
    const offsetX = this.offsetX;
    this.morseGapPx = 20;
    const morseGapPx = this.morseGapPx;
    this.morseLinePx = 40;
    this.morseDotPx = 15;
    

    var pixelIndex = 0;
    const pattern:Array<Array<number>> = [[0,0,0,1,1,1,0,0,0],[0,1,1,0,0,0,1,0,1,0],[0,0,0,0,0,0]]; //0=Space 1=SOS, 2=ABC, 3=HI
    const patternDescr:Array<string> = ["SOS","ABC","HI"]; //0=Space 1=SOS, 2=ABC, 3=HI
    var index = MasterOfDisaster.getInstance().getGameSeed() % pattern.length;

    this.info.innerHTML = "Morse:"+" '"+patternDescr[index]+"'";
    var checkArray = this.drawCode(pattern[index], this.offsetX, 130,this.morseLinePx, this.morseDotPx, this.morseGapPx);
    var morseArray = [];
    var firstClick = true;
    var animitionFinish = false;
    var tupleResult:[boolean,string,number];

    const calcPrec = this.calcPrecision;
   
    function moveRect(){
        ctxAnimtated.clearRect(pixelIndex-1,140,2,20);
        ctxAnimtated.fillRect(pixelIndex,140,2,20);
        
        var x = requestAnimationFrame(moveRect) // call requestAnimationFrame again to animate next frame
        if(mouseDown && pixelIndex> offsetX)
        { 
            ctx.beginPath();
            ctx.moveTo(pixelIndex-1, 150);
            ctx.lineTo(pixelIndex, 150);
            ctx.stroke(); 
            ctx.closePath();
            morseArray.push(1);
            
        }
        else if(pixelIndex> offsetX){
                morseArray.push(0);
            }
        
        pixelIndex+=1
        if(pixelIndex>offsetX+checkArray.length){
            cancelAnimationFrame(x)
            animitionFinish=true;
            tupleResult = calcPrec(morseArray,checkArray);
            infoHeading.innerHTML = tupleResult[1];
            infoHeading.style.color = tupleResult[0] ? "green" : "red";

        }  
    }
    this.canvasElement.addEventListener("mousedown", (e) => {
        console.log("mousedown");
        mouseDown=true;
        
      });
      this.canvasElement.addEventListener("mouseup", (e) => {
        console.log("mouseup");
        mouseDown = false;
      }); 

      this.controlButton.addEventListener("click", (e) => {
        if(firstClick){
            requestAnimationFrame(moveRect);
            this.controlButton.setAttribute("label","Back");
            infoHeading.innerHTML = "Playing...";
            firstClick=false;
        }
        else if(!firstClick && animitionFinish){
            this.finish(tupleResult[0],(1+(1-(tupleResult[2]/100))));
        }
      });
  
    }

  onUnmounting(): void | Promise<void> {}


drawCode(pattern:Array<number>, offsetX: number, offsetY: number, linePx:number, dotPx ,gapPx: number): Array<number>{
    var checkPattern:Array<number> = [];
    const gapConst = gapPx
    gapPx=0
    //check pattern [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,...] //1...pixel filled, 0...not 
    //add gap before first signal:
    //range(gapConst).forEach(x => checkPattern.push(0))
    //add line, dot, gap
    
    pattern = pattern.map(x => x==1 ? x=linePx: x=dotPx) //encode pattern to real pixel
    for(var element of pattern){
        this.stroke(element, gapPx+offsetX, offsetY);
        gapPx+=(gapConst+element+offsetX);
        offsetX=0; //only first time
        range(element).forEach(x => checkPattern.push(1))
        range(gapConst).forEach(x => checkPattern.push(0))
        console.log("pattern",checkPattern)
    }
    range(gapConst).forEach(x => checkPattern.pop())
    
    return checkPattern;
   
}
stroke(lengthPx:number, offsetX:number, offsetY:number)
{
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, offsetY);
    this.ctx.lineTo(offsetX+lengthPx, offsetY);
    this.ctx.stroke(); 
    this.ctx.closePath();
    
}
createRect(xPos,yPos){
    this.ctxAnimtated.fillRect(xPos,yPos,4,20);

}
deleteRect(xPos,yPos){
    this.ctxAnimtated.clearRect(xPos-2,yPos,4,20);
}
calcPrecision(morseArray: Array<number>, checkArray: Array<number>):[boolean,string,number]{
    var cntCorrectLineDot=0;
    var cntCorrectGap=0;
    var cntTotalGap=0;
    var cntTotalLineDot=0;
    //length of both arrays is equal!
    for(var i=0; i<checkArray.length; i++){
        //correct morse
        if(checkArray[i] == morseArray[i] && morseArray[i]==1){
            cntCorrectLineDot++;
        }
        if(checkArray[i] == morseArray[i] && morseArray[i]==0){
            cntCorrectGap++;
        }
        //get total gap/lineDot
        if(checkArray[i] == 0){
            cntTotalGap++;
        }
        if(checkArray[i] == 1){
            cntTotalLineDot++;
        }
       
    }
    console.log("correct line dot",cntCorrectLineDot,cntTotalLineDot);
    console.log("correct gap",cntCorrectGap,cntTotalGap);

    var result = ((cntCorrectLineDot/cntTotalLineDot)*100)/2 + ((cntCorrectGap/cntTotalGap)*100)/2;
    var message:any;

    if(result<80){
        message = [false,"Signal incomplete. (<80%)",0];
    }
    else{
        message = [true,"Accuracy: " + result.toFixed(1)+ " %", result.toFixed(1)];
    }   
    
    return message;
}


}

customElements.define("morse-code-task", MorseCodeTask);
