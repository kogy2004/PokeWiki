import {
  API_BASE_URL,
  fetchJson,
  setButtonsDisabled,
  clearCards,
  getLocalizedValue,
} from "./utils.js";

const containerCard = document.getElementById("container_card");
const allPokemonButton = document.getElementById("all_pokemon");
const containerButtonCategory = document.getElementById("container_button_category");
const searchInput = document.getElementById("input");
const searchButton = document.getElementById("button");
const datalistItems = document.getElementById("datalist_items");

const itemCache = new Map();

const normalizeQuery = (value) => value.toString().trim().toLowerCase();

const createItemCardHtml = (item) => `
  <div class="card" id="pok_${item.id}">
    <div class="info_card">
      <div class="img_card">
        <img class="img_normal" src="${item.sprites.default}" alt="${item.name}" />
      </div>
      <div class="details_card">
        <div class="id_pokedex">
          <span>#${item.id.toString().padStart(3, "0")}</span>
        </div>
        <div class="name_card">
          <h2>${getLocalizedValue(item.names, "name")}</h2>
        </div>
        <div class="Basic_data">
          <div class="data">
            <h4>Coste:</h4><span>${item.cost}</span>
          </div>
          <div class="data">
            <h4>Categoria:</h4><span>${item.category.name}</span>
          </div>
          <div class="description">
            <h3>Descripción</h3>
            <p>${getLocalizedValue(item.flavor_text_entries, "text")}</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

const showSearchError = (message) => {
  clearCards(containerCard);
  const errorElement = document.createElement("div");
  errorElement.className = "search-error";
  errorElement.textContent = message;
  containerCard.appendChild(errorElement);
};

const renderItemCard = (item) => {
  if (!item || !item.sprites?.default) return;
  containerCard.insertAdjacentHTML("beforeend", createItemCardHtml(item));
};

const cacheItem = (item) => {
  if (!item) return;
  itemCache.set(item.id.toString(), item);
  itemCache.set(item.name.toLowerCase(), item);
};

const fetchItemById = async (idOrName) => {
  const query = normalizeQuery(idOrName);
  if (itemCache.has(query)) {
    renderItemCard(itemCache.get(query));
    return itemCache.get(query);
  }

  const item = await fetchJson(`${API_BASE_URL}/item/${query}/`);
  if (item) {
    cacheItem(item);
    renderItemCard(item);
  }

  return item;
};

const fetchInBatches = async (ids, batchSize = 12) => {
  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize);
    await Promise.all(batch.map((id) => fetchItemById(id)));
  }
};

const fetchItems = async (end) => {
  setButtonsDisabled(true);
  clearCards(containerCard);
  await ensureCategoryButtons();

  const ids = Array.from({ length: end }, (_, index) => index + 1);
  await fetchInBatches(ids);

  setButtonsDisabled(false);
};

const createCategoryButton = (pocket) => {
  const listItem = document.createElement("li");
  const button = document.createElement("button");

  button.type = "button";
  button.id = `item-pocket_${pocket.id}`;
  button.className = "button list";
  button.textContent = getLocalizedValue(pocket.names, "name");

  button.addEventListener("click", async () => {
    setButtonsDisabled(true);
    clearCards(containerCard);

    for (const category of pocket.categories) {
      await fetchCategoryItems(category.url);
    }

    setButtonsDisabled(false);
  });

  listItem.appendChild(button);
  containerButtonCategory.appendChild(listItem);
};

const ensureCategoryButtons = async () => {
  if (containerButtonCategory.childElementCount > 0) return;

  const pocketRequests = Array.from({ length: 8 }, (_, index) =>
    fetchJson(`${API_BASE_URL}/item-pocket/${index + 1}/`),
  );

  const pockets = await Promise.all(pocketRequests);
  pockets.forEach((pocket) => {
    if (pocket) createCategoryButton(pocket);
  });
};

const fetchCategoryItems = async (url) => {
  const category = await fetchJson(url);
  if (!category?.items) return;

  const ids = category.items.map((itemRef) =>
    Number(itemRef.url.split("/item/")[1].replace("/", "")),
  );
  await fetchInBatches(ids);
};

const searchItem = async (query) => {
  if (!query) return;
  clearCards(containerCard);

  const item = await fetchItemById(query);
  if (!item) {
    showSearchError("Item no encontrado");
  }
};

const createDatalistOption = (name) => {
  const option = document.createElement("option");
  option.value = name;
  datalistItems.appendChild(option);
};

const populateDatalist = async () => {
  const itemList = await fetchJson(`${API_BASE_URL}/item?limit=300`);
  if (!itemList?.results) return;

  itemList.results.forEach((item) => {
    createDatalistOption(item.name);
  });
};

const initializeListeners = () => {
  allPokemonButton.addEventListener("click", async () => {
    await fetchItems(1000);
  });

  searchButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
      showSearchError("Por favor ingresa un ID o nombre de item.");
      return;
    }

    await searchItem(query);
  });
};

const init = async () => {
  initializeListeners();
  await fetchItems(151);
  await populateDatalist();
};

init();
