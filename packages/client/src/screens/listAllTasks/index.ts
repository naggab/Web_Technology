import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

import { TaskManger } from "../../taskManager";
import { MasterOfDisaster } from "../../masterOfDisaster";

import "../../components/taskList";

class ListAllTasksScreen extends AbstractScreen {
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
  }

  async getHtml(): Promise<string> {
    return templateHTML;
  }
}

customElements.define("list-all-tasks-screen", ListAllTasksScreen);

export default ListAllTasksScreen;
