import { init, getDataUrl, getImage } from "./dropzone";
import { libraries } from "../lib";
import CanvasModel from "./Canvas";

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

const convertAndAppend = (file: File) => {
  getDataUrl(file)
    .then((src: string) => getImage(src))
    .then(async (img: HTMLImageElement) => {
      const container = document.createElement("div");
      const list = document.createElement("ul");
      const canvas = new CanvasModel(img);

      container.appendChild(canvas.canvas);
      container.appendChild(list);

      imageListContainer.appendChild(container);

      canvas.changeBackgroundColor("black");

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
          canvas.changeBackgroundColor(color);
        });
      });
    })
    .catch(e => {
      console.log(e);
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
