/**
 * Represents a two-dimensional position on the screen.
 *
 * This interface is used to specify the offset of an element,
 * such as a cropping square, by defining its horizontal (left)
 * and vertical (top) distances from the top-left corner.
 */
export interface Position {
  /**
   * The horizontal offset in pixels.
   */
  left: number;

  /**
   * The vertical offset in pixels.
   */
  top: number;
}

/**
 * Describes the result returned after an image has been cropped.
 *
 * This interface contains details about the cropped image, including
 * its name, path, source type (whether it came from the camera or gallery),
 * file type, and the image data encoded in base64 format.
 */
export interface CropResponse {
  /**
   * The file name of the cropped image.
   * Typically generated dynamically (e.g., using a timestamp).
   */
  imageName: string;

  /**
   * The file path where the cropped image is stored.
   * This may be empty if the image is only provided as base64 data.
   */
  imagePath: string;

  /**
   * The source from which the image was obtained.
   * - 'camera': Image was captured using the device camera.
   * - 'gallery': Image was selected from the device's photo gallery.
   */
  imageSourceType: 'camera' | 'gallery';

  /**
   * The file extension or MIME type of the image.
   * For example, '.png' indicates a PNG image.
   */
  imageType: string;

  /**
   * The base64 encoded string of the cropped image.
   * This string can be used to display the image in the UI or
   * for further processing.
   */
  imageBase64: string;
}

/**
 * Configuration options for the Unified Cropper.
 *
 * This interface is used to customize the behavior of the cropper
 * component by specifying the mode of operation and, optionally,
 * the desired aspect ratio for the crop area.
 */
export interface UnifiedCropperOptions {
  /**
   * Determines the cropping mode:
   * - 'preCaptureCrop': The crop operation is performed before capturing the image in  the live view of the camera.
   * - 'postCaptureCrop': The crop operation is performed after the image is captured.
   * - 'gallery': The image is selected from the device's gallery, and then cropped.
   */
  mode: 'preCaptureCrop' | 'postCaptureCrop' | 'gallery';

  /**
   * (Optional) The aspect ratio to be enforced for the crop box.
   * Specify as a string in the format "width:height", for example:
   * - "1:1" for a square crop
   * - "16:9" for a widescreen crop.
   * If not provided, the cropper may allow free-form cropping.
   */
  aspectRatio?: string;
}
