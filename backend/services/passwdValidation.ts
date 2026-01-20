import { AbstractControl } from '@angular/forms';

export class PasswordValidation {
  static isValidPassword(password: string): boolean {
    const length = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const number = /\d/.test(password);
    const special = /[!@#$%^&*()_\-+=\[{\]}:;"'<>,.?/\\|`~]/.test(password);
    return length && upper && number && special;
  }

  static getPasswordErrorMessage(password: string): string {
    const missing: string[] = [];
    if (password.length < 8) missing.push('minimum 8 characters');
    if (!/[A-Z]/.test(password)) missing.push('1 uppercase letter');
    if (!/\d/.test(password)) missing.push('1 digit');
    if (!/[!@#$%^&*()_\-+=\[{\]}:;"'<>,.?/\\|`~]/.test(password))
      missing.push('1 special character');
    return missing.join(', ');
  }

  static passwordComplexityValidator(control: AbstractControl) {
    const value = (control.value || '') as string;
    const length = value.length >= 8;
    const upper = /[A-Z]/.test(value);
    const number = /\d/.test(value);
    const special = /[!@#$%^&*()_\-+=\[{\]}:;"'<>,.?/\\|`~]/.test(value);
    const ok = length && upper && number && special;
    return ok
      ? null
      : {
          complexity: {
            requirements: { length, upper, number, special },
          },
        };
  }
}
