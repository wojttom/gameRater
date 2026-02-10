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

  it('should have default horizontal as true', () => {
    expect(component.horizontal).toBe(true);
  });

  it('should have default scores as 0', () => {
    expect(component.upvotes).toBe(0);
    expect(component.downvotes).toBe(0);
    expect(component.score).toBe(0);
  });

  it('should have default userVote as null', () => {
    expect(component.userVote).toBeNull();
  });
});
