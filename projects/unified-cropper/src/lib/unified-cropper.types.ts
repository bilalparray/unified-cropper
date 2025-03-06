export interface Position {
  left: number;
  top: number;
}

export interface CropResponse {
  imageName: string;
  imagePath: string;
  imageSourceType: 'camera' | 'gallery';
  imageType: string;
  imageBase64: string;
}

export interface UnifiedCropperOptions {
  mode: 'preCaptureCrop' | 'postCaptureCrop' | 'gallery';
  aspectRatio?: string; // e.g., "1:1", "16:9"
}
