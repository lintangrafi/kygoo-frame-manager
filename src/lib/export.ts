import sharp from "sharp";
import { join } from "path";
import { readFile } from "fs/promises";
import { getUploadPath } from "./upload";

interface SlotData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface AllocationData {
  photoPath: string;
  slot: SlotData;
  scale: number;
  offsetX: number;
  offsetY: number;
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
}

export async function composeFrame(
  frameUrl: string,
  frameWidth: number,
  frameHeight: number,
  allocations: AllocationData[]
): Promise<Buffer> {
  const framePath = getUploadPath(frameUrl);
  const frameBuffer = await readFile(framePath);

  const layers: sharp.OverlayOptions[] = [];

  layers.push({
    input: frameBuffer,
    top: 0,
    left: 0,
  });

  for (const alloc of allocations) {
    const photoPath = getUploadPath(alloc.photoPath);
    const photoBuffer = await readFile(photoPath);

    const scaledW = Math.round(alloc.slot.width * alloc.scale);
    const scaledH = Math.round(alloc.slot.height * alloc.scale);

    const resized = await sharp(photoBuffer)
      .resize(scaledW, scaledH, { fit: "cover", position: "center" })
      .modulate({
        brightness: alloc.brightness / 100,
        saturation: alloc.saturation / 100,
        hue: alloc.hue,
      })
      .linear(alloc.contrast / 100, -(128 * ((alloc.contrast / 100) - 1)))
      .png()
      .toBuffer();

    const centerX = alloc.slot.x + alloc.slot.width / 2;
    const centerY = alloc.slot.y + alloc.slot.height / 2;
    const left = Math.round(centerX - scaledW / 2 + alloc.offsetX);
    const top = Math.round(centerY - scaledH / 2 + alloc.offsetY);

    layers.push({
      input: resized,
      top: Math.max(0, top),
      left: Math.max(0, left),
    });
  }

  return sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}
