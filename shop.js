const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
  cucumber: { name: "Cucumber", emoji: "🥒" },
  avocado: { name: "Avocado", emoji: "🥑" },
  tomato: { name: "Tomato", emoji: "🍅" },
  potato: { name: "Potato", emoji: "🥔" },
};

const REQUEST_NOTE =
  "This is a requested item. We’ll review it before checkout.";

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
    return item;
  }
  return null;
}

function addToBasket(product) {
  const basket = getBasket();
  basket.push(product);
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
    description: "",
  };
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
    li.className = display.kind === "request" ? "basket-item basket-item-request" : "basket-item";

    const referenceMarkup = display.reference
      ? `<a class="request-reference" href="${display.reference}" target="_blank" rel="noreferrer">Reference</a>`
      : "";

    li.innerHTML = `
      <div class="basket-item-content">
        <span class="basket-emoji">${display.emoji}</span>
        <div class="basket-item-text">
          <span class="basket-item-title">${display.title}</span>
          ${display.description ? `<span class="basket-item-description">${display.description}</span>` : ""}
          ${referenceMarkup}
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
