import {Component, computed, contentChildren, input, ViewEncapsulation} from '@angular/core';
import {ControlLabelTemplateDirective} from './control-label-template.directive';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'cm-control',
  template: `
    <div [style.flex-direction]="flow()"
         class="control">
      @if (label() || commonLabelTpl()) {
        <label [attr.for]="labelFor()" class="control__label">
          <ng-container *ngTemplateOutlet="beforeLabelTpl()"></ng-container>

          <span class="control__label-string">
          @if (commonLabelTpl()) {
            <ng-container *ngTemplateOutlet="commonLabelTpl()"></ng-container>
          } @else if (label()) {
            {{ label() }}
          }
        </span>
          <ng-container *ngTemplateOutlet="afterLabelTpl()"></ng-container>

          @if (endLabelTpl()) {
            <span class="control__label-end">
            <ng-container *ngTemplateOutlet="endLabelTpl()"></ng-container>
          </span>
          }
        </label>
      }

      <div class="control__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        width: 100%;
      }

      .control {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .control__label {
        font-size: 14px;
        display: flex;
        align-items: flex-end;
        gap: 8px;
        min-width: 0;

        &-string {
        }
      }

      .control__label-end {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        margin-left: auto;
      }

      .control__label-end:empty {
        display: none;
      }

      .control__label-string:empty {
        display: none;
      }

      .control__content {
        display: flex;
      }
    `
  ],
  imports: [
    NgTemplateOutlet,
    ],
  encapsulation: ViewEncapsulation.None
})
export class ControlComponent {
  constructor() {
  }

  label = input('');
  flow = input<'row' | 'column' | 'column-reverse' | 'row-reverse'>('column');
  labelFor = input<string | null>(null);
  labelTpls = contentChildren(ControlLabelTemplateDirective);
  beforeLabelTpl = computed(() => {
    return this.labelTpls().find(tpl => tpl.position() === 'before')?.templateRef || null;
  });

  afterLabelTpl = computed(() => {
    return this.labelTpls().find(tpl => tpl.position() === 'after')?.templateRef || null;
  });

  endLabelTpl = computed(() => {
    return this.labelTpls().find(tpl => tpl.position() === 'end')?.templateRef || null;
  });

  commonLabelTpl = computed(() => {
    return this.labelTpls().find(tpl => !tpl.position())?.templateRef || null;
  });
}

