
import { Component } from '@angular/core';
import { GenericWcWrapperComponent } from './generic-wc-wrapper.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GenericWcWrapperComponent],
  template: \`
    <h2>Dynamic Web Component Wrapper</h2>
    <generic-wc-wrapper
      [selector]="'cool-counter'"
      [props]="{
        count: 5,
        label: 'Upvotes',
        disabled: false
      }"
      [onEvent]="handleCustomEvent"
      [onLoaded]="handleWcLoad"
      [onResize]="handleResize"
    ></generic-wc-wrapper>
  \`
})
export class AppComponent {
  handleCustomEvent(event: Event) {
    console.log('[Angular] Custom event received:', event);
  }

  handleWcLoad = (element: HTMLElement) => {
    console.log('[Angular] Web component loaded:', element);
  };

  handleResize = (entry: ResizeObserverEntry) => {
    console.log('[Angular] Resize detected:', entry.contentRect);
  };
}
