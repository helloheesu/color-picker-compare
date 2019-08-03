import { init, getDataUrl, getImage } from "./dropzone";
import ColorThief from "../lib/color-thief";

const imageListContainer = document.querySelector(".image-list");

init(".drop-zone", (file: File) => {
  getDataUrl(file)
    .then((src: string) => getImage(src))
    .then((img: HTMLImageElement) => {
      const container = document.createElement("div");
      const list = document.createElement("ul");

      container.appendChild(img);
      container.appendChild(list);

      imageListContainer.appendChild(container);

      const item = document.createElement("li");
      const color: string = ColorThief.getColor(img).join(", ");
      const backgroundColor = `rgb(${color})`;

      item.style.backgroundColor = backgroundColor;

      list.appendChild(item);
      item.innerText = `color-thief: ${color}`;
    });
});
