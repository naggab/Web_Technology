import viewHtml from "./view.html";
import { Task } from "../../task";

import { Button } from "../../components/button";
import "../../components/inputBox";
import "../../components/slider_switch";
import { TextBox } from "../../components/inputBox";
import { MasterOfDisaster } from "../../masterOfDisaster";

export default class MorseCodeTask extends Task {
  loadButton: Button;
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ctxAnimtated: CanvasRenderingContext2D;
  curPixelX: number;
 
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

    var cnt = 0;
    const pattern:Array<Array<number>> = [[1,0,1,1,1,0,0],[1,1,0,0],[0,0,1]]; //0=Space 1=. 2=-
    var seed = MasterOfDisaster.getInstance().getGameSeed();

    this.drawCode(pattern[seed%pattern.length], 50, 120, 10);

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
        ctxAnimtated.clearRect(cnt-1,140,2,20);
        ctxAnimtated.fillRect(cnt,140,2,20);
        console.log(cnt)
       
        
        var x = requestAnimationFrame(moveRect) // call requestAnimationFrame again to animate next frame
        if(mouseDown)
        { 
            ctx.beginPath();
            ctx.moveTo(cnt-1, 150);
            ctx.lineTo(cnt, 150);
            ctx.stroke(); 
            ctx.closePath();
        }
        cnt+=1
        if(cnt>canvasElement.width){
            cancelAnimationFrame(x)
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


drawCode(pattern:Array<number>, offsetX: number, offsetY: number, gapPx: number){
    var lineLength = 30;
    var dotLength = 10;
    pattern = pattern.map(x => x==1 ? x=lineLength: x=dotLength) //encode pattern to real pixel
    for(var element of pattern){
        this.stroke(element, gapPx+offsetX, offsetY);
        gapPx+=(lineLength+element+offsetX);
        offsetX=0; //only first time
    }
   
}
stroke(lengthPx,offsetX,offsetY)
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
