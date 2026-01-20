import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PasswordValidation } from '../../../backend/services/passwdValidation';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { PostCardComponent } from '../shared/post-card/post-card';
import { PostEditorComponent } from '../shared/post-editor/post-editor';
import { BackButtonComponent } from '../shared/back-button/back-button';
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
    MarkdownPipe,
  ],
})
export class UserProfile implements OnInit {
  username: string = '';
  user: any = null;
  loading = false;
  error = '';
  editMode = false;
  editUser = { email: '', password: '', avatar: '', emailPublic: false };
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

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private titleService: Title,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.username = params['username'];

      // determine current user state after we have the route username
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
    this.http.get(`/api/user/${this.username}`).subscribe({
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
    this.http.get(`/api/user/${this.username}/reviews`).subscribe({
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
      .get<any>(`/api/user/${this.username}/posts?page=${this.postsPage}&limit=5`)
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
    if (typeof this.editUser.emailPublic !== 'undefined')
      updateData.emailPublic = !!this.editUser.emailPublic;

    if (Object.keys(updateData).length === 0) {
      this.editMode = false;
      return;
    }

    this.http.put(`/api/user/${this.username}`, updateData).subscribe({
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
    if (game.header_image) {
      return game.header_image;
    }
    if (game.capsule_image) {
      return game.capsule_image;
    }
    if (game.appid && typeof game.appid === 'number') {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`;
    }
    return '';
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.http.delete(`/api/reviews/${reviewId}`).subscribe({
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

    this.http.get<{ value: number | null }>(`/api/vote/user/${this.user._id}`).subscribe({
      next: (res) => {
        this.userVote = res.value;
      },
      error: () => {
        this.userVote = null;
      },
    });
  }

  voteOnProfile(value: 1 | -1) {
    if (!this.user?._id) return;

    this.http
      .post<{ reputation: number; userVote: number | null }>('/api/vote', {
        targetType: 'user',
        targetId: this.user._id,
        value,
      })
      .subscribe({
        next: (res) => {
          this.user.reputation = res.reputation;
          this.userVote = res.userVote;
        },
        error: (err) => {
          console.error('Vote error:', err);
        },
      });
  }

  deleteAccount() {
    if (!confirm('Czy na pewno chcesz usunąć konto? To nieodwracalne.')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.http
      .delete(`/api/user/${this.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
          window.location.href = '/';
        },
        error: (err) => {
          alert('Błąd podczas usuwania konta: ' + (err.error?.error || 'Nieznany błąd'));
        },
      });
  }
}
