import { TgetColor } from "./type";
import ColorThief from "./color-thief";
import Rgbaster from "./rgbaster";
import Vibrant from "./vibrant";

export const libraries: { [key: string]: TgetColor } = {
  "color-thief": ColorThief,
  rgbaster: Rgbaster,
  vibrant: Vibrant
};
