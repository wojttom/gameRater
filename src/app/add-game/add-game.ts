import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { BackButtonComponent } from '../shared/back-button/back-button';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, BackButtonComponent],
  templateUrl: './add-game.html',
  styleUrl: './add-game.scss',
})
export class AddGame implements OnInit {
  gameForm: FormGroup;
  currentUser: any = null;
  loading = false;
  error = '';
  success = false;
  successMessage = '';

  screenshots: any[] = [];
  newScreenshot = '';
  movies: any[] = [];
  newMovie = '';
  developers: string[] = [];
  newDeveloper = '';
  publishers: string[] = [];
  newPublisher = '';
  categories: any[] = [];
  newCategory = { id: 0, description: '' };
  genres: any[] = [];
  newGenre = { id: '', description: '' };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private titleService: Title,
  ) {
    this.gameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['video_game', Validators.required],
      short_description: ['', Validators.required],
      about_the_game: ['', Validators.required],
      detailed_description: [''],
      header_image: [''],
      capsule_image: [''],
      website: [''],
      is_free: [false],
      platforms_windows: [true],
      platforms_mac: [false],
      platforms_linux: [false],
      price_currency: ['USD'],
      price_final: [9.99],
      required_age: [0],
      supported_languages: ['English'],
      pc_minimum: [''],
      pc_recommended: [''],
      mac_minimum: [''],
      mac_recommended: [''],
      linux_minimum: [''],
      linux_recommended: [''],
      requirements: [''],
      release_date: [new Date().toISOString().split('T')[0]],
      coming_soon: [false],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Add Game - gameRater');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      this.error = 'You must be logged in to add a game';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  addScreenshot() {
    if (this.newScreenshot.trim()) {
      this.screenshots.push({ path_thumbnail: this.newScreenshot, id: this.screenshots.length });
      this.newScreenshot = '';
    }
  }

  removeScreenshot(index: number) {
    this.screenshots.splice(index, 1);
  }

  addMovie() {
    if (this.newMovie.trim()) {
      this.movies.push({ embed_html: this.newMovie.trim(), id: this.movies.length });
      this.newMovie = '';
    }
  }

  removeMovie(index: number) {
    this.movies.splice(index, 1);
  }

  addDeveloper() {
    if (this.newDeveloper.trim()) {
      this.developers.push(this.newDeveloper.trim());
      this.newDeveloper = '';
    }
  }

  removeDeveloper(index: number) {
    this.developers.splice(index, 1);
  }

  addPublisher() {
    if (this.newPublisher.trim()) {
      this.publishers.push(this.newPublisher.trim());
      this.newPublisher = '';
    }
  }

  removePublisher(index: number) {
    this.publishers.splice(index, 1);
  }

  addCategory() {
    if (this.newCategory.description.trim()) {
      this.categories.push({ ...this.newCategory, id: this.categories.length });
      this.newCategory = { id: 0, description: '' };
    }
  }

  removeCategory(index: number) {
    this.categories.splice(index, 1);
  }

  addGenre() {
    if (this.newGenre.description.trim()) {
      this.genres.push({ ...this.newGenre, id: `genre_${this.genres.length}` });
      this.newGenre = { id: '', description: '' };
    }
  }

  removeGenre(index: number) {
    this.genres.splice(index, 1);
  }

  submitGame() {
    if (!this.gameForm.valid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.gameForm.value;

    const gameData = {
      name: formValue.name,
      type: formValue.type,
      short_description: formValue.short_description,
      about_the_game: formValue.about_the_game,
      detailed_description: formValue.detailed_description,
      header_image: formValue.header_image,
      capsule_image: formValue.capsule_image,
      website: formValue.website,
      is_free: formValue.is_free,
      platforms: {
        windows: formValue.platforms_windows,
        mac: formValue.platforms_mac,
        linux: formValue.platforms_linux,
      },
      price_overview: {
        currency: formValue.price_currency,
        final: formValue.price_final,
      },
      required_age: formValue.required_age,
      supported_languages: formValue.supported_languages,
      pc_requirements: {
        minimum: formValue.pc_minimum,
        recommended: formValue.pc_recommended,
      },
      mac_requirements: {
        minimum: formValue.mac_minimum,
        recommended: formValue.mac_recommended,
      },
      linux_requirements: {
        minimum: formValue.linux_minimum,
        recommended: formValue.linux_recommended,
      },
      release_date: {
        date: formValue.release_date,
        coming_soon: formValue.coming_soon,
      },
      screenshots: this.screenshots,
      movies: this.movies,
      developers: this.developers,
      publishers: this.publishers,
      categories: this.categories,
      genres: this.genres,
      createdBy: this.currentUser.id,
    };

    this.http.post('/api/games', gameData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.success = true;
        this.successMessage = 'Game added successfully!';
        setTimeout(() => {
          this.router.navigate(['/g', response.appid]);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Error adding game';
      },
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
