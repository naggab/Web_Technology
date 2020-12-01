import "./components/button";

import { TaskManger, TaskModule } from "./taskManager";

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

  const tasks = TaskManger.getTasks();

  /**
   * unmounts any previous task before creating and mounting a new task
   */
  function mountTask(module: TaskModule) {
    const instance = TaskManger.createTaskInstance(module, (duration, success) => {
      if (success) {
        alert(`task ${module.name} finished in ${duration}ms. Success: ${success}`);
      }
      taskWrapper.innerHTML = "";
    });
    taskWrapper.innerHTML = "";
    taskWrapper.appendChild(instance);
  }

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
    const task = TaskManger.findTask(taskName);
    if (task) {
      mountTask(task);
    }
  }
}

window.addEventListener("load", () => {
  main();
});
