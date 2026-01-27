// noinspection JSUnusedGlobalSymbols

import { computed, DestroyRef, effect, inject, type Signal, signal, type WritableSignal } from '@angular/core';
import type { FormControlStatus } from '@angular/forms';
import {
  disabled,
  type FieldTree,
  form,
  type FormOptions,
  type PathKind,
  type SchemaOrSchemaFn,
  type SchemaPath
} from '@angular/forms/signals';
import { isEqual } from 'lodash-es';

export class SignalFormDescriptor<TModel> {
  private static readonly ERROR_TIMEOUT_SECONDS: number = 15;

  private readonly _original: WritableSignal<TModel>;
  private readonly _lastValue: WritableSignal<TModel>;
  private readonly _model: WritableSignal<TModel>;
  readonly model: Signal<TModel>;
  readonly form: FieldTree<TModel>;
  readonly formStatus: Signal<FormControlStatus>;
  readonly isPristine: Signal<boolean>;
  readonly enabledForm: Signal<boolean>;
  readonly disabledForm: Signal<boolean>;
  readonly hasError: WritableSignal<boolean>;
  readonly isErrorPersistent: WritableSignal<boolean>;
  readonly errorTimeoutSeconds: WritableSignal<number>;

  private errorTimeoutId?: NodeJS.Timeout;
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isDisabled = signal(false);
  readonly isDisabled = this._isDisabled.asReadonly();

  constructor(
    initialValue: TModel,
    schemaFn: SchemaOrSchemaFn<TModel> = () => {},
    options?: FormOptions,
  ) {
    this._model = signal({ ...initialValue });

    this.form = form(this._model, (root) => {
      disabled(root as SchemaPath<TModel, 1, PathKind.Root>, () => this._isDisabled());
      if (typeof schemaFn === 'function')         schemaFn(root);
    }, options ?? {});

    this._original = signal({ ...initialValue });
    this._lastValue = signal({ ...initialValue });
    this.hasError = signal(false);
    this.isErrorPersistent = signal(true);
    this.errorTimeoutSeconds = signal(SignalFormDescriptor.ERROR_TIMEOUT_SECONDS);
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

    this.setupEffects();
    this.destroyRef.onDestroy(() => this.destroy());
  }

  private setupEffects(): void {
    effect(() => {
      const value = this._model();

      if (value == null || isEqual(this._lastValue(), value)) return;

      this._lastValue.set({ ...value });
      this.hasError.set(false);
    });

    effect(() => {
      if (this.isErrorPersistent() || !this.hasError()) return;

      this.clearErrorTimeout();

      this.errorTimeoutId = setTimeout(() => {
        this.hasError.set(false);
      }, this.errorTimeoutSeconds() * 1000);
    });
  }

  private destroy(): void {
    this.clearErrorTimeout();
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
    this._lastValue.set({ ...value });
    this.clearErrorState();
  }

  markAsSaved(): void {
    const current = this._model();

    this._original.set({ ...current });
    this._lastValue.set({ ...current });
    this.clearErrorState();
  }

  private clearErrorTimeout(): void {
    if (this.errorTimeoutId == null) return;
    clearTimeout(this.errorTimeoutId);
    this.errorTimeoutId = undefined;
  }

  private clearErrorState(): void {
    this.clearErrorTimeout();
    this.hasError.set(false);
  }
}
