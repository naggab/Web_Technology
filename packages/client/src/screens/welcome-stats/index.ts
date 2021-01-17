import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "../../components/textBox";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { Button } from "../../components/button";
import { StatsStorage } from "../../statsStorage";
import { TaskManger, TaskIdentifier } from "../../taskManager";
import Container from "../../components/container";

class StatsScreen extends AbstractScreen {
  _userName_input: any;
  _mod: MasterOfDisaster;
  _stats: StatsStorage;
  _taskNumber: number;
  _iter: any;
  _container: HTMLDivElement;
  _apirush_container: Container;
  _stat: HTMLDivElement;
  button: Button;
  tasks = [];

  buttons = [];
  texts = [];
  task_names = {};
  curr_stats = {};

  private stat: { [key in TaskIdentifier]?: number };
  async getHtml() {
    return templateHTML;
  }

  constructor() {
    super();
    document.title = "Stats";
  }

  onMounted() {
    this._mod = MasterOfDisaster.getInstance();
    this.task_names = this._mod.getString().tasks;
    this._container = this.shadowRoot.querySelector("#container") as HTMLDivElement;
    this._apirush_container = this.shadowRoot.querySelector("apirush-container");
    this._apirush_container.showArrow();
    this.tasks = TaskManger.getTaskIdentifiers();

    this.createButton();
    this.storeDynamicTexts();
    this.getCurrStats();
    this.texts[1].innerHTML = "HIGHSCORE";
    this.texts[2].innerHTML = "--";
  }

  private getCurrStats() {
    this.curr_stats = this._mod.statsStorage.getStats();
  }
  private storeDynamicTexts() {
    this.texts.push(this.shadowRoot.querySelector("#taskname"));
    this.texts.push(this.shadowRoot.querySelector("#highscore"));
    this.texts.push(this.shadowRoot.querySelector("#time"));
  }
  private createButton() {
    TaskManger.getTaskIdentifiers().forEach((task) => {
      this.button = new Button();
      this.button.setStyle("transparent,stats");
      this.button.setID(task);
      this.button.setLabel(this._mod.getString().tasks[task]);
      this.button.addEventListener("click", () => {
        this.selectButton(task);
      });

      this.buttons.push(this.button);
      this._container.appendChild(this.button);
    });
  }
  selectButton(curr_id: string) {
    for (var i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].getAttribute("id") == curr_id) {
        this.buttons[i].setAttribute("styletype", "white,stats");
      } else this.buttons[i].setAttribute("styletype", "transparent,stats");
    }
    this.texts[0].innerHTML = this.task_names[curr_id];
    if (!this.curr_stats[curr_id]) {
      this.texts[2].innerHTML = "No Stats :,(";
    } else {
      this.texts[2].innerHTML = (this.curr_stats[curr_id] / 1000).toFixed(3) + "s";
    }
  }
}

customElements.define("stats-screen", StatsScreen);

export default StatsScreen;
