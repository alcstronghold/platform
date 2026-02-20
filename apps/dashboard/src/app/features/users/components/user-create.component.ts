import { SignalFormDescriptor } from '@alcstronghold/infrastructure';
import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { email, FormField, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { UserManagementService } from '../../../core/services/user-management.service';

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-user-create',
  imports: [FormField, RouterLink],
  templateUrl: './user-create.component.html',
})
export class UserCreateComponent implements OnInit {
  private readonly userManagement = inject(UserManagementService);
  private readonly router = inject(Router);

  readonly policies = this.userManagement.policies;
  readonly selectedPolicyIds = signal(new Set<string>());
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly descriptor = new SignalFormDescriptor<CreateUserFormData>(
    { email: '', password: '', firstName: '', lastName: '' },
    (schema) => {
      required(schema.email, { message: 'El email es obligatorio' });
      email(schema.email, { message: 'El formato del email no es válido' });
      required(schema.password, { message: 'La contraseña es obligatoria' });
      minLength(schema.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
      required(schema.firstName, { message: 'El nombre es obligatorio' });
      required(schema.lastName, { message: 'El apellido es obligatorio' });
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
    await this.userManagement.loadPolicies();
  }

  togglePolicy(policyId: string): void {
    const current = new Set(this.selectedPolicyIds());
    if (current.has(policyId)) {
      current.delete(policyId);
    } else {
      current.add(policyId);
    }
    this.selectedPolicyIds.set(current);
  }

  isSelected(policyId: string): boolean {
    return this.selectedPolicyIds().has(policyId);
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

    if (result.success && result.user) {
      const policyIds = [...this.selectedPolicyIds()];
      if (policyIds.length > 0) {
        await this.userManagement.assignPolicies(result.user.id, policyIds);
      }
      await this.router.navigate(['/users']);
    } else {
      this.serverError.set(result.error ?? 'Error al crear el usuario');
    }

    this.isSubmitting.set(false);
  }
}
