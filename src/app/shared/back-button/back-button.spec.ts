import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BackButtonComponent } from './back-button';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let locationSpy: jasmine.SpyObj<Location>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    locationSpy = jasmine.createSpyObj('Location', ['back']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BackButtonComponent],
      providers: [
        { provide: Location, useValue: locationSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default label as "Back"', () => {
    expect(component.label).toBe('Back');
  });

  it('should have default fallbackUrl as "/"', () => {
    expect(component.fallbackUrl).toBe('/');
  });

  it('should call location.back() when history exists', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);
    component.goBack();
    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('should navigate to fallbackUrl when no history', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to custom fallbackUrl when no history', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);
    component.fallbackUrl = '/home';
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
});
