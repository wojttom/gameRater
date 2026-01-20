import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LoginSite } from './login-site';

describe('LoginSite', () => {
  let component: LoginSite;
  let fixture: ComponentFixture<LoginSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSite, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginSite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
