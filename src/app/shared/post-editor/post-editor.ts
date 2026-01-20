import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';

interface MentionedGame {
  appid: string | number;
  name: string;
  tiny_image?: string;
}

@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.html',
  styleUrl: './post-editor.scss',
  imports: [FormsModule],
})
export class PostEditorComponent implements OnInit {
  @Input() editMode: boolean = false;
  @Input() existingPost: any = null;
  @Output() postCreated = new EventEmitter<any>();
  @Output() postUpdated = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  title: string = '';
  content: string = '';
  mentionedGames: MentionedGame[] = [];
  gameSearchQuery: string = '';
  gameSearchResults: any[] = [];
  isSearching: boolean = false;
  isSubmitting: boolean = false;
  error: string = '';
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.editMode && this.existingPost) {
      this.title = this.existingPost.title;
      this.content = this.existingPost.content;
      this.mentionedGames = [...(this.existingPost.mentionedGames || [])];
    }

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => query.length > 2),
        switchMap((query) => {
          this.isSearching = true;
          return this.http.get<any>(`/api/steam/search-all?term=${encodeURIComponent(query)}`);
        }),
      )
      .subscribe({
        next: (data: any) => {
          const steamGames = (data.steam || []).map((game: any) => ({
            appid: game.id,
            name: game.name,
            tiny_image: game.tiny_image,
            price: game.price,
            type: 'steam',
          }));
          const customGames = (data.custom || []).map((game: any) => ({
            appid: game.appid,
            name: game.name,
            tiny_image: game.capsule_image || game.header_image,
            type: 'custom',
          }));

          this.gameSearchResults = [...steamGames, ...customGames].slice(0, 8);
          this.isSearching = false;
        },
        error: () => {
          this.isSearching = false;
          this.gameSearchResults = [];
        },
      });
  }

  searchGames() {
    if (this.gameSearchQuery.length <= 2) {
      this.gameSearchResults = [];
      return;
    }
    this.searchSubject.next(this.gameSearchQuery);
  }

  addGame(game: any) {
    const appid = game.appid || game.id;
    const exists = this.mentionedGames.some((g) => g.appid === appid);
    if (!exists) {
      this.mentionedGames.push({
        appid: appid,
        name: game.name,
        tiny_image: game.tiny_image,
      });
    }
    this.gameSearchQuery = '';
    this.gameSearchResults = [];
  }

  removeGame(appid: string | number) {
    this.mentionedGames = this.mentionedGames.filter((g) => g.appid !== appid);
  }

  submit() {
    if (!this.title.trim() || !this.content.trim()) {
      this.error = 'Title and content are required';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'You must be logged in';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const postData = {
      title: this.title.trim(),
      content: this.content.trim(),
      mentionedGames: this.mentionedGames,
    };

    const headers = { Authorization: `Bearer ${token}` };

    if (this.editMode && this.existingPost) {
      this.http.put<any>(`/api/posts/${this.existingPost._id}`, postData, { headers }).subscribe({
        next: (post) => {
          this.postUpdated.emit(post);
          this.isSubmitting = false;
          this.resetForm();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error updating post';
          this.isSubmitting = false;
        },
      });
    } else {
      this.http.post<any>('/api/posts', postData, { headers }).subscribe({
        next: (post) => {
          this.postCreated.emit(post);
          this.isSubmitting = false;
          this.resetForm();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error creating post';
          this.isSubmitting = false;
        },
      });
    }
  }

  resetForm() {
    this.title = '';
    this.content = '';
    this.mentionedGames = [];
    this.gameSearchQuery = '';
    this.gameSearchResults = [];
  }

  cancel() {
    this.resetForm();
    this.cancelled.emit();
  }
}
