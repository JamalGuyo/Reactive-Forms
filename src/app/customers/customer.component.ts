import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  FormArray
} from '@angular/forms';
import { Customer } from './customer';
import { debounceTime } from 'rxjs/operators';

/** RATING RANGE CUSTOM VALIDATOR WITH PARAMETER */
function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (
      c.value !== null &&
      (isNaN(c.value) || c.value < min || c.value > max)
    ) {
      return { range: true };
    }
    return null;
  };
}

/** CROSS-FIELD VALIDATION USING CUSTOM VALIDATORS -> CONFIRMING MATCHING EMAIL ADDRESSES */
function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmEmailControl = c.get('confirmEmail');
  if (emailControl.pristine || confirmEmailControl.pristine) {
    return null;
  }
  if (emailControl.value === confirmEmailControl.value) {
    return null;
  }
  return { match: true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  // CREATE REFERENCE TO THE FORM-MODEL
  customerForm: FormGroup;

  // CREATE THE DATA MODEL
  customer = new Customer();

  // VALIDATION MESSAGES
  emailMessage: string;
  private validationMessages = {
    required: 'Please enter your email address',
    email: 'Please enter a valid email address'
  };

  // GET FORM-ARRAY
  get addresses(): FormArray {
    return this.customerForm.get('addresses') as FormArray;
  }

  constructor(private fb: FormBuilder) {}
  /** CREATING THE FORM-MODEL AND SETTING VALIDATIONS */
  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group(
        {
          email: ['joe@doe.com', [Validators.required, Validators.email]],
          confirmEmail: ['', [Validators.required, Validators.email]]
        },
        { validator: emailMatcher }
      ),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddress()])
    });
    // Reacting to changes
    this.customerForm
      .get('notification')
      .valueChanges.subscribe(value => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(value => this.setMessage(emailControl));
  }
  /** SUBMITTING FORM DATA */
  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }
  /** USING PATCHVALUE AND SETVALUE  */
  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Jamal'
    });
  }

  /** ADJUSTING VALIDATION RULES AT RUNTIME */
  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    const emailControl = this.customerForm.get('email');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  /** VALIDATION MESSAGE PRINTING FN */
  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors)
        .map(key => this.validationMessages[key])
        .join(' ');
    }
  }

  /** FORM-ARRAY */
  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }
}
