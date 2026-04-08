export const API_BASE_URL = "https://pokeapi.co/api/v2";

export const fetchJson = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error, url);
    return null;
  }
};

export const setButtonsDisabled = (disabled) => {
  document.querySelectorAll(".button").forEach((btn) => {
    btn.disabled = disabled;
  });
};

export const clearCards = (container = document.getElementById("container_card")) => {
  container.replaceChildren();
};

export const formatName = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const getProgressWidth = (stat) =>
  Math.min(100, Math.round((stat / 255) * 100));

export const getLocalizedValue = (items, field, preferredLocales = ["es", "en"]) => {
  const found = items.find((item) => preferredLocales.includes(item.language.name));
  return found?.[field] || items[0]?.[field] || "";
};
