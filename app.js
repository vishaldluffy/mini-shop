const products = [
  { id: "notebook", name: "Pocket Notebook", category: "Paper", price: 129, icon: "📓" },
  { id: "pens", name: "Fine-Line Pens", category: "Writing", price: 179, icon: "🖊️" },
  { id: "notes", name: "Sticky Notes", category: "Paper", price: 89, icon: "🗒️" },
  { id: "lamp", name: "Orbit Desk Lamp", category: "Lighting", price: 749, icon: "💡" },
  { id: "organiser", name: "Wood Desk Tray", category: "Storage", price: 429, icon: "🪵" },
  { id: "mug", name: "Ceramic Mug", category: "Accessories", price: 299, icon: "☕" },
  { id: "plant", name: "Mini Planter", category: "Accessories", price: 239, icon: "🪴" },
  { id: "scissors", name: "Craft Scissors", category: "Tools", price: 159, icon: "✂️" },
];
const storageKey = "desk-and-day.cart";
const quantityLimit = 99;
const deliveryFee = 40;
const freeDeliveryThreshold = 500;

const catalog = document.querySelector("#products");
const cartTable = document.querySelector("#cart-table");
const cartRows = document.querySelector("#cart-rows");
const empty = document.querySelector("#empty");
const badge = document.querySelector("#badge");
const checkout = document.querySelector("#checkout");
const preview = document.querySelector("#preview");
const feedback = document.querySelector("#feedback");
const storageError = document.querySelector("#storage-error");

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const money = (amount) => currency.format(amount);
const cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Object.fromEntries(products.flatMap(({ id }) => {
      const quantity = saved?.[id];
      return Number.isInteger(quantity) && quantity > 0 && quantity <= quantityLimit ? [[id, quantity]] : [];
    }));
  } catch {
    return {};
  }
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function actionButton(text, action, product, label) {
  const button = element("button", text, action === "remove" ? "remove" : undefined);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = product.id;
  button.setAttribute("aria-label", label);
  return button;
}

function renderProducts() {
  for (const product of products) {
    const card = element("article", "", "product");
    const visual = element("span", product.icon, "visual");
    visual.setAttribute("aria-hidden", "true");
    card.append(
      visual, element("h3", product.name), element("p", product.category, "category"),
      element("p", money(product.price), "price"),
      actionButton("Add to cart", "add", product, "Add " + product.name + " to cart")
    );
    catalog.append(card);
  }
}

function items() {
  return products.filter(({ id }) => cart[id]).map((product) => ({
    ...product, quantity: cart[product.id], lineTotal: product.price * cart[product.id],
  }));
}

function totals(lines) {
  const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const delivery = subtotal > 0 && subtotal < freeDeliveryThreshold ? deliveryFee : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

function renderTotals(node, lines) {
  const { subtotal, delivery, total } = totals(lines);
  const values = [["Subtotal", money(subtotal)], ["Delivery", money(delivery)], ["Total", money(total)]];
  node.replaceChildren(...values.map(([label, value]) => {
    const row = element("div", "");
    row.append(element("dt", label), element("dd", value));
    return row;
  }));
}

function createCartRow(item) {
  const row = element("tr", "");
  const name = element("th", item.name);
  name.scope = "row";
  name.append(actionButton("Remove", "remove", item, "Remove " + item.name));
  const quantityCell = element("td", "");
  const controls = element("div", "", "qty");
  const decrease = actionButton("−", "decrease", item, "Decrease " + item.name + " quantity");
  const increase = actionButton("+", "increase", item, "Increase " + item.name + " quantity");
  increase.disabled = item.quantity >= quantityLimit;
  controls.append(decrease, element("span", item.quantity), increase);
  quantityCell.append(controls);
  row.append(name, quantityCell, element("td", money(item.lineTotal)));
  return row;
}

function renderCart() {
  const lines = items();
  const count = lines.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
  empty.hidden = lines.length > 0;
  cartTable.hidden = lines.length === 0;
  checkout.disabled = lines.length === 0;
  cartRows.replaceChildren(...lines.map(createCartRow));
  renderTotals(document.querySelector("#totals"), lines);
}

function saveAndRender() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    storageError.hidden = true;
  } catch {
    storageError.hidden = false;
  }
  renderCart();
}

function changeQuantity(product, delta) {
  const quantity = (cart[product.id] ?? 0) + delta;
  if (quantity <= 0) {
    removeItem(product);
    return;
  }
  if (quantity > quantityLimit) {
    feedback.textContent = "Maximum quantity reached for " + product.name + ".";
    return;
  }
  cart[product.id] = quantity;
  saveAndRender();
  feedback.textContent = product.name + " quantity: " + quantity + ".";
}

function removeItem(product) {
  delete cart[product.id];
  saveAndRender();
  feedback.textContent = product.name + " removed.";
}

catalog.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const product = products.find(({ id }) => id === button.dataset.id);
  changeQuantity(product, 1);
});

cartRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const { id, action } = button.dataset;
  const product = products.find((item) => item.id === id);
  if (action === "remove") removeItem(product);
  else changeQuantity(product, action === "increase" ? 1 : -1);
  const replacement = cartRows.querySelector('[data-id="' + id + '"][data-action="' + action + '"]:not(:disabled)');
  const fallback = cartRows.querySelector("button") ?? document.querySelector("#cart-title");
  (replacement ?? fallback).focus();
});

checkout.addEventListener("click", () => {
  const lines = items();
  if (!lines.length) return;
  const summary = document.querySelector("#order-items");
  summary.replaceChildren(...lines.map((item) =>
    element("li", item.name + " × " + item.quantity + " — " + money(item.lineTotal))
  ));
  renderTotals(document.querySelector("#order-totals"), lines);
  preview.showModal();
});

renderProducts();
renderCart();

