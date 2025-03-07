import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
  EventEmitter,
  Output,
} from '@angular/core';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {
  CropResponse,
  UnifiedCropperOptions,
  Position,
} from './unified-cropper.types';

@Component({
  selector: 'lib-unified-cropper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-cropper.component.html',
  styleUrls: ['./unified-cropper.component.scss'],
})
export class UnifiedCropperComponent implements OnInit, AfterViewInit {
  // Template Refs
  @ViewChild('draggableSquare', { static: false })
  draggableSquare!: ElementRef<HTMLDivElement>;

  @ViewChild('galleryImg', { static: false })
  galleryImgRef!: ElementRef<HTMLImageElement>;

  @Output() cropCompleted: EventEmitter<CropResponse> =
    new EventEmitter<CropResponse>();

  isWindowDefined: boolean = typeof window !== 'undefined';
  currentPage: 'camera' = 'camera';
  cropMode: 'preCaptureCrop' | 'postCaptureCrop' = 'postCaptureCrop';
  sourceMode: 'camera' | 'gallery' = 'camera';
  capturedImage: string = '';
  livePreviewActive: boolean = false;
  boxWidth: number = 200;
  boxHeight: number = 200;
  squarePos: Position = { left: 0, top: 0 };
  screenWidth: number = 0;
  screenHeight: number = 0;
  dragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  initialSquareLeft: number = 0;
  initialSquareTop: number = 0;
  isResizing: boolean = false;
  initialResizeX: number = 0;
  initialResizeY: number = 0;
  initialBoxWidth: number = 200;
  initialBoxHeight: number = 200;
  aspectRatio?: string;
  aspectX?: number;
  aspectY?: number;

  // New property to control saving the cropped image
  private saveToStorage: boolean = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    if (this.isWindowDefined) {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      this.squarePos = {
        left: this.screenWidth / 2 - 100,
        top: this.screenHeight / 2 - 100,
      };
    } else {
      this.squarePos = { left: 0, top: 0 };
    }
  }

  ngAfterViewInit(): void {}

  public start(options: UnifiedCropperOptions): void {
    if (options.aspectRatio) {
      this.aspectRatio = options.aspectRatio;
      const parts = options.aspectRatio.split(':');
      if (parts.length === 2) {
        this.aspectX = parseFloat(parts[0]);
        this.aspectY = parseFloat(parts[1]);
      }
    }
    // Store the saveToStorage option (default is false if not provided)
    this.saveToStorage = options.saveToStorage || false;
    this.setCropMode(options.mode);
  }

  setCropMode(mode: 'preCaptureCrop' | 'postCaptureCrop' | 'gallery'): void {
    if (mode === 'gallery') {
      this.cropMode = 'postCaptureCrop';
      this.sourceMode = 'gallery';
      this.currentPage = 'camera';
      this.capturedImage = '';
    } else {
      this.cropMode = mode;
      this.sourceMode = 'camera';
      this.currentPage = 'camera';
      if (this.isWindowDefined) {
        this.startCameraPreview();
      }
    }
  }

  async pickImageFromGallery(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      this.capturedImage = photo.base64String || '';
      if (this.livePreviewActive) {
        await CameraPreview.stop();
        this.livePreviewActive = false;
      }
      console.log('Gallery image selected');
    } catch (error) {
      console.error('Gallery selection error:', error);
    }
  }

  async startCameraPreview(): Promise<void> {
    if (!this.isWindowDefined) return;
    this.sourceMode = 'camera';
    this.capturedImage = '';
    this.livePreviewActive = true;
    await CameraPreview.start({
      position: 'rear',
      width: this.screenWidth,
      height: this.screenHeight,
      parent: 'cameraPreviewContainer',
      className: 'cameraPreview',
      toBack: true,
    })
      .then(() => console.log('Camera preview started'))
      .catch((error) => console.error('Error starting camera preview:', error));
  }

  async captureImage(): Promise<void> {
    if (!this.isWindowDefined) return;
    if (!this.livePreviewActive && this.cropMode === 'postCaptureCrop') return;
    await CameraPreview.capture({ quality: 85 })
      .then((result: any) => {
        const base64 = result.value;
        if (!base64) {
          console.error('No image data captured');
          return;
        }
        this.capturedImage = base64;
        if (this.cropMode === 'postCaptureCrop') {
          CameraPreview.stop().then(() => {
            this.livePreviewActive = false;
          });
        }
      })
      .catch((error) => console.error('Capture error:', error));
  }

  async cropOrCapture(): Promise<void> {
    if (this.cropMode === 'preCaptureCrop') {
      await this.captureImage();
      this.processImage(this.capturedImage);
    } else {
      this.processImage(this.capturedImage);
    }
  }

  /**
   * Saves the cropped image to device storage if saveToStorage is true.
   * Returns the saved image path.
   */
  private async saveCroppedImage(base64Data: string): Promise<string> {
    const fileName = `cropped-${new Date().getTime()}.png`;
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents, // or Directory.Documents depending on your needs
    });
    const fileUriResult = await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    });
    return fileUriResult.uri; // Return the URI (or adjust if your plugin requires a specific format)
  }

  private processImage(base64: string): void {
    const img = new Image();
    // Mark the onload callback as async so we can await saving to storage
    img.onload = async () => {
      let cropX: number, cropY: number, cropWidth: number, cropHeight: number;
      if (this.sourceMode === 'gallery' && this.galleryImgRef) {
        const containerRect =
          this.galleryImgRef.nativeElement.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const scale = Math.min(
          containerWidth / naturalWidth,
          containerHeight / naturalHeight
        );
        const displayedWidth = naturalWidth * scale;
        const displayedHeight = naturalHeight * scale;
        const offsetX = (containerWidth - displayedWidth) / 2;
        const offsetY = (containerHeight - displayedHeight) / 2;
        const cropRect =
          this.draggableSquare.nativeElement.getBoundingClientRect();
        const containerLeft = containerRect.left;
        const containerTop = containerRect.top;
        cropX =
          (cropRect.left - containerLeft - offsetX) *
          (naturalWidth / displayedWidth);
        cropY =
          (cropRect.top - containerTop - offsetY) *
          (naturalHeight / displayedWidth);
        cropWidth = cropRect.width * (naturalWidth / displayedWidth);
        cropHeight = cropRect.height * (naturalHeight / displayedWidth);
      } else {
        const scaleX = img.width / this.screenWidth;
        const scaleY = img.height / this.screenHeight;
        const rect = this.draggableSquare.nativeElement.getBoundingClientRect();
        cropX = rect.left * scaleX;
        cropY = rect.top * scaleY;
        cropWidth = rect.width * scaleX;
        cropHeight = rect.height * scaleY;
      }
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        const croppedDataUrl = canvas.toDataURL('image/png');
        this.resetCropBox();
        if (this.livePreviewActive) {
          CameraPreview.stop().then(() => {
            this.livePreviewActive = false;
          });
        }
        const base64Result = croppedDataUrl.split(',')[1];
        // Prepare the crop response
        const responseObj: CropResponse = {
          imageName: `IMG_${new Date().getTime()}.png`,
          imagePath: '', // can be used for in-memory images
          imageSourceType: this.sourceMode,
          imageType: '.png',
          imageBase64: base64Result,
        };
        // If saving is enabled, save the cropped image and include the path in the response
        if (this.saveToStorage) {
          try {
            const savedPath = await this.saveCroppedImage(
              croppedDataUrl.split(',')[1]
            );
            responseObj.savedImagePath = savedPath;
          } catch (saveError) {
            console.error('Error saving cropped image:', saveError);
          }
        }
        console.log('Crop Completed:', responseObj);
        this.cropCompleted.emit(responseObj);
      } else {
        console.error('Canvas context not available');
      }
    };
    img.src = 'data:image/png;base64,' + base64;
  }

  // ... existing drag and resize methods remain unchanged ...

  startDrag(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    if ((event.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    this.dragging = true;
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.initialSquareLeft = this.squarePos.left;
    this.initialSquareTop = this.squarePos.top;
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('touchmove', this.onDrag, { passive: false });
    document.addEventListener('mouseup', this.stopDrag);
    document.addEventListener('touchend', this.stopDrag);
  }

  onDrag = (event: MouseEvent | TouchEvent): void => {
    if (!this.dragging) return;
    event.preventDefault();
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;
    this.ngZone.run(() => {
      this.squarePos = {
        left: this.initialSquareLeft + deltaX,
        top: this.initialSquareTop + deltaY,
      };
    });
  };

  stopDrag = (): void => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('touchend', this.stopDrag);
  };

  startResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    this.initialResizeX = clientX;
    this.initialResizeY = clientY;
    this.initialBoxWidth = this.boxWidth;
    this.initialBoxHeight = this.boxHeight;
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('touchmove', this.onResize, { passive: false });
    document.addEventListener('mouseup', this.stopResize);
    document.addEventListener('touchend', this.stopResize);
  }

  onResize = (event: MouseEvent | TouchEvent): void => {
    if (!this.isResizing) return;
    event.preventDefault();
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    const deltaX = clientX - this.initialResizeX;
    if (this.aspectRatio && this.aspectX && this.aspectY) {
      let newWidth = Math.max(50, this.initialBoxWidth + deltaX);
      let newHeight = newWidth * (this.aspectY / this.aspectX);
      if (newHeight < 50) {
        newHeight = 50;
        newWidth = newHeight * (this.aspectX / this.aspectY);
      }
      this.ngZone.run(() => {
        this.boxWidth = newWidth;
        this.boxHeight = newHeight;
      });
    } else {
      const deltaY = clientY - this.initialResizeY;
      const newWidth = Math.max(50, this.initialBoxWidth + deltaX);
      const newHeight = Math.max(50, this.initialBoxHeight + deltaY);
      this.ngZone.run(() => {
        this.boxWidth = newWidth;
        this.boxHeight = newHeight;
      });
    }
  };

  stopResize = (): void => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('touchmove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
    document.removeEventListener('touchend', this.stopResize);
  };

  resetCropBox(): void {
    if (this.sourceMode === 'gallery' && this.galleryImgRef) {
      const containerRect =
        this.galleryImgRef.nativeElement.getBoundingClientRect();
      const defaultWidth = containerRect.width * 0.5;
      const defaultHeight = containerRect.height * 0.5;
      this.boxWidth = defaultWidth;
      this.boxHeight = defaultHeight;
      this.squarePos = {
        left: (containerRect.width - defaultWidth) / 2,
        top: (containerRect.height - defaultHeight) / 2,
      };
    } else if (this.isWindowDefined) {
      this.boxWidth = 200;
      this.boxHeight = 200;
      this.squarePos = {
        left: this.screenWidth / 2 - 100,
        top: this.screenHeight / 2 - 100,
      };
    }
  }

  onImageLoad(): void {}
}
