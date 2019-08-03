// const callColorThief = require("./color-thief");
import ColorThief from "./color-thief";

const instance = new ColorThief();

const getColor = (img: HTMLImageElement): string => {
  const color: string[] = instance.getColor(img);

  return `rgb(${color.join(", ")})`;
};

export default getColor;
