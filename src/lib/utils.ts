import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTextColorForBackground(hexColor: string): string {
  if (!hexColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexColor)) {
    return '#111827'; // Dark gray for invalid colors
  }

  let r: number, g: number, b: number;
  if (hexColor.length === 4) {
    r = parseInt(hexColor[1] + hexColor[1], 16);
    g = parseInt(hexColor[2] + hexColor[2], 16);
    b = parseInt(hexColor[3] + hexColor[3], 16);
  } else {
    r = parseInt(hexColor.slice(1, 3), 16);
    g = parseInt(hexColor.slice(3, 5), 16);
    b = parseInt(hexColor.slice(5, 7), 16);
  }

  // WCAG 2.0 formula for luminance
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // Use black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#111827' : '#FFFFFF';
}
