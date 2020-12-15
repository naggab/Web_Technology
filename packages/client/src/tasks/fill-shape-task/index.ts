import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";

export default class FillShapeTask extends Task {
  canvasElement: HTMLCanvasElement;
  button: Button;
  test: boolean;
  ctx: CanvasRenderingContext2D;
  radius=80;
  pen_thickness = 20;
  count_pixel=0;
  count_total=0;
  fill_shape = 0.0;
  circle:Circle;
  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.button = this.shadowRoot.getElementById("load-button") as Button;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    const rect = this.canvasElement.getBoundingClientRect(); //get radius according to html spec

    //center canvas drawing panel
    ctx.translate(rect.width / 2, rect.height / 2);
    console.log(rect.width,rect.height);
    this.circle = new Circle(ctx,0,0,60);
    this.circle.DrawCircle();
    const rect_1 = new Rectangle(ctx,-100,-100,-90,-90).DrawRectangle();
    const rect_2 = new Rectangle(ctx,100,-100,-80,80).DrawRectangle();
    const rect_3 = new Rectangle(ctx,-150,180,-60,300).DrawRectangle();

    this.fill_shape = Math.floor(Math.random() * 100);
    this.button.setAttribute("label","Fill: "+(this.fill_shape)+"%")

    this.test = false;
    //line thickness
    ctx.lineWidth = this.pen_thickness;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = "round"; //round line edge
    
    this.canvasElement.addEventListener("mousemove", this.onMouseMove);
    this.canvasElement.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      this.test = true;
      const relativeMousePos = this.getMousePos(this.canvasElement, e);
      //start stroke (path)
      //ctx.strokeStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(relativeMousePos.x, relativeMousePos.y);
    });
    this.canvasElement.addEventListener("mouseup", (e) => {
      console.log("mouseup");
      //end stroke (path)
      ctx.closePath();
      this.test = false;
     
    });
    this.button.addEventListener("click",(c)=>{
       //calc pixels
       
      const offset_x = Math.trunc(rect.width/2-this.radius);
      const offset_y = Math.trunc(rect.width/2);
      //const offset_y = Math.trunc(rect.width/2);
      //check pixel color in shape:
      for(var _y=0; _y<this.radius*2; _y+=2){
        var new_x = Math.trunc(Math.sqrt(Math.pow(this.radius,2)-Math.pow(_y,2)));
        for(var _x=0; _x<(2*new_x); _x+=2)
        {
          //console.log(_x,_y)
          //console.log(this.ctx.getImageData(offset_x+_x,offset_y+_y,1,1).data,new_x,_x) //down
          //console.log(this.ctx.getImageData(offset_x+_x,offset_y-_y,1,1).data,new_x,_x) //up
          
          const color_up = this.ctx.getImageData(offset_x+_x,offset_y-_y,1,1).data[3];
          const color_down = this.ctx.getImageData(offset_x+_x,offset_y+_y,1,1).data[3];
          //check if color changed up or down
          if(color_up==255){
            this.count_pixel++;
          }
          if(color_down==255){
            this.count_pixel++;
          }
          this.count_total+=2 //up and down;
        } 
      }
      var z = this.circle.calcPixelsFilled()
      console.log(z.filled,z.total);
      /*
      this.count_pixel = z.filled;
      this.count_total = z.total;*/
      var percentage_check = (this.count_pixel/this.count_total)*100; 
      console.log(percentage_check,"Drawn: ",this.count_pixel,"Total:",this.count_total);
      if(percentage_check>(this.fill_shape-5) && percentage_check<(this.fill_shape+5)){
      
        alert("("+percentage_check+") You did it!!!")
      }
      else{
        alert("("+percentage_check+") Nice try")
        
      }
      this.count_pixel = 0;
      this.count_total = 0;
    });
  }
  onUnmounting(): void | Promise<void> {}

  onMouseMove(e: MouseEvent) {
    
    if (this.test) {
      const { ctx, getMousePos,circle} = this;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const relativeMousePos = getMousePos(this.canvasElement, e);
      ctx.lineTo(relativeMousePos.x, relativeMousePos.y);
      ctx.stroke();
      //console.log("Abs mous pos",clientX, clientY);
      //console.log("Rel mous pos",relativeMousePos.x, relativeMousePos.y);
      //console.log("seeet",this.help_arr.length)
      //console.log("Percantage covered:",(this.help_arr.length/(this.no_sqares))*100,"%")
      //check if mouse is in shape or not. easy with vector length
      if(circle.isDrawnOutside(relativeMousePos)){
        console.log("Inside");
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
}*/
class Circle {
  ctx: CanvasRenderingContext2D;
  posX:number;
  posY:number;
  radius:number;
  lineWidth = 1;
  strokeStyle = '#ff0000';
  
  constructor(canvasElement: CanvasRenderingContext2D, posX:number, posY:number, radius:number) {
    this.ctx = canvasElement;
    this.posX = posX;
    this.posY = posY;
    this.radius = radius;
    
  }
  DrawCircle()
  {
    const { ctx,radius,posX,posY,lineWidth,strokeStyle} = this;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle
    ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
  }
  calcPixelsFilled(){
    var countPixel = 0;
    var countTotalPixel = 0;
    const offsetX = 402.33/2-this.radius;
    const offsetY = 400/2;

    for(var _y=0; _y<this.radius*2; _y+=2){
      var newX = Math.trunc(Math.sqrt(Math.pow(this.radius,2)-Math.pow(_y,2)));
      for(var _x=0; _x<(2*newX); _x+=2){
        //console.log(_x,_y)
        //console.log(this.ctx.getImageData(offsetX+_x,offsetY+_y,1,1).data,newX,_x) //down
        //console.log(this.ctx.getImageData(offsetX+_x,offsetY-_y,1,1).data,newX,_x) //up
        const color_up = this.ctx.getImageData(offsetX+_x,offsetY-_y,1,1).data[3];
        const color_down = this.ctx.getImageData(offsetX+_x,offsetY+_y,1,1).data[3];
        //check if color changed up or down
        if(color_up==255){
          countPixel++;
        }
        if(color_down==255){
          countPixel++;
        }
        countTotalPixel+=2 //up and down;
      } 
    }
    return {total:countTotalPixel,filled:countPixel}
  }
  isDrawnOutside(relativeMousePos){
    return (Math.hypot(relativeMousePos.x, relativeMousePos.y)<this.radius) ? true: false;
  }
}
class Rectangle {
  ctx: CanvasRenderingContext2D;
  posX:number;
  posY:number;
  height:number;
  width:number;
  lineWidth = 1;
  strokeStyle = '#ff0000';

  constructor(canvasElement: CanvasRenderingContext2D, posX:number, posY:number, height:number, width:number) {
    this.ctx = canvasElement;
    this.posX = posX;
    this.posY = posY;
    this.height = height;
    this.width = width;
  }
  DrawRectangle()
  {
    const { ctx,posX,posY,width,height, lineWidth, strokeStyle} = this;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.rect(posX,posY,width,height);
    ctx.closePath();
    ctx.stroke();
  }
}
