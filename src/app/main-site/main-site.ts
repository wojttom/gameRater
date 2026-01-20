import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { VidGallery } from '../vid-gallery/vid-gallery';

@Component({
  selector: 'app-main-site',
  imports: [CommonModule, FormsModule, VidGallery],
  templateUrl: './main-site.html',
  styleUrls: ['./main-site.scss'],
})
export class MainSite implements OnInit {
  randomGame: any = null;
  loadingRandomGame = false;
  maxAttempts = 50;
  currentAttempt = 0;
  currentAppId = 0;

  minPriceFilter = 0;
  maxPriceFilter = 9999999;
  customPriceActive = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('gameRater - Curate your favorite games!');
  }

  setQuickPrice(min: number, max: number) {
    this.minPriceFilter = min;
    this.maxPriceFilter = max;
  }

  checkPriceFilter(gamePrice: number | null): boolean {
    if (gamePrice === null || gamePrice === 0) {
      return this.minPriceFilter === 0;
    }
    return gamePrice >= this.minPriceFilter && gamePrice <= this.maxPriceFilter;
  }

  getRandomGame() {
    this.loadingRandomGame = true;
    this.randomGame = null;
    this.currentAttempt = 0;

    const findRandomGame = (attempts = 0) => {
      this.currentAttempt = attempts + 1;

      if (attempts > this.maxAttempts) {
        this.loadingRandomGame = false;
        alert('Could not find a game. Please try again.');
        return;
      }

      const randomAppId = Math.floor(Math.random() * 1500000) + 1;
      this.currentAppId = randomAppId;

      this.http.get(`/api/steam/details/${randomAppId}`).subscribe({
        next: (data: any) => {
          if (data && data.name && data.type === 'game') {
            const gamePrice = data.price_overview?.final || 0;
            const isAvailable = data.is_free || data.price_overview !== undefined;

            if (isAvailable && this.checkPriceFilter(gamePrice)) {
              this.randomGame = data;
              this.loadingRandomGame = false;
            } else {
              setTimeout(() => findRandomGame(attempts + 1), 200);
            }
          } else {
            setTimeout(() => findRandomGame(attempts + 1), 200);
          }
        },
        error: () => {
          setTimeout(() => findRandomGame(attempts + 1), 200);
        },
      });
    };

    findRandomGame();
  }

  goToRandomGame() {
    if (this.randomGame) {
      this.router.navigate(['/g', this.randomGame.steam_appid]);
    }
  }
}
