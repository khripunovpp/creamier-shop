import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {DeliveryDetails, ShippingDetails} from '../../types/order.type';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  constructor() {
  }

  private _deliveryDetails?: DeliveryDetails;
  private _shippingDetails?: ShippingDetails;
  private readonly _deliveryDetailsSubject = new BehaviorSubject<DeliveryDetails | undefined>(undefined);

  updateDetails(details: DeliveryDetails) {
    this._deliveryDetails = details;
    this._deliveryDetailsSubject.next(this._deliveryDetails);
  }

  get deliveryDetails$() {
    return this._deliveryDetailsSubject.asObservable();
  }
}
