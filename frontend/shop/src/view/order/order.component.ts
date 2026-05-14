import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal,} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {CartService} from '../../service/services/cart.service';
import {CartUiService} from '../../service/services/cart-ui.service';
import {I18nService} from '../../service/services/i18n.service';
import {SetsService} from '../../service/services/sets.service';
import {CreateOrderPayload, OrderService} from '../../service/services/order.service';
import {SetCartItem} from '../../types/set-cart-item.type';
import {Flavor} from '../../types/flavor.type';
import {TIME_SLOTS} from '../../../../shared/time-slots';

type ContactChannel = 'whatsapp' | 'telegram' | 'phone' | 'email';

const DAY_HDR = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
} as const;

const MONTH_FULL = {
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
} as const;

const MONTH_SHORT = {
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
} as const;

const PLACEHOLDERS: Record<ContactChannel, string> = {
  whatsapp: '+351 999 000 000',
  telegram: '@username',
  phone: '+351 999 000 000',
  email: 'hello@email.com',
};

@Component({
  selector: 'cmh-order',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cartUi.isCheckoutOpen()) {
      <div class="co-overlay">
        <div class="co-back" (click)="onBackdrop()"></div>
        <div class="co-modal">
          @if (submitted()) {
            <div class="co-ok">
              <div class="co-ok__ring">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2D4A3A"
                     stroke-width="2" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="co-ok__title">{{ i18n.t('Заказ принят!', 'Pedido recebido!') }}</div>
              @if (date() && timeSlot()) {
                <div class="co-ok__date">
                  <span class="co-ok__date-tx">📅 {{ selectedFormatted() }}</span>
                </div>
              }
              <p class="co-ok__msg">
                {{ i18n.t('Мы свяжемся с вами для подтверждения.', 'Entraremos em contacto para confirmar.') }}
              </p>
              <button class="co-ok__btn" type="button" (click)="finish()">
                {{ i18n.t('Готово', 'Fechar') }}
              </button>
            </div>
          } @else {
            <div class="co-hd">
              <div class="co-title">{{ i18n.t('Оформление', 'Finalizar') }}</div>
              <button class="co-close" type="button" (click)="closeAndReset()" aria-label="Close">✕</button>
            </div>

            @if (cartItems().length > 0) {
              <div class="co-summary">
                @for (item of cartItems(); track lineKey(item)) {
                  <div class="co-sum-row">
                    <div>
                      <div class="co-sum-kind">
                        {{ i18n.lang() === 'ru' ? item.set_name_ru : item.set_name_pt }}
                        · {{ item.count }} {{ i18n.t('шт', 'un') }} ×{{ item.quantity }}
                      </div>
                      <div class="co-sum-flavor">{{ flavorListFor(item) }}</div>
                    </div>
                    <div class="co-sum-price">{{ item.price * item.quantity }} €</div>
                  </div>
                }
                <div class="co-sum-total-row">
                  <span class="co-sum-total-lbl">{{ i18n.t('Итого', 'Total') }}</span>
                  <span class="co-sum-total-p">{{ sum() }} €</span>
                </div>
              </div>
            }

            <div class="co-field">
              <label class="co-label">{{ i18n.t('Имя *', 'Nome *') }}</label>
              <input class="co-input" type="text"
                     [value]="name()"
                     (input)="name.set(asInput($event))"
                     [placeholder]="i18n.t('Ваше имя', 'O seu nome')"/>
            </div>

            <div class="co-field">
              <label class="co-label">{{ i18n.t('Контакт *', 'Contacto *') }}</label>
              <div class="co-methods">
                @for (m of channels; track m.id) {
                  <button class="co-method-btn" type="button"
                          [class.co-method-btn--on]="contactChannel() === m.id"
                          (click)="selectChannel(m.id)">{{ i18n.t(m.ru, m.pt) }}
                  </button>
                }
              </div>
              <input class="co-input"
                     [type]="contactChannel() === 'email' ? 'email' : 'tel'"
                     [value]="contactValue()"
                     (input)="contactValue.set(asInput($event))"
                     [placeholder]="contactPlaceholder()"/>
            </div>

            <div class="co-field">
              <label class="co-label">{{ i18n.t('Дата и время *', 'Data e hora *') }}</label>
              <button class="co-date-btn" type="button"
                      [class.co-date-btn--set]="!!date()"
                      [class.co-date-btn--unset]="!date()"
                      (click)="isCalOpen.set(!isCalOpen())">
                <span>{{ selectedFormatted() || i18n.t('Выберите дату и время', 'Escolha data e hora') }}</span>
                <span class="co-date-arr" [class.co-date-arr--open]="isCalOpen()">▾</span>
              </button>
              @if (isCalOpen()) {
                <div class="co-cal">
                  <div class="co-cal-nav">
                    <button class="co-cal-btn" type="button" (click)="prevMonth()">←</button>
                    <span class="co-cal-month">{{ monthFull()[calMonth()] }} {{ calYear() }}</span>
                    <button class="co-cal-btn" type="button" (click)="nextMonth()">→</button>
                  </div>
                  <div class="co-cal-grid">
                    @for (d of dayHeader(); track d) {
                      <div class="co-cal-dname">{{ d }}</div>
                    }
                  </div>
                  <div class="co-cal-grid">
                    @for (c of cells(); track $index) {
                      @if (c === null) {
                        <div></div>
                      } @else {
                        <button class="co-cal-day" type="button"
                                [class.co-cal-day--dis]="isDisabled(c)"
                                [class.co-cal-day--sel]="isSameDay(c, pickedDate())"
                                [disabled]="isDisabled(c)"
                                (click)="selectDay(c)">{{ c.getDate() }}
                        </button>
                      }
                    }
                  </div>
                  @if (pickedDate()) {
                    <div class="co-slots">
                      <div class="co-slots-lbl">{{ i18n.t('Выберите время', 'Escolha o horário') }}</div>
                      <div class="co-slot-grid">
                        @for (s of slots; track s) {
                          <button class="co-slot-btn" type="button"
                                  [class.co-slot-btn--on]="timeSlot() === s"
                                  (click)="selectSlot(s)">{{ s }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="co-dlv-section">
              <label class="co-label">{{ i18n.t('Получение', 'Recebimento') }}</label>
              <div class="co-dlv-btns">
                <button class="co-dlv-btn" type="button"
                        [class.co-dlv-btn--on]="delivery() === 'pickup'"
                        (click)="selectDelivery('pickup')">
                  {{ i18n.t('Самовывоз', 'Levantar') }}
                </button>
                <button class="co-dlv-btn" type="button"
                        [class.co-dlv-btn--on]="delivery() === 'delivery'"
                        (click)="selectDelivery('delivery')">
                  {{ i18n.t('Доставка (Uber/Bolt)', 'Entrega (Uber/Bolt)') }}
                </button>
              </div>
            </div>

            @if (delivery() === 'pickup') {
              <div class="co-info co-info--pickup">
                <span class="co-info-ic">📍</span>
                <div class="co-info-tx co-info-tx--p">
                  @if (i18n.lang() === 'ru') {
                    <span>Самовывоз осуществляется по адресу:<br/>
                      <strong>м. Parque de Real · Rua Florbela Espanca</strong></span>
                  } @else {
                    <span>Levantamento no endereço:<br/>
                      <strong>M. Parque de Real · Rua Florbela Espanca</strong></span>
                  }
                </div>
              </div>
            } @else {
              <div class="co-info co-info--delivery">
                <span class="co-info-ic">🚗</span>
                <div class="co-info-tx co-info-tx--d">
                  {{
                    i18n.t(
                      'Доставка осуществляется через Uber или Bolt. Точная стоимость будет известна в момент отправки — мы согласуем её с вами перед отправкой заказа.',
                      'Entrega via Uber ou Bolt. O custo exacto será confirmado no momento do envio — iremos acordar consigo antes de despachar.'
                    )
                  }}
                </div>
              </div>
              <div class="co-field">
                <label class="co-label">{{ i18n.t('Адрес доставки *', 'Morada de entrega *') }}</label>
                <input class="co-input" type="text"
                       [value]="address()"
                       (input)="address.set(asInput($event))"
                       [placeholder]="i18n.t('Улица, дом, квартира', 'Rua, número, andar')"/>
              </div>
            }

            <div class="co-field co-field--lg">
              <label class="co-label">{{ i18n.t('Комментарий', 'Observações') }}</label>
              <textarea rows="3" class="co-input" style="resize: vertical;"
                        [value]="note()"
                        (input)="note.set(asTextarea($event))"
                        [placeholder]="i18n.t('Пожелания к заказу...', 'Observações ao pedido...')"></textarea>
            </div>

            <button class="co-submit"
                    type="button"
                    [class.co-submit--on]="canSubmit() && !submitting()"
                    [class.co-submit--off]="!canSubmit() || submitting()"
                    [disabled]="!canSubmit() || submitting()"
                    (click)="submit()">
              {{
                submitting()
                  ? i18n.t('Отправляем…', 'Enviando…')
                  : i18n.t('Отправить заказ →', 'Enviar pedido →')
              }}
            </button>

            @if (!canSubmit()) {
              <p
                class="co-hint">{{ i18n.t('Заполните все обязательные поля', 'Preencha todos os campos obrigatórios') }}</p>
            }
            @if (submitError()) {
              <p class="co-hint" style="color: #B33">{{ submitError() }}</p>
            }
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* Copied verbatim from .co-* rules in source/sweet-thing-v2.html */
    .co-overlay {
      position: fixed;
      inset: 0;
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .co-back {
      position: absolute;
      inset: 0;
      background: rgba(31, 42, 32, .5);
    }

    .co-modal {
      position: relative;
      background: var(--cream);
      width: 520px;
      max-width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      padding: 44px 48px;
      box-shadow: 0 12px 48px rgba(31, 42, 32, .22);
    }

    .co-hd {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .co-title {
      font-family: var(--f-disp);
      font-size: 40px;
      color: var(--forest);
      line-height: 1;
    }

    .co-close {
      background: none;
      border: none;
      color: var(--muted);
      font-size: 20px;
      cursor: pointer;
    }

    .co-summary {
      border: 1px solid var(--line);
      padding: 16px 18px;
      margin-bottom: 28px;
    }

    .co-sum-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
    }

    .co-sum-kind {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: var(--muted);
      margin-bottom: 2px;
    }

    .co-sum-flavor {
      font-size: 13px;
      color: var(--text);
    }

    .co-sum-price {
      font-family: var(--f-price);
      font-weight: 500;
      font-size: 18px;
      color: var(--forest);
    }

    .co-sum-total-row {
      display: flex;
      justify-content: space-between;
      padding-top: 4px;
    }

    .co-sum-total-lbl {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: var(--muted);
    }

    .co-sum-total-p {
      font-family: var(--f-price);
      font-weight: 500;
      font-size: 22px;
      color: var(--forest);
    }

    .co-field {
      margin-bottom: 18px;
    }

    .co-field--lg {
      margin-bottom: 28px;
    }

    .co-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }

    .co-input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--line);
      font-size: 14px;
      color: var(--text);
      background: var(--bg2);
    }

    .co-methods {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .co-method-btn {
      padding: 7px 14px;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .06em;
      cursor: pointer;
    }

    .co-method-btn--on {
      border-color: var(--forest);
      background: var(--forest);
      color: var(--cream);
    }

    .co-date-btn {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--line);
      background: var(--bg2);
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      cursor: pointer;
    }

    .co-date-btn--set {
      border-color: var(--forest);
      font-weight: 600;
      color: var(--text);
    }

    .co-date-btn--unset {
      color: var(--muted);
      font-weight: 400;
    }

    .co-date-arr {
      font-size: 14px;
      opacity: .5;
      transition: transform .2s;
      display: inline-block;
    }

    .co-date-arr--open {
      transform: rotate(180deg);
    }

    .co-cal {
      background: var(--bg2);
      border: 1px solid var(--line);
      border-top: none;
      padding: 20px;
    }

    .co-cal-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .co-cal-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--line);
      background: none;
      font-size: 16px;
      color: var(--forest);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .co-cal-month {
      font-family: var(--f-disp);
      font-size: 20px;
      color: var(--forest);
    }

    .co-cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 3px;
      margin-bottom: 6px;
    }

    .co-cal-dname {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .08em;
      color: var(--muted);
      padding-bottom: 4px;
    }

    .co-cal-day {
      padding: 7px 0;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--text);
      transition: all .12s;
      cursor: pointer;
    }

    .co-cal-day--dis {
      color: var(--line);
      cursor: default;
    }

    .co-cal-day--sel {
      background: var(--forest);
      color: var(--cream);
      font-weight: 700;
    }

    .co-slots {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
    }

    .co-slots-lbl {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .co-slot-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .co-slot-btn {
      padding: 11px 8px;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      transition: all .15s;
      cursor: pointer;
    }

    .co-slot-btn--on {
      border-color: var(--forest);
      background: var(--forest);
      color: var(--cream);
    }

    .co-dlv-section {
      margin-bottom: 12px;
    }

    .co-dlv-btns {
      display: flex;
      border: 1px solid var(--line);
      margin-bottom: 12px;
    }

    .co-dlv-btn {
      flex: 1;
      padding: 13px 16px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .co-dlv-btn:first-child {
      border-right: 1px solid var(--line);
    }

    .co-dlv-btn--on {
      background: var(--forest);
      color: var(--cream);
    }

    .co-info {
      margin-bottom: 18px;
      padding: 12px 14px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .co-info--pickup {
      background: #EAF4EC;
      border: 1px solid #9CC0A0;
    }

    .co-info--delivery {
      background: #FBF8E8;
      border: 1px solid #D4C870;
    }

    .co-info-ic {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .co-info-tx {
      font-size: 13px;
      line-height: 1.6;
    }

    .co-info-tx--p {
      color: #2D5C38;
    }

    .co-info-tx--d {
      color: #6B5F20;
    }

    .co-submit {
      width: 100%;
      padding: 15px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .co-submit--on {
      background: var(--forest);
      color: var(--cream);
      cursor: pointer;
    }

    .co-submit--off {
      background: rgba(31, 42, 32, .08);
      color: var(--muted);
      cursor: default;
    }

    .co-hint {
      font-size: 12px;
      color: var(--muted);
      text-align: center;
      margin-top: 10px;
    }

    .co-ok {
      text-align: center;
      padding: 32px 0;
    }

    .co-ok__ring {
      width: 64px;
      height: 64px;
      border: 2px solid var(--forest);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .co-ok__title {
      font-family: var(--f-disp);
      font-size: 56px;
      color: var(--forest);
      line-height: 1;
      margin-bottom: 14px;
    }

    .co-ok__date {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      background: var(--mint);
      padding: 10px 20px;
      margin-bottom: 16px;
    }

    .co-ok__date-tx {
      font-size: 14px;
      font-weight: 600;
      color: var(--forest);
    }

    .co-ok__msg {
      font-size: 15px;
      color: var(--muted);
      line-height: 1.7;
    }

    .co-ok__btn {
      margin-top: 32px;
      padding: 14px 40px;
      background: var(--forest);
      color: var(--cream);
      border: none;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .14em;
      text-transform: uppercase;
      cursor: pointer;
    }
  `,
})
export class OrderComponent {
  readonly cartUi = inject(CartUiService);
  readonly i18n = inject(I18nService);
  readonly slots = TIME_SLOTS;
  readonly channels: { id: ContactChannel; ru: string; pt: string }[] = [
    {id: 'whatsapp', ru: 'WhatsApp', pt: 'WhatsApp'},
    {id: 'telegram', ru: 'Telegram', pt: 'Telegram'},
    {id: 'phone', ru: 'Телефон', pt: 'Telefone'},
    {id: 'email', ru: 'Email', pt: 'Email'},
  ];
  // Form state
  readonly name = signal('');
  readonly contactChannel = signal<ContactChannel>('whatsapp');
  readonly contactValue = signal('');
  readonly date = signal('');                // YYYY-MM-DD
  readonly timeSlot = signal('');
  readonly delivery = signal<'pickup' | 'delivery'>('pickup');
  readonly address = signal('');
  readonly note = signal('');
  // Calendar state
  readonly isCalOpen = signal(false);
  readonly pickedDate = signal<Date | null>(null);
  // Submit state
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly dayHeader = computed(() => DAY_HDR[this.i18n.lang()]);
  readonly monthFull = computed(() => MONTH_FULL[this.i18n.lang()]);
  readonly cells = computed<(Date | null)[]>(() => {
    const y = this.calYear();
    const m = this.calMonth();
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;     // Mon = 0
    const dim = new Date(y, m + 1, 0).getDate();
    const out: (Date | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= dim; d++) out.push(new Date(y, m, d));
    return out;
  });
  readonly contactPlaceholder = computed(() => PLACEHOLDERS[this.contactChannel()]);
  readonly canSubmit = computed(() =>
    !!this.name().trim() &&
    !!this.contactValue().trim() &&
    !!this.date() &&
    !!this.timeSlot() &&
    (this.delivery() === 'pickup' || !!this.address().trim()) &&
    this.cartItems().length > 0
  );
  readonly selectedFormatted = computed(() => {
    if (!this.date()) return '';
    const d = new Date(this.date() + 'T00:00:00');
    const lang = this.i18n.lang();
    const dow = DAY_HDR[lang][(d.getDay() + 6) % 7];
    const m = MONTH_SHORT[lang][d.getMonth()];
    const time = this.timeSlot() ? ' · ' + this.timeSlot() : '';
    return `${dow}, ${d.getDate()} ${m}${time}`;
  });
  private readonly _cart = inject(CartService);
  // Cart for the summary box and final payload
  readonly cartItems = toSignal(this._cart.cart$, {initialValue: []});
  readonly sum = toSignal(this._cart.sum$, {initialValue: 0});
  private readonly _sets = inject(SetsService);
  private readonly _orderService = inject(OrderService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _initial = nextDay();
  readonly calYear = signal(this._initial.getFullYear());
  readonly calMonth = signal(this._initial.getMonth());
  private readonly _setsSig = toSignal(this._sets.sets$, {initialValue: []});
  private readonly _flavorsById = computed(() => {
    const map = new Map<string, Flavor>();
    for (const s of this._setsSig()) for (const f of s.items) map.set(f.id, f);
    return map;
  });
  private readonly _minDate = nextDay();

  isDisabled(d: Date): boolean {
    const a = new Date(d);
    a.setHours(0, 0, 0, 0);
    const b = new Date(this._minDate);
    b.setHours(0, 0, 0, 0);
    return a < b;
  }

  isSameDay(a: Date, b: Date | null): boolean {
    return !!b && a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  selectChannel(ch: ContactChannel): void {
    this.contactChannel.set(ch);
    this.contactValue.set('');
  }

  prevMonth(): void {
    if (this.calMonth() === 0) {
      this.calYear.update(y => y - 1);
      this.calMonth.set(11);
    } else {
      this.calMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.calMonth() === 11) {
      this.calYear.update(y => y + 1);
      this.calMonth.set(0);
    } else {
      this.calMonth.update(m => m + 1);
    }
  }

  selectDay(d: Date): void {
    if (this.isDisabled(d)) return;
    this.pickedDate.set(d);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.date.set(iso);
    this.timeSlot.set('');
  }

  selectSlot(s: string): void {
    this.timeSlot.set(s);
    setTimeout(() => this.isCalOpen.set(false), 180);
  }

  selectDelivery(d: 'pickup' | 'delivery'): void {
    this.delivery.set(d);
    this.address.set('');
  }

  flavorListFor(item: SetCartItem): string {
    const map = this._flavorsById();
    return item.flavor_ids
      .map(id => {
        const f = map.get(id);
        return f ? this.i18n.pick(f, 'name') : id;
      })
      .join(' + ');
  }

  lineKey(item: SetCartItem): string {
    return item.stock_set_rule_id + ':' + item.flavor_ids.join(',');
  }

  asInput(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  asTextarea(e: Event): string {
    return (e.target as HTMLTextAreaElement).value;
  }

  onBackdrop(): void {
    if (this.submitting()) return;
    this.closeAndReset();
  }

  closeAndReset(): void {
    this.cartUi.closeCheckout();
    if (this.submitted()) this._resetForm();
  }

  finish(): void {
    this.cartUi.closeCheckout();
    this._resetForm();
  }

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);

    const ch = this.contactChannel();
    const value = this.contactValue().trim();

    const payload: CreateOrderPayload = {
      items: this._cart.toOrderItems(),
      contact_channel: ch,
      name: this.name().trim(),
      email: ch === 'email' ? value : null,
      phone_number: ch === 'phone' ? value : null,
      telegram: ch === 'telegram' ? value : null,
      whatsapp: ch === 'whatsapp' ? value : null,
      delivery_date: new Date(this.date() + 'T00:00:00').toISOString(),
      delivery_time: this.timeSlot(),
      delivery_info: this.delivery() === 'delivery' ? {address: this.address().trim()} : null,
      delivery_type: this.delivery(),
      comment: this.note().trim() || null,
    };

    this._orderService.create(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this._cart.clear();
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err?.error?.error ?? this.i18n.t('Не удалось отправить заказ', 'Falha ao enviar pedido'));
        },
      });
  }

  private _resetForm(): void {
    this.name.set('');
    this.contactChannel.set('whatsapp');
    this.contactValue.set('');
    this.date.set('');
    this.timeSlot.set('');
    this.delivery.set('pickup');
    this.address.set('');
    this.note.set('');
    this.isCalOpen.set(false);
    this.pickedDate.set(null);
    this.submitted.set(false);
    this.submitError.set(null);
  }
}

function nextDay(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}
