import { SignalFormDescriptor } from '@alcstronghold/infrastructure';
import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { email, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { UserManagementService } from '../../../core/services/user-management.service';

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

@Component({
  selector: 'app-user-create',
  imports: [FormField],
  templateUrl: './user-create.component.html',
})
export class UserCreateComponent implements OnInit {
  private readonly userManagement = inject(UserManagementService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly roles = this.userManagement.roles;

  readonly descriptor = new SignalFormDescriptor<CreateUserFormData>(
    { email: '', password: '', firstName: '', lastName: '', roleId: '' },
    (schema) => {
      required(schema.email, { message: 'El email es obligatorio' });
      email(schema.email, { message: 'El formato del email no es válido' });
      required(schema.password, { message: 'La contraseña es obligatoria' });
      minLength(schema.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
      required(schema.firstName, { message: 'El nombre es obligatorio' });
      required(schema.lastName, { message: 'El apellido es obligatorio' });
      required(schema.roleId, { message: 'El rol es obligatorio' });
    }
  );

  readonly emailError = computed(() => {
    const field = this.descriptor.form.email();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly passwordError = computed(() => {
    const field = this.descriptor.form.password();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly firstNameError = computed(() => {
    const field = this.descriptor.form.firstName();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly lastNameError = computed(() => {
    const field = this.descriptor.form.lastName();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  async ngOnInit(): Promise<void> {
    await this.userManagement.loadRoles();
  }

  async submit(): Promise<void> {
    if (!this.descriptor.form().valid()) {
      this.descriptor.form.email().markAsTouched();
      this.descriptor.form.password().markAsTouched();
      this.descriptor.form.firstName().markAsTouched();
      this.descriptor.form.lastName().markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const data = this.descriptor.model();
    const result = await this.userManagement.createUser(data);

    this.isSubmitting.set(false);

    if (result.success) {
      await this.router.navigate(['/users']);
    } else {
      this.serverError.set(result.error ?? 'Error al crear el usuario');
    }
  }
}
