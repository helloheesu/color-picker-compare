// const callColorThief = require("./color-thief");
import ColorThief from "./color-thief";
import { TgetColor } from "../type";

const instance = new ColorThief();

const getColor: TgetColor = async img => {
  const color: string[] = instance.getColor(img);

  return `rgb(${color.join(", ")})`;
};

export default getColor;
