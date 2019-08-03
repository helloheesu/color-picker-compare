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

init(".drop-zone", (file: File) => {
  getDataUrl(file)
    .then((src: string) => getImage(src))
    .then(async (img: HTMLImageElement) => {
      const container = document.createElement("div");
      const list = document.createElement("ul");

      container.appendChild(img);
      container.appendChild(list);

      imageListContainer.appendChild(container);

      Object.keys(libraries).forEach(async name => {
        const { color, time } = await getColor(name, img);
        const item = createItem(color, name, time);
        list.appendChild(item);
      });
    })
    .catch(() => {
      alert("inappropriate file");
    });
});
