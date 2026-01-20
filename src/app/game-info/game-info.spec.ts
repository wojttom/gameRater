import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { GameInfo } from './game-info';

describe('GameInfo', () => {
  let component: GameInfo;
  let fixture: ComponentFixture<GameInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameInfo, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ appid: '12345' }),
            snapshot: { params: { appid: '12345' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameInfo);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
