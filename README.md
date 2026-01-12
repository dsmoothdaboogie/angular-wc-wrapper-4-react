
# Angular 18 - Generic Web Component Wrapper

This demo showcases a reusable Angular component that dynamically loads any custom web component (e.g., built with React, Stencil, etc.).

## 🔧 Features
- Dynamic selector & prop binding
- Event handling via `CustomEvent`
- Optional resize tracking with `ResizeObserver`
- Angular 18 standalone component architecture

## 📦 Usage

```html
<generic-wc-wrapper
  [selector]="'cool-counter'"
  [props]="{ label: 'Votes', count: 3 }"
  [onEvent]="handleEvent"
></generic-wc-wrapper>
```
