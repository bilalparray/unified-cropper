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
npm i @capacitor/filesystem
npm i @capacitor-community/camera-preview

```

## How to use

** Example of how to use and barcode scanning is for demo use **

```
import {
  UnifiedCropperModule,
  UnifiedCropperComponent,
  CropResponse,
  UnifiedCropperOptions,
} from 'unified-cropper';
import { Filesystem, Directory } from '@capacitor/filesystem';
@Component({
  selector: 'app-root',
  imports: [CommonModule, UnifiedCropperComponent],///import here
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})


export class AppComponent {


  @ViewChild('cropper') cropper!: UnifiedCropperComponent;
  startCropper(): void {
    this.startCamera = true;
    if (this.startCamera) {
      this.cropper.start({
        mode: 'postCaptureCrop',
        saveToStorage: true,
      } as UnifiedCropperOptions);
    }
  }

  handleCropCompleted(event: CropResponse) {
   console.log(event);

  }

}

```

#Html

```

<div class="cont">
  <button (click)="startCropper()" [ngClass]="{ 'hidden': startCamera }">Start Cropper</button>
</div>

<lib-unified-cropper #cropper [ngClass]="{ 'hidden': !startCamera }" (cropCompleted)="handleCropCompleted($event)"></lib-unified-cropper>


```
