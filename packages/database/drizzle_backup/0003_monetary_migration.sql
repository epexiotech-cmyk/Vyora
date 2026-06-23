UPDATE products SET purchase_price = CAST(ROUND(purchase_price * 100) AS INTEGER), sale_price = CAST(ROUND(sale_price * 100) AS INTEGER);

--> statement-breakpoint

UPDATE customers SET balance = CAST(ROUND(balance * 100) AS INTEGER);

--> statement-breakpoint

UPDATE suppliers SET balance = CAST(ROUND(balance * 100) AS INTEGER);