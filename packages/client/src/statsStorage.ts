import { TaskIdentifier } from "./taskManager";

export class StatsStorage {
  taskCompleted(taskName: TaskIdentifier, timeInMS: number) {
    // TODO
  }

  getStats(): any {
    return {
      "fill-shape-task": 15,
      "drag-and-drop-task": 222,
    };
  }
}
