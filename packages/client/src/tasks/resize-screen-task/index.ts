import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";



export default class ResizeScreenTask extends Task {
  backButton: Button;
  resizeZone: HTMLDivElement;
  textElement: HTMLDivElement;
  topLeftElement: HTMLDivElement;
  topRightElement: HTMLDivElement;
  bottomLeftElement: HTMLDivElement;
  bottomRightElement: HTMLDivElement;
  result: any = [false, ""];
  selectedFile: any;
  firstClickFlag: boolean = false;
  filesArray: Array<[string, string]> = [];
  currWidth: number;
  currHeight: number;
  targetWidth: number;
  targetHeight: number;

  constructor(props) {
    super(props);
   // this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.backButton = this.shadowRoot.getElementById("back-button") as Button;
    this.textElement = this.shadowRoot.getElementById("text") as HTMLDivElement;
    this.resizeZone = this.shadowRoot.getElementById("resize-zone") as HTMLDivElement;
    this.topLeftElement = this.shadowRoot.getElementById("top-left") as HTMLDivElement
    this.topRightElement = this.shadowRoot.getElementById("top-right") as HTMLDivElement
    this.bottomLeftElement = this.shadowRoot.getElementById("bottom-left") as HTMLDivElement
    this.bottomRightElement = this.shadowRoot.getElementById("bottom-right") as HTMLDivElement
   
    const resizeArray: Array<[number,number]> = [[-50,-50],[-80,-100],[-65,-81],[-70,-33]] //height width tuple
    var index = MasterOfDisaster.getInstance().getGameSeed() % resizeArray.length;
    var setDimensionFlag: boolean = true;
    
    var firstButtonClick: boolean = true;
    var taskSuccess: boolean = true;

    this.topLeftElement.style.color = "red"
    
    this.topLeftElement.addEventListener("mousedown", (f)=>{
        console.log("topLeftElement");
    });
    this.topRightElement.addEventListener("mousedown", (f)=>{
      console.log("topRightElement");
    });
    this.bottomLeftElement.addEventListener("mousedown", (f)=>{
      console.log("bottomLeftElement");
    });
    this.bottomRightElement.addEventListener("mousedown", (f)=>{
      console.log("bottomRightElement");
    });
    
    const resizeObserver = new ResizeObserver(entries => {
        this.currHeight =  Math.trunc(entries[0].contentRect.height);
        this.currWidth =  Math.trunc(entries[0].contentRect.width);

        if(setDimensionFlag){
            setDimensionFlag = false;
            this.targetHeight = Math.trunc(this.currHeight + resizeArray[index][0]);
            this.targetWidth = Math.trunc(this.currWidth + resizeArray[index][1]);
        }
        this.textElement.innerHTML = "Current rectangle size: <br>" +this.currWidth+ " x " +this.currHeight+" px <br>" + "Resize to: <br>"+this.targetWidth+" x "+this.targetHeight + "px"
      });
      
      resizeObserver.observe(this.resizeZone);
      
      this.resizeZone.addEventListener('change', () => {
        console.log("yeah")
      });

      this.backButton.addEventListener("click", e =>{
        if(firstButtonClick){
            if(this.currHeight == this.targetHeight && this.currWidth == this.targetWidth){
                this.textElement.innerHTML="Yes, you did it!!!"
                this.resizeZone.style.background = "green";
                taskSuccess = true;
            }
            else{
                this.textElement.innerHTML="Nope, nice try."
                this.resizeZone.style.background = "red";
                taskSuccess = false;
    
            }
            this.backButton.setAttribute("label","Back");
            firstButtonClick = false;
        }
        else{
            this.finish(taskSuccess,1);
        }
       
      })

    }
  onUnmounting(): void | Promise<void> {}

}

customElements.define("resize-screen-task", ResizeScreenTask);
