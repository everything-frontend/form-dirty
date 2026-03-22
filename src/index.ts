export interface FormDirtyOptions {
  form?: HTMLFormElement | string;
  fields?: Record<string, unknown>;
  beforeUnload?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export interface ChangedField {
  name: string;
  original: unknown;
  current: unknown;
}

type FieldMap = Record<string, unknown>;

function resolveForm(form: HTMLFormElement | string): HTMLFormElement | null {
  if (typeof form === "string") {
    return document.querySelector<HTMLFormElement>(form);
  }
  return form;
}

function readFormValues(form: HTMLFormElement): FieldMap {
  const values: FieldMap = {};
  const elements = form.elements;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const name = el.getAttribute("name");
    if (!name) continue;

    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") {
        values[name] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) values[name] = el.value;
        else if (!(name in values)) values[name] = "";
      } else if (el.type === "file") {
        continue;
      } else {
        values[name] = el.value;
      }
    } else if (el instanceof HTMLSelectElement) {
      if (el.multiple) {
        values[name] = Array.from(el.selectedOptions).map((o) => o.value);
      } else {
        values[name] = el.value;
      }
    } else if (el instanceof HTMLTextAreaElement) {
      values[name] = el.value;
    }
  }

  return values;
}

function cloneFields(fields: FieldMap): FieldMap {
  const out: FieldMap = {};
  for (const key in fields) {
    const v = fields[key];
    out[key] =
      typeof v === "object" && v !== null ? JSON.parse(JSON.stringify(v)) : v;
  }
  return out;
}

function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object" && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

export class FormDirty {
  private formEl: HTMLFormElement | null = null;
  private baseline: FieldMap = {};
  private current: FieldMap = {};
  private wasDirty = false;
  private guardActive = false;
  private opts: FormDirtyOptions;
  private boundOnInput: (() => void) | null = null;
  private boundBeforeUnload: ((e: BeforeUnloadEvent) => void) | null = null;

  constructor(options: FormDirtyOptions = {}) {
    this.opts = options;

    if (options.form) {
      this.formEl =
        typeof window !== "undefined" ? resolveForm(options.form) : null;
      if (this.formEl) {
        this.baseline = readFormValues(this.formEl);
        this.current = readFormValues(this.formEl);
        this.boundOnInput = () => this.handleInput();
        this.formEl.addEventListener("input", this.boundOnInput);
        this.formEl.addEventListener("change", this.boundOnInput);
      }
    } else if (options.fields) {
      this.baseline = cloneFields(options.fields);
      this.current = cloneFields(options.fields);
    }

    if (options.beforeUnload) {
      this.guard(true);
    }
  }

  get isDirty(): boolean {
    const allKeys = new Set([
      ...Object.keys(this.baseline),
      ...Object.keys(this.current),
    ]);
    for (const key of allKeys) {
      if (!eq(this.baseline[key], this.current[key])) return true;
    }
    return false;
  }

  get changedFields(): ChangedField[] {
    const changed: ChangedField[] = [];
    const allKeys = new Set([
      ...Object.keys(this.baseline),
      ...Object.keys(this.current),
    ]);
    for (const key of allKeys) {
      if (!eq(this.baseline[key], this.current[key])) {
        changed.push({
          name: key,
          original: this.baseline[key],
          current: this.current[key],
        });
      }
    }
    return changed;
  }

  snapshot(): void {
    if (this.formEl) {
      this.baseline = readFormValues(this.formEl);
      this.current = readFormValues(this.formEl);
    } else {
      this.baseline = cloneFields(this.current);
    }
    this.notify();
  }

  update(fields: FieldMap): void {
    this.current = cloneFields(fields);
    this.notify();
  }

  guard(enable = true): void {
    if (typeof window === "undefined") return;

    if (enable && !this.guardActive) {
      this.boundBeforeUnload = (e: BeforeUnloadEvent) => {
        if (this.isDirty) {
          e.preventDefault();
        }
      };
      window.addEventListener("beforeunload", this.boundBeforeUnload);
      this.guardActive = true;
    } else if (!enable && this.guardActive) {
      if (this.boundBeforeUnload) {
        window.removeEventListener("beforeunload", this.boundBeforeUnload);
        this.boundBeforeUnload = null;
      }
      this.guardActive = false;
    }
  }

  destroy(): void {
    if (this.formEl && this.boundOnInput) {
      this.formEl.removeEventListener("input", this.boundOnInput);
      this.formEl.removeEventListener("change", this.boundOnInput);
    }
    this.guard(false);
    this.formEl = null;
    this.baseline = {};
    this.current = {};
  }

  private handleInput(): void {
    if (this.formEl) {
      this.current = readFormValues(this.formEl);
    }
    this.notify();
  }

  private notify(): void {
    const dirty = this.isDirty;
    if (dirty !== this.wasDirty) {
      this.wasDirty = dirty;
      this.opts.onDirtyChange?.(dirty);
    }
  }
}

export default FormDirty;
