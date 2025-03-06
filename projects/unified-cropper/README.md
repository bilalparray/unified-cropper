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

  ngOnInit(): void {
    setTimeout(() => this.startCropper(), 1000);
  }
  startCropper(): void {
    this.cropper.start({ mode: 'preCaptureCrop', aspectRatio: '1:1' });

    this.cropper.cropCompleted.subscribe((response: CropResponse) => {
      console.log('Crop response received:', response);
    });
  }
  title = 'ClientApp';
}



<lib-unified-cropper #cropper></lib-unified-cropper>

also we can start it on button click

```
