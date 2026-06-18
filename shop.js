const PRODUCTS = {
  apple: {
    name: "Apple",
    emoji: "🍏",
    price: 1.6,
    category: "Fruit",
    description: "Fresh and crisp for everyday snacking.",
    allergens: [],
  },
  banana: {
    name: "Banana",
    emoji: "🍌",
    price: 1.2,
    category: "Fruit",
    description: "Naturally sweet and easy to enjoy.",
    allergens: [],
  },
  lemon: {
    name: "Lemon",
    emoji: "🍋",
    price: 1.0,
    category: "Fruit",
    description: "Bright and zesty for drinks and recipes.",
    allergens: [],
  },
  cucumber: {
    name: "Cucumber",
    emoji: "🥒",
    price: 1.4,
    category: "Vegetable",
    description: "Cool, crunchy, and refreshing.",
    allergens: [],
  },
  avocado: {
    name: "Avocado",
    emoji: "🥑",
    price: 2.0,
    category: "Vegetable",
    description: "Smooth, creamy, and full of good fats.",
    allergens: [],
  },
  tomato: {
    name: "Tomato",
    emoji: "🍅",
    price: 1.3,
    category: "Vegetable",
    description: "A juicy staple for salads and cooking.",
    allergens: [],
  },
  potato: {
    name: "Potato",
    emoji: "🥔",
    price: 0.9,
    category: "Vegetable",
    description: "A versatile pantry favorite.",
    allergens: [],
  },
};

const GIFT_BOXES = {
  "vitamine-c-box": {
    name: "Vitamine C Box",
    emoji: "🎁",
    description: "A bright assortment designed for an extra vitamin boost.",
    price: 5.8,
    category: "Gift Box",
    contents: [
      { id: "apple", quantity: 2 },
      { id: "banana", quantity: 1 },
      { id: "lemon", quantity: 1 },
    ],
    allergens: ["May contain traces of nuts"],
  },
  "kids-party-box": {
    name: "Kids Party Box",
    emoji: "🎉",
    description: "A playful snack mix that is great for sharing.",
    price: 6.2,
    category: "Gift Box",
    contents: [
      { id: "banana", quantity: 2 },
      { id: "apple", quantity: 1 },
      { id: "lemon", quantity: 1 },
    ],
    allergens: ["May contain traces of nuts"],
  },
};

const REQUEST_NOTE =
  "This is a requested item. We’ll review it before checkout.";

function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

function getBasket() {
  try {
    const basket = localStorage.getItem("basket");
    if (!basket) return [];
    const parsed = JSON.parse(basket);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Error parsing basket from localStorage:", error);
    return [];
  }
}

function setBasket(basket) {
  localStorage.setItem("basket", JSON.stringify(basket));
}

function normalizeBasketItem(item) {
  if (typeof item === "string") {
    return { type: "product", id: item };
  }
  if (item && typeof item === "object") {
    if (item.type === "request" || item.type === "product" || item.type === "gift-box") {
      return item;
    }
    if (item.id && item.type === undefined && item.giftBox === true) {
      return { type: "gift-box", id: item.id };
    }
    if (item.id) {
      return { type: "product", id: item.id };
    }
  }
  return null;
}

function addToBasket(product) {
  const basket = getBasket();
  const normalized = normalizeBasketItem(product);
  basket.push(normalized || product);
  setBasket(basket);
}

function createRequestProduct(data) {
  return {
    type: "request",
    id: `request-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: data.name,
    description: data.description,
    reference: data.reference || "",
  };
}

function clearBasket() {
  localStorage.removeItem("basket");
}

function getGiftBoxAvailability(box) {
  if (!box) {
    return { available: false, note: "This gift box is temporarily unavailable." };
  }

  const missingItems = box.contents.filter((entry) => !PRODUCTS[entry.id]);
  if (missingItems.length > 0) {
    return {
      available: false,
      note: "This gift box is temporarily unavailable because one or more fruits are currently unavailable.",
    };
  }

  return { available: true, note: "" };
}

function getBasketItemDisplay(item) {
  const normalized = normalizeBasketItem(item);
  if (!normalized) return null;

  if (normalized.type === "request") {
    return {
      kind: "request",
      title: normalized.name || "Requested product",
      emoji: "📝",
      note: REQUEST_NOTE,
      reference: normalized.reference || "",
      description: normalized.description || "",
      price: null,
      contents: "",
      warnings: [],
    };
  }

  if (normalized.type === "gift-box") {
    const giftBox = GIFT_BOXES[normalized.id];
    if (!giftBox) return null;

    const availability = getGiftBoxAvailability(giftBox);
    const warnings = Array.from(
      new Set(
        giftBox.contents
          .flatMap((entry) => PRODUCTS[entry.id]?.allergens || [])
          .concat(giftBox.allergens || [])
      )
    );

    return {
      kind: "gift-box",
      title: giftBox.name,
      emoji: giftBox.emoji,
      note: availability.available ? "" : availability.note,
      reference: "",
      description: giftBox.description,
      price: giftBox.price,
      contents: giftBox.contents
        .map((entry) => `${PRODUCTS[entry.id]?.name || entry.id} ×${entry.quantity}`)
        .join(", "),
      warnings,
      isAvailable: availability.available,
    };
  }

  const product = PRODUCTS[normalized.id];
  if (!product) return null;

  return {
    kind: "product",
    title: product.name,
    emoji: product.emoji,
    note: "",
    reference: "",
    description: product.description,
    price: product.price,
    contents: "",
    warnings: product.allergens || [],
    isAvailable: true,
  };
}

function getBasketItemPrice(item) {
  const display = getBasketItemDisplay(item);
  return display && display.price !== null ? display.price : 0;
}

function getBasketItemFruitCount(item) {
  const normalized = normalizeBasketItem(item);
  if (!normalized) return 0;
  if (normalized.type === "gift-box") {
    const giftBox = GIFT_BOXES[normalized.id];
    if (!giftBox) return 0;
    return giftBox.contents.reduce((sum, entry) => sum + entry.quantity, 0);
  }
  return 1;
}

function getBasketTotals() {
  const basket = getBasket();
  let total = 0;
  let fruitCount = 0;

  basket.forEach((item) => {
    total += getBasketItemPrice(item);
    fruitCount += getBasketItemFruitCount(item);
  });

  return { total, fruitCount };
}

function updateBasketItem(index, updates) {
  const basket = getBasket();
  if (!basket[index]) return;
  basket[index] = { ...basket[index], ...updates };
  setBasket(basket);
  renderBasket();
  renderBasketIndicator();
}

function removeBasketItem(index) {
  const basket = getBasket();
  basket.splice(index, 1);
  setBasket(basket);
  renderBasket();
  renderBasketIndicator();
}

function openRequestModal(index = null) {
  const modal = document.getElementById("requestModal");
  const form = document.getElementById("requestForm");
  const productName = document.getElementById("requestProductName");
  const description = document.getElementById("requestDescription");
  const reference = document.getElementById("requestReference");
  const editingIndex = document.getElementById("requestEditingIndex");

  if (!modal || !form || !productName || !description || !reference || !editingIndex) {
    return;
  }

  if (index !== null) {
    const basket = getBasket();
    const item = basket[index];
    if (item && item.type === "request") {
      productName.value = item.name || "";
      description.value = item.description || "";
      reference.value = item.reference || "";
      editingIndex.value = String(index);
    } else {
      editingIndex.value = "";
    }
  } else {
    form.reset();
    editingIndex.value = "";
  }

  modal.style.display = "flex";
}

function closeRequestModal() {
  const modal = document.getElementById("requestModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function handleBasketClick(event) {
  const target = event.target;
  const button = target.closest("button[data-action]");
  if (!button) return;

  const action = button.getAttribute("data-action");
  const index = Number(button.getAttribute("data-index"));

  if (action === "remove") {
    removeBasketItem(index);
  } else if (action === "edit" && Number.isInteger(index)) {
    openRequestModal(index);
  }
}

function renderBasket() {
  const basket = getBasket();
  const basketList = document.getElementById("basketList");
  const basketSummary = document.getElementById("basketSummary");
  const cartButtonsRow = document.querySelector(".cart-buttons-row");
  const clearBasketBtn = document.getElementById("clearBasket");
  const checkoutLink = document.getElementById("checkoutLink");
  if (!basketList) return;
  basketList.innerHTML = "";

  if (basket.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
  } else {
    basket.forEach((item, index) => {
      const normalized = normalizeBasketItem(item);
      const display = getBasketItemDisplay(normalized);
      if (!display) return;

      const li = document.createElement("li");
      li.className =
        display.kind === "request"
          ? "basket-item basket-item-request"
          : display.kind === "gift-box"
            ? "basket-item basket-item-gift"
            : "basket-item";

      const referenceMarkup = display.reference
        ? `<a class="request-reference" href="${display.reference}" target="_blank" rel="noreferrer">Reference</a>`
        : "";
      const priceMarkup = display.price !== null && display.price !== undefined
        ? `<span class="basket-item-price">${formatCurrency(display.price)}</span>`
        : "";
      const contentsMarkup = display.contents
        ? `<span class="basket-item-list">Contents: ${display.contents}</span>`
        : "";
      const warningsMarkup = display.warnings && display.warnings.length > 0
        ? `<span class="basket-item-warning">Allergy note: ${display.warnings.join(" • ")}</span>`
        : "";

      li.innerHTML = `
        <div class="basket-item-content">
          <span class="basket-emoji">${display.emoji}</span>
          <div class="basket-item-text">
            <span class="basket-item-title">${display.title}</span>
            ${display.description ? `<span class="basket-item-description">${display.description}</span>` : ""}
            ${contentsMarkup}
            ${priceMarkup}
            ${referenceMarkup}
            ${warningsMarkup}
            ${display.note ? `<span class="basket-notice">${display.note}</span>` : ""}
          </div>
        </div>
        <div class="basket-item-actions">
          ${display.kind === "request" ? `<button type="button" data-action="edit" data-index="${index}" aria-label="Edit requested item">Edit</button>` : ""}
          <button type="button" data-action="remove" data-index="${index}" aria-label="Remove item from basket">Remove</button>
        </div>
      `;

      basketList.appendChild(li);
    });
  }

  if (basketSummary) {
    const totals = getBasketTotals();
    basketSummary.textContent = `Total items: ${totals.fruitCount} • Basket total: ${formatCurrency(totals.total)}`;
  }

  if (cartButtonsRow) {
    cartButtonsRow.style.display = "flex";
  }
  if (clearBasketBtn) {
    clearBasketBtn.style.display = basket.length > 0 ? "inline-block" : "none";
  }
  if (checkoutLink) {
    checkoutLink.style.display = basket.length > 0 ? "inline-block" : "none";
  }
}

function renderBasketIndicator() {
  const basket = getBasket();
  let indicator = document.querySelector(".basket-indicator");
  if (!indicator) {
    const basketLink = document.querySelector(".basket-link");
    if (!basketLink) return;
    indicator = document.createElement("span");
    indicator.className = "basket-indicator";
    basketLink.appendChild(indicator);
  }
  if (basket.length > 0) {
    indicator.textContent = basket.length;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

if (document.readyState !== "loading") {
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", renderBasketIndicator);
}

const origAddToBasket = addToBasket;
addToBasket = function (product) {
  origAddToBasket(product);
  renderBasketIndicator();
};
const origClearBasket = clearBasket;
clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
};

if (document.getElementById("basketList")) {
  document.getElementById("basketList").addEventListener("click", handleBasketClick);
}

if (document.getElementById("requestForm")) {
  document.getElementById("requestForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const form = event.currentTarget;
    const productName = document.getElementById("requestProductName");
    const description = document.getElementById("requestDescription");
    const reference = document.getElementById("requestReference");
    const editingIndex = document.getElementById("requestEditingIndex");

    if (!productName || !description || !reference || !editingIndex) return;

    const name = productName.value.trim();
    const requestDescription = description.value.trim();
    const requestReference = reference.value.trim();

    if (!name) {
      productName.focus();
      return;
    }

    const requestItem = createRequestProduct({
      name,
      description: requestDescription,
      reference: requestReference,
    });

    const basketIndex = editingIndex.value;
    if (basketIndex !== "") {
      updateBasketItem(Number(basketIndex), requestItem);
    } else {
      addToBasket(requestItem);
      renderBasket();
      renderBasketIndicator();
    }

    form.reset();
    closeRequestModal();
  });
}

if (document.getElementById("requestProductBtn")) {
  document.getElementById("requestProductBtn").addEventListener("click", function () {
    openRequestModal();
  });
}

if (document.getElementById("closeRequestModal")) {
  document.getElementById("closeRequestModal").addEventListener("click", closeRequestModal);
}

if (document.getElementById("cancelRequestModal")) {
  document.getElementById("cancelRequestModal").addEventListener("click", closeRequestModal);
}

if (document.getElementById("requestModal")) {
  document.getElementById("requestModal").addEventListener("click", function (event) {
    if (event.target.id === "requestModal") {
      closeRequestModal();
    }
  });
}
