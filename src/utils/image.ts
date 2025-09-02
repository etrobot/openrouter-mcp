import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, extname } from "path";

/**
 * Save a base64 image to the filesystem
 */
export function saveBase64Image(base64Data: string, directory: string, filename?: string): string {
  // Ensure directory exists
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  // Extract image format from base64 data
  const matches = base64Data.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image data format");
  }

  const imageType = matches[1]; // e.g., 'png', 'jpeg', 'jpg'
  const actualBase64Data = matches[2];

  // Generate filename if not provided
  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filename = `image_${timestamp}.${imageType}`;
  } else if (!extname(filename)) {
    filename = `${filename}.${imageType}`;
  }

  const filepath = join(directory, filename);

  // Convert base64 to buffer and save
  const imageBuffer = Buffer.from(actualBase64Data, 'base64');
  writeFileSync(filepath, imageBuffer);

  return filepath;
}

/**
 * Save response images from OpenRouter API
 */
export function saveResponseImages(images: any[], saveDirectory?: string): Array<{ url: string; savedPath?: string }> {
  if (!saveDirectory || !images?.length) {
    return images?.map(img => ({ url: img.image_url?.url || "" })) || [];
  }

  return images.map((img, index) => {
    const imageUrl = img.image_url?.url || "";
    let savedPath: string | undefined;

    try {
      if (imageUrl.startsWith('data:image/')) {
        savedPath = saveBase64Image(imageUrl, saveDirectory, `generated_image_${index + 1}`);
      }
    } catch (error) {
      console.error(`Failed to save image ${index + 1}:`, error);
    }

    return { url: imageUrl, savedPath };
  });
}