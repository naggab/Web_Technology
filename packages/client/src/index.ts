/**
 * defines name and importPath of one Task
 */
interface TaskModule {
  name: string;
  importPath: string;
}

const taskResolverContext = require.context("./tasks/", true, /\.\/[^\/]+\/index.ts$/);

/**
 * Resolves all importable tasks by looking for folders inside ./tasks containing a index.ts file
 */
function resolveTasks(): TaskModule[] {
  const importPaths = taskResolverContext.keys();
  return importPaths.map((importPath) => ({
    importPath,
    name: importPath.substring(2, importPath.length - "/index.ts".length),
  }));
}

/**
 * looks for a task inside a Array<TaskModule> by name
 */
function findTask(tasks: TaskModule[], name: string): TaskModule | null {
  for (let task of tasks) {
    if (task.name === name) {
      return task;
    }
  }
  return null;
}

/**
 * loads task by importPath and creates its custom Web Component
 */
function createTaskInstance(module: TaskModule) {
  taskResolverContext(module.importPath);
  return document.createElement(module.name);
}

/**
 * unmounts any previous task before creating and mounting a new task
 */
function mountTask(module: TaskModule) {
  const instance = createTaskInstance(module);
  taskWrapper.innerHTML = "";
  taskWrapper.appendChild(instance);
}

const linkCollection = document.createElement("div");
const taskWrapper = document.createElement("div");

function main() {
  linkCollection.setAttribute(
    "style",
    `
  height: 44px; 
  display: flex; 
  justify-content: space-around;
   align-items: center
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

  const tasks = resolveTasks();

  // create links in the 'LinkCollection' for every found task
  for (let task of tasks) {
    const link = document.createElement("a");
    link.onclick = () => {
      mountTask(task);
    };
    link.href = `#${task.name}`;
    link.innerText = task.name;
    linkCollection.appendChild(link);
  }

  // check if task is already selected by hash in url
  if (window.location.hash) {
    const taskName = window.location.hash.substring(1);
    const task = findTask(tasks, taskName);
    if (task) {
      mountTask(task);
    }
  }
}

window.addEventListener("load", () => {
  main();
});
