import {
  API_BASE_URL,
  fetchJson,
  setButtonsDisabled,
  clearCards,
  formatName,
  getProgressWidth,
} from "./utils.js";

const containerCard = document.getElementById("container_card");
const searchInput = document.getElementById("input");
const searchButton = document.getElementById("button");
const allPokemonButton = document.getElementById("all_pokemon");

const generationRanges = {
  gen_1: [1, 151],
  gen_2: [152, 251],
  gen_3: [252, 386],
  gen_4: [387, 493],
  gen_5: [494, 649],
  gen_6: [650, 721],
  gen_7: [722, 809],
  gen_8: [810, 898],
};

const pokemonCache = new Map();

const normalizeQuery = (value) => value.toString().trim().toLowerCase();

const renderStatHtml = (stat) => `
    <div class="stats_containesr" id="stat_${stat.stat.name}">
      <span>${stat.stat.name.toLowerCase()}</span>
      <div class="progress">
        <div class="value" style="width:${getProgressWidth(stat.base_stat)}%">${stat.base_stat}</div>
      </div>
    </div>
  `;

const renderTypeIcons = (types, pokemonId) => {
  const cardElement = document.getElementById(`pok_${pokemonId}`);
  const typeContainer = cardElement?.querySelector(".types");
  if (!typeContainer) return;

  typeContainer.replaceChildren();
  types.forEach((typeInfo, index) => {
    const typeName = typeInfo.type.name;
    const typeSuffix = index === 0 ? "" : "a";
    const img = document.createElement("img");
    img.src = `./Img/Tipo_${typeName}${typeSuffix}.png`;
    img.alt = typeName;
    img.classList.add("type-icon");
    typeContainer.appendChild(img);
  });
};

const createPokemonCardHtml = (pokemon) => {
  const primaryType = pokemon.types?.[0]?.type?.name ?? "normal";
  return `
  <div class="card type-${primaryType}" id="pok_${pokemon.id}">
    <div class="info_card">
      <div class="img_card">
        <img class="img_normal" src="${pokemon.sprites.front_default}" alt="${pokemon.name} normal" />
        <img class="img_shiny" src="${pokemon.sprites.front_shiny}" alt="${pokemon.name} shiny" />
      </div>
      <div class="details_card">
        <div class="id_pokedex">
          <span>#${pokemon.id.toString().padStart(3, "0")}</span>
        </div>
        <div class="name_card">
          <h2>${formatName(pokemon.name)}</h2>
        </div>
        <div class="Basic_data">
          <p>Altura<span>${pokemon.height / 10}m</span></p>
          <p>Peso<span>${pokemon.weight / 10}kg</span></p>
        </div>
        <div class="stats">
          ${pokemon.stats.map(renderStatHtml).join("")}
        </div>
        <div class="types"></div>
      </div>
    </div>
  </div>
`;
};

const renderPokemonCard = (pokemon) => {
  if (!pokemon) return;

  containerCard.insertAdjacentHTML("beforeend", createPokemonCardHtml(pokemon));
  renderTypeIcons(pokemon.types, pokemon.id);
};

const fetchPokemonById = async (idOrName) => {
  const query = normalizeQuery(idOrName);
  if (pokemonCache.has(query)) {
    renderPokemonCard(pokemonCache.get(query));
    return pokemonCache.get(query);
  }

  const pokemon = await fetchJson(`${API_BASE_URL}/pokemon/${query}`);
  if (pokemon) {
    pokemonCache.set(query, pokemon);
    pokemonCache.set(pokemon.id.toString(), pokemon);
    renderPokemonCard(pokemon);
  }

  return pokemon;
};

const fetchInBatches = async (ids, batchSize = 12) => {
  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize);
    await Promise.all(batch.map((id) => fetchPokemonById(id)));
  }
};

const fetchPokemons = async (start, end) => {
  setButtonsDisabled(true);
  clearCards(containerCard);
  const ids = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  await fetchInBatches(ids);
  setButtonsDisabled(false);
};

const showSearchError = (message) => {
  clearCards(containerCard);
  const errorElement = document.createElement("div");
  errorElement.className = "search-error";
  errorElement.textContent = message;
  containerCard.appendChild(errorElement);
};

const handleSearch = async (event) => {
  event.preventDefault();
  const query = normalizeQuery(searchInput.value);

  if (!query) {
    showSearchError("Por favor ingresa un ID o nombre de Pokémon.");
    return;
  }

  clearCards(containerCard);
  const pokemon = await fetchPokemonById(query);
  if (!pokemon) {
    showSearchError("Pokémon no encontrado.");
  }
};

const bindGenerationButtons = () => {
  Object.keys(generationRanges).forEach((key) => {
    const button = document.getElementById(key);
    if (!button) return;

    button.addEventListener("click", async () => {
      const [start, end] = generationRanges[key];
      await fetchPokemons(start, end);
    });
  });
};

const initializeListeners = () => {
  searchButton.addEventListener("click", handleSearch);

  allPokemonButton.addEventListener("click", async () => {
    await fetchPokemons(generationRanges.gen_1[0], generationRanges.gen_8[1]);
  });

  bindGenerationButtons();
};

const init = async () => {
  initializeListeners();
  await fetchPokemons(generationRanges.gen_1[0], generationRanges.gen_1[1]);
};

init();
