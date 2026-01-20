import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { VidGallery } from '../vid-gallery/vid-gallery';
import { AuthService } from '../../../backend/services/authService';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { BackButtonComponent } from '../shared/back-button/back-button';

@Component({
  selector: 'app-login-site',
  imports: [VidGallery, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './login-site.html',
  styleUrl: './login-site.scss',
})
export class LoginSite implements OnInit {
  loginForm: FormGroup;
  showPopup = false;
  popupMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private titleService: Title,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Login - gameRater');
  }

  sanitizeString(s: string) {
    return (s || '').replace(/[\x00-\x1F\x7F]/g, '');
  }

  showError(msg: string) {
    this.popupMessage = msg;
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
    }, 6000);
  }

  onSignUp() {
    this.router.navigate(['/register']);
  }

  onLogin() {
    this.loginForm.patchValue({
      email: (this.loginForm.get('email')?.value || '').trim().toLowerCase(),
      password: this.sanitizeString(this.loginForm.get('password')?.value || ''),
    });

    if (this.loginForm.invalid) {
      this.showError('Could not login');
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        if (res.user) {
          localStorage.setItem('currentUser', JSON.stringify(res.user));
        }
        if (res.accessToken) {
          localStorage.setItem('token', res.accessToken);
        }
        window.location.href = '/';
      },
      error: () => {
        this.showError('Could not login');
      },
    });
  }
}
