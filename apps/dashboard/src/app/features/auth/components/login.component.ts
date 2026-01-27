import { SignalFormDescriptor } from '@alcstronghold/infrastructure';
import { Component, computed, inject, signal } from '@angular/core';
import { email, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface LoginFormData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [
    FormField
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);

  readonly descriptor = new SignalFormDescriptor<LoginFormData>(
    { email: '', password: '' },
    (schema) => {
      required(schema.email, { message: 'El email es obligatorio' });
      email(schema.email, { message: 'El formato del email no es válido' });
      required(schema.password, { message: 'La contraseña es obligatoria' });
      minLength(schema.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres' });
    }
  );
  readonly emailError = computed(() => {
    const field = this.descriptor.form.email();
    if (!field.touched()) return null;
    const errors = field.errors();
    return errors.length > 0 ? errors[0].message : null;
  });

  readonly passwordError = computed(() => {
    const field = this.descriptor.form.password();
    if (!field.touched()) return null;
    const errors = field.errors();
    return errors.length > 0 ? errors[0].message : null;
  });

  readonly authError = computed(() =>
    this.authService.error());

  async login(): Promise<void> {
    if (!this.descriptor.form().valid()) {
      // Mark all fields as touched para mostrar errores
      this.descriptor.form.email().markAsTouched();
      this.descriptor.form.password().markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authService.clearError();

    const { email, password } = this.descriptor.model();
    const success = await this.authService.login(email, password);

    this.isSubmitting.set(false);

    if (!success) return;

    // Lee redirectUrl del query parameter
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl');

    // Valida que redirectUrl sea seguro (mismo dominio, no externo)
    const isSafeRedirect =
      redirectUrl != null &&
      redirectUrl.startsWith('/') &&
      !redirectUrl.startsWith('//') &&
      redirectUrl !== '/login';

    if (isSafeRedirect) {
      // Navega a la URL original
      await this.router.navigateByUrl(redirectUrl);
    } else {
      // Default: navega a dashboard
      await this.router.navigate(['/dashboard']);
    }
  }
}
