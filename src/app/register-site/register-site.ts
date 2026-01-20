import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { VidGallery } from '../vid-gallery/vid-gallery';
import { PasswordValidation } from '../../../backend/services/passwdValidation';
import { Title } from '@angular/platform-browser';
import { BackButtonComponent } from '../shared/back-button/back-button';

@Component({
  selector: 'app-register-site',
  imports: [VidGallery, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './register-site.html',
  styleUrls: ['./register-site.scss'],
})
export class RegisterSite implements OnInit {
  registerForm: FormGroup;
  showPopup = false;
  popupMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private titleService: Title,
  ) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required, this.usernameValidator]],
        password: ['', [Validators.required, this.passwordComplexityValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    this.titleService.setTitle('Register - gameRater');
  }

  passwordComplexityValidator(control: AbstractControl) {
    return PasswordValidation.passwordComplexityValidator(control);
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
      ? { mismatch: true }
      : null;
  }

  private buildPasswordErrorMessage(req: {
    length: boolean;
    upper: boolean;
    number: boolean;
    special: boolean;
  }) {
    const missing: string[] = [];
    if (!req.length) missing.push('minimum 8 characters long');
    if (!req.upper) missing.push('1 upper case letter');
    if (!req.number) missing.push('1 number');
    if (!req.special) missing.push('1 special character');
    return 'Password does not meet the requirements: ' + missing.join(', ');
  }

  usernameValidator(control: AbstractControl) {
    const value = (control.value || '') as string;
    const usernameRe = /^[a-zA-Z0-9._-]{3,30}$/;
    return usernameRe.test(value) ? null : { invalidUsername: true };
  }

  sanitizeString(s: string) {
    return (s || '').replace(/[\x00-\x1F\x7F]/g, '');
  }

  sanitizeFormValues() {
    this.registerForm.patchValue({
      email: (this.registerForm.get('email')?.value || '').trim(),
      username: this.sanitizeString((this.registerForm.get('username')?.value || '').trim()),
      password: (this.registerForm.get('password')?.value || '').replace(/[\x00-\x1F\x7F]/g, ''),
      confirmPassword: (this.registerForm.get('confirmPassword')?.value || '').replace(
        /[\x00-\x1F\x7F]/g,
        '',
      ),
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      const pwCtrl = this.registerForm.get('password');

      if (this.registerForm.get('email')?.invalid) {
        this.wrongInput('email');
        this.showError('Incorrect email format');
        return;
      }

      if (
        (this.registerForm.get('username')?.value || '').length <= 3 ||
        this.registerForm.get('username')?.invalid
      ) {
        this.wrongInput('username');
        this.showError('Username should be at least 3 characters long');
        return;
      }

      if (this.registerForm.errors?.['mismatch']) {
        this.wrongInput('confirmPassword');
        this.showError('Passwords do not match.');
        return;
      }

      const complexityErr = pwCtrl?.errors?.['complexity'] ?? null;
      if (complexityErr && complexityErr.requirements) {
        this.wrongInput('password');
        const req = complexityErr.requirements;
        this.showError(this.buildPasswordErrorMessage(req));
        return;
      }
    }

    const { email, username, password } = this.registerForm.value;
    this.sanitizeFormValues();
    this.http.post('/api/auth/register', { email, username, password }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        const backendMsg = err?.error?.message;
        if (backendMsg?.includes('exists') || backendMsg?.includes('already')) {
          if (backendMsg.toLowerCase().includes('email')) this.wrongInput('email');
          if (
            backendMsg.toLowerCase().includes('user') ||
            backendMsg.toLowerCase().includes('username')
          )
            this.wrongInput('username');
          this.showError('Email or username already exists.');
        } else {
          this.showError(backendMsg || 'Registration error.');
        }
      },
    });
  }

  showError(msg: string) {
    this.popupMessage = msg;
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
    }, 6000);
  }

  wrongInput(controlName: string) {
    const selector = `[formcontrolname="${controlName.toLowerCase()}"]`;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    el.classList.remove('invalid-blink');
    void el.offsetWidth;
    el.classList.add('invalid-blink');
    const handler = () => {
      el.classList.remove('invalid-blink');
      el.removeEventListener('animationend', handler);
    };
    el.addEventListener('animationend', handler);
  }

  onLogin() {
    this.router.navigate(['/login']);
  }
}
