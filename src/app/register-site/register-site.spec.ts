import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RegisterSite } from './register-site';

describe('RegisterSite', () => {
  let component: RegisterSite;
  let fixture: ComponentFixture<RegisterSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSite, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterSite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
