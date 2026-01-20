import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Forum } from './forum';

describe('Forum', () => {
  let component: Forum;
  let fixture: ComponentFixture<Forum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forum, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Forum);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
