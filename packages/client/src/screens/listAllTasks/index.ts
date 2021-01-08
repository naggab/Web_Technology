import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

import { TaskManger } from "../../taskManager";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { Task } from "../../task";

const linkCollection = document.createElement("div");
const taskWrapper = document.createElement("div");

class ListAllTasksScreen extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Welcome");
    this._getTaskList();
  }

  async onMounted() {
    const hash = window.location.hash.replace("#", "");
    if (hash && TaskManger.getTaskIds().indexOf(hash as any) !== -1) {
      await MasterOfDisaster.getInstance().openTaskByIdentifier(hash as any);
      window.location.hash = "";
    }
  }

  _getTaskList() {
    linkCollection.setAttribute(
      "style",
      `height: 44px; 
                    display: flex; 
                    justify-content: space-around;
                    align-items: center;
                      background-color: #D3D3D3;
                      margin: 3px;
                    
                  `,
    );
    taskWrapper.setAttribute(
      "style",
      `
                  width: 100%; 
                  border: 1px solid #EFEFEF;
                `,
    );
    document.body.appendChild(linkCollection);
    document.body.appendChild(taskWrapper);

    const taskIds = TaskManger.getTaskIds();

    linkCollection.innerHTML = "";
    // create links in the 'LinkCollection' for every found task
    for (let taskId of taskIds) {
      const link = document.createElement("a");
      link.onclick = async (e) => {
        e.preventDefault();
        window.location.hash = taskId;
        await MasterOfDisaster.getInstance().openTaskByIdentifier(taskId);
        window.location.hash = "";
      };
      link.href = "";
      link.innerText = taskId;
      linkCollection.appendChild(link);
    }

    return taskWrapper;
  }
}

customElements.define("list-all-tasks-screen", ListAllTasksScreen);

export default ListAllTasksScreen;
