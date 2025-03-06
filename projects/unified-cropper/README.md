# UnifiedCropper

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.0.

# Install

```
npm i unified cropper // if installing from npm
npm i unified cropper  /// install from package.json file where in depencencies set  "unified-cropper": "file:unified-cropper-0.0.8.tgz",

```

# Additional Capacitor Plugins Required to Work

```
npm i @capacitor/camera
npm i @capacitor/core
npm i @capacitor-community/camera-preview

```

## How to use

** Example of how to use and barcode scanning is for demo use **

```
import { CropResponse, UnifiedCropperComponent } from 'unified-cropper';

@Component({
  selector: 'app-root',
  imports: [CommonModule, UnifiedCropperComponent],///import here
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})


export class AppComponent {
  @ViewChild('cropper') cropper!: UnifiedCropperComponent;

  title = 'cropper-test';
  croppedBase64Image: string = '';
  startCamera: boolean = false;
  startCropper(): void {
    this.startCamera = true;
    if (this.startCamera) {
      this.cropper.start({ mode: 'gallery' });
    }
    this.cropper.cropCompleted.subscribe((response: CropResponse) => {
      console.log('Crop response received:', response);
      this.croppedBase64Image = response.imageBase64;

      this.startCodeScanFromImage(true);
    });
  }

  async startCodeScanFromImage(isQrScan: boolean) {
    try {
      this.startCamera = false;

      // Save the base64 image to a file and get its path
      const filePath = await this.saveBase64Image(this.croppedBase64Image);

      // Scan all formats using the file path
      await BarcodeScanner.readBarcodesFromImage({
        path: filePath,
      }).then((result) => {
        if (result.barcodes.length > 0) {
          alert(result.barcodes[0].rawValue);
        }
        console.log('Barcode Scan Result:', result.barcodes);
      });
    } catch (error) {
      console.error('Error during barcode scanning:', error);
    }
  }

  async saveBase64Image(base64Data: string): Promise<string> {
    const fileName = `crop-${Date.now()}.png`;

    // Write the file to Directory.Data
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Retrieve the file URI from Directory.Data
    const fileUriResult = await Filesystem.getUri({
      directory: Directory.Data,
      path: fileName,
    });

    const fileUri = fileUriResult.uri;

    // For testing, return fileUri directly.
    return fileUri;
  }
}


```

#Html

```
<div class="cont">
  <button (click)="startCropper()" [ngClass]="{ 'hidden': startCamera }">Start Cropper</button>
</div>

<lib-unified-cropper #cropper [ngClass]="{ 'hidden': !startCamera }"></lib-unified-cropper>
```
