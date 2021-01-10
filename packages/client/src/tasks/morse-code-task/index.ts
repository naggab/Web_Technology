import viewHtml from "./view.html";
import { Task } from "../../task";

import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { range } from "lodash";

export default class MorseCodeTask extends Task {
  loadButton: Button;
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ctxAnimtated: CanvasRenderingContext2D;
  curPixelX: number;
  offsetX: number;
 
  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.loadButton = this.shadowRoot.getElementById("check-button") as Button;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.ctx = this.canvasElement.getContext("2d");
    this.ctxAnimtated = this.canvasElement.getContext("2d");
    const canvasElement = this.canvasElement;
    const ctx = this.ctx;
    const ctxAnimtated = this.ctxAnimtated;
    ctx.lineWidth = 3;
    this.curPixelX = 0;
    var mouseDown:boolean=false;
    this.offsetX = 100;

    var cntPixel = 0;
    const pattern:Array<Array<number>> = [[1,0,1,1,1,0,0],[1,1,0,0],[0,0,1]]; //0=Space 1=. 2=-
    var seed = MasterOfDisaster.getInstance().getGameSeed();

    var patternReshaped = this.drawCode(pattern[seed%pattern.length], this.offsetX, 130, 10);
    var morseArray = [];
    /*
    const interval1 = setInterval((f)=> {
        this.curPixelX++;
        this.deleteRect(this.curPixelX,150);
        this.createRect(this.curPixelX,150);
        //this.ctxAnimtated.translate(this.curPixelX,100);
        if(this.curPixelX==800){
            clearInterval(interval1);
        }
        if(mouseDown){

        }
    }, 15);*/

    function moveRect(){
        ctxAnimtated.clearRect(cntPixel-1,140,2,20);
        ctxAnimtated.fillRect(cntPixel,140,2,20);
        
        var x = requestAnimationFrame(moveRect) // call requestAnimationFrame again to animate next frame
        if(mouseDown)
        { 
            ctx.beginPath();
            ctx.moveTo(cntPixel-1, 150);
            ctx.lineTo(cntPixel, 150);
            ctx.stroke(); 
            ctx.closePath();
            morseArray.push(1);
        }
        else{
            morseArray.push(0);
        }
        cntPixel+=1
        if(cntPixel>canvasElement.width){
            cancelAnimationFrame(x)
            console.log(morseArray);
        }
       
    }
    requestAnimationFrame(moveRect);


    this.canvasElement.addEventListener("mousedown", (e) => {
        console.log("mousedown");
        /*
        interval = setInterval((f)=>{
            if(flag){
                cnt=this.curPixelX;
                flag=false;
            }
            this.stroke(this.curPixelX, cnt,200)
        }, 15);*/
        //this.stroke(cnt,)
        mouseDown=true;
        
      });
      this.canvasElement.addEventListener("mouseup", (e) => {
        console.log("mouseup");
        //clearInterval(interval);
        mouseDown = false;
      }); 
  
    }
  onUnmounting(): void | Promise<void> {}


drawCode(pattern:Array<number>, offsetX: number, offsetY: number, gapPx: number): Array<number>{
    var lineLength = 30;
    var dotLength = 10;
    var checkPattern:Array<number> = [];
    const gapConst = gapPx
    //check pattern [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,...] //1...pixel filled, 0...not 
    //add offsetX:
    range(offsetX).forEach(x => checkPattern.push(0));
    //add line, dot, gap
    
    console.log("pattern",checkPattern)
    pattern = pattern.map(x => x==1 ? x=lineLength: x=dotLength) //encode pattern to real pixel
    for(var element of pattern){
        this.stroke(element, gapPx+offsetX, offsetY);
        gapPx+=(lineLength+element+offsetX);
        
        offsetX=0; //only first time
        range(element).forEach(x => checkPattern.push(1))
        range(gapConst).forEach(x => checkPattern.push(0))
        console.log("pattern",checkPattern)
        
        
    }
    return checkPattern;
   
}
calcCheck(checkPattern:Array<number>){
    for(var element of checkPattern){

        
    }
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


}

customElements.define("morse-code-task", MorseCodeTask);
