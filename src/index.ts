import { init, getDataUrl, getImage } from "./dropzone";
import ColorThief from "../lib/color-thief";
import Rgbaster from "../lib/rgbaster";
import Vibrant from "../lib/vibrant";

const imageListContainer = document.querySelector(".image-list");

const createItem = (rgbColor: string, libraryName: string): HTMLLIElement => {
  const item = document.createElement("li");

  item.style.backgroundColor = rgbColor;
  item.innerText = `${libraryName}: ${rgbColor}`;

  return item;
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

      const itemInfoList: { color: string; name: string }[] = [
        {
          color: ColorThief(img),
          name: "color-thief"
        },
        {
          color: await Rgbaster(img),
          name: "rgbaster"
        },
        {
          color: await Vibrant(img),
          name: "vibrant"
        }
      ];

      itemInfoList.forEach(({ color, name }) => {
        const item = createItem(color, name);
        list.appendChild(item);
      });
    });
});
