import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-badge',
  template: `
    <span class="gameBadge" (click)="goToGame($event)">
      @if (game.tiny_image || game.header_image || game.capsule_image) {
        <img
          class="gameBadgeIcon"
          [src]="game.tiny_image || game.header_image || game.capsule_image"
          [alt]="game.name"
          onerror="this.style.display='none'"
        />
      } @else {
        <span class="gameBadgePlaceholder">🎮</span>
      }
      <span class="gameBadgeName">{{ game.name }}</span>
    </span>
  `,
  styles: [
    `
      .gameBadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
        border: 1px solid rgba(102, 126, 234, 0.4);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
        color: #fff;
      }

      .gameBadge:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4));
        border-color: rgba(102, 126, 234, 0.7);
        transform: translateY(-1px);
      }

      .gameBadgeIcon {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        object-fit: cover;
      }

      .gameBadgePlaceholder {
        font-size: 14px;
      }

      .gameBadgeName {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
  standalone: true,
})
export class GameBadgeComponent {
  @Input() game!: {
    appid: string | number;
    name: string;
    tiny_image?: string;
    header_image?: string;
    capsule_image?: string;
  };
  @Input() stopPropagation: boolean = false;

  constructor(private router: Router) {}

  goToGame(event: Event) {
    if (this.stopPropagation) {
      event.stopPropagation();
    }
    this.router.navigate(['/g', this.game.appid]);
  }
}
