import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AddGame } from './add-game';

describe('AddGame', () => {
  let component: AddGame;
  let fixture: ComponentFixture<AddGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGame, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AddGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
