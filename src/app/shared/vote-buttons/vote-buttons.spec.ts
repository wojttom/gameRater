import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { VoteButtonsComponent } from './vote-buttons';

describe('VoteButtonsComponent', () => {
  let component: VoteButtonsComponent;
  let fixture: ComponentFixture<VoteButtonsComponent>;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VoteButtonsComponent, HttpClientTestingModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(VoteButtonsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default targetType as "post"', () => {
    expect(component.targetType).toBe('post');
  });

  it('should have default vertical as true', () => {
    expect(component.vertical).toBe(true);
  });

  it('should have default scores as 0', () => {
    expect(component.upvotes).toBe(0);
    expect(component.downvotes).toBe(0);
    expect(component.score).toBe(0);
  });

  it('should have default userVote as null', () => {
    expect(component.userVote).toBeNull();
  });

  it('should set isLoggedIn based on token on init', () => {
    localStorage.setItem('token', 'test-token');
    component.ngOnInit();
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should set isLoggedIn to false when no token', () => {
    localStorage.removeItem('token');
    component.ngOnInit();
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should redirect to login when voting without token', () => {
    localStorage.removeItem('token');
    component.vote(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not vote when already voting', () => {
    localStorage.setItem('token', 'test-token');
    component.isVoting = true;
    component.vote(1);
    httpMock.expectNone('/api/vote');
  });

  it('should make vote request with correct data', () => {
    localStorage.setItem('token', 'test-token');
    component.targetType = 'post';
    component.targetId = '123';

    component.vote(1);

    const req = httpMock.expectOne('/api/vote');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      targetType: 'post',
      targetId: '123',
      value: 1,
    });
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({
      upvotes: 5,
      downvotes: 2,
      score: 3,
      userVote: 1,
    });
  });

  it('should update votes and emit voteChanged on success', () => {
    localStorage.setItem('token', 'test-token');
    component.targetId = '123';
    spyOn(component.voteChanged, 'emit');

    component.vote(1);

    const req = httpMock.expectOne('/api/vote');
    req.flush({
      upvotes: 10,
      downvotes: 3,
      score: 7,
      userVote: 1,
    });

    expect(component.upvotes).toBe(10);
    expect(component.downvotes).toBe(3);
    expect(component.score).toBe(7);
    expect(component.userVote).toBe(1);
    expect(component.isVoting).toBeFalse();
    expect(component.voteChanged.emit).toHaveBeenCalledWith({
      upvotes: 10,
      downvotes: 3,
      score: 7,
      userVote: 1,
    });
  });

  it('should handle vote error', () => {
    localStorage.setItem('token', 'test-token');
    component.targetId = '123';
    spyOn(console, 'error');

    component.vote(-1);

    const req = httpMock.expectOne('/api/vote');
    req.flush({ error: 'Vote failed' }, { status: 400, statusText: 'Bad Request' });

    expect(component.isVoting).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should show alert on error with message', () => {
    localStorage.setItem('token', 'test-token');
    component.targetId = '123';
    spyOn(window, 'alert');

    component.vote(-1);

    const req = httpMock.expectOne('/api/vote');
    req.flush({ error: 'Already voted' }, { status: 400, statusText: 'Bad Request' });

    expect(window.alert).toHaveBeenCalledWith('Already voted');
  });
});
