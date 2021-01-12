import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { times } from "lodash";



export default class ResizeScreenTask extends Task {
  backButton: Button;
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
  mouseDown: boolean=false;
  tolerance: number;
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
  initWidth: number;
  initHeight: number;

  //mouse:
  currPosX: number;
  currPosY: number;
  staticPosX: number;
  staticPosY: number;


  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.backButton = this.shadowRoot.getElementById("back-button") as Button;
    this.textElement = this.shadowRoot.getElementById("text") as HTMLDivElement;
    this.rootContainer = this.shadowRoot.querySelector(".root") as HTMLDivElement;
    this.resizeZone = this.shadowRoot.getElementById("resize-zone") as HTMLDivElement;
    this.bottomRightElement = this.shadowRoot.getElementById("bottom-right") as HTMLDivElement
   
    const resizeArray: Array<[number,number]> = [[380,150],[333,222],[800,200],[900,250]] //height width tuple
    var index = MasterOfDisaster.getInstance().getGameSeed() % resizeArray.length;
    var setDimensionFlag: boolean = true;
    
    var firstButtonClick: boolean = true;
    var taskSuccess: boolean = true;

    this.tolerance = 5;
    this.maxHeight = 360;
    this.minHeight = 100
    this.maxWidth = 1000;
    this.minWidth = 320;
    this.initHeight = 150;
    this.initWidth = 500;
    this.targetWidth = resizeArray[index][0];
    this.targetHeight = resizeArray[index][1];

    this.resizeZone.style.height = this.initHeight+"px";
    this.resizeZone.style.width = this.initWidth+"px";


    this.bottomRightElement.addEventListener("mousedown", (e)=>{
      console.log("bottomRightElement","mousedown");
      this.mouseDown = true;
      this.staticPosX = this.currPosX;
      this.staticPosY = this.currPosY;
    });
    this.bottomRightElement.addEventListener("mouseup", (e)=>{
      console.log("bottomRightElement");
      this.mouseDown = false;
    });
    this.bottomRightElement.addEventListener("mouseout", (e)=>{
      console.log("bottomRightElement");
      this.mouseDown = false;
    });
    this.rootContainer.addEventListener("mousemove", this.onMouseMove);

    const resizeObserver = new ResizeObserver(entries => {
        this.currHeight =  Math.trunc(entries[0].contentRect.height);
        this.currWidth =  Math.trunc(entries[0].contentRect.width);

        if(setDimensionFlag){
            setDimensionFlag = false;
            this.textElement.innerHTML = "Current size: <br>" +this.currWidth+ " x " +this.currHeight+" px <br>" + "Resize to: <br>"+this.targetWidth+" x "+this.targetHeight + "px" + " [+/-"+this.tolerance+"]"

        }
      });
      
      const x = resizeObserver.observe(this.resizeZone);
     
      this.backButton.addEventListener("click", e =>{
        if(firstButtonClick){
            if(Math.abs(this.currHeight-this.targetHeight) <= this.tolerance && Math.abs(this.currWidth-this.targetWidth)<=this.tolerance){
                this.textElement.innerHTML="Yes, you did it!!!"
                this.resizeZone.style.background = "green";
                taskSuccess = true;
            }
            else{
                this.textElement.innerHTML="Nope, nice try."
                this.resizeZone.style.background = "red";
                taskSuccess = false;
    
            }
            this.rootContainer.removeEventListener("mousemove",this.onMouseMove);
            this.backButton.setAttribute("label","Back");
            firstButtonClick = false;
        }
        else{
            this.finish(taskSuccess,1);
        }
       
      })

    }
  onUnmounting(): void | Promise<void> {}
  onMouseMove(e: MouseEvent) {
    
    
    this.currPosX = e.clientX;
    this.currPosY = e.clientY;

    if( this.currWidth <= this.minWidth)
    {
      this.currWidth = this.minWidth;
    }
    if( this.currWidth >= this.maxWidth)
    {
      this.currWidth = this.maxWidth;
    }
    if( this.currHeight <= this.minHeight)
    {
      this.currHeight = this.minHeight;
    }
    if( this.currHeight >= this.maxHeight)
    {
      this.currHeight = this.maxHeight;
    }

    if(this.mouseDown){
      this.resizeZone.style.width = this.currWidth + (this.currPosX-this.staticPosX)*2+"px" //times2 due to central pos -> updates pixel and puts it into middle
      this.resizeZone.style.height = this.currHeight + (this.currPosY-this.staticPosY)*2+"px"
      this.staticPosX = this.currPosX;
      this.staticPosY = this.currPosY;
    }
    this.textElement.innerHTML = "Current size: <br>" +this.currWidth+ " x " +this.currHeight+" px <br>" + "Resize to: <br>"+this.targetWidth+" x "+this.targetHeight + "px" + " [+/-"+this.tolerance+"]"

    
    
    
  }

}

customElements.define("resize-screen-task", ResizeScreenTask);
