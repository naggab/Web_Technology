import { numbers } from "@material/textfield";
import { isNull, min } from "lodash";
import { TaskIdentifier } from "./taskManager";

export class StatsStorage {
  private localStorageKey = "stats";
  private tasks: { [key in TaskIdentifier]?: number };

  taskCompleted(taskName: TaskIdentifier, timeInMS: number) {
    //load stats
    this.tasks = this.getStats();
    var flagFound = false;
    //check if task already in array:
    if (Object.keys(this.tasks).includes(taskName)) {
      this.tasks[taskName] = min([timeInMS, this.tasks[taskName]]);
    } else {
      this.tasks[taskName] = timeInMS;
    }
    this.store(this.tasks);
  }
  private store(tasks: { [key in TaskIdentifier]?: number }) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(tasks));
  }
  getStats(): { [key in TaskIdentifier]?: number } {
    var parse = JSON.parse(localStorage.getItem(this.localStorageKey));
    return isNull(parse) ? {} : parse;
  }
  deleteStats() {
    localStorage.removeItem(this.localStorageKey);
  }
}
