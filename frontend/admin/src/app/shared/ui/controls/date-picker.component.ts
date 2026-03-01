import {Component, forwardRef, input, model, signal, ViewEncapsulation} from '@angular/core';
import {FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {FormValueControl} from '@angular/forms/signals';

@Component({
  selector: 'cm-date-picker',
  standalone: true,
  template: `
    <mat-form-field appearance="outline" class="cm-date-picker">
      <input
        matInput
        [matDatepicker]="picker"
        [ngModel]="value()"
        (ngModelChange)="value.set($event)"
        [disabled]="disabled()"
      >
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
  `,
  imports: [
    MatFormField,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatSuffix,
    MatDatepickerToggle,
    FormsModule
  ],
  encapsulation: ViewEncapsulation.None,
  styles: [`

    cm-date-picker {
      display: flex;
      width: 100%;
    }

    .cm-date-picker {
      flex: 1;
      width: 100%;
      --mat-form-field-container-height: 51px;
      --mat-form-field-container-vertical-padding: 12px;

      .mat-mdc-text-field-wrapper {
        border-radius: 12px;
        background-color: #fff;
      }

      .mdc-text-field__input {
        font-family: var(--text-font) !important;
      }

      .mdc-notched-outline__trailing {
        border-radius: 0 12px 12px 0;
        border-color: transparent !important;
      }

      .mdc-notched-outline__leading {
        border-radius: 12px 0 0 12px;
        border-color: transparent !important;
      }

      .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }
  `]
})
export class DatePickerComponent implements FormValueControl<string | null> {
  value = model<string | null>(null);
  disabled = input(false);
}
