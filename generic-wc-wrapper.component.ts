
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'generic-wc-wrapper',
  standalone: true,
  template: '<div #container></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericWcWrapperComponent implements AfterViewInit, OnDestroy {
  @Input() selector!: string;
  @Input() props: Record<string, any> = {};
  @Input() onEvent?: (event: Event) => void;
  @Input() onLoaded?: (element: HTMLElement) => void;
  @Input() onResize?: (entry: ResizeObserverEntry) => void;

  @ViewChild('container', { static: true }) containerRef!: ElementRef;

  private element!: HTMLElement;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    if (!this.selector) return;

    this.element = document.createElement(this.selector);

    Object.entries(this.props || {}).forEach(([key, value]) => {
      this.element[key] = value;
    });

    this.containerRef.nativeElement.appendChild(this.element);

    if (this.onEvent) {
      this.element.addEventListener('custom-event', this.onEvent);
    }

    if (this.onResize) {
      this.resizeObserver = new ResizeObserver(([entry]) => this.onResize?.(entry));
      this.resizeObserver.observe(this.element);
    }

    if (this.onLoaded) {
      this.onLoaded(this.element);
    }
  }

  ngOnDestroy() {
    if (this.onEvent) {
      this.element.removeEventListener('custom-event', this.onEvent);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
