import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { concat, times } from "lodash";
import { Collection } from "konva/types/Util";
import { MasterOfDisaster } from "../../masterOfDisaster";

interface ShapeI {
  checkOutside(relativeMousePos: any);
  draw();
  checkFillStatus();
}

type ShapeConstructor = new (
  canvasElement: CanvasRenderingContext2D,
  cnt_max_px_outside: number,
  cnt_max_outside: number,
  fill_shape: number,
  canvasPx: number,
  tolerancePx: number,
) => ShapeI;

const shapes: Array<ShapeConstructor> = [];
const fillArry: Array<number> = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export default class FillShapeTask extends Task {
  canvasElement: HTMLCanvasElement;
  infoElement: HTMLElement;
  checkButton: Button;
  flagMouseDown: boolean;
  ctx: CanvasRenderingContext2D;
  pen_thickness = 20;
  cnt_button_clicks = 0;
  shape: ShapeI;
  tupleResult: any;

  constructor(props) {
    super(props);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.canvasElement = this.shadowRoot.getElementById("myCanvas") as HTMLCanvasElement;
    this.infoElement = this.shadowRoot.querySelector(".info") as HTMLElement;
    this.checkButton = this.shadowRoot.getElementById("check-button") as Button;
    this.ctx = this.canvasElement.getContext("2d");
    const ctx = this.ctx;
    const canvasPanel = this.canvasElement.getBoundingClientRect(); //get size according to html spec

    var seed = MasterOfDisaster.getInstance().getGameSeed();
    this.infoElement.innerHTML = "Fill: " + fillArry[seed % fillArry.length] + "%";

    shapes.push(Smiley, Pyramid, Tree, Cactus);
    //this.shape = new shapes[seed % shapes.length](this.ctx, 100, 5, fillArry[seed % fillArry.length], 400, 10);
    this.shape = new shapes[3](this.ctx, 100, 5, fillArry[seed % fillArry.length], 400, 5);
    this.shape.draw();

    this.flagMouseDown = false;
    //line thickness
    ctx.lineWidth = this.pen_thickness;
    ctx.strokeStyle = "#000000";
    ctx.lineCap = "round"; //round line edge

    this.canvasElement.addEventListener("mousemove", this.onMouseMove);
    this.canvasElement.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      this.flagMouseDown = true;
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
      this.flagMouseDown = false;
    });
    this.checkButton.addEventListener("click", (c) => {
      c.preventDefault();
      console.log("button", this.cnt_button_clicks);
      if (this.cnt_button_clicks == 0) {
        this.tupleResult = this.shape.checkFillStatus(); //returns [bool,message]
        this.infoElement.innerHTML = this.tupleResult[1];
      } else {
        this.finish(this.tupleResult[0],1);
      }
      this.infoElement.style.color = this.tupleResult[0] ? "green" : "red";
      this.checkButton.setAttribute("label", "Back");

      this.cnt_button_clicks++;
    });
  }
  onUnmounting(): void | Promise<void> {}

  onMouseMove(e: MouseEvent) {
    if (this.flagMouseDown) {
      // e.buttons === 1
      const { ctx, getMousePos } = this;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const relativeMousePos = getMousePos(this.canvasElement, e);
      ctx.lineTo(relativeMousePos.x, relativeMousePos.y);
      ctx.stroke();

      //remove event listener in case of violation against in-game rules
      if (typeof this.shape.checkOutside(relativeMousePos) !== "undefined") {
        this.infoElement.innerHTML = this.shape.checkOutside(relativeMousePos)[1];
        this.infoElement.style.color = "red";
        this.checkButton.setAttribute("label", "Back");
        this.canvasElement.removeEventListener("mousemove", this.onMouseMove);
        //to activate exit
        this.cnt_button_clicks++;
        this.tupleResult = [false, ""];
      }
    }
  }
  //Get Mouse Position
  // let m = new Mouse(this.canvasElement);
  // m.startTracking(this.canvasElement);

  getMousePos(canvas: HTMLCanvasElement, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }
}

customElements.define("fill-shape-task", FillShapeTask);
class Circle {
  ctx: CanvasRenderingContext2D;
  posX: number;
  posY: number;
  radius: number;
  pixelSamplingRate: number; //in otder to recalc colored pixel since other shape are sampled pixel wise
  lineWidth = 1;
  fillStyle = "#fff000";

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number, radius: number, pixelSamplingRate: number) {
    this.ctx = ctx;
    this.posX = posX;
    this.posY = posY;
    this.radius = radius;
    this.pixelSamplingRate = pixelSamplingRate;
  }
  DrawCircle() {
    const { ctx, radius, posX, posY, lineWidth, fillStyle: fillStyle } = this;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = fillStyle;
    ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.stroke();
  }
  calcPixelsFilled() {
    var countPixel = 0;
    var countTotalPixel = 0;
    const offsetX = this.posX - this.radius;
    const offsetY = this.posY;

    for (var _y = 0; _y < this.radius * 2; _y += this.pixelSamplingRate) {
      var newX = Math.trunc(Math.sqrt(Math.pow(this.radius, 2) - Math.pow(_y, 2)));
      for (var _x = 0; _x < 2 * newX; _x += this.pixelSamplingRate) {
        //console.log(_x,_y)
        //console.log(this.ctx.getImageData(offsetX+_x,offsetY+_y,1,1).data,newX,_x) //down
        //console.log(this.ctx.getImageData(offsetX+_x,offsetY-_y,1,1).data,newX,_x) //up
        const color_up = this.ctx.getImageData(offsetX + _x, offsetY - _y, 1, 1).data;
        const color_down = this.ctx.getImageData(offsetX + _x, offsetY + _y, 1, 1).data;
        //check if color changed up or down
        if (color_up[1] == 0 && color_up[2] == 0 && color_up[3] == 255) {
          countPixel++;
        }
        if (color_down[1] == 0 && color_down[2] == 0 && color_down[3] == 255) {
          countPixel++;
        }
        countTotalPixel += 2; //up and down;
        //countTotalPixel+=Math.pow(this.pixelSamplingRate,this.pixelSamplingRate);
      }
    }

    return {
      totalPixel: countTotalPixel * Math.pow(this.pixelSamplingRate, 2),
      coloredPixel: countPixel * Math.pow(this.pixelSamplingRate, 2),
    };
  }
  isDrawnInside(relativeMousePos) {
    return Math.pow(relativeMousePos.x - this.posX, 2) + Math.pow(relativeMousePos.y - this.posY, 2) <
      Math.pow(this.radius, 2)
      ? true
      : false;
  }
}
class Rectangle {
  ctx: CanvasRenderingContext2D;
  posX: number = 0.0;
  posY: number = 0.0;
  height: number;
  width: number;
  lineWidth = 1;
  fillStyle = "#fff000";

  constructor(canvasElement: CanvasRenderingContext2D, posX: number, posY: number, height: number, width: number) {
    this.ctx = canvasElement;
    this.posX = posX;
    this.posY = posY;
    this.height = height;
    this.width = width;
  }

  drawRectangle() {
    const { ctx, posX, posY, width, height, lineWidth, fillStyle: fillStyle } = this;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(posX, posY, width, height);
    ctx.closePath();
    ctx.stroke();
  }
  calcPixelsFilled() {
    const { ctx, posX, posY, width, height, lineWidth, fillStyle: strokeStyle } = this;
    var data = ctx.getImageData(posX, posY, width - 1, height - 1).data;
    var countPixel = 0;
    var countTotalPixel = 0;

    for (var _i = 0; _i < data.length; _i += 4) {
      if (data[_i + 1] == 0 && data[_i + 2] == 0 && data[_i + 3] == 255) {
        countPixel++;
      }
      countTotalPixel++;
    }
    return { totalPixel: countTotalPixel, coloredPixel: countPixel };
  }
  isDrawnInside(relativeMousePos) {
    return relativeMousePos.x > this.posX &&
      relativeMousePos.x < this.posX + this.width &&
      relativeMousePos.y > this.posY &&
      relativeMousePos.y < this.posY + this.height
      ? true
      : false;
  }
}
class Smiley implements ShapeI {
  ctx: CanvasRenderingContext2D;
  circle: Circle;
  rect_1: Rectangle;
  rect_2: Rectangle;
  rect_3: Rectangle;
  cnt_max_px_outside: number;
  cnt_max_outside: number;
  flagOutside = true;
  fill_shape: number;
  canvasPx: number;
  tolerance: number;

  constructor(
    canvasElement: CanvasRenderingContext2D,
    cnt_max_px_outside: number,
    cnt_max_outside: number,
    fill_shape: number,
    canvasPx: number,
    tolerance: number,
  ) {
    this.ctx = canvasElement;
    this.cnt_max_px_outside = cnt_max_px_outside;
    this.cnt_max_outside = cnt_max_outside;
    this.fill_shape = fill_shape;
    this.canvasPx = canvasPx;
    this.tolerance = tolerance;
  }
  draw() {
    this.circle = new Circle(this.ctx, 200, 200, 60, 2);
    this.circle.DrawCircle();
    this.rect_1 = new Rectangle(this.ctx, 20, 20, 90, 90);
    this.rect_1.drawRectangle();
    this.rect_2 = new Rectangle(this.ctx, 300, 20, 80, 80);
    this.rect_2.drawRectangle();
    this.rect_3 = new Rectangle(this.ctx, 50, 280, 60, 300);
    this.rect_3.drawRectangle();
  }
  checkOutside(relativeMousePos: any) {
    if (
      this.circle.isDrawnInside(relativeMousePos) ||
      this.rect_1.isDrawnInside(relativeMousePos) ||
      this.rect_2.isDrawnInside(relativeMousePos) ||
      this.rect_3.isDrawnInside(relativeMousePos)
    ) {
      this.flagOutside = false;
    } else {
      if (!this.flagOutside) {
        this.flagOutside = true;

        this.cnt_max_outside--;
      }
      if (this.cnt_max_px_outside < 0) {
        return [true, "Woops, too many  pixels colored outside."];
      }
      if (this.cnt_max_outside < 0) {
        return [true, "Woops, too many times colored outside."];
      }
      this.cnt_max_px_outside--;
    }
  }
  checkFillStatus() {
    var outCircle = this.circle.calcPixelsFilled();
    var outRect1 = this.rect_1.calcPixelsFilled();
    var outRect2 = this.rect_2.calcPixelsFilled();
    var outRect3 = this.rect_3.calcPixelsFilled();

    /*
    console.log("Circle", outCircle.coloredPixel, outCircle.totalPixel);
    console.log("Rectangle_left", outRect1.coloredPixel, outRect1.totalPixel);
    console.log("Rectangle_right", outRect2.coloredPixel, outRect2.totalPixel);
    console.log("Rectangle_bottom", outRect3.coloredPixel, outRect3.totalPixel);

    this.count_pixel = z.filled;
    this.count_total = z.total;*/
    var percentage_check =
      ((outCircle.coloredPixel + outRect1.coloredPixel + outRect2.coloredPixel + outRect3.coloredPixel) /
        (outCircle.totalPixel + outRect1.totalPixel + outRect2.totalPixel + outRect3.totalPixel)) *
      100;
    console.log(
      percentage_check,
      "Drawn: ",
      outCircle.coloredPixel + outRect1.coloredPixel + outRect2.coloredPixel + outRect3.coloredPixel,
      "Total:",
      outCircle.totalPixel + outRect1.totalPixel + outRect2.totalPixel + outRect3.totalPixel,
    );
    if (percentage_check > this.fill_shape - 5 && percentage_check < this.fill_shape + 5) {
      return [
        true,
        "You did it! (" + Math.trunc(percentage_check) + "% / " + this.fill_shape + "%, +/-" + this.tolerance + "%)",
      ];
    } else {
      return [
        false,
        "Nope. Nice Try. (" +
          Math.trunc(percentage_check) +
          "% / " +
          this.fill_shape +
          "%, +/-" +
          this.tolerance +
          "%)",
      ];
    }
  }
}

class Pyramid implements ShapeI {
  ctx: CanvasRenderingContext2D;
  rect_1: Rectangle;
  rect_2: Rectangle;
  rect_3: Rectangle;
  rect_4: Rectangle;
  cnt_max_px_outside: number;
  cnt_max_outside: number;
  flagOutside = true;
  fill_shape: number;
  canvasPx: number;
  tolerance: number;

  constructor(
    canvasElement: CanvasRenderingContext2D,
    cnt_max_px_outside: number,
    cnt_max_outside: number,
    fill_shape: number,
    canvasPx: number,
    tolerance: number,
  ) {
    this.ctx = canvasElement;
    this.cnt_max_px_outside = cnt_max_px_outside;
    this.cnt_max_outside = cnt_max_outside;
    this.fill_shape = fill_shape;
    this.canvasPx = canvasPx;
    this.tolerance = tolerance;
  }
  draw() {
    this.rect_1 = new Rectangle(this.ctx, 175, 100, 60, 50);
    this.rect_1.drawRectangle();
    this.rect_2 = new Rectangle(this.ctx, 150, 160, 60, 100);
    this.rect_2.drawRectangle();
    this.rect_3 = new Rectangle(this.ctx, 100, 220, 60, 200);
    this.rect_3.drawRectangle();
    this.rect_4 = new Rectangle(this.ctx, 50, 280, 60, 300);
    this.rect_4.drawRectangle();
  }
  checkOutside(relativeMousePos: any) {
    if (
      this.rect_1.isDrawnInside(relativeMousePos) ||
      this.rect_2.isDrawnInside(relativeMousePos) ||
      this.rect_3.isDrawnInside(relativeMousePos) ||
      this.rect_4.isDrawnInside(relativeMousePos)
    ) {
      this.flagOutside = false;
    } else {
      if (!this.flagOutside) {
        this.flagOutside = true;

        this.cnt_max_outside--;
      }
      if (this.cnt_max_px_outside < 0) {
        //to do break in-game
        return [true, "Woops, too many  pixels colored outside."];
      }
      if (this.cnt_max_outside < 0) {
        return [true, "Woops, too many times colored outside."];
      }
      this.cnt_max_px_outside--;
    }
  }
  checkFillStatus() {
    var outRect1 = this.rect_1.calcPixelsFilled();
    var outRect2 = this.rect_2.calcPixelsFilled();
    var outRect3 = this.rect_3.calcPixelsFilled();
    var outRect4 = this.rect_4.calcPixelsFilled();

    console.log("Rectangle_left", outRect1.coloredPixel, outRect1.totalPixel);
    console.log("Rectangle_right", outRect2.coloredPixel, outRect2.totalPixel);
    console.log("Rectangle_bottom", outRect3.coloredPixel, outRect3.totalPixel);

    /*
    this.count_pixel = z.filled;
    this.count_total = z.total;*/
    var percentage_check =
      ((outRect1.coloredPixel + outRect2.coloredPixel + outRect3.coloredPixel + outRect4.coloredPixel) /
        (outRect1.totalPixel + outRect2.totalPixel + outRect3.totalPixel + outRect4.totalPixel)) *
      100;
    console.log(
      percentage_check,
      "Drawn: ",
      outRect1.coloredPixel + outRect2.coloredPixel + outRect3.coloredPixel + outRect4.coloredPixel,
      "Total:",
      outRect1.totalPixel + outRect2.totalPixel + outRect3.totalPixel + outRect4.totalPixel,
    );
    if (percentage_check > this.fill_shape - 5 && percentage_check < this.fill_shape + 5) {
      return [
        true,
        "You did it! (" + Math.trunc(percentage_check) + "% / " + this.fill_shape + "%, +/-" + this.tolerance + "%)",
      ];
    } else {
      return [
        false,
        "Nope. Nice Try. (" +
          Math.trunc(percentage_check) +
          "% / " +
          this.fill_shape +
          "%, +/-" +
          this.tolerance +
          "%)",
      ];
    }
  }
}
class Tree implements ShapeI {
  ctx: CanvasRenderingContext2D;
  rect_1: Rectangle;
  rect_2: Rectangle;
  rect_3: Rectangle;
  rect_4: Rectangle;
  rect_5: Rectangle;
  rect_6: Rectangle;
  cnt_max_px_outside: number;
  cnt_max_outside: number;
  flagOutside = true;
  fill_shape: number;
  canvasPx: number;
  tolerance: number;

  constructor(
    canvasElement: CanvasRenderingContext2D,
    cnt_max_px_outside: number,
    cnt_max_outside: number,
    fill_shape: number,
    canvasPx: number,
    tolerance: number,
  ) {
    this.ctx = canvasElement;
    this.cnt_max_px_outside = cnt_max_px_outside;
    this.cnt_max_outside = cnt_max_outside;
    this.fill_shape = fill_shape;
    this.canvasPx = canvasPx;
    this.tolerance = tolerance;
  }
  draw() {
    const color = "#0cae5b";
    this.rect_1 = new Rectangle(this.ctx, (this.canvasPx - 40) / 2, 20, 60, 40);
    this.rect_1.fillStyle = color;
    this.rect_1.drawRectangle();
    this.rect_2 = new Rectangle(this.ctx, (this.canvasPx - 120) / 2, this.rect_1.height + this.rect_1.posY, 60, 120);
    this.rect_2.fillStyle = color;
    this.rect_2.drawRectangle();
    this.rect_3 = new Rectangle(this.ctx, (this.canvasPx - 200) / 2, this.rect_2.height + this.rect_2.posY, 60, 200);
    this.rect_3.fillStyle = color;
    this.rect_3.drawRectangle();
    this.rect_4 = new Rectangle(this.ctx, (this.canvasPx - 250) / 2, this.rect_3.height + this.rect_3.posY, 60, 250);
    this.rect_4.fillStyle = color;
    this.rect_4.drawRectangle();
    this.rect_5 = new Rectangle(this.ctx, (this.canvasPx - 60) / 2, this.rect_4.height + this.rect_4.posY, 80, 60);
    this.rect_5.fillStyle = "#ab6134";
    this.rect_5.drawRectangle();
    this.rect_6 = new Rectangle(this.ctx, (this.canvasPx - 150) / 2, this.rect_5.height + this.rect_5.posY, 30, 150);
    this.rect_6.fillStyle = "#ab6134";
    this.rect_6.drawRectangle();
  }
  checkOutside(relativeMousePos: any) {
    if (
      this.rect_1.isDrawnInside(relativeMousePos) ||
      this.rect_2.isDrawnInside(relativeMousePos) ||
      this.rect_3.isDrawnInside(relativeMousePos) ||
      this.rect_4.isDrawnInside(relativeMousePos) ||
      this.rect_5.isDrawnInside(relativeMousePos) ||
      this.rect_6.isDrawnInside(relativeMousePos)
    ) {
      this.flagOutside = false;
    } else {
      if (!this.flagOutside) {
        this.flagOutside = true;

        this.cnt_max_outside--;
      }
      if (this.cnt_max_px_outside < 0) {
        //to do break in-game
        return [true, "Woops, too many pixels colored outside."];
      }
      if (this.cnt_max_outside < 0) {
        return [true, "Woops, too many times colored outside."];
      }
      this.cnt_max_px_outside--;
    }
  }
  checkFillStatus() {
    var outRect1 = this.rect_1.calcPixelsFilled();
    var outRect2 = this.rect_2.calcPixelsFilled();
    var outRect3 = this.rect_3.calcPixelsFilled();
    var outRect4 = this.rect_4.calcPixelsFilled();
    var outRect5 = this.rect_5.calcPixelsFilled();
    var outRect6 = this.rect_6.calcPixelsFilled();

    console.log("Rectangle_left", outRect1.coloredPixel, outRect1.totalPixel);
    console.log("Rectangle_right", outRect2.coloredPixel, outRect2.totalPixel);
    console.log("Rectangle_bottom", outRect3.coloredPixel, outRect3.totalPixel);

    /*
    this.count_pixel = z.filled;
    this.count_total = z.total;*/
    var percentage_check =
      ((outRect1.coloredPixel +
        outRect2.coloredPixel +
        outRect3.coloredPixel +
        outRect4.coloredPixel +
        outRect5.coloredPixel +
        outRect6.coloredPixel) /
        (outRect1.totalPixel +
          outRect2.totalPixel +
          outRect3.totalPixel +
          outRect4.totalPixel +
          outRect5.totalPixel +
          outRect6.totalPixel)) *
      100;
    console.log(
      percentage_check,
      "Drawn: ",
      outRect1.coloredPixel +
        outRect2.coloredPixel +
        outRect3.coloredPixel +
        outRect4.coloredPixel +
        outRect5.coloredPixel +
        outRect6.coloredPixel,
      "Total:",
      outRect1.totalPixel +
        outRect2.totalPixel +
        outRect3.totalPixel +
        outRect4.totalPixel +
        outRect5.totalPixel +
        outRect6.totalPixel,
    );
    if (percentage_check > this.fill_shape - 5 && percentage_check < this.fill_shape + 5) {
      return [
        true,
        "You did it! (" + Math.trunc(percentage_check) + "% / " + this.fill_shape + "%, +/-" + this.tolerance + "%)",
      ];
    } else {
      return [
        false,
        "Nope. Nice Try. (" +
          Math.trunc(percentage_check) +
          "% / " +
          this.fill_shape +
          "%, +/-" +
          this.tolerance +
          "%)",
      ];
    }
  }
}
class Cactus implements ShapeI {
  ctx: CanvasRenderingContext2D;
  middle: Rectangle;
  rightBranchTop: Rectangle;
  rightBranchBottom: Rectangle;
  rightBBLeave: Rectangle;
  leftBranchTop: Rectangle;
  leftBTLeave: Rectangle;
  rightBTLeave: Rectangle;
  root: Rectangle;
  cnt_max_px_outside: number;
  cnt_max_outside: number;
  flagOutside = true;
  fill_shape: number;
  canvasPx: number;
  tolerance: number;

  constructor(
    canvasElement: CanvasRenderingContext2D,
    cnt_max_px_outside: number,
    cnt_max_outside: number,
    fill_shape: number,
    canvasPx: number,
    tolerance: number,
  ) {
    this.ctx = canvasElement;
    this.cnt_max_px_outside = cnt_max_px_outside;
    this.cnt_max_outside = cnt_max_outside;
    this.fill_shape = fill_shape;
    this.canvasPx = canvasPx;
    this.tolerance = tolerance;
  }
  draw() {
    const color = "#0cae5b";
    this.middle = new Rectangle(this.ctx, (this.canvasPx - 80) / 2, 20, 300, 80);
    this.middle.fillStyle = color;
    this.middle.drawRectangle();

    this.rightBranchTop = new Rectangle(this.ctx, (this.canvasPx + this.middle.width) / 2, 80, 20, 120);
    this.rightBranchTop.fillStyle = color;
    this.rightBranchTop.drawRectangle();
    this.rightBTLeave = new Rectangle(
      this.ctx,
      (this.canvasPx + this.middle.width) / 2 + this.rightBranchTop.width - 50,
      this.rightBranchTop.posY - 40,
      40,
      50,
    );
    this.rightBTLeave.fillStyle = color;
    this.rightBTLeave.drawRectangle();

    this.rightBranchBottom = new Rectangle(this.ctx, (this.canvasPx + this.middle.width) / 2, 200, 20, 100);
    this.rightBranchBottom.fillStyle = color;
    this.rightBranchBottom.drawRectangle();
    this.rightBBLeave = new Rectangle(
      this.ctx,
      (this.canvasPx + this.middle.width) / 2 + this.rightBranchBottom.width - 50,
      this.rightBranchBottom.posY - 40,
      40,
      50,
    );
    this.rightBBLeave.fillStyle = color;
    this.rightBBLeave.drawRectangle();

    this.leftBranchTop = new Rectangle(this.ctx, (this.canvasPx - this.middle.width - 120 * 2) / 2, 160, 20, 120);
    this.leftBranchTop.fillStyle = color;
    this.leftBranchTop.drawRectangle();
    this.leftBTLeave = new Rectangle(
      this.ctx,
      (this.canvasPx - this.middle.width - this.leftBranchTop.width * 2) / 2,
      80,
      80,
      40,
    );
    this.leftBTLeave.fillStyle = color;
    this.leftBTLeave.drawRectangle();

    this.root = new Rectangle(this.ctx, (this.canvasPx - 150) / 2, this.middle.posY + this.middle.height, 30, 150);
    this.root.fillStyle = "#ab6134";
    this.root.drawRectangle();
  }
  checkOutside(relativeMousePos: any) {
    if (
      this.middle.isDrawnInside(relativeMousePos) ||
      this.rightBranchTop.isDrawnInside(relativeMousePos) ||
      this.rightBTLeave.isDrawnInside(relativeMousePos) ||
      this.rightBranchBottom.isDrawnInside(relativeMousePos) ||
      this.rightBBLeave.isDrawnInside(relativeMousePos) ||
      this.leftBranchTop.isDrawnInside(relativeMousePos) ||
      this.leftBTLeave.isDrawnInside(relativeMousePos) ||
      this.root.isDrawnInside(relativeMousePos)
    ) {
      this.flagOutside = false;
    } else {
      if (!this.flagOutside) {
        this.flagOutside = true;

        this.cnt_max_outside--;
      }
      if (this.cnt_max_px_outside < 0) {
        //to do break in-game
        return [true, "Woops, too many pixels colored outside."];
      }
      if (this.cnt_max_outside < 0) {
        return [true, "Woops, too many times colored outside."];
      }
      this.cnt_max_px_outside--;
    }
  }
  checkFillStatus() {
    var middle = this.middle.calcPixelsFilled();
    var rightBranchTop = this.rightBranchTop.calcPixelsFilled();
    var rightBTLeave = this.rightBTLeave.calcPixelsFilled();
    var rightBranchBottom = this.rightBranchBottom.calcPixelsFilled();
    var rightBBLeave = this.rightBBLeave.calcPixelsFilled();
    var leftBranchTop = this.leftBranchTop.calcPixelsFilled();
    var leftBTLeave = this.leftBTLeave.calcPixelsFilled();
    var root = this.root.calcPixelsFilled();

    var percentage_check =
      ((middle.coloredPixel +
        rightBranchTop.coloredPixel +
        leftBranchTop.coloredPixel +
        leftBTLeave.coloredPixel +
        rightBTLeave.coloredPixel +
        root.coloredPixel +
        rightBranchBottom.coloredPixel +
        rightBBLeave.coloredPixel) /
        (middle.totalPixel +
          rightBranchTop.totalPixel +
          leftBranchTop.totalPixel +
          leftBTLeave.totalPixel +
          rightBTLeave.totalPixel +
          root.totalPixel +
          rightBranchBottom.totalPixel +
          rightBBLeave.totalPixel)) *
      100;
    console.log(
      percentage_check,
      "Drawn: ",
      middle.coloredPixel +
        rightBranchTop.coloredPixel +
        leftBranchTop.coloredPixel +
        leftBTLeave.coloredPixel +
        rightBTLeave.coloredPixel +
        root.coloredPixel +
        rightBranchBottom.coloredPixel +
        rightBBLeave.coloredPixel,
      "Total:",
      middle.totalPixel +
        rightBranchTop.totalPixel +
        leftBranchTop.totalPixel +
        leftBTLeave.totalPixel +
        rightBTLeave.totalPixel +
        root.totalPixel +
        rightBranchBottom.totalPixel +
        rightBBLeave.totalPixel,
    );
    if (percentage_check > this.fill_shape - 5 && percentage_check < this.fill_shape + 5) {
      return [
        true,
        "You did it! (" + Math.trunc(percentage_check) + "% / " + this.fill_shape + "%, +/-" + this.tolerance + "%)",
      ];
    } else {
      return [
        false,
        "Nope. Nice Try. (" +
          Math.trunc(percentage_check) +
          "% / " +
          this.fill_shape +
          "%, +/-" +
          this.tolerance +
          "%)",
      ];
    }
  }
}
