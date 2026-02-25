import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PasswordValidation } from '../../../backend/services/passwdValidation';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { PostCardComponent } from '../shared/post-card/post-card';
import { PostEditorComponent } from '../shared/post-editor/post-editor';
import { BackButtonComponent } from '../shared/back-button/back-button';
import { VoteButtonsComponent } from '../shared/vote-buttons/vote-buttons';
import { MarkdownPipe } from '../shared/mics/markdown.pipe';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  imports: [
    FormsModule,
    DatePipe,
    PostCardComponent,
    PostEditorComponent,
    BackButtonComponent,
    VoteButtonsComponent,
    MarkdownPipe,
  ],
})
export class UserProfile implements OnInit {
  username: string = '';
  user: any = null;
  loading = false;
  error = '';
  editMode = false;
  editUser = { email: '', password: '', avatar: '', emailPublic: false, bio: '' };
  isCurrentUser = false;
  isLoggedIn = false;
  editError = '';
  userReviews: any[] = [];
  userVote: number | null = null;

  userPosts: any[] = [];
  showPostEditor = false;
  loadingPosts = false;
  hasMorePosts = false;
  postsPage = 1;
  isVoting = false;
  private gameImageCache = new Map<string, string>();
  private gameImagePending = new Set<string>();
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.username = params['username'];
      const storedUser = localStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      this.isCurrentUser = currentUser?.username === this.username;
      this.isLoggedIn = !!currentUser;

      if (this.username) {
        this.titleService.setTitle(`${this.username} - gameRater`);
        this.loadUser();
        this.loadUserPosts();
      }
    });
  }

  loadUser() {
    this.loading = true;
    this.error = '';
    this.user = null;
    this.http.get(`/api/user/${this.username}`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
        this.loadUserReviews();
        this.loadUserVote();
      },
      error: (err) => {
        this.error = err.error?.error || 'Unable to load user data.';
        this.loading = false;
      },
    });
  }

  loadUserReviews() {
    this.http.get(`/api/user/${this.username}/reviews`, { withCredentials: true }).subscribe({
      next: (data: any) => {
        this.userReviews = data || [];
      },
      error: () => {
        this.userReviews = [];
      },
    });
  }

  loadUserPosts() {
    this.loadingPosts = true;
    this.http
      .get<any>(`/api/user/${this.username}/posts?page=${this.postsPage}&limit=5`, {
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          if (this.postsPage === 1) {
            this.userPosts = response.posts;
          } else {
            this.userPosts = [...this.userPosts, ...response.posts];
          }
          this.hasMorePosts = this.postsPage < response.pagination.pages;
          this.loadingPosts = false;
        },
        error: () => {
          this.userPosts = [];
          this.loadingPosts = false;
        },
      });
  }

  loadMorePosts() {
    this.postsPage++;
    this.loadUserPosts();
  }

  onPostCreated(post: any) {
    this.userPosts.unshift(post);
    this.showPostEditor = false;
  }

  startEdit() {
    this.editUser = {
      email: this.user.email,
      password: '',
      avatar: this.user.avatarUrl || '',
      emailPublic: !!this.user.emailPublic,
      bio: this.user.bio || '',
    };
    this.editMode = true;
    this.editError = '';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPassword(password: string): boolean {
    return PasswordValidation.isValidPassword(password);
  }

  getPasswordErrorMessage(password: string): string {
    return PasswordValidation.getPasswordErrorMessage(password);
  }

  saveEdit() {
    this.editError = '';

    if (this.editUser.email && !this.isValidEmail(this.editUser.email)) {
      this.editError = 'Invalid email format';
      return;
    }

    if (this.editUser.password && !this.isValidPassword(this.editUser.password)) {
      this.editError =
        'Password must contain: ' + this.getPasswordErrorMessage(this.editUser.password);
      return;
    }

    const updateData: any = {};
    if (this.editUser.email) updateData.email = this.editUser.email;
    if (this.editUser.password) updateData.password = this.editUser.password;
    if (this.editUser.avatar) updateData.avatar = this.editUser.avatar;
    updateData.bio = this.editUser.bio;
    if (typeof this.editUser.emailPublic !== 'undefined')
      updateData.emailPublic = !!this.editUser.emailPublic;

    if (Object.keys(updateData).length === 0) {
      this.editMode = false;
      return;
    }

    this.http.put(`/api/user/${this.username}`, updateData, { withCredentials: true }).subscribe({
      next: (data) => {
        this.user = data;
        if (this.isCurrentUser) {
          try {
            const stored: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
            stored.avatarUrl = (data as any).avatarUrl || stored.avatarUrl;
            stored.emailPublic = !!(data as any).emailPublic;
            localStorage.setItem('currentUser', JSON.stringify(stored));
          } catch (e) {
            // ignore
          }
        }
        this.editMode = false;
      },
      error: (err) => {
        this.editError = err.error?.error || 'Error saving changes';
      },
    });
  }

  goToGame(appid: number | string) {
    window.open('/g/' + appid, '_self');
  }

  getGameImageUrl(game: any): string {
    const key = this.getGameKey(game);
    const cached = this.gameImageCache.get(key);
    if (cached) return cached;

    const fallback = this.getGameFallbackImage(game);
    this.gameImageCache.set(key, fallback);

    if (game.appid && !this.gameImagePending.has(key)) {
      this.gameImagePending.add(key);
      this.resolveCdnImage(game.appid)
        .then((cdnUrl) => {
          if (cdnUrl) this.gameImageCache.set(key, cdnUrl);
        })
        .finally(() => {
          this.gameImagePending.delete(key);
        });
    }

    return fallback;
  }

  private getGameKey(game: any): string {
    return String(game.appid || game._id || game.name || 'unknown');
  }

  private getGameFallbackImage(game: any): string {
    if (game.header_image && game.header_image.trim() !== '') {
      return game.header_image;
    }
    if (game.capsule_image && game.capsule_image.trim() !== '') {
      return game.capsule_image;
    }
    return `https://placehold.co/184x69?text=${encodeURIComponent(game.name || 'Game')}`;
  }

  private async resolveCdnImage(appid: number | string): Promise<string | null> {
    const cdnUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/capsule_184x69.jpg`;
    try {
      const response = await fetch(cdnUrl, { method: 'HEAD' });
      return response.ok ? cdnUrl : null;
    } catch (e) {
      return null;
    }
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.http.delete(`/api/reviews/${reviewId}`, { withCredentials: true }).subscribe({
      next: () => {
        this.loadUserReviews();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
      },
    });
  }

  loadUserVote() {
    if (!this.isLoggedIn || this.isCurrentUser || !this.user?._id) return;

    this.http
      .get<{ value: number | null }>(`/api/vote/user/${this.user._id}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.userVote = res.value;
        },
        error: () => {
          this.userVote = null;
        },
      });
  }

  voteOnProfile(value: any) {
    const voteValue = typeof value === 'number' ? value : Number(value);
    if (!this.user?._id || this.isVoting || (voteValue !== 1 && voteValue !== -1)) return;

    this.isVoting = true;
    this.http
      .post<{ reputation: number; userVote: number | null }>(
        '/api/vote',
        {
          targetType: 'user',
          targetId: this.user._id,
          value: voteValue,
        },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          this.user.reputation = res.reputation;
          this.userVote = res.userVote;
          this.isVoting = false;
        },
        error: (err) => {
          console.error('Vote error:', err);
          this.isVoting = false;
        },
      });
  }

  deleteAccount() {
    if (!confirm('Czy na pewno chcesz usunąć konto? To nieodwracalne.')) return;
    const isLogged = !!localStorage.getItem('currentUser');
    if (!isLogged) return;

    this.http.delete(`/api/user/${this.username}`, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
      },
      error: (err) => {
        alert('Błąd podczas usuwania konta: ' + (err.error?.error || 'Nieznany błąd'));
      },
    });
  }
}
