import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PostCardComponent } from './post-card';

describe('PostCardComponent', () => {
  let component: PostCardComponent;
  let fixture: ComponentFixture<PostCardComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PostCardComponent, HttpClientTestingModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
    component.post = {
      _id: 'post123',
      title: 'Test Post',
      content: 'Test content',
      authorId: { _id: 'user123', username: 'testuser' },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default showAuthor as false', () => {
    expect(component.showAuthor).toBe(false);
  });

  it('should navigate to post on goToPost', () => {
    component.goToPost();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/u', 'testuser', 'post', 'post123']);
  });

  it('should navigate to post with authorId string', () => {
    component.post = {
      _id: 'post123',
      authorId: 'testuser',
    };
    component.goToPost();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/u', 'testuser', 'post', 'post123']);
  });

  it('should navigate to game on goToGame', () => {
    component.goToGame('12345');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/g', '12345']);
  });

  it('should navigate to game with numeric appid', () => {
    component.goToGame(12345);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/g', 12345]);
  });

  it('should navigate to author on goToAuthor', () => {
    component.goToAuthor();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/u', 'testuser']);
  });

  it('should not navigate to author when username is missing', () => {
    component.post = { _id: 'post123', authorId: {} };
    component.goToAuthor();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
