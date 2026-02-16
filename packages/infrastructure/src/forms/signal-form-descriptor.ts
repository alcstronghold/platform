// noinspection JSUnusedGlobalSymbols

import { computed, type Signal, signal, type WritableSignal } from '@angular/core';
import type { FormControlStatus } from '@angular/forms';
import { disabled, type FieldTree, form, type FormOptions, type SchemaOrSchemaFn, type SchemaPath } from '@angular/forms/signals';
import { isEqual } from 'lodash-es';

export class SignalFormDescriptor<TModel> {
  readonly form: FieldTree<TModel>;
  readonly model: Signal<TModel>;
  readonly formStatus: Signal<FormControlStatus>;
  readonly isPristine: Signal<boolean>;
  readonly enabledForm: Signal<boolean>;
  readonly disabledForm: Signal<boolean>;
  private readonly _model: WritableSignal<TModel>;
  private readonly _original: WritableSignal<TModel>;
  private readonly _isDisabled = signal(false);
  readonly isDisabled = this._isDisabled.asReadonly();

  constructor(
    initialValue: TModel,
    schemaFn: SchemaOrSchemaFn<TModel> = () => {},
    options?: FormOptions,
  ) {
    this._model = signal({ ...initialValue });
    this.form = form(this._model, (root) => {
      disabled(root as SchemaPath<TModel>, () => this._isDisabled());
      if (typeof schemaFn === 'function') schemaFn(root);
    }, options ?? {});

    this._original = signal({ ...initialValue });

    this.model = this._model.asReadonly();
    this.formStatus = computed((): FormControlStatus => {
      const field = this.form();

      if (field.disabled()) return 'DISABLED';
      if (field.pending()) return 'PENDING';
      if (field.valid()) return 'VALID';

      return 'INVALID';
    });

    this.isPristine = computed(() => {
      const current = this._model();
      const original = this._original();

      return isEqual(original, current);
    });
    this.enabledForm = computed(() => {
      const dirty = !this.isPristine();
      const valid = this.form().valid();

      return dirty && valid;
    });

    this.disabledForm = computed(() => !this.enabledForm());
  }

  disable(): void {
    this._isDisabled.set(true);
  }

  enable(): void {
    this._isDisabled.set(false);
  }

  toggleDisabled(): void {
    this._isDisabled.update((v) => !v);
  }

  updateModel(value: Partial<TModel>): void {
    this._model.update((current) => ({ ...current, ...value }));
  }

  reset(value: TModel): void {
    this._model.set({ ...value });
    this._original.set({ ...value });
  }

  markAsSaved(): void {
    const current = this._model();

    this._original.set({ ...current });
  }
}
