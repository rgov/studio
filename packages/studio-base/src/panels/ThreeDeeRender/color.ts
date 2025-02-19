// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SRGBToLinear } from "three/src/math/ColorManagement";
import { clamp } from "three/src/math/MathUtils";
import tinycolor from "tinycolor2";

import { approxEquals, uint8Equals } from "./math";
import { ColorRGB, ColorRGBA } from "./ros";

export { SRGBToLinear } from "three/src/math/ColorManagement";

export function stringToRgba(output: ColorRGBA, colorStr: string): ColorRGBA {
  const color = tinycolor(colorStr);
  if (!color.isValid()) {
    output.r = output.g = output.b = output.a = 1;
    return output;
  }
  const rgb = color.toRgb();
  output.r = rgb.r / 255;
  output.g = rgb.g / 255;
  output.b = rgb.b / 255;
  output.a = rgb.a;
  return output;
}

export function makeRgba(): ColorRGBA {
  return { r: 0, g: 0, b: 0, a: 0 };
}

export function stringToRgb<T extends ColorRGB | THREE.Color>(output: T, colorStr: string): T {
  const color = tinycolor(colorStr);
  if (!color.isValid()) {
    output.r = output.g = output.b = 1;
    return output;
  }
  const rgb = color.toRgb();
  output.r = rgb.r / 255;
  output.g = rgb.g / 255;
  output.b = rgb.b / 255;
  return output;
}

export function rgbaToHexString(color: ColorRGBA): string {
  const rgba =
    (clamp(color.r * 255, 0, 255) << 24) ^
    (clamp(color.g * 255, 0, 255) << 16) ^
    (clamp(color.b * 255, 0, 255) << 8) ^
    (clamp(color.a * 255, 0, 255) << 0);
  return ("00000000" + rgba.toString(16)).slice(-8);
}

export function rgbaToCssString(color: ColorRGBA): string {
  const r = Math.trunc(color.r * 255);
  const g = Math.trunc(color.g * 255);
  const b = Math.trunc(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

export function rgbaToLinear(output: ColorRGBA, color: ColorRGBA): ColorRGBA {
  output.r = SRGBToLinear(color.r);
  output.g = SRGBToLinear(color.g);
  output.b = SRGBToLinear(color.b);
  output.a = color.a;
  return output;
}

export function rgbaEqual(a: ColorRGBA, b: ColorRGBA): boolean {
  return (
    uint8Equals(a.r, b.r) &&
    uint8Equals(a.g, b.g) &&
    uint8Equals(a.b, b.b) &&
    approxEquals(a.a, b.a)
  );
}
