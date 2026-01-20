import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface UserModel {
  id: string;
  username: string;
  avatarUrl?: string;
  emailPublic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(creds: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ accessToken?: string; user?: UserModel }>('/api/auth/login', creds, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res?.user) this.currentUserSubject.next(res.user);
        }),
      );
  }

  logout(): Observable<any> {
    return this.http
      .post('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }
}
