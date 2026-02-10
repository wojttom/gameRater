import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CommentFormComponent } from './comment-form';

describe('CommentFormComponent', () => {
  let component: CommentFormComponent;
  let fixture: ComponentFixture<CommentFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentFormComponent, HttpClientTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default parentType as "post"', () => {
    expect(component.parentType).toBe('post');
  });

  it('should have default rootType as "post"', () => {
    expect(component.rootType).toBe('post');
  });

  it('should have default editMode as false', () => {
    expect(component.editMode).toBe(false);
  });

  it('should set error when content is empty on submit', () => {
    component.content = '';
    component.submit();
    expect(component.error).toBe('Comment cannot be empty');
  });

  it('should set error when content is whitespace only on submit', () => {
    component.content = '   ';
    component.submit();
    expect(component.error).toBe('Comment cannot be empty');
  });

  it('should set error when not logged in', () => {
    localStorage.removeItem('token');
    component.content = 'Test comment';
    component.submit();
    expect(component.error).toBe('You must be logged in');
  });

  it('should clear content and error on cancel', () => {
    component.content = 'Test';
    component.error = 'Some error';
    spyOn(component.cancelled, 'emit');

    component.cancel();

    expect(component.content).toBe('');
    expect(component.error).toBe('');
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should populate content in edit mode on init', () => {
    component.editMode = true;
    component.existingComment = { content: 'Existing content' };
    component.ngOnInit();
    expect(component.content).toBe('Existing content');
  });
});
