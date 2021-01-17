import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

import { TaskManger } from "../../taskManager";
import { MasterOfDisaster } from "../../masterOfDisaster";

import "../../components/taskList";
import Container from "../../components/container";

class ListAllTasksScreen extends AbstractScreen {
  _container: Container;
  constructor() {
    super();
    this.setTitle("Task Debugger");
  }

  async onMounted() {
    const hash = window.location.hash.replace("#", "");
    if (!hash || TaskManger.getTaskIdentifiers().indexOf(hash as any) === -1) {
      return;
    }
    await MasterOfDisaster.getInstance().openTaskByIdentifier(hash as any);
    window.location.hash = "";
    
    this._container = this.shadowRoot.querySelector("apirush-container");
    this._container.showArrow();
  }

  async getHtml(): Promise<string> {
    return templateHTML;
  }
}

customElements.define("list-all-tasks-screen", ListAllTasksScreen);

export default ListAllTasksScreen;
