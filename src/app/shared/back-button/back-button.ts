import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  template: `
    <button class="backBtn" (click)="goBack()">
      <span class="backIcon">←</span>
      <span class="backText">{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .backBtn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .backBtn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
      }
      .backIcon {
        font-size: 18px;
      }
    `,
  ],
})
export class BackButtonComponent {
  @Input() label: string = 'Back';
  @Input() fallbackUrl: string = '/';

  constructor(private location: Location, private router: Router) {}

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.fallbackUrl]);
    }
  }
}
