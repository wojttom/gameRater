import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '../shared/back-button/back-button';
import { PostCardComponent } from '../shared/post-card/post-card';
import { PostEditorComponent } from '../shared/post-editor/post-editor';

@Component({
  selector: 'app-forum',
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
  imports: [FormsModule, BackButtonComponent, PostCardComponent, PostEditorComponent],
})
export class Forum implements OnInit {
  posts: any[] = [];
  filteredPosts: any[] = [];
  games: any[] = [];
  loading = true;

  sortBy: 'karma' | 'new' | 'old' = 'karma';
  selectedGame: string = '';
  searchQuery: string = '';

  page = 1;
  limit = 20;
  totalPages = 1;

  showPostEditor = false;
  isLoggedIn = false;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.checkLogin();
    this.loadPosts();
  }

  checkLogin() {
    const storedUser = localStorage.getItem('currentUser');
    this.isLoggedIn = !!storedUser;
  }

  loadPosts() {
    this.loading = true;
    const sort = this.sortBy === 'karma' ? 'top' : this.sortBy;

    this.http.get<any>(`/api/posts?page=${this.page}&limit=${this.limit}&sort=${sort}`).subscribe({
      next: (res) => {
        this.posts = res.posts;
        this.totalPages = res.pagination.pages;
        this.extractGames();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  extractGames() {
    const gameMap = new Map<string, any>();
    this.posts.forEach((post) => {
      if (post.mentionedGames) {
        post.mentionedGames.forEach((game: any) => {
          if (!gameMap.has(game.appid.toString())) {
            gameMap.set(game.appid.toString(), game);
          }
        });
      }
    });
    this.games = Array.from(gameMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFilters() {
    let result = [...this.posts];

    if (this.selectedGame) {
      result = result.filter((post) =>
        post.mentionedGames?.some((g: any) => g.appid.toString() === this.selectedGame),
      );
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query),
      );
    }

    if (this.sortBy === 'karma') {
      result.sort((a, b) => b.score - a.score);
    } else if (this.sortBy === 'new') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'old') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    this.filteredPosts = result;
  }

  onSortChange() {
    this.page = 1;
    this.loadPosts();
  }

  onGameChange() {
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedGame = '';
    this.searchQuery = '';
    this.sortBy = 'karma';
    this.page = 1;
    this.loadPosts();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadPosts();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadPosts();
    }
  }

  onPostCreated(post: any) {
    this.showPostEditor = false;
    const username =
      post.authorId?.username || JSON.parse(localStorage.getItem('currentUser') || '{}').username;
    this.router.navigate(['/u', username, 'post', post._id]);
  }

  cancelPostEditor() {
    this.showPostEditor = false;
  }
}
