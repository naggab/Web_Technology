import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";

var modInstance: MasterOfDisaster;

export default class DragAndDropTask extends Task {
  backButton: Button;
  serverResponseSpan: HTMLSpanElement;
  dropZone: HTMLDivElement;
  taskContainer: HTMLDivElement;
  result: any = [false, ""];
  selectedFile: any;
  filesArray: Array<[string, string]> = [];
  constructor(props) {
    super(props);
    this.onDrop = this.onDrop.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.backButton = this.shadowRoot.getElementById("back-button") as Button;
    this.serverResponseSpan = this.shadowRoot.getElementById("test") as HTMLSpanElement;
    this.dropZone = this.shadowRoot.getElementById("drop-zone") as HTMLDivElement;
    this.taskContainer = this.shadowRoot.getElementById("root-drag-and-drop") as HTMLDivElement;

    //for later using random seed to determine how many files will be picked!
    //add data
    var dateTime = new Date().getTime();
    this.filesArray.push(
      ["hello.txt", "Yes you downloaded the correct file! " + dateTime],
      ["bye.txt", "The file says goodbye! " + dateTime],
      ["hallo.txt", "Das ist richtig " + dateTime],
      ["adios.txt", "File es correcto " + dateTime],
    );
    modInstance = MasterOfDisaster.getInstance();
    var randomSeed = modInstance.getGameSeed();
    modInstance.log("random", randomSeed, randomSeed % this.filesArray.length);
    this.selectedFile = this.filesArray[randomSeed % this.filesArray.length];

    this.dropZone.innerHTML =
      modInstance.getString().drag_and_drop_task.task_msg_1 +
      "'" +
      this.selectedFile[0] +
      "'" +
      modInstance.getString().drag_and_drop_task.task_msg_2;

    this.taskContainer.addEventListener("drop", (e) => {
      e.preventDefault();
    }); //disable browser default drop, outside drop zone
    this.taskContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
    }); //disable browser default drop, outside drop zone
    this.taskContainer.addEventListener("dragleave", (e) => {
      e.preventDefault();
    }); //disable browser default drop, outside drop zone

    this.dropZone.addEventListener("dragover", (e) => {
      e.preventDefault(); //disable automatic browser preview
      //fill background gray
      modInstance.log("dragover");
      this.dropZone.style.border = "4px solid";
    });
    this.dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault(); //disable automatic browser preview
      //fill background gray
      modInstance.log("dragleave");
      this.dropZone.style.border = "4px dashed";
    });
    this.dropZone.addEventListener("drop", this.onDrop);

    this.backButton.addEventListener("click", this.onClick);
  }
  async onDrop(e: DragEvent) {
    e.preventDefault(); //disable automatic browser preview
    modInstance.log("dropped");
    var files = e.dataTransfer.files;
    this.result = await checkUpload(files, this.selectedFile);
    this.dropZone.style.background = this.result[0] ? "green" : "red";
    this.dropZone.innerHTML = this.result[1].toString();
    this.dropZone.removeEventListener("drop", this.onDrop);
    this.backButton.removeEventListener("click", this.onClick);
    this.backButton.style.display = "none";

    this.finish(this.result[0], 1);
  }
  onClick(e: Event) {
    download(this.selectedFile);
    this.backButton.removeEventListener("click", this.onClick);
    this.backButton.style.display = "none";
  }

  onUnmounting(): void | Promise<void> {}
}
function download(file: [string, string]) {
  //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server

  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(file[1]));
  element.setAttribute("download", file[0]);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
async function checkUpload(files: FileList, download: [string, string]) {
  var fileContents;
  var name;
  //for loop for later purposes (eg multiple file upload)
  for (var file of files) {
    name = file.name;
    try {
      fileContents = await readUploadedFileAsText(file);
    } catch (e) {}
    if (fileContents == download[1]) {
      //&& name == download[0]) {
      return [true, modInstance.getString().drag_and_drop_task.check_win_msg];
    } /* else if (fileContents != download[1] && name == download[0]) {
      return [false, "Nope, correct file name. Wrong content."];
    } else if (name != download[0] && fileContents == download[1]) {
      return [false, "Nope, wrong file name. Correct content."];
    }*/
    return [false, modInstance.getString().drag_and_drop_task.check_fail_msg];
  }
}

const readUploadedFileAsText = (inputFile) => {
  const temporaryFileReader = new FileReader();
  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };
    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};
customElements.define("drag-and-drop-task", DragAndDropTask);
