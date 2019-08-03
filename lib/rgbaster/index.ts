import Rgbaster from "rgbaster";
import { TgetColor } from "../type";

const getColor: TgetColor = async img => {
  const result = await Rgbaster(img.src);

  return result[0].color;
};

export default getColor;
