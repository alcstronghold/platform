import { Component } from '@angular/core';

/**
 * Componente de splash loader que se muestra durante la inicialización de la app.
 * Se usa mientras AuthService.initialize() verifica si existe una sesión válida.
 */
@Component({
  selector: 'app-splash-loader',
  standalone: true,
  templateUrl: './splash-loader.component.html',
})
export class SplashLoaderComponent { }
