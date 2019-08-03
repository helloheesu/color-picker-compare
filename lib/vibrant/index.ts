import Vibrant = require("node-vibrant");

export const getColor = async (img: HTMLImageElement): Promise<string> => {
  const palette = await Vibrant.from(img).getPalette();
  const color = palette.Vibrant.getRgb();

  return `rgb(${color.join(", ")})`;
};

export default getColor;
