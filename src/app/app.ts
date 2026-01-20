import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { UserModel } from '../../backend/services/authService';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  currentUser: UserModel | null = null;
  showUserMenu = false;
  currentSite: string = '';

  searchQuery: string = '';
  searchResults: any[] = [];
  showSearchResults = false;
  isSearching = false;
  private searchSubject = new Subject<string>();

  private routerSub?: Subscription;

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  @ViewChild('userMenuContainer') userMenuContainer!: ElementRef;

  constructor(
    public router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }

    if (this.currentUser && !this.currentUser.avatarUrl) {
      this.http.get<any>(`/api/user/${this.currentUser.username}`).subscribe({
        next: (userData) => {
          this.currentUser = userData;
          localStorage.setItem('currentUser', JSON.stringify(userData));
          console.log('Updated Current User with avatarUrl:', this.currentUser?.avatarUrl);
        },
        error: () => {},
      });
    }

    console.log('Current User:', this.currentUser);
    console.log('Current User Avatar URL:', this.currentUser?.avatarUrl);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentSite = e.urlAfterRedirects || e.url;
        let route = this.router.routerState.root;
        while (route.firstChild) route = route.firstChild;
      });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => query.length > 2),
        switchMap((query) => {
          this.isSearching = true;
          if (!isNaN(Number(query))) return [];
          return this.http.get<any>(`/api/steam/search-all?term=${query}`);
        }),
      )
      .subscribe({
        next: (data: any) => {
          const steamGames = (data.steam || []).map((game: any) => ({
            ...game,
            type: 'steam',
          }));
          const customGames = (data.custom || []).map((game: any) => ({
            ...game,
            type: 'custom',
            id: game.appid,
            tiny_image: game.capsule_image,
          }));

          this.searchResults = [...steamGames, ...customGames];
          this.isSearching = false;
          this.showSearchResults = true;
        },
        error: () => {
          this.isSearching = false;
          this.searchResults = [];
        },
      });
  }

  onSearchInput() {
    if (this.searchQuery.length <= 2) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    this.searchSubject.next(this.searchQuery);
  }

  goToGame(appid: number | string) {
    this.router.navigate(['/g', appid]);
    this.showSearchResults = false;
    this.searchQuery = '';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.showSearchResults = false;
    }
    if (
      this.showUserMenu &&
      this.userMenuContainer &&
      !this.userMenuContainer.nativeElement.contains(event.target)
    ) {
      this.showUserMenu = false;
    }
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  goToProfile() {
    this.showUserMenu = false;
    const username = this.currentUser?.username;
    this.router.navigate(['/u', username]);
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUser = null;
    this.showUserMenu = false;
    window.location.reload();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
