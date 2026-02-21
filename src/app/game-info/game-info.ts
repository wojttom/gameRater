import { firstValueFrom } from 'rxjs';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { GameDetails } from '../../../backend/models/game';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../shared/back-button/back-button';
import { MarkdownPipe } from '../shared/mics/markdown.pipe';
import { StripMarkdownPipe } from '../shared/mics/strip-markdown.pipe';
import Hls from 'hls.js';

@Component({
  selector: 'app-game-info',
  imports: [
    DecimalPipe,
    DatePipe,
    FormsModule,
    BackButtonComponent,
    MarkdownPipe,
    StripMarkdownPipe,
  ],
  templateUrl: './game-info.html',
  styleUrl: './game-info.scss',
})
export class GameInfo implements OnInit {
  gameDetails: any = null;
  loading = false;
  error = '';
  currentAppId: number | string = '';
  window = window;
  dominantColor: string = '#1b2838';
  galleryOpen = false;
  currentScreenshotIndex = 0;
  currentScreenshot: any = null;
  currentItemType: 'screenshot' | 'movie' = 'screenshot';
  allGalleryItems: any[] = [];
  game: any = null;
  isDLC = false;
  isCustomGame = false;
  createdBy: any = null;
  @ViewChild('videoPlayer') videoPlayer: ElementRef | undefined;
  private hlsInstance: any = null;

  isLoggedIn = false;
  currentUsername: string = '';
  currentUserId: string = '';
  isFavorite = false;
  userReview: any = null;
  showReviewForm = false;
  reviewRating = 5;
  reviewText = '';
  reviews: any[] = [];
  movies: Array<{ id: any; safeHtml: SafeHtml; name?: string }> = [];
  relatedPosts: any[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private sanitizer: DomSanitizer,
  ) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToUserProfile(username: string) {
    this.router.navigate(['/u', username]);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const gameId = params['appid'];
      if (gameId) {
        this.loadGameDetails(gameId);
      } else {
        this.error = 'Invalid game ID in URL';
      }
    });
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.currentUsername = user.username;
      this.currentUserId = user.id;
    }
  }
  loadGameDetails(gameId: string) {
    this.loading = true;
    this.error = '';
    this.gameDetails = null;

    this.http.get<GameDetails>(`/api/steam/details/${gameId}`).subscribe({
      next: (data) => {
        this.gameDetails = data;
        this.loading = false;
        this.titleService.setTitle(data.name + ' - Game Details');

        this.currentAppId = data.appid || gameId;
        this.isCustomGame = typeof data.appid === 'string' && /^c\d/.test(data.appid);
        this.createdBy = data.createdBy || null;
        this.checkIfFavorite();
        this.loadReviews();
        this.loadRelatedPosts();
        this.isDLC = data.type === 'dlc';
        this.game = data.fullgame || null;
        this.prepareMovies();
        this.prepareGalleryItems();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to fetch game details.';
        this.loading = false;
      },
    });
  }

  goToRawData() {
    window.open(
      `https://store.steampowered.com/api/appdetails?appids=${this.currentAppId}&l=english&cc=EN`,
      '_blank',
    );
  }

  openStore(appid: number) {
    window.open(`https://store.steampowered.com/app/${appid}`, '_blank');
  }

  goToMainGame() {
    if (this.game?.appid) {
      window.location.href = `/g/${this.game.appid}`;
    }
  }

  openGallery(index: number) {
    this.currentScreenshotIndex = index;
    const item = this.allGalleryItems[index];
    if (item.type === 'movie') {
      this.currentItemType = 'movie';
      this.currentScreenshot = item;
    } else {
      this.currentItemType = 'screenshot';
      this.currentScreenshot = item;
    }
    this.galleryOpen = true;
    document.body.style.overflow = 'hidden';
    if (item.type === 'movie') {
      setTimeout(() => {
        this.initHlsPlayer(item.hls_h264);
      }, 100);
    }
  }

  initHlsPlayer(streamUrl: string) {
    if (!this.videoPlayer) return;

    const videoElement = this.videoPlayer.nativeElement as HTMLVideoElement;
    try {
      if (this.hlsInstance && typeof this.hlsInstance.destroy === 'function') {
        this.hlsInstance.destroy();
        this.hlsInstance = null;
      }
    } catch (e) {}

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
      this.hlsInstance = hls;
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = streamUrl;
    }
  }

  prepareGalleryItems() {
    this.allGalleryItems = [];
    if (this.movies && this.movies.length > 0) {
      this.movies.forEach((movie: any) => {
        if (movie.thumbnail || movie.hls || movie.hls_h264) {
          this.allGalleryItems.push({
            ...movie,
            type: 'movie',
            id: `movie_${movie.id}`,
          });
        }
      });
    }

    if (this.gameDetails.screenshots && this.gameDetails.screenshots.length > 0) {
      this.gameDetails.screenshots.forEach((screenshot: any) => {
        this.allGalleryItems.push({
          ...screenshot,
          type: 'screenshot',
        });
      });
    }
  }

  closeGallery() {
    this.galleryOpen = false;
    document.body.style.overflow = 'auto';
  }

  nextScreenshot() {
    if (this.currentScreenshotIndex < this.allGalleryItems.length - 1) {
      this.currentScreenshotIndex++;
      const item = this.allGalleryItems[this.currentScreenshotIndex];
      this.currentScreenshot = item;
      this.currentItemType = item.type;
      if (item.type === 'movie') {
        setTimeout(() => {
          const stream = item.hls_h264 || item.hls || item.video_url;
          if (stream) this.initHlsPlayer(stream);
        }, 100);
      } else {
        try {
          if (this.hlsInstance && typeof this.hlsInstance.destroy === 'function') {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
          }
          if (this.videoPlayer) {
            const ve = this.videoPlayer.nativeElement as HTMLVideoElement;
            ve.src = '';
          }
        } catch (e) {}
      }
    }
  }

  prevScreenshot() {
    if (this.currentScreenshotIndex > 0) {
      this.currentScreenshotIndex--;
      const item = this.allGalleryItems[this.currentScreenshotIndex];
      this.currentScreenshot = item;
      this.currentItemType = item.type;
      if (item.type === 'movie') {
        setTimeout(() => {
          const stream = item.hls_h264 || item.hls || item.video_url;
          if (stream) this.initHlsPlayer(stream);
        }, 100);
      } else {
        try {
          if (this.hlsInstance && typeof this.hlsInstance.destroy === 'function') {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
          }
          if (this.videoPlayer) {
            const ve = this.videoPlayer.nativeElement as HTMLVideoElement;
            ve.src = '';
          }
        } catch (e) {}
      }
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (!this.galleryOpen) return;
    if (event.key === 'ArrowRight') this.nextScreenshot();
    if (event.key === 'ArrowLeft') this.prevScreenshot();
    if (event.key === 'Escape') this.closeGallery();
  }

  async toggleFavorite() {
    if (!this.isLoggedIn) {
      alert('Please sign in to add games to favorites');
      return;
    }

    if (this.isFavorite) {
      this.http
        .delete(`/api/user/${this.currentUsername}/favorites/${this.currentAppId}`)
        .subscribe({
          next: () => {
            this.isFavorite = false;
          },
          error: (err) => {
            console.error('Error removing from favorites', err);
          },
        });
    } else {
      let header_image = this.gameDetails.header_image || '';
      let capsule_image = this.gameDetails.capsule_image || '';
      if ((!header_image || !capsule_image) && this.currentAppId) {
        try {
          const details: any = await firstValueFrom(
            this.http.get(`/api/steam/details/${this.currentAppId}`),
          );
          if (!header_image && details.header_image) header_image = details.header_image;
          if (!capsule_image && details.capsule_image) capsule_image = details.capsule_image;
        } catch (e) {}
      }
      this.http
        .post(`/api/user/${this.currentUsername}/favorites/${this.currentAppId}`, {
          gameName: this.gameDetails.name,
          isCustom: this.isCustomGame,
          header_image,
          capsule_image,
        })
        .subscribe({
          next: () => {
            this.isFavorite = true;
          },
          error: (err) => {
            console.error('Error adding to favorites', err);
          },
        });
    }
  }

  submitReview() {
    if (!this.isLoggedIn) {
      alert('Please sign in to write a review');
      return;
    }

    if (!this.reviewText.trim()) {
      alert('Please enter your review');
      return;
    }

    const reviewData = {
      gameAppId: this.currentAppId,
      gameName: this.gameDetails.name,
      rating: this.reviewRating,
      text: this.reviewText,
    };

    this.http.post(`/api/user/${this.currentUsername}/reviews`, reviewData).subscribe({
      next: () => {
        this.showReviewForm = false;
        this.reviewText = '';
        this.reviewRating = 5;
        this.loadReviews();
      },
      error: (err) => {
        console.error('Error saving review', err);
        alert('Error saving review');
      },
    });
  }

  private prepareMovies() {
    const movies = this.gameDetails?.movies || [];
    this.movies = movies
      .filter((m: any) => m?.embed_html || m?.video_url)
      .map((m: any, idx: number) => ({
        ...m,
        id: m.id ?? idx,
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(m.embed_html || m.video_url || ''),
      }));
  }

  loadReviews() {
    this.http.get(`/api/reviews/game/${this.currentAppId}`).subscribe({
      next: (data: any) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Error loading reviews', err);
      },
    });
  }

  loadRelatedPosts() {
    this.http.get(`/api/posts/game/${this.currentAppId}`).subscribe({
      next: (data: any) => {
        this.relatedPosts = data;
      },
      error: (err) => {
        console.error('Error loading related posts', err);
      },
    });
  }

  goToPost(post: any) {
    const username = post.authorId?.username || post.authorId;
    this.router.navigate(['/u', username, 'post', post._id]);
  }

  checkIfFavorite() {
    if (!this.isLoggedIn) return;

    this.http.get(`/api/user/${this.currentUsername}`).subscribe({
      next: (user: any) => {
        this.isFavorite = user.favorites.some((fav: any) => {
          return fav.appid === this.currentAppId;
        });
      },
      error: (err) => {
        console.error('Error checking favorites', err);
      },
    });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.http.delete(`/api/reviews/${reviewId}`).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
      },
    });
  }
}
