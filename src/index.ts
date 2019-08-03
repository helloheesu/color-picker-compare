import { init, getDataUrl, getImage } from "./dropzone";

const imageListContainer = document.querySelector(".image-list");

init(".drop-zone", (file: File) => {
  getDataUrl(file)
    .then((src: string) => getImage(src))
    .then((img: HTMLImageElement) => {
      imageListContainer.appendChild(img);
    });
});
