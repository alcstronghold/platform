import { TestBed } from '@angular/core/testing';
import { email, required } from '@angular/forms/signals';
import { beforeEach, describe, expect, it } from 'vitest';

import { SignalFormDescriptor } from './signal-form-descriptor';

interface TestFormData {
  name: string;
  email: string;
  age: number;
}

describe('SignalFormDescriptor', () => {
  let descriptor: SignalFormDescriptor<TestFormData>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          () => {}
        );

        expect(descriptor.model()).toEqual({ name: '', email: '', age: 0 });
        expect(descriptor.isPristine()).toBe(true);
        // Sin validaciones, un formulario vacío es VALID
        expect(descriptor.formStatus()).toBe('VALID');
      });
    });

    it('should initialize with custom values', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@example.com', age: 30 },
          () => {}
        );

        expect(descriptor.model()).toEqual({ name: 'John', email: 'john@example.com', age: 30 });
      });
    });

    it('should apply validation schema', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          (schema) => {
            required(schema.name, { message: 'Name is required' });
            email(schema.email, { message: 'Invalid email' });
          }
        );

        expect(descriptor.form().valid()).toBe(false);

        const nameErrors = descriptor.form.name().errors();
        expect(nameErrors.length).toBeGreaterThan(0);
        expect(nameErrors[0].message).toBe('Name is required');
      });
    });
  });

  describe('patchValue', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          () => {}
        );
      });
    });

    it('should update partial model values', () => {
      descriptor.form.name().value.set('Alice');

      expect(descriptor.model()).toEqual({ name: 'Alice', email: '', age: 0 });
    });

    it('should update multiple fields', () => {
      descriptor.updateModel({ name: 'Bob', email: 'bob@test.com' });

      expect(descriptor.model()).toEqual({ name: 'Bob', email: 'bob@test.com', age: 0 });
    });

    it('should mark form as dirty after patch', () => {
      expect(descriptor.isPristine()).toBe(true);

      descriptor.form.name().value.set('Charlie');

      expect(descriptor.isPristine()).toBe(false);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          () => {}
        );
      });
    });

    it('should reset to new values', () => {
      descriptor.updateModel({ name: 'Alice', email: 'alice@test.com' });

      descriptor.reset({ name: 'Bob', email: 'bob@test.com', age: 25 });

      expect(descriptor.model()).toEqual({ name: 'Bob', email: 'bob@test.com', age: 25 });
    });

    it('should mark form as pristine after reset', () => {
      descriptor.form.name().value.set('Alice');
      expect(descriptor.isPristine()).toBe(false);

      descriptor.reset({ name: '', email: '', age: 0 });

      expect(descriptor.isPristine()).toBe(true);
    });

    it('should clear error state on reset', () => {
      descriptor.hasError.set(true);

      descriptor.reset({ name: '', email: '', age: 0 });

      expect(descriptor.hasError()).toBe(false);
    });
  });

  describe('markAsSaved', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          () => {}
        );
      });
    });

    it('should mark current values as original', () => {
      descriptor.updateModel({ name: 'Alice', email: 'alice@test.com' });
      expect(descriptor.isPristine()).toBe(false);

      descriptor.markAsSaved();

      expect(descriptor.isPristine()).toBe(true);
    });

    it('should clear error state', () => {
      descriptor.hasError.set(true);

      descriptor.markAsSaved();

      expect(descriptor.hasError()).toBe(false);
    });
  });

  describe('isPristine computed', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@test.com', age: 30 },
          () => {}
        );
      });
    });

    it('should be true initially', () => {
      expect(descriptor.isPristine()).toBe(true);
    });

    it('should be false after changes', () => {
      descriptor.form.name().value.set('Jane');
      expect(descriptor.isPristine()).toBe(false);
    });

    it('should be true after resetting to original values', () => {
      descriptor.form.name().value.set('Jane');
      expect(descriptor.isPristine()).toBe(false);

      descriptor.form.name().value.set('John');
      expect(descriptor.isPristine()).toBe(true);
    });
  });

  describe('enabledForm computed', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          (schema) => {
            required(schema.name, { message: 'Name is required' });
          }
        );
      });
    });

    it('should be false when pristine', () => {
      expect(descriptor.enabledForm()).toBe(false);
    });

    it('should be false when dirty but invalid', () => {
      descriptor.form.email().value.set('test@test.com');
      expect(descriptor.enabledForm()).toBe(false);
    });

    it('should be true when dirty and valid', () => {
      descriptor.updateModel({ name: 'Alice', email: 'alice@test.com' });
      expect(descriptor.enabledForm()).toBe(true);
    });
  });

  describe('disabledForm computed', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@test.com', age: 30 },
          () => {}
        );
      });
    });

    it('should be opposite of enabledForm', () => {
      expect(descriptor.disabledForm()).toBe(!descriptor.enabledForm());

      descriptor.form.name().value.set('Jane');
      expect(descriptor.disabledForm()).toBe(!descriptor.enabledForm());
    });
  });

  describe('formStatus computed', () => {
    it('should return INVALID when form has errors', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          (schema) => {
            required(schema.name, { message: 'Name is required' });
          }
        );

        expect(descriptor.formStatus()).toBe('INVALID');
      });
    });

    it('should return VALID when form has no errors', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@test.com', age: 30 },
          () => {}
        );

        expect(descriptor.formStatus()).toBe('VALID');
      });
    });

    it('should return DISABLED when form is disabled', () => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@test.com', age: 30 },
          () => {}
        );

        descriptor.disable();

        expect(descriptor.formStatus()).toBe('DISABLED');
      });
    });
  });

  describe('disable/enable/toggle', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: 'John', email: 'john@test.com', age: 30 },
          () => {}
        );
      });
    });

    it('should disable form', () => {
      descriptor.disable();

      expect(descriptor.isDisabled()).toBe(true);
      expect(descriptor.formStatus()).toBe('DISABLED');
    });

    it('should enable form', () => {
      descriptor.disable();
      descriptor.enable();

      expect(descriptor.isDisabled()).toBe(false);
    });

    it('should toggle disabled state', () => {
      expect(descriptor.isDisabled()).toBe(false);

      descriptor.toggleDisabled();
      expect(descriptor.isDisabled()).toBe(true);

      descriptor.toggleDisabled();
      expect(descriptor.isDisabled()).toBe(false);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      TestBed.runInInjectionContext(() => {
        descriptor = new SignalFormDescriptor<TestFormData>(
          { name: '', email: '', age: 0 },
          () => {}
        );
      });
    });

    it('should have hasError signal', () => {
      expect(descriptor.hasError()).toBe(false);

      descriptor.hasError.set(true);

      expect(descriptor.hasError()).toBe(true);
    });

    it('should clear error on value change', async () => {
      descriptor.hasError.set(true);
      expect(descriptor.hasError()).toBe(true);

      descriptor.form.name().value.set('Alice');

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(descriptor.hasError()).toBe(false);
    });

    it('should support persistent errors', () => {
      descriptor.isErrorPersistent.set(true);
      descriptor.hasError.set(true);

      expect(descriptor.hasError()).toBe(true);
      expect(descriptor.isErrorPersistent()).toBe(true);
    });

    it('should configure non-persistent error timeout', () => {
      descriptor.isErrorPersistent.set(false);
      descriptor.errorTimeoutSeconds.set(5);

      expect(descriptor.isErrorPersistent()).toBe(false);
      expect(descriptor.errorTimeoutSeconds()).toBe(5);
    });
  });
});
