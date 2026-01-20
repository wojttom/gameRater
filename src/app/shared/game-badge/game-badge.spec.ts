import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameBadgeComponent } from './game-badge';

describe('GameBadgeComponent', () => {
  let component: GameBadgeComponent;
  let fixture: ComponentFixture<GameBadgeComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GameBadgeComponent],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameBadgeComponent);
    component = fixture.componentInstance;
    component.game = { appid: '12345', name: 'Test Game' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display game name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Game');
  });

  it('should navigate to game on click', () => {
    const event = new MouseEvent('click');
    component.goToGame(event);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/g', '12345']);
  });

  it('should stop propagation when stopPropagation is true', () => {
    component.stopPropagation = true;
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.goToGame(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should not stop propagation when stopPropagation is false', () => {
    component.stopPropagation = false;
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    component.goToGame(event);

    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('should display game icon when tiny_image is provided', () => {
    component.game = { appid: '12345', name: 'Test Game', tiny_image: 'image.jpg' };
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.game-badge-icon');
    expect(img).toBeTruthy();
    expect(img.src).toContain('image.jpg');
  });

  it('should display placeholder when no image is provided', () => {
    component.game = { appid: '12345', name: 'Test Game' };
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.game-badge-placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain('🎮');
  });
});
