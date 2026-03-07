import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {DeliveryDetails, ShippingDetails} from '../../types/order.type';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  constructor() {
  }

  private _deliveryDetails: DeliveryDetails = {
    shipping: undefined,
    time: Date.now(),
    phoneNumber: '+351 912345678',
    email: 'pashtito@gmail.com',
    telegram: '',
    whatsapp: '',
    name: 'Pashtito',
    comment: 'do not ring the doorbell, just leave it at the door',
  };
  private _shippingDetails: ShippingDetails = {
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
  };
  private readonly _deliveryDetailsSubject = new BehaviorSubject<DeliveryDetails>(this._deliveryDetails);

  get deliveryDetails$() {
    return this._deliveryDetailsSubject.asObservable();
  }

  updateDetails(details: DeliveryDetails) {
    this._deliveryDetails = details;
    this._deliveryDetailsSubject.next(this._deliveryDetails);
  }
}
