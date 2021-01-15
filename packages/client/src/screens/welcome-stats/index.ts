import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "../../components/textBox";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { Button } from "../../components/button";
import { StatsStorage } from "../../statsStorage";
import { any, variable } from "@tensorflow/tfjs";
import { TaskManger, TaskIdentifier} from "../../taskManager"
import { event, globalEval } from "jquery";
import { useForkRef } from "@material-ui/core";


var curr_id:any
var buttons = []
var texts = []
var task_names = {}
var curr_stats = {}
class StatsScreen extends AbstractScreen {

  _userName_input: any;
  _mod: MasterOfDisaster;
  _stats: StatsStorage
  _taskNumber: number;
  _iter: any;
  _container: HTMLDivElement;
  _stat: HTMLDivElement;
  _index: any
  button: Button; 
  tasks = [];
  _taskname: any
  _highscore: any
  _score: any
  _t_in_s: any

  private stat: { [key in TaskIdentifier]?: number };
  async getHtml() {
    return templateHTML;
  }

  constructor() {
    super();
    document.title = "Stats";
  }


  onMounted(){
  this._mod = MasterOfDisaster.getInstance();
  task_names = this._mod.getString().tasks
  this._container = this.shadowRoot.querySelector("#container") as HTMLDivElement;
  this.tasks = TaskManger.getTaskIdentifiers()
   
  this.createButton();
  this.storeDynamicTexts();
  this.getCurrStats();
  texts[1].innerHTML = "STATS"
  texts[2].innerHTML = "HIGHSCORE"
  texts[3].innerHTML = "--"
  }

  private getCurrStats(){

  curr_stats = this._mod.statsStorage.getStats()  
  }
  private storeDynamicTexts(){

    texts.push(this.shadowRoot.querySelector("#taskname"))
    texts.push(this.shadowRoot.querySelector("#stat_title"))
    texts.push(this.shadowRoot.querySelector("#highscore"))
    texts.push(this.shadowRoot.querySelector("#time"))

  }
  private createButton(){


    TaskManger.getTaskIdentifiers().forEach(task =>{
      this.button = new Button();
      this.button.setStyle("transparent,stats");
      this.button.setID(task);
      this.button.setLabel(this._mod.getString().tasks[task]);
      this.button.addEventListener("click", function () {
        curr_id = this.id
        
        
      })
      this.button.onclick = this.selectButton
    
    
      buttons.push(this.button)
      this._container.appendChild(this.button);    
    })
   
  }
selectButton(){
for(var i = 0; i < buttons.length; i++){
  if(buttons[i].getAttribute("id") == curr_id){
    buttons[i].setAttribute("styletype", "white,stats")

  }
  else
  buttons[i].setAttribute("styletype", "transparent,stats")
}
texts[0].innerHTML = task_names[curr_id]
if(!curr_stats[curr_id]){
  texts[3].innerHTML = "No Stats :,("
}
else{
texts[3].innerHTML = (curr_stats[curr_id] / 1000).toFixed(3) + "s"
}
}
}

customElements.define("stats-screen", StatsScreen);

export default StatsScreen;
