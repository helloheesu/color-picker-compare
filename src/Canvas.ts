enum Orientation {
  Horizontal,
  Vertical
}

class CanvasModel {
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  orientation: Orientation;
  originalWidth: number;
  originalHeight: number;
  drawnWidth: number = 0;
  drawnHeight: number = 0;
  drawnX: number = 0;
  drawnY: number = 0;
  margin: number;
  backgroundColor: string;

  constructor(img: HTMLImageElement) {
    this.img = img;

    const { width, height } = img;
    this.originalWidth = width;
    this.originalHeight = height;
    this.orientation =
      width > height ? Orientation.Horizontal : Orientation.Vertical;

    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.calculateDrawnSize();
  }

  drawImage() {
    const { ctx, canvas, backgroundColor } = this;
    const { width } = canvas;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, width);

    this.ctx.drawImage(
      this.img,
      this.drawnX,
      this.drawnY,
      this.drawnWidth,
      this.drawnHeight
    );
  }

  changeBackgroundColor(color: string) {
    this.backgroundColor = color;

    this.drawImage();
  }

  private calculateDrawnSize() {
    const { img, canvas } = this;

    const size = Math.max(img.width, img.height);
    canvas.width = size;
    canvas.height = size;

    if (this.orientation === Orientation.Horizontal) {
      this.drawnWidth = size;
      this.drawnHeight = (this.originalHeight / this.originalWidth) * size;

      const diff = size - this.drawnHeight;
      this.drawnX = 0;
      this.drawnY = diff / 2;
    } else {
      this.drawnHeight = size;
      this.drawnWidth = (this.originalWidth / this.originalHeight) * size;

      const diff = size - this.drawnHeight;
      this.drawnX = diff / 2;
      this.drawnY = 0;
    }
  }
}

export default CanvasModel;
