import { afterNextRender, Component, inject, VERSION } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';

import { SplashLoaderComponent } from './core/components/splash-loader.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly version = VERSION.full;
  protected readonly authService = inject(AuthService);

  constructor() {
    afterNextRender(() => {
      initFlowbite();
    });
  }
}