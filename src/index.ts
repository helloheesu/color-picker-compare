import { init, getDataUrl, getImage } from "./dropzone";
import { libraries } from "../lib";

const imageListContainer = document.querySelector(".image-list");

const createItem = (
  rgbColor: string,
  libraryName: string,
  time: number
): HTMLLIElement => {
  const item = document.createElement("li");

  item.style.backgroundColor = rgbColor;
  item.innerText = `${libraryName} - ${time}: ${rgbColor}`;

  return item;
};

const getColor = async (
  name: keyof typeof libraries,
  img: HTMLImageElement
): Promise<{ color: string; time: number }> => {
  const before = performance.now();
  const color = await libraries[name](img);
  const after = performance.now();

  return {
    color,
    time: after - before
  };
};

const librarySelector = document.querySelector(".library-options");

Object.keys(libraries).forEach((name: string) => {
  const wrapper = document.createElement("div");

  const id = `library-on-${name}`;

  const input: HTMLInputElement = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.id = id;
  input.checked = true;

  const label: HTMLLabelElement = document.createElement("label");
  label.setAttribute("for", id);
  label.innerText = name;

  wrapper.appendChild(input);
  wrapper.appendChild(label);

  librarySelector.appendChild(wrapper);
});

const drawImageOnCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  color: string = "black"
) => {
  const { width } = canvas;
  const ctx = canvas.getContext("2d");
  const { width: imgWidth, height: imgHeight } = img;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, width);

  let resultWidth: number, resultHeight: number, diff: number;
  if (imgWidth > imgHeight) {
    resultWidth = width;
    resultHeight = (imgHeight / imgWidth) * resultWidth;
    diff = width - resultHeight;

    ctx.drawImage(img, 0, diff / 2, resultWidth, resultHeight);
  } else {
    resultHeight = width;
    resultWidth = (imgWidth / imgHeight) * resultHeight;
    diff = width - resultHeight;

    ctx.drawImage(img, diff / 2, 0, resultWidth, resultHeight);
  }
};

const convertAndAppend = (file: File) => {
  getDataUrl(file)
    .then((src: string) => getImage(src))
    .then(async (img: HTMLImageElement) => {
      const container = document.createElement("div");
      const list = document.createElement("ul");
      const canvas = document.createElement("canvas");

      container.appendChild(canvas);
      container.appendChild(list);

      imageListContainer.appendChild(container);

      const width: number = img.width;
      canvas.width = width;
      canvas.height = width;

      const checkedInputList = librarySelector.querySelectorAll(
        "input:checked"
      );
      const selectedLibraryList = Array.from(checkedInputList).map(
        (i: HTMLInputElement) => i.name
      );

      selectedLibraryList.forEach(async name => {
        const { color, time } = await getColor(name, img);
        const item = createItem(color, name, time);
        list.appendChild(item);

        item.addEventListener("click", () => {
          drawImageOnCanvas(canvas, img, color);
        });
      });

      drawImageOnCanvas(canvas, img);
    })
    .catch(() => {
      alert("inappropriate file");
    });
};

init(".drop-zone", convertAndAppend);

const input: HTMLInputElement = document.querySelector(
  ".drop-zone input[type=file]"
);

input.addEventListener("change", e => {
  const { files } = e.target as HTMLInputElement;
  Array.from(files).forEach(file => convertAndAppend(file));
});
