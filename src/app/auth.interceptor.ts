import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

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

          return http
            .post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true })
            .pipe(
              switchMap((response) => {
                isRefreshing = false;
                localStorage.setItem('token', response.accessToken);

                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.accessToken}`,
                  },
                });
                return next(newReq);
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
                return throwError(() => refreshError);
              }),
            );
        }
      }
      return throwError(() => error);
    }),
  );
};
