// Delivery time slots offered to customers and shown in admin order editor.
// Every 2 hours, 09:00–19:00. Shared between frontend/shop and frontend/admin.
export const TIME_SLOTS = [
  '09:00–11:00',
  '11:00–13:00',
  '13:00–15:00',
  '15:00–17:00',
  '17:00–19:00',
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];
