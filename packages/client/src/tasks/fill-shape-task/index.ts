import viewHtml from "./view.html";
import { Task } from "../../task";

export default class FillShapeTask extends Task {
  canvasElement: HTMLCanvasElement;
  test: boolean;
  ctx: CanvasRenderingContext2D;
  radius=80;
  pen_thickness = 20;
  arr_squares = [[]]
  no_sqares=0
  help_arr =[]
  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    const rect = this.canvasElement.getBoundingClientRect(); //get size according to html spec

    //center canvas drawing panel
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    
    //For mathematical purposes
    /*
    var arr_y = []; 
    for (var _x = -this.radius; _x < this.radius; _x++) {
      arr_y.push(Math.sqrt(Math.pow(this.radius,2)-Math.pow(_x,2)))
     
    }
    console.log(arr_y);
    */
    // bezierCurveTo to draw curves
    //ctx.fillStyle = '#8ED6FF';
    //ctx.fill();
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 1;
    //fill shape with squares -> remeber pos of each square.
    /*
    for(var _h = this.pen_thickness; _h<=this.radius; _h+=this.pen_thickness){
      for (var _i=-this.radius;_i<=this.radius;_i+=this.pen_thickness){
        //just for visualization: the squares are only saved in an array
        ctx.strokeRect(_i,0,this.pen_thickness,this.pen_thickness);
        arr_shapes.push([_i,_h]) 
      }
    }
    console.log(arr_shapes)
    */

   //get all squares: (negative + positive)

   this.no_sqares = Math.PI*Math.pow(80,2)/(Math.pow(this.pen_thickness,2));
   console.log(this.no_sqares);
   for(var row=(-this.radius); row<=this.radius; row+=this.pen_thickness){
     console.log("here")
     for(var col=(-this.radius); col<=this.radius; col+=this.pen_thickness){
       if(row!=0 && col!=0){
        this.arr_squares.push([row,col])
       }
       
     }
   }
   console.log(this.arr_squares)

    this.test = false;
    //line thickness
    ctx.lineWidth = this.pen_thickness;
    ctx.lineCap = "round"; //round line edge
    this.canvasElement.addEventListener("mousemove", this.onMouseMove);
    this.canvasElement.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      this.test = true;
      const relativeMousePos = this.getMousePos(this.canvasElement, e);
      //start stroke (path)
      ctx.beginPath();
      ctx.moveTo(relativeMousePos.x, relativeMousePos.y);
    });
    this.canvasElement.addEventListener("mouseup", (e) => {
      console.log("mouseup");
      //end stroke (path)
      ctx.closePath();
      this.test = false;
    });
  }
  onUnmounting(): void | Promise<void> {}

  onMouseMove(e: MouseEvent) {
    
    if (this.test) {
      const { ctx, getMousePos } = this;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const relativeMousePos = getMousePos(this.canvasElement, e);
      ctx.lineTo(relativeMousePos.x, relativeMousePos.y);
      ctx.stroke();
      //console.log("Abs mous pos",clientX, clientY);
      console.log("Rel mous pos",relativeMousePos.x, relativeMousePos.y);
      console.log("seeet",this.help_arr.length)
      console.log("Percantage covered:",(this.help_arr.length/(this.no_sqares))*100,"%")
      //check if mouse is in shape or not. easy with vector length
      if(Math.hypot(relativeMousePos.x, relativeMousePos.y)<this.radius){
        console.log("Inside");
        //check if in test row 
      
      console.log("count squares", this.help_arr.length)
        for(var index=0; index < this.arr_squares.length ;index++)
        {
          //up, yes up is negative :(
          if(relativeMousePos.y <=0 && relativeMousePos.y <= this.arr_squares[index][0] && relativeMousePos.x <= this.arr_squares[index][1])
          {
            
            this.help_arr.push(this.arr_squares[index])
            this.arr_squares.splice(index, 1);

            //log the squares currently visting
            console.log(this.arr_squares[index][0],this.arr_squares[index][1])
            break;
          }
          //down
          if(relativeMousePos.y > 0 && relativeMousePos.y <= this.arr_squares[index][0] && relativeMousePos.x <= this.arr_squares[index][1])
          {
            this.help_arr.push(this.arr_squares[index])
            this.arr_squares.splice(index, 1);
            //log the squares currently visting
            console.log(this.arr_squares[index][0],this.arr_squares[index][1])
            break;
          }

        }
      }
       
      
      else{
        console.log("Outside");
      }
    }
  }
  //Get Mouse Position
  // let m = new Mouse(this.canvasElement);
  // m.startTracking(this.canvasElement);
  
  getMousePos(canvas: HTMLCanvasElement, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - (rect.left + rect.width / 2),
      y: evt.clientY - (rect.top + rect.height / 2),
    };
  }
}

customElements.define("fill-shape-task", FillShapeTask);
/*
class Mouse {
  canvasElement: HTMLCanvasElement;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;
  }
  startTracking(canvasElement) {
    var clientX = 0.0;
    var clientY = 0.0;
    var test = false;
    canvasElement.addEventListener("mousemove", function (e) {
      if (test) {
        clientX = e.clientX;
        clientY = e.clientY;
        console.log(clientX, clientY);
        console.log(canvasElement.isPointInPath(clientX, clientY)?"yeah":"nope");
      }
    });
    canvasElement.addEventListener("mousedown", function (e) {
      console.log("mousedown");
      test = true;
    });
    canvasElement.addEventListener("mouseup", function (e) {
      console.log("mouseup");
      test = false;
    });
  }
}
class Timer {} */
