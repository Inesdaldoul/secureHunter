import { Directive, Input, ElementRef, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({ 
  selector: '[safeHtml]',
  standalone: true
})
export class SafeHtmlDirective {
  @Input() set safeHtml(value: string) {
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, value);
    this.el.nativeElement.innerHTML = sanitized || '';
  }

  constructor(
    private el: ElementRef,
    private sanitizer: DomSanitizer
  ) { }
}