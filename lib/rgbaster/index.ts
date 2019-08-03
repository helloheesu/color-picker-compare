import Rgbaster from "rgbaster";

const getColor = async (img: HTMLImageElement): Promise<string> => {
  const result = await Rgbaster(img.src);

  return result[0].color;
};

export default getColor;
