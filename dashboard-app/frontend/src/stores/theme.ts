import { defineStore } from "pinia";
import { getTheme, THEME_OPTIONS, THEMES, THEME_STORAGE_KEY, type ThemeName } from "../utils/theme";

function savedTheme(): ThemeName {
  const value = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
  return value && value in THEMES ? value : "indigo";
}

export const useThemeStore = defineStore("theme", {
  state: () => ({ name: savedTheme() as ThemeName }),
  getters: {
    current: (state) => getTheme(state.name),
    options: () => THEME_OPTIONS
  },
  actions: {
    apply(name: ThemeName) {
      this.name = name in THEMES ? name : "indigo";
      document.documentElement.dataset.theme = this.name;
      localStorage.setItem(THEME_STORAGE_KEY, this.name);
    },
    initialize() {
      this.apply(this.name);
    }
  }
});
