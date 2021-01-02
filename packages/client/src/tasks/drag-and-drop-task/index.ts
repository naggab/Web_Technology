import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";


const filesArray: Array<[string,string]> = [];
const randomSeed: number = Math.floor(Math.random() * 100); 

export default class DragAndDropTask extends Task {
    backButton: Button;
    serverResponseSpan: HTMLSpanElement;
    dropZone: HTMLDivElement;
    result: any;

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.backButton = this.shadowRoot.getElementById("back-button") as Button;
    this.serverResponseSpan = this.shadowRoot.getElementById("test") as HTMLSpanElement;
    this.dropZone  =this.shadowRoot.getElementById("drop-zone") as HTMLDivElement;
   
    //for later using random seed to determine how many files will be picked!
    //add data
    filesArray.push(["hello.txt","Yes you downloaded the correct file!"],["bye.txt","The file says goodbye!"])
    this.dropZone.innerHTML = "Drag and Drop file '"+filesArray[0][0]+"' from Downloads";
    this.backButton.hidden = true;

    this.dropZone.addEventListener("dragover",(e) => {
        e.preventDefault(); //disable automatic browser preview
        //fill background gray
        console.log("dragover");
        this.dropZone.style.border = "4px solid"
    });
    this.dropZone.addEventListener("dragleave",(e) => {
        e.preventDefault(); //disable automatic browser preview
        //fill background gray
        console.log("dragleave");
        this.dropZone.style.border = "4px dashed"
    });
    this.dropZone.addEventListener("drop", async (e) => {
        e.preventDefault(); //disable automatic browser preview
        
        console.log("dropped");
        var files = e.dataTransfer.files;

        this.result = await checkUpload(files,filesArray[0]);
    
        this.dropZone.style.background = this.result[0]?"green":"red";
        this.dropZone.innerHTML = this.result[1].toString();
        this.backButton.hidden = false;

      
        });
    this.backButton.addEventListener("click", (e)=>{
        this.finish(this.result[0]);;
    })
    //download(filesArray[0]);
  }

  onUnmounting(): void | Promise<void> {}
}
function download(file:[string,string]) {
    //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file[1]));
    element.setAttribute('download', file[0]);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
    console.log("here")
  }
async function checkUpload(files: FileList,download:[string,string]){
    var fileContents;
    var name;
    //for loop for later purposes (eg multiple file upload)
    for (var file of files){            
        name = file.name;
        try {
            fileContents = await readUploadedFileAsText(file)  
            console.log("heejrjeje",fileContents)
        } catch (e) {}
        console.log(fileContents,download[1],name,download[0])
        if(fileContents==download[1] && name == download[0]){
            return [true,"Congrats, you did it!"]
        }
        return [false,"Nope, wrong file."]
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
