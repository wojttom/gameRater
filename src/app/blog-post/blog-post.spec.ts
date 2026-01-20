import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { BlogPost } from './blog-post';

describe('BlogPost', () => {
  let component: BlogPost;
  let fixture: ComponentFixture<BlogPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPost, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ username: 'testuser', postId: '123' }),
            snapshot: { params: { username: 'testuser', postId: '123' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
