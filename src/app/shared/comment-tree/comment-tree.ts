import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { VoteButtonsComponent } from '../vote-buttons/vote-buttons';
import { CommentFormComponent } from '../comment-form/comment-form';
import { MarkdownPipe } from '../mics/markdown.pipe';

@Component({
  selector: 'app-comment-tree',
  templateUrl: './comment-tree.html',
  styleUrl: './comment-tree.scss',
  imports: [DatePipe, VoteButtonsComponent, CommentFormComponent, MarkdownPipe],
})
export class CommentTreeComponent {
  @Input() comments: any[] = [];
  @Input() rootId: string = '';
  @Input() rootType: 'post' | 'review' = 'post';
  @Input() currentUserId: string = '';
  @Input() depth: number = 0;
  private readonly maxIndentLevels = 1;
  private readonly indentPx = 1;

  getIndent(depth: number) {
    return Math.min(depth, this.maxIndentLevels) * this.indentPx;
  }
  @Output() commentAdded = new EventEmitter<any>();
  @Output() commentDeleted = new EventEmitter<string>();

  collapsedComments: Set<string> = new Set();
  replyingTo: string | null = null;
  editingComment: string | null = null;

  toggleCollapse(commentId: string) {
    if (this.collapsedComments.has(commentId)) {
      this.collapsedComments.delete(commentId);
    } else {
      this.collapsedComments.add(commentId);
    }
  }

  isCollapsed(commentId: string): boolean {
    return this.collapsedComments.has(commentId);
  }

  startReply(commentId: string) {
    this.replyingTo = commentId;
    this.editingComment = null;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  onReplyCreated(comment: any) {
    this.replyingTo = null;
    this.commentAdded.emit(comment);
  }

  startEdit(commentId: string) {
    this.editingComment = commentId;
    this.replyingTo = null;
  }

  cancelEdit() {
    this.editingComment = null;
  }

  onCommentUpdated(comment: any) {
    this.editingComment = null;
  }

  canEdit(comment: any): boolean {
    if (comment.authorId?._id !== this.currentUserId) return false;
    return new Date() < new Date(comment.editableUntil);
  }

  canDelete(comment: any): boolean {
    return comment.authorId?._id === this.currentUserId;
  }

  deleteComment(commentId: string) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentDeleted.emit(commentId);
    }
  }

  getTimeRemaining(editableUntil: Date): string {
    const remaining = new Date(editableUntil).getTime() - Date.now();
    if (remaining <= 0) return '';
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m left to edit`;
  }
}
