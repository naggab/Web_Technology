import templateHTML from "./template.html";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { TaskIdentifier, TaskManger } from "../../taskManager";

export class TaskOpener extends HTMLElement {
  wrapper_: HTMLDivElement;
  backdrop_: HTMLDivElement;
  container_: HTMLDivElement;

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = templateHTML;
    this.openTask = this.openTask.bind(this);

    this.wrapper_ = this.shadowRoot.querySelector(".task-opener-wrapper");
    this.backdrop_ = this.shadowRoot.querySelector(".task-opener-backdrop");
    this.container_ = this.shadowRoot.querySelector(".task-opener-container");
  }

  private animateFadeIn() {
    document.body.style.overflow = "hidden";
    this.wrapper_.classList.add("open");
    setTimeout(() => {
      this.backdrop_.classList.add("open");
      this.container_.classList.add("open");
      this.backdrop_.onclick = this.abortTask.bind(this);
    }, 50);
  }

  private animateFadeOut() {
    this.container_.addEventListener(
      "transitionend",
      () => {
        this.wrapper_.classList.remove("open");
        document.body.style.overflow = "";
        this.backdrop_.onclick = undefined;
        this.container_.innerHTML = "";
      },
      { once: true },
    );
    this.backdrop_.classList.remove("open");
    this.container_.classList.remove("open");
  }

  openTask(taskId: TaskIdentifier): Promise<{ duration: number; success: boolean }> {
    return new Promise<{ duration: number; success: boolean }>((resolve, reject) => {
      const task = TaskManger.createTaskInstance(taskId, (duration, success) => {
        if (this.container_.classList.contains("open")) {
          this.animateFadeOut();
        }

        resolve({ duration, success });
      });
      this.container_.innerHTML = "";
      this.container_.appendChild(task);
      this.animateFadeIn();
    });
  }

  abortTask() {
    this.animateFadeOut();
  }

  disconnectedCallback() {
    const mod = MasterOfDisaster.getInstance();
    mod.onTaskNeedsToBeOpened = undefined;
  }
}

customElements.define("task-opener", TaskOpener);
