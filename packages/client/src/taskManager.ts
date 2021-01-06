/**
 * defines name and importPath of one Task
 */
import { Task, TaskFinishCallback } from "./task";
import DragAndDropTask from "./tasks/drag-and-drop-task";
import FillShapeTask from "./tasks/fill-shape-task";

const TASK_LIST = {
  "drag-and-drop-task": DragAndDropTask,
  "fill-shape-task": FillShapeTask,
} as const;

export type TaskIdentifier = keyof typeof TASK_LIST;

class TaskManagerClass {
  constructor() {}

  getTaskIds(): TaskIdentifier[] {
    return Object.keys(TASK_LIST) as any;
  }

  findTask(name: TaskIdentifier): typeof TASK_LIST[keyof typeof TASK_LIST] | null {
    return TASK_LIST[name];
  }

  createTaskInstance(taskId: TaskIdentifier, finishCb?: TaskFinishCallback): Task {
    const taskConstr = this.findTask(taskId);
    if (!finishCb) {
      finishCb = (time, success) => {
        console.log(`TaskManager: task ${taskId} finished`, { time, success });
      };
    }
    return new taskConstr({ finishCb });
  }
}

export const TaskManger = new TaskManagerClass();
