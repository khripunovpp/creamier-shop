const pgErrorMessages: Record<string, string> = {
  'Rate limit': 'Too many orders, please try again later',
  'Product not found': 'One or more products are unavailable',
};

export function mapPgErrorMessage(message: string): string {
  const match = Object.entries(pgErrorMessages)
    .find(([key]) => message.startsWith(key));

  return match?.[1] ?? 'Order could not be processed';
}