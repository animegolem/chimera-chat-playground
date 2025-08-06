/**
 * Image processing utilities for Lexical editor
 * Extracted from LexicalEditor.tsx for better separation of concerns
 */

/**
 * Resizes an image file to optimize for Claude API usage
 * @param file - The image file to resize
 * @param maxSize - Maximum dimension in pixels (default: 1568)
 * @returns Promise resolving to base64 encoded string
 */
export const resizeImage = async (
  file: File,
  maxSize: number = 1568
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions
      let { width, height } = img;
      const maxDim = Math.max(width, height);

      if (maxDim > maxSize) {
        const scale = maxSize / maxDim;
        width *= scale;
        height *= scale;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and convert to base64
      ctx?.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Acceptable image types for drag-drop
export const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];
