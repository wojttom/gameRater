import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { VoteButtonsComponent } from '../shared/vote-buttons/vote-buttons';
import { CommentTreeComponent } from '../shared/comment-tree/comment-tree';
import { CommentFormComponent } from '../shared/comment-form/comment-form';
import { PostEditorComponent } from '../shared/post-editor/post-editor';
import { BackButtonComponent } from '../shared/back-button/back-button';
import { MarkdownPipe } from '../shared/mics/markdown.pipe';
import { GameBadgeComponent } from '../shared/game-badge/game-badge';

@Component({
  selector: 'app-blog-post',
  imports: [
    DatePipe,
    VoteButtonsComponent,
    CommentTreeComponent,
    CommentFormComponent,
    PostEditorComponent,
    BackButtonComponent,
    MarkdownPipe,
    GameBadgeComponent,
  ],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
})
export class BlogPost implements OnInit {
  postId: string = '';
  username: string = '';
  post: any = null;
  comments: any[] = [];
  loading = true;
  error = '';
  currentUserId: string = '';
  isAuthor = false;
  editMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.username = params['username'];
      this.postId = params['postId'];
      if (this.postId) {
        this.loadPost();
        this.loadComments();
      }
    });

    const storedUser = localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserId = currentUser?.id || currentUser?._id || '';
  }

  loadPost() {
    this.loading = true;
    this.http.get<any>(`/api/posts/${this.postId}`).subscribe({
      next: (post) => {
        this.post = post;
        this.isAuthor = post.authorId?._id === this.currentUserId;
        this.titleService.setTitle(`${post.title} - ${post.authorId?.username} - gameRater`);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Post not found';
        this.loading = false;
      },
    });
  }

  loadComments() {
    this.http.get<any[]>(`/api/comments/post/${this.postId}`).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: () => {
        this.comments = [];
      },
    });
  }

  canEdit(): boolean {
    if (!this.isAuthor || !this.post) return false;
    return new Date() < new Date(this.post.editableUntil);
  }

  getTimeRemaining(): string {
    if (!this.post?.editableUntil) return '';
    const remaining = new Date(this.post.editableUntil).getTime() - Date.now();
    if (remaining <= 0) return '';
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m left to edit`;
  }

  startEdit() {
    this.editMode = true;
  }

  onPostUpdated(post: any) {
    this.post = post;
    this.editMode = false;
  }

  deletePost() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const isLogged = !!localStorage.getItem('currentUser');
    if (!isLogged) return;

    this.http.delete(`/api/posts/${this.postId}`, { withCredentials: true }).subscribe({
      next: () => {
        this.location.back();
      },
      error: (err) => {
        alert(err.error?.error || 'Error deleting post');
      },
    });
  }

  onCommentAdded(comment: any) {
    this.loadComments();
    if (this.post) {
      this.post.commentCount = (this.post.commentCount || 0) + 1;
    }
  }

  onCommentDeleted(commentId: string) {
    const isLogged = !!localStorage.getItem('currentUser');
    if (!isLogged) return;

    this.http.delete(`/api/comments/${commentId}`, { withCredentials: true }).subscribe({
      next: () => {
        this.loadComments();
      },
      error: (err) => {
        alert(err.error?.error || 'Error deleting comment');
      },
    });
  }

  goToAuthor() {
    const username = this.post?.authorId?.username;
    this.router.navigate(['/u', username]);
  }
}
