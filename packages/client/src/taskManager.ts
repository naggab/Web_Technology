/**
 * defines name and importPath of one Task
 */
import { Task, TaskFinishCallback } from "./task";

export interface TaskModule {
  name: string;
  importPath: string;
}

class TaskManagerClass {
  private readonly taskResolverContext: __WebpackModuleApi.RequireContext;

  private readonly availableTasks: TaskModule[];

  constructor() {
    this.taskResolverContext = require.context("./tasks/", true, /\.\/[^\/]+\/index.ts$/);
    this.availableTasks = this.resolveTasks();
  }

  /**
   * Resolves all importable tasks by looking for folders inside ./tasks containing a index.ts file
   */
  private resolveTasks(): TaskModule[] {
    const importPaths = this.taskResolverContext.keys();
    return importPaths.map((importPath) => ({
      importPath,
      name: importPath.substring(2, importPath.length - "/index.ts".length),
    }));
  }

  getTasks() {
    return [...this.availableTasks];
  }

  /**
   * looks for a task inside a Array<TaskModule> by name
   */
  findTask(name: string): TaskModule | null {
    for (let task of this.availableTasks) {
      if (task.name === name) {
        return task;
      }
    }
    return null;
  }

  /**
   * loads task by importPath and creates its custom Web Component
   */
  createTaskInstance(module: TaskModule, finishCb?: TaskFinishCallback): Task {
    const { default: TaskConstructor } = this.taskResolverContext(module.importPath) as { default: typeof Task };

    if (!finishCb) {
      finishCb = (time, success) => {
        console.log(`TaskManager: task ${module.name} finished`, { time, success });
      };
    }
    return new TaskConstructor({ finishCb });
  }
}

export const TaskManger = new TaskManagerClass();
