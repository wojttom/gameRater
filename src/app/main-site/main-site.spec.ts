import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MainSite } from './main-site';

describe('MainSite', () => {
  let component: MainSite;
  let fixture: ComponentFixture<MainSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSite, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MainSite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
