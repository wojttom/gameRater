import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-comment-form',
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.scss',
  imports: [FormsModule],
})
export class CommentFormComponent {
  @Input() parentType: 'post' | 'review' | 'comment' = 'post';
  @Input() parentId: string = '';
  @Input() rootId: string = '';
  @Input() rootType: 'post' | 'review' = 'post';
  @Input() editMode: boolean = false;
  @Input() existingComment: any = null;
  @Output() commentCreated = new EventEmitter<any>();
  @Output() commentUpdated = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  content: string = '';
  isSubmitting: boolean = false;
  error: string = '';
  isLoggedIn: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    if (this.editMode && this.existingComment) {
      this.content = this.existingComment.content;
    }
  }

  submit() {
    if (!this.content.trim()) {
      this.error = 'Comment cannot be empty';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'You must be logged in';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const headers = { Authorization: `Bearer ${token}` };

    if (this.editMode && this.existingComment) {
      this.http
        .put<any>(
          `/api/comments/${this.existingComment._id}`,
          { content: this.content.trim() },
          { headers },
        )
        .subscribe({
          next: (comment) => {
            this.commentUpdated.emit(comment);
            this.isSubmitting = false;
            this.content = '';
          },
          error: (err) => {
            this.error = err.error?.error || 'Error updating comment';
            this.isSubmitting = false;
          },
        });
    } else {
      const commentData = {
        parentType: this.parentType,
        parentId: this.parentId || this.rootId,
        rootId: this.rootId,
        rootType: this.rootType,
        content: this.content.trim(),
      };

      this.http.post<any>('/api/comments', commentData, { headers }).subscribe({
        next: (comment) => {
          this.commentCreated.emit(comment);
          this.isSubmitting = false;
          this.content = '';
        },
        error: (err) => {
          this.error = err.error?.error || 'Error creating comment';
          this.isSubmitting = false;
        },
      });
    }
  }

  cancel() {
    this.content = '';
    this.error = '';
    this.cancelled.emit();
  }
}
