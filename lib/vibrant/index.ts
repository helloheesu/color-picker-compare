import Vibrant = require("node-vibrant");
import { TgetColor } from "../type";

const getColor: TgetColor = async img => {
  const palette = await Vibrant.from(img).getPalette();
  const color = palette.Vibrant.getRgb();

  return `rgb(${color.join(", ")})`;
};

export default getColor;
