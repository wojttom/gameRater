import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VidGallery } from './vid-gallery';

describe('VidGallery', () => {
  let component: VidGallery;
  let fixture: ComponentFixture<VidGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VidGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VidGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
