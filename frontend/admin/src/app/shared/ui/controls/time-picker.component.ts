import {Component, input, model, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {FormValueControl} from '@angular/forms/signals';
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from '@angular/material/timepicker';

@Component({
  selector: 'cm-time-picker',
  standalone: true,
  template: `
    <mat-form-field appearance="outline" class="cm-time-picker">
      <input
        matInput
        [matTimepicker]="timepicker"
        [ngModel]="value()"
        [matTimepickerMin]="minTime()"
        [matTimepickerMax]="maxTime()"
        (ngModelChange)="value.set($event)"
        [disabled]="disabled()"
      >
      <mat-timepicker #timepicker/>
      <mat-timepicker-toggle [for]="timepicker" matSuffix/>
    </mat-form-field>
  `,
  imports: [
    MatFormField,
    MatInput,
    MatSuffix,
    MatTimepickerInput,
    MatTimepicker,
    MatTimepickerToggle,
    FormsModule
  ],
  encapsulation: ViewEncapsulation.None,
  styles: [`

    cm-time-picker {
      display: flex;
      width: 100%;
    }

    .cm-time-picker {
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
export class TimePickerComponent implements FormValueControl<string | null> {
  value = model<string | null>(null);
  disabled = input(false);
  minTime = input<string>('09:00');
  maxTime = input<string>('22:00');
}
