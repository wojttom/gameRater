import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take, tap } from 'rxjs/operators';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/api/auth/refresh') &&
        !req.url.includes('/api/auth/login')
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return http
            .post<{ message?: string }>('/api/auth/refresh', {}, { withCredentials: true })
            .pipe(
              switchMap(() => {
                isRefreshing = false;
                refreshSubject.next(true);
                return next(req);
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                refreshSubject.next(false);
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
                return throwError(() => refreshError);
              }),
            );
        }

        return refreshSubject.pipe(
          filter((v) => v === true),
          take(1),
          switchMap(() => next(req)),
        );
      }
      return throwError(() => error);
    }),
  );
};
