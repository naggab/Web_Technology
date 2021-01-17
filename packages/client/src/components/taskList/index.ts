import { List } from "../list";
import templateHTML from "./template.html";
import { TaskManger } from "../../taskManager";
import { MasterOfDisaster } from "../../masterOfDisaster";

interface TaskDetails {
  id: string;
}

export class TaskList extends List<TaskDetails> {
  entryContentTemplate_: HTMLTemplateElement;

  connectedCallback() {
    this.entryContentTemplate_ = document.createElement("template");
    this.entryContentTemplate_.innerHTML = templateHTML;

    TaskManger.getTaskIdentifiers().forEach((id) => {
      this.addEntry({ id });
    });
  }

  disconnectedCallback() {}

  applyEntryData(el: HTMLElement, data: TaskDetails) {
    el.querySelector(".name").innerHTML = data.id;
  }

  getEntryContentTemplate(): HTMLTemplateElement {
    return this.entryContentTemplate_;
  }

  async onEntryClicked(id) {
    history.replaceState("all-tasks", "", "/#" + id);
    await MasterOfDisaster.getInstance().openTaskByIdentifier(id);
    history.replaceState("all-tasks", "", "/");
  }
}

customElements.define("task-list", TaskList);
