import { min } from "lodash";

export type taskName = "fill-shape-task" | "drag-and-drop-task";
export class StatsStorage {
  private tasks: Array<[taskName, number]> = [];
  private localStorageKey = "stats";

  taskCompleted(taskName: taskName, timeInMS: number) {
    //check if task already in array:
    var index = 0;
    var flagFound = false;
    for (index = 0; index < this.tasks.length; index++) {
      if (this.tasks[index][0] == taskName) {
        flagFound = true;
        break;
      }
    }
    if (flagFound) {
      this.tasks[index][1] = min([timeInMS, this.tasks[index][1]]);
    } else {
      this.tasks.push([taskName, timeInMS]);
    }
    this.store(this.tasks);
  }
  private store(tasks: Array<[taskName, number]>) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(tasks));
  }
  getStats(): Array<[taskName, number]> {
    return JSON.parse(localStorage.getItem(this.localStorageKey));
  }
  deleteStats() {
    localStorage.removeItem(this.localStorageKey);
  }
}
