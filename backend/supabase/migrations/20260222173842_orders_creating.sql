-- orders creating
-- enums for payment method
CREATE TYPE payment_methods AS ENUM ('cash', 'bank_transfer', 'card');

-- add delivery_info column, paid_at , payment_method is enum('cash', 'bank_transfer', 'card')
ALTER TABLE orders
    ADD COLUMN delivery_info JSONB,
ADD COLUMN paid_at timestamp with time zone,
ADD COLUMN payment_method payment_methods;

