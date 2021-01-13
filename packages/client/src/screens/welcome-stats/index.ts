import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "../../components/textBox";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { Button } from "../../components/button";
import { StatsStorage } from "../../statsStorage";
import { variable } from "@tensorflow/tfjs";
import { TaskManger} from "../../taskManager"



class StatsScreen extends AbstractScreen {
  _userName_input: any;
  _mod: MasterOfDisaster;
  _taskNumber: number;
  _iter: number;
  _container: HTMLDivElement;
  button: Button; 
  
  buttons = [];
  tasks = [];

  constructor() {
    super();
    document.title = "Stats";
  }

  onMounted(){
  this._mod = MasterOfDisaster.getInstance();
  this._container = this.shadowRoot.querySelector("#container") as HTMLDivElement;
  this.tasks = TaskManger.getTaskIds()
   
  this.createButton();
  }

  private createButton(){


    TaskManger.getTaskIds().forEach(task =>{
      this.button = new Button();
      this.button.setStyle("transparent,stats");
      this.button.setID(task);
      this.button.setLabel(this._mod.getString().tasks[task]);
      this.buttons.push(this.button);
      this._container.appendChild(this.button);
      
  })
   
  }
  async getHtml() {
    return templateHTML;
  }
}

customElements.define("stats-screen", StatsScreen);

export default StatsScreen;
