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
  // Template Refs for HTML elements

  /// for draggable square
  @ViewChild('draggableSquare', { static: false })
  draggableSquare!: ElementRef<HTMLDivElement>;

  // for gallery image
  @ViewChild('galleryImg', { static: false })
  galleryImgRef!: ElementRef<HTMLImageElement>;

  /// Output Event Emitters for cropresponse
  @Output() cropCompleted: EventEmitter<CropResponse> =
    new EventEmitter<CropResponse>();

  // variable for check window object
  isWindowDefined: boolean = typeof window !== 'undefined';

  currentPage: 'camera' = 'camera'; ///for check current page, camera or gallery

  cropMode: 'preCaptureCrop' | 'postCaptureCrop' = 'postCaptureCrop'; ///for check crop mode

  sourceMode: 'camera' | 'gallery' = 'camera'; ///for check source mode camera or gallery

  capturedImage: string = ''; // for captured image data

  livePreviewActive: boolean = false; /// for check live preview is active or not
  boxWidth: number = 200; // for draggble box width
  boxHeight: number = 200; // for draggble box height
  squarePos: Position = { left: 0, top: 0 }; // for draggble box position
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

  constructor(private ngZone: NgZone) {}

  /**
   * This lifecycle hook sets the initial position of the draggable square
   * to the center of the screen, based on the screen's width and height.
   * If the component is being rendered on the server, no action is taken.
   */
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

  /**
   * Initializes the unified cropper component with the given options.
   *
   * @param options The options to initialize the component with.
   * @param options.aspectRatio The aspect ratio of the crop area. If provided, the cropping square will
   * be resized to maintain the specified aspect ratio as the user drags it.
   * @param options.mode The mode of the unified cropper. Can be 'preCaptureCrop', 'postCaptureCrop', or 'gallery'.
   */
  public start(options: UnifiedCropperOptions): void {
    if (options.aspectRatio) {
      this.aspectRatio = options.aspectRatio;
      const parts = options.aspectRatio.split(':');
      if (parts.length === 2) {
        this.aspectX = parseFloat(parts[0]);
        this.aspectY = parseFloat(parts[1]);
      }
    }
    this.setCropMode(options.mode);
  }

  /**
   * Sets the crop mode and source mode of the cropper component.
   *
   * @param mode The desired crop mode for the component. Can be 'preCaptureCrop',
   * 'postCaptureCrop', or 'gallery'. If 'gallery' is selected, the source mode is
   * set to 'gallery' and crop mode is set to 'postCaptureCrop'. For other modes,
   * the crop mode and source mode are set to 'camera'. If the window object is
   * defined, the camera preview is started for non-gallery modes.
   */

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

  /**
   * Allows the user to select an image from the photo gallery on their device.
   * If the user selects an image, it is stored in the component's capturedImage
   * property. If the live preview is active, it is stopped prior to opening
   * the gallery. If the gallery image selection fails for any reason, an error
   * message is logged to the console.
   */
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

  /**
   * Starts the camera preview and sets the live preview active flag to true.
   *
   * This method is called when the user selects the camera as the source for
   * the unified cropper. It sets the source mode to 'camera', clears any
   * existing captured image, and starts the camera preview. If the window
   * object is not defined (i.e. the component is being rendered on the server),
   * this method does nothing.
   */
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

  /**
   * Captures an image from the camera preview and stores it in the capturedImage
   * property. If the camera preview is not active or the crop mode is not
   * 'postCaptureCrop', this method does nothing. If the image data is not
   * successfully captured, an error message is logged to the console. If the
   * image data is captured successfully, the capturedImage property is updated
   * and the camera preview is stopped if the crop mode is 'postCaptureCrop'.
   */
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

  /**
   * Triggers image capture or processing based on the current crop mode.
   * If the crop mode is 'preCaptureCrop', this method captures an image from
   * the camera preview and, after a brief delay, processes the resulting
   * image data. If the crop mode is 'postCaptureCrop', this method processes
   * the captured image data immediately.
   */
  async cropOrCapture(): Promise<void> {
    if (this.cropMode === 'preCaptureCrop') {
      await this.captureImage();
      this.processImage(this.capturedImage);
    } else {
      this.processImage(this.capturedImage);
    }
  }

  /**
   * Processes the captured or selected image by cropping it and emitting
   * the resulting image data as a base64 string. The image data is cropped
   * based on the position and size of the draggable square. If the image
   * source is the gallery, the image is first scaled to fit the container
   * and then cropped. If the image source is the camera, the image is
   * cropped directly from the camera preview. The resulting image data
   * is emitted as a base64 string along with additional metadata about
   * the image, such as its name, path, source type, and file type.
   *
   * @param base64 The base64 string representation of the image data to
   *               be processed.
   */
  private processImage(base64: string): void {
    const img = new Image();
    img.onload = () => {
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
          (naturalHeight / displayedHeight);
        cropWidth = cropRect.width * (naturalWidth / displayedWidth);
        cropHeight = cropRect.height * (naturalHeight / displayedHeight);
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
        const responseObj: CropResponse = {
          imageName: `IMG_${new Date().getTime()}.png`,
          imagePath: '',
          imageSourceType: this.sourceMode,
          imageType: '.png',
          imageBase64: base64Result,
        };
        console.log('Crop Completed:', responseObj);
        this.cropCompleted.emit(responseObj);
      } else {
        console.error('Canvas context not available');
      }
    };
    img.src = 'data:image/png;base64,' + base64;
  }

  /**
   * Starts the drag gesture by storing the initial position of the
   * draggable square and the client coordinates of the initial touch
   * or mouse event. It also adds event listeners for subsequent drag
   * events and the end of the drag gesture.
   * @param event The initial touch or mouse event that triggered the
   *              drag gesture.
   */
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

  /**
   * Starts the resize operation.
   *
   * This method is called when the user starts a drag operation on one of
   * the resize handles. It sets the isResizing flag to true and stores the
   * initial values of the mouse position, box width, and box height. It
   * then adds event listeners to the document to track the mouse or touch
   * movement and to stop the resize operation when the user releases the
   * mouse or touch.
   * @param event The event that triggered the resize operation.
   */
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

  /**
   * Resets the crop box to its default size and position.
   *
   * If the image source is the gallery, the crop box is resized to half the
   * width and height of the image container and positioned at the center of
   * the container. If the image source is the camera, the crop box is reset
   * to a fixed size of 200x200 and positioned at the center of the screen.
   */
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
