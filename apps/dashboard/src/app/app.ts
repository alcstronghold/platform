import { Component, VERSION, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly version = VERSION.full;

  constructor() {
    afterNextRender(() => {
      initFlowbite();
    });
  }
}