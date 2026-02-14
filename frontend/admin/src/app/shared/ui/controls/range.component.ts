import {Component, Input} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

// custom component with all custom styles for thumb and track
@Component({
  selector: 'cm-range',
  standalone: true,
  template: `
    <div class="range-wrapper">
      <input
        type="range"
        [min]="min"
        [max]="max"
        [step]="step"
        [(ngModel)]="value"
        (ngModelChange)="changeValue($event)"
        class="custom-range"
      />

      <div class="ticks">
        @for (tick of ticks; track tick) {
          <div
            class="tick"
            [style.left.%]="((tick - min) / (max - min)) * 100"
          >
            <div class="tick-line"></div>
            <div class="label">{{ tick }}</div>
          </div>
        }
      </div>
    </div>
  `,
  imports: [
    FormsModule
  ], providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: RangeComponent,
      multi: true
    }
  ],
  styles: [`
    .range-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 30px;
    }

    .custom-range {
      width: 100%;
      -webkit-appearance: none;
      background: transparent;
      position: relative;
      z-index: 2;
      margin: 0;
    }

    /* Track */
    .custom-range::-webkit-slider-runnable-track {
      height: 6px;
      background: var(--range-track-bg);
      border-radius: 3px;
    }

    .custom-range::-moz-range-track {
      height: 6px;
      background: var(--range-track-bg);
      border-radius: 3px;
    }

    /* Thumb */
    .custom-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 20px;
      width: 20px;
      background: var(--accent-color);
      border-radius: 50%;
      margin-top: -7px;
      cursor: pointer;
    }

    .custom-range::-moz-range-thumb {
      height: 20px;
      width: 20px;
      background: var(--accent-color);
      border-radius: 50%;
      cursor: pointer;
    }

    /* Ticks */
    .ticks {
      position: absolute;
      top: 28px;
      left: 2.4%;
      right: 2.4%;
      height: 30px;
      pointer-events: none;
    }

    .tick {
      position: absolute;
      text-align: center;
      transform: translateX(-50%);
    }

    .tick-line {
      width: 1px;
      height: 10px;
      background-color: var(--range-tick-color);
      margin: 0 auto;
    }

    .label {
      font-size: 10px;
      color: var(--range-tick-color);
      margin-top: 2px;
      display: block;
    }
  `]
})
export class RangeComponent
  implements ControlValueAccessor {
  constructor() {
  }

  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;

  @Input() tickInterval?: number;
  @Input() customTicks?: number[];

  value: string = '';

  get ticks(): number[] {
    if (this.customTicks) return this.customTicks;
    if (this.tickInterval) {
      const ticks = [];
      for (let i = this.min; i <= this.max; i += this.tickInterval) {
        ticks.push(i);
      }
      return ticks;
    }
    return [];
  }

  onChange: (value: string) => void = () => {
  };

  onTouched: () => void = () => {
  };

  writeValue(value: string): void {
    this.changeValue(value);
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  changeValue(value: string): void {
    this.value = value;
    this.onChange(this.value);
  }
}
