import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { PostEditorComponent } from './post-editor';

describe('PostEditorComponent', () => {
  let component: PostEditorComponent;
  let fixture: ComponentFixture<PostEditorComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostEditorComponent, HttpClientTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PostEditorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default editMode as false', () => {
    expect(component.editMode).toBe(false);
  });

  it('should have empty title and content by default', () => {
    expect(component.title).toBe('');
    expect(component.content).toBe('');
  });

  it('should have empty mentionedGames array by default', () => {
    expect(component.mentionedGames).toEqual([]);
  });

  it('should populate fields in edit mode on init', () => {
    component.editMode = true;
    component.existingPost = {
      title: 'Existing Title',
      content: 'Existing Content',
      mentionedGames: [{ appid: '123', name: 'Test Game' }],
    };
    component.ngOnInit();

    expect(component.title).toBe('Existing Title');
    expect(component.content).toBe('Existing Content');
    expect(component.mentionedGames.length).toBe(1);
  });

  it('should clear search results when query is too short', () => {
    component.gameSearchQuery = 'ab';
    component.gameSearchResults = [{ name: 'Test' }];
    component.searchGames();

    expect(component.gameSearchResults).toEqual([]);
  });

  it('should add game to mentionedGames', () => {
    const game = { appid: '123', name: 'Test Game', tiny_image: 'image.jpg' };
    component.gameSearchQuery = 'test';

    component.addGame(game);

    expect(component.mentionedGames.length).toBe(1);
    expect(component.mentionedGames[0].appid).toBe('123');
    expect(component.mentionedGames[0].name).toBe('Test Game');
    expect(component.gameSearchQuery).toBe('');
  });

  it('should not add duplicate game', () => {
    component.mentionedGames = [{ appid: '123', name: 'Test Game' }];
    const game = { appid: '123', name: 'Test Game' };

    component.addGame(game);

    expect(component.mentionedGames.length).toBe(1);
  });

  it('should use game.id when appid is not available', () => {
    const game = { id: '456', name: 'Another Game' };

    component.addGame(game);

    expect(component.mentionedGames[0].appid).toBe('456');
  });

  it('should search games with debounce', fakeAsync(() => {
    component.gameSearchQuery = 'test game';
    component.searchGames();

    tick(300);

    const req = httpMock.expectOne((request) => request.url.includes('/api/steam/search-all'));
    expect(req.request.method).toBe('GET');
    req.flush({
      steam: [{ id: '123', name: 'Steam Game', tiny_image: 'img.jpg' }],
      custom: [{ appid: '456', name: 'Custom Game' }],
    });

    expect(component.gameSearchResults.length).toBe(2);
    expect(component.isSearching).toBeFalse();
  }));

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');

    component.cancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
