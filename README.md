# Desk & Day

InternCircle Project 05, mini e-commerce option. This storefront contains eight fictional desk products, a cart and a checkout preview.

[Live app](https://vishaldluffy.github.io/mini-shop/)

## How totals work

Each line total multiplies the product's numeric price by its quantity. The subtotal adds all line totals. A nonempty cart below ₹500 adds ₹40 for delivery. Orders of ₹500 or more have free delivery. The grand total is the subtotal plus delivery, formatted in Indian rupees. Quantities are saved in localStorage and validated when restored.

The checkout preview is a demo without payment. To run locally, serve this folder with a static server such as Live Server.

