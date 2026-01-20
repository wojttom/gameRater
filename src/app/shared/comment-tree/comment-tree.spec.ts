import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommentTreeComponent } from './comment-tree';

describe('CommentTreeComponent', () => {
  let component: CommentTreeComponent;
  let fixture: ComponentFixture<CommentTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentTreeComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty comments array', () => {
    expect(component.comments).toEqual([]);
  });

  it('should have default rootType as "post"', () => {
    expect(component.rootType).toBe('post');
  });

  it('should have default depth as 0', () => {
    expect(component.depth).toBe(0);
  });

  it('should toggle collapse state', () => {
    const commentId = '123';
    expect(component.isCollapsed(commentId)).toBeFalse();

    component.toggleCollapse(commentId);
    expect(component.isCollapsed(commentId)).toBeTrue();

    component.toggleCollapse(commentId);
    expect(component.isCollapsed(commentId)).toBeFalse();
  });

  it('should start reply and clear editing', () => {
    component.editingComment = '456';
    component.startReply('123');

    expect(component.replyingTo).toBe('123');
    expect(component.editingComment).toBeNull();
  });

  it('should cancel reply', () => {
    component.replyingTo = '123';
    component.cancelReply();

    expect(component.replyingTo).toBeNull();
  });

  it('should emit commentAdded and clear replyingTo on reply created', () => {
    component.replyingTo = '123';
    spyOn(component.commentAdded, 'emit');

    const newComment = { _id: '456', content: 'New reply' };
    component.onReplyCreated(newComment);

    expect(component.replyingTo).toBeNull();
    expect(component.commentAdded.emit).toHaveBeenCalledWith(newComment);
  });

  it('should start edit and clear replying', () => {
    component.replyingTo = '123';
    component.startEdit('456');

    expect(component.editingComment).toBe('456');
    expect(component.replyingTo).toBeNull();
  });

  it('should cancel edit', () => {
    component.editingComment = '123';
    component.cancelEdit();

    expect(component.editingComment).toBeNull();
  });

  it('should clear editingComment on comment updated', () => {
    component.editingComment = '123';
    component.onCommentUpdated({ _id: '123', content: 'Updated' });

    expect(component.editingComment).toBeNull();
  });

  it('should allow edit when user is author and within time limit', () => {
    const futureDate = new Date(Date.now() + 60000);
    const comment = {
      authorId: { _id: 'user123' },
      editableUntil: futureDate,
    };
    component.currentUserId = 'user123';

    expect(component.canEdit(comment)).toBeTrue();
  });

  it('should not allow edit when user is not author', () => {
    const futureDate = new Date(Date.now() + 60000);
    const comment = {
      authorId: { _id: 'user456' },
      editableUntil: futureDate,
    };
    component.currentUserId = 'user123';

    expect(component.canEdit(comment)).toBeFalse();
  });

  it('should not allow edit when time has passed', () => {
    const pastDate = new Date(Date.now() - 60000);
    const comment = {
      authorId: { _id: 'user123' },
      editableUntil: pastDate,
    };
    component.currentUserId = 'user123';

    expect(component.canEdit(comment)).toBeFalse();
  });

  it('should allow delete when user is author', () => {
    const comment = { authorId: { _id: 'user123' } };
    component.currentUserId = 'user123';

    expect(component.canDelete(comment)).toBeTrue();
  });

  it('should not allow delete when user is not author', () => {
    const comment = { authorId: { _id: 'user456' } };
    component.currentUserId = 'user123';

    expect(component.canDelete(comment)).toBeFalse();
  });

  it('should emit commentDeleted on delete confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.commentDeleted, 'emit');

    component.deleteComment('123');

    expect(component.commentDeleted.emit).toHaveBeenCalledWith('123');
  });

  it('should not emit commentDeleted when delete is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.commentDeleted, 'emit');

    component.deleteComment('123');

    expect(component.commentDeleted.emit).not.toHaveBeenCalled();
  });

  it('should return empty string when edit time has passed', () => {
    const pastDate = new Date(Date.now() - 60000);
    expect(component.getTimeRemaining(pastDate)).toBe('');
  });

  it('should return remaining time in minutes', () => {
    const futureDate = new Date(Date.now() + 300000); // 5 minutes
    const result = component.getTimeRemaining(futureDate);
    expect(result).toMatch(/\d+m left to edit/);
  });
});
