# 📝 form-dirty

> Unsaved changes detection. Snapshot form state, expose `isDirty` + `changedFields`, handle `beforeunload` — in 3 lines. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/form-dirty)](https://www.npmjs.com/package/form-dirty)
[![npm downloads](https://img.shields.io/npm/dm/form-dirty)](https://www.npmjs.com/package/form-dirty)
[![bundle size](https://img.shields.io/bundlephobia/minzip/form-dirty)](https://bundlephobia.com/package/form-dirty)
[![license](https://img.shields.io/github/license/everything-frontend/form-dirty)](https://github.com/everything-frontend/form-dirty/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/types-included-blue)](https://www.npmjs.com/package/form-dirty)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-green)](https://www.npmjs.com/package/form-dirty)

**[Live Demo →](https://www.everythingfrontend.com/form-dirty)**

---

## Why

"You have unsaved changes — are you sure you want to leave?" gets asked on every StackOverflow forum. Detecting form dirtiness across native and controlled forms, handling `beforeunload`, figuring out *which* fields changed — it's consistently painful.

Full form libraries like react-hook-form handle it internally, but you have to buy into the entire system. There's no tiny, standalone "is this form dirty?" utility.

**form-dirty is that utility.** ~1.0kB gzipped. Zero dependencies. Works with DOM forms and controlled state (React, Vue, Svelte, anything).

---

## Install

```bash
npm install form-dirty
# or
yarn add form-dirty
# or
pnpm add form-dirty
```

---

## Quick Start

### DOM form

```ts
import FormDirty from 'form-dirty';

const fd = new FormDirty({
  form: '#my-form',
  beforeUnload: true,
});

// Check anytime
console.log(fd.isDirty);        // true / false
console.log(fd.changedFields);  // [{ name: 'email', original: '', current: 'hi@me.com' }]

// After saving, re-baseline
fd.snapshot();
```

### Controlled form (React / Vue / Svelte)

```ts
import FormDirty from 'form-dirty';

const fd = new FormDirty({
  fields: { name: '', email: '', bio: '' },
  beforeUnload: true,
  onDirtyChange: (dirty) => setHasUnsavedChanges(dirty),
});

// Whenever state changes
fd.update({ name: 'Ada', email: '', bio: '' });

console.log(fd.isDirty);        // true
console.log(fd.changedFields);  // [{ name: 'name', original: '', current: 'Ada' }]
```

---

## Features

- **Zero dependencies** — pure TypeScript, no external packages
- **DOM mode** — pass a form element or selector, tracks `<input>`, `<select>`, `<textarea>` automatically
- **Controlled mode** — pass initial fields object, call `update()` when state changes
- **`isDirty`** — single boolean, always up to date
- **`changedFields`** — array of `{ name, original, current }` for every changed field
- **`beforeunload` guard** — one option to prevent accidental navigation
- **`snapshot()`** — re-baseline after save
- **`onDirtyChange` callback** — fires only when dirty state transitions
- **Handles edge cases** — checkboxes, radio buttons, multi-selects, nested objects
- **SSR safe** — guards all DOM access behind `typeof window`
- **~1.0kB minified + gzipped**

---

## API

### `new FormDirty(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `form` | `HTMLFormElement \| string` | — | DOM form element or CSS selector |
| `fields` | `Record<string, unknown>` | — | Initial field values for controlled mode |
| `beforeUnload` | `boolean` | `false` | Auto-attach `beforeunload` guard |
| `onDirtyChange` | `(dirty: boolean) => void` | — | Called when dirty state changes |

### Instance properties

| Property | Type | Description |
|----------|------|-------------|
| `.isDirty` | `boolean` | Whether any field differs from the baseline |
| `.changedFields` | `ChangedField[]` | Array of changed fields with original and current values |

### Instance methods

| Method | Returns | Description |
|--------|---------|-------------|
| `.snapshot()` | `void` | Capture current state as the new clean baseline |
| `.update(fields)` | `void` | Push new field values (controlled mode) |
| `.guard(enable?)` | `void` | Toggle the `beforeunload` guard on/off |
| `.destroy()` | `void` | Remove all listeners and clean up |

### `ChangedField`

```ts
interface ChangedField {
  name: string;
  original: unknown;
  current: unknown;
}
```

---

## Examples

### React hook

```tsx
import { useEffect, useRef } from 'react';
import FormDirty from 'form-dirty';

function useFormDirty(fields: Record<string, unknown>) {
  const fdRef = useRef<FormDirty | null>(null);

  useEffect(() => {
    fdRef.current = new FormDirty({
      fields,
      beforeUnload: true,
    });
    return () => fdRef.current?.destroy();
  }, []);

  useEffect(() => {
    fdRef.current?.update(fields);
  }, [fields]);

  return {
    get isDirty() { return fdRef.current?.isDirty ?? false; },
    get changedFields() { return fdRef.current?.changedFields ?? []; },
    snapshot: () => fdRef.current?.snapshot(),
  };
}
```

### Vue composable

```ts
import { onMounted, onUnmounted, reactive } from 'vue';
import FormDirty from 'form-dirty';

export function useFormDirty(formSelector: string) {
  let fd: FormDirty;
  const state = reactive({ isDirty: false, changedFields: [] as any[] });

  onMounted(() => {
    fd = new FormDirty({
      form: formSelector,
      beforeUnload: true,
      onDirtyChange: (dirty) => {
        state.isDirty = dirty;
        state.changedFields = fd.changedFields;
      },
    });
  });

  onUnmounted(() => fd?.destroy());

  return { state, snapshot: () => fd?.snapshot() };
}
```

### Snapshot after save

```ts
const fd = new FormDirty({ form: '#settings-form', beforeUnload: true });

async function handleSave() {
  await fetch('/api/settings', { method: 'POST', body: getFormData() });
  fd.snapshot(); // current state is now the new baseline
}
```

### CDN (no build step)

```html
<script type="module">
  import FormDirty from 'https://esm.sh/form-dirty';

  const fd = new FormDirty({
    form: '#contact-form',
    beforeUnload: true,
    onDirtyChange: (dirty) => {
      document.getElementById('save-btn').disabled = !dirty;
    },
  });
</script>
```

---

## License

[MIT](https://github.com/everything-frontend/form-dirty/blob/main/LICENSE)
