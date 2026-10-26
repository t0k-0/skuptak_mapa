import * as d3 from "d3";
import initSqlJs from "sql.js";
import readExcelFile from "read-excel-file/browser";
import * as vennLibrary from "venn.js/build/venn.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import skuptakHorizontalSvg from "./assets/skuptak-horizontal.svg?raw";
import skuptakEmblemUrl from "./assets/skuptak-emblem.svg?url";
import skuptakEmblemSvg from "./assets/skuptak-emblem.svg?raw";
import skaviatorSvg from "./assets/skaviator-light.svg?raw";
import "./styles.css";

const skuptakV1DataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(skuptakHorizontalSvg)}`;

const CATEGORY_COLORS = {
  "Oddíl 1": "#ef765f",
  "Oddíl 2": "#6ba29b",
  "Oddíl 3": "#d4ae72",
  "Oddíl 4": "#8daec4",
  "Oddíl 5": "#bbc85d"
};

const seed = {
  categories: [
    [1, "Oddíl 1", "První oddíl a jeho družiny", "#ef765f"],
    [2, "Oddíl 2", "Druhý oddíl a jeho družiny", "#6ba29b"],
    [3, "Oddíl 3", "Třetí oddíl a jeho družiny", "#d4ae72"],
    [4, "Oddíl 4", "Čtvrtý oddíl a jeho družiny", "#8daec4"],
    [5, "Oddíl 5", "Pátý oddíl a jeho družiny", "#bbc85d"]
  ],
  teams: [
    [1, "Středisko", null, 0],
    [2, "Oddíl 1", 1, 1], [3, "Oddíl 2", 1, 1], [4, "Oddíl 3", 1, 1],
    [5, "Oddíl 4", 1, 1], [6, "Oddíl 5", 1, 1],
    [7, "Družina 1A", 2, 2], [8, "Družina 1B", 2, 2],
    [9, "Družina 2A", 3, 2], [10, "Družina 2B", 3, 2],
    [11, "Družina 3A", 4, 2], [12, "Družina 3B", 4, 2],
    [13, "Družina 4A", 5, 2], [14, "Družina 4B", 5, 2],
    [15, "Družina 5A", 6, 2], [16, "Družina 5B", 6, 2]
  ],
  people: [
    [1,"Anna Novotná","Vedoucí střediska",36,1,"Jádro","Praha","anna@stredisko.cz","Drží společný směr a propojuje vedoucí týmů."],
    [2,"Matěj Dvořák","Programový koordinátor",29,2,"Jádro","Brno","matej@stredisko.cz","Skládá roční program a hlídá jeho rytmus."],
    [3,"Klára Svobodová","Grafická designérka",27,4,"Komunikace","Olomouc","klara@stredisko.cz","Vizuální identita, sazba a sociální sítě."],
    [4,"Tomáš Procházka","Správce prostoru",43,3,"Provoz","Praha","tomas@stredisko.cz","Budova, technika, klíče a bezpečnost."],
    [5,"Eliška Veselá","Metodička",32,2,"Program","Plzeň","eliska@stredisko.cz","Podpora týmů a příprava metodických materiálů."],
    [6,"Jan Kučera","Fundraiser",39,1,"Jádro","Praha","jan@stredisko.cz","Partnerství, granty a péče o dárce."],
    [7,"Nina Horáková","Social media",24,4,"Komunikace","Brno","nina@stredisko.cz","Obsahový kalendář a každodenní komunikace."],
    [8,"David Marek","Technická podpora",31,3,"Provoz","Liberec","david@stredisko.cz","Digitální nástroje, zvuk a projekce."],
    [9,"Sára Králová","Koordinátorka dobrovolníků",26,5,"Dobrovolníci","Praha","sara@stredisko.cz","Páruje lidi s úkoly a pečuje o komunitu."],
    [10,"Petr Jelínek","Lektor",48,2,"Program","Tábor","petr@stredisko.cz","Vede kurzy a mentoruje nové lektory."],
    [11,"Bára Malá","Fotografka",22,4,"Komunikace","Praha","bara@stredisko.cz","Dokumentuje akce a spravuje fotoarchiv."],
    [12,"Ondřej Černý","Ekonom",51,3,"Provoz","Brno","ondrej@stredisko.cz","Rozpočet, smlouvy a finanční přehledy."],
    [13,"Tereza Pokorná","Dobrovolnice",19,5,"Dobrovolníci","Jihlava","tereza@stredisko.cz","Pomoc s akcemi a přípravou prostoru."],
    [14,"Marek Hájek","Facilitátor",34,1,"Jádro","Praha","marek@stredisko.cz","Porady, retrospektivy a týmové procesy."]
  ],
  tags: [[1,"strategie"],[2,"facilitace"],[3,"design"],[4,"děti"],[5,"technika"],[6,"finance"],[7,"text"],[8,"produkce"],[9,"foto"],[10,"komunita"],[11,"vzdělávání"],[12,"granty"]],
  peopleTags: [[1,1],[1,2],[2,4],[2,8],[3,3],[3,7],[4,5],[4,8],[5,4],[5,11],[6,6],[6,12],[7,7],[7,3],[8,5],[9,10],[9,8],[10,11],[11,9],[11,3],[12,6],[13,10],[14,2],[14,1]],
  personTeams: [[1,7],[2,10],[3,14],[4,12],[5,9],[6,8],[7,13],[8,12],[9,15],[10,9],[11,14],[12,11],[13,15],[14,16]],
  relationships: [[1,2,"spolupráce"],[1,6,"spolupráce"],[1,14,"spolupráce"],[2,5,"program"],[2,10,"program"],[2,9,"akce"],[3,7,"komunikace"],[3,11,"komunikace"],[4,8,"provoz"],[4,12,"provoz"],[5,10,"metodika"],[6,12,"rozpočet"],[7,9,"kampaně"],[8,11,"akce"],[9,13,"dobrovolnictví"],[14,5,"facilitace"]]
};

const app = document.querySelector("#app");
const THEME_KEY = "mapa-strediska-theme";
const APP_SETTINGS_KEY = "mapa-strediska-app-settings-v1";
const DEFAULT_APP_SETTINGS = {textScale: 100, mapBackground: "", showHints: true, showStats: true};
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
let themePreference = "system";
let appSettings = {...DEFAULT_APP_SETTINGS};
try {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (["system", "light", "dark"].includes(savedTheme)) themePreference = savedTheme;
  const savedSettings = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || "null");
  if (savedSettings && typeof savedSettings === "object") {
    if (Number.isFinite(+savedSettings.textScale)) appSettings.textScale = Math.max(85, Math.min(125, +savedSettings.textScale));
    if (/^#[0-9a-f]{6}$/i.test(savedSettings.mapBackground || "")) appSettings.mapBackground = savedSettings.mapBackground;
    if (typeof savedSettings.showHints === "boolean") appSettings.showHints = savedSettings.showHints;
    if (typeof savedSettings.showStats === "boolean") appSettings.showStats = savedSettings.showStats;
  }
} catch (_) {}

function resolvedTheme(preference = themePreference) {
  return preference === "system" ? (themeMedia.matches ? "dark" : "light") : preference;
}

function syncThemeControl() {
  const button = document.querySelector("#theme-toggle");
  const labels = {system: "Systém", light: "Světlý", dark: "Tmavý"};
  const next = {system: "light", light: "dark", dark: "system"};
  const resolved = resolvedTheme();
  if (button) {
    const landing = document.documentElement.classList.contains("landing-page");
    const shownTheme = landing ? resolved : themePreference;
    const nextLabel = landing ? labels[resolved === "dark" ? "light" : "dark"] : labels[next[themePreference]];
    button.innerHTML = `${icons[`theme${shownTheme[0].toUpperCase()}${shownTheme.slice(1)}`]}<span>${labels[shownTheme]}</span>`;
    button.dataset.resolvedTheme = resolved;
    button.setAttribute("aria-label", `Motiv: ${labels[shownTheme]}. Přepnout na ${nextLabel.toLocaleLowerCase("cs")}.`);
    button.title = button.getAttribute("aria-label");
  }
  const select = document.querySelector("#app-theme-select");
  if (select) select.value = themePreference;
}

function applyTheme(preference = themePreference, syncControl = true) {
  const resolved = resolvedTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0d1210" : "#f4f2eb");
  if (syncControl) {
    syncThemeControl();
    syncAppSettingsControls();
  }
}

function setThemePreference(preference) {
  themePreference = ["system", "light", "dark"].includes(preference) ? preference : "system";
  try { localStorage.setItem(THEME_KEY, themePreference); } catch (_) {}
  applyTheme(themePreference);
}

function defaultMapBackground() {
  return resolvedTheme() === "dark" ? "#253246" : "#eff3f6";
}

function persistAppSettings() {
  try { localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings)); } catch (_) {}
}

function syncAppSettingsControls() {
  const textInput = document.querySelector("#app-text-size");
  const textOutput = document.querySelector("#app-text-size-output");
  const background = document.querySelector("#app-background-color");
  const backgroundState = document.querySelector("#app-background-state");
  const backgroundReset = document.querySelector("#reset-app-background");
  const hints = document.querySelector("#app-show-hints");
  const stats = document.querySelector("#app-show-stats");
  if (textInput) textInput.value = String(appSettings.textScale);
  if (textOutput) textOutput.textContent = `${appSettings.textScale} %`;
  if (background) background.value = appSettings.mapBackground || defaultMapBackground();
  if (backgroundState) backgroundState.textContent = appSettings.mapBackground ? "vlastní" : "podle motivu";
  if (backgroundReset) backgroundReset.disabled = !appSettings.mapBackground;
  if (hints) hints.checked = appSettings.showHints;
  if (stats) stats.checked = appSettings.showStats;
}

function applyAppSettings(syncControls = true) {
  document.documentElement.style.setProperty("--board-text-offset", `${(appSettings.textScale - 100) / 5}px`);
  document.documentElement.style.setProperty("--map-background", appSettings.mapBackground || "var(--paper-deep)");
  document.documentElement.dataset.customMapBackground = appSettings.mapBackground ? "true" : "false";
  document.documentElement.dataset.showMapHints = appSettings.showHints ? "true" : "false";
  document.documentElement.dataset.showMapStats = appSettings.showStats ? "true" : "false";
  const map = document.querySelector("#map");
  if (map && appSettings.mapBackground) {
    const [red, green, blue] = appSettings.mapBackground.slice(1).match(/.{2}/g).map(value => parseInt(value, 16));
    const darkBackground = (red * 299 + green * 587 + blue * 114) / 1000 < 150;
    map.style.setProperty("--ink", darkBackground ? "#f4f7fa" : "#2f3a4b");
    map.style.setProperty("--muted", darkBackground ? "#c1cad0" : "#6d7987");
    map.style.setProperty("--label-halo", `rgba(${red}, ${green}, ${blue}, .95)`);
    map.style.setProperty("--graph-link", darkBackground ? "rgba(244, 247, 250, .55)" : "rgba(47, 58, 75, .46)");
    map.style.setProperty("--graph-guide", darkBackground ? "rgba(244, 247, 250, .2)" : "rgba(47, 58, 75, .17)");
  } else if (map) {
    ["--ink", "--muted", "--label-halo", "--graph-link", "--graph-guide"].forEach(property => map.style.removeProperty(property));
  }
  if (syncControls) syncAppSettingsControls();
}

function updateAppSetting(key, value) {
  appSettings = {...appSettings, [key]: value};
  persistAppSettings();
  applyAppSettings();
  if (key === "textScale" && teamLayer) requestAnimationFrame(() => {
    applyAdaptiveTeamTitles(teamLayer.selectAll("g.team-node"), graphViewport.width);
    updateAdaptiveTitleVisibility(savedZoom.k);
    if (currentMode === "field") updateModeV2("field", false);
  });
}

applyTheme(themePreference, false);
applyAppSettings(false);
themeMedia.addEventListener("change", () => {
  if (themePreference === "system") applyTheme("system");
});

let db;
let SQLRuntime;
let loadedDatabaseName = "";
let people = [];
let teams = [];
let relationships = [];
let categoriesData = [];
let tagsData = [];
let structureGraphLinks = [];
let relationshipGraphLinks = [];
let allGraphLinks = [];
let simulation;
let svg, rootLayer, structureLinkLayer, relationshipLinkLayer, zoneLayer, teamLayer, nodeLayer, axisLayer;
let currentMode = "network";
let fieldDimension = "druzina";
let selectedFieldTagIds = [];
let fieldTagSearchTerm = "";
let fieldTagSort = "name";
let fieldTagOnlyUsed = false;
let fieldSidebarExpanded = false;
let selectedPersonId = null;
const displayOptions = { primary: true, secondary: true, tags: false, categories: true, titles: true };
let editingId = null;
let searchTerm = "";
let mapSearchSuggestions = [];
let activeMapSearchSuggestion = -1;
let mapSearchZoomTimer;
let mapSearchRestoreByMode = {};
let peopleEditorSearch = "";
let toastTimer;
let confirmResolver = null;
let activeSection = "map";
let positionCache = {network: {}, field: {}, age: {}};
let savedZoomByMode = {
  network: {x: 0, y: 0, k: 1},
  field: {x: 0, y: 0, k: 1},
  age: {x: 0, y: 0, k: 1}
};
let savedZoom = {...savedZoomByMode.network};
let needsInitialStructureFit = true;
let zoomBehavior;
let workspaceSaveTimer;
const editorAutosaveTimers = new Map();
const editorAutosaveVersions = new WeakMap();
let editorAutosaveQueue = Promise.resolve();
const VIEW_STATE_KEY = "mapa-strediska-workspace-v1";
const STRUCTURE_LAYOUT_VERSION = 45;
const PEOPLE_CLUSTER_BUFFER = 220;
const CROSS_GROUP_PERSON_BUFFER = 130;
const CLUSTER_CLEAR_GAP = 210;
const DEPARTMENT_CLEAR_GAP = 320;
const ODDIL_FIELD_NODE_CLEARANCE = 22;
const physicsSettings = Object.freeze({center: .16, repel: 10, linkForce: .35, linkDistance: 110});
const DEFAULT_CONNECTION_FILTERS = {hierarchy: true, assignment: true, membership: true, relationship: true};
let connectionFilters = {...DEFAULT_CONNECTION_FILTERS};
let hiddenRelationshipTypes = [];
const DEFAULT_GRAPH_FILTERS = {unitId: "", includeDescendants: true, query: "", showOrphans: true, match: "all", rules: []};
let graphFilters = {...DEFAULT_GRAPH_FILTERS, rules: []};
let colorRules = [];
let graphColorMode = "group";
let graphPeople = [];
let graphTeams = [];
let filterSuggestionItems = [];
let filterSuggestionIndex = -1;
let filterSuggestionInput = null;
let activeFieldRegions = [];
let activeFieldShapes = [];
let hoveredOddilReachName = null;
let pinnedOddilReachName = null;
let selectedUnitActionId = null;
let graphFilterFrame;
let graphFitTimer;
let spreadsheetImportState = null;
let graphViewport = {width: 1000, height: 650};
let stableSimulationTicks = 0;
let personTagSuggestionIndex = -1;
let personTagSuggestionValues = [];

const icons = {
  map: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3z"/><path d="M8 3v15M16 6v15"/></svg>',
  structure: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 7.5v4M6 15.5v-4h12v4"/></svg>',
  field: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
  age: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19h16M6 16V9M12 16V5M18 16v-4"/><circle cx="6" cy="7" r="1.5"/><circle cx="12" cy="3" r="1.5"/><circle cx="18" cy="10" r="1.5"/></svg>',
  sql: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  edit: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20h4l11-11-4-4L4 16z"/><path d="m13.5 6.5 4 4M4 4h6M4 9h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  settings: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7z"/></svg>',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 15v5h14v-5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  themeSystem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  themeLight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
  themeDark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 15.4A8.7 8.7 0 0 1 8.6 3.5 8.8 8.8 0 1 0 20.5 15.4Z"/></svg>'
};

function loadWorkspaceState() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_STATE_KEY) || "null");
    if (!saved) return;
    if (["network", "field", "age"].includes(saved.mode)) currentMode = saved.mode;
    if (["oddil", "druzina", "role", "city", "category", "tags"].includes(saved.fieldDimension)) fieldDimension = saved.fieldDimension;
    if (Array.isArray(saved.selectedFieldTagIds)) selectedFieldTagIds = saved.selectedFieldTagIds.map(Number).filter(Number.isFinite);
    if (["name", "usage"].includes(saved.fieldTagSort)) fieldTagSort = saved.fieldTagSort;
    if (typeof saved.fieldTagOnlyUsed === "boolean") fieldTagOnlyUsed = saved.fieldTagOnlyUsed;
    if (typeof saved.fieldSidebarExpanded === "boolean") fieldSidebarExpanded = saved.fieldSidebarExpanded;
    if (["map", "edit", "sql"].includes(saved.section)) activeSection = saved.section;
    if (typeof saved.searchTerm === "string") searchTerm = saved.searchTerm;
    ["network", "field", "age"].forEach(mode => {
      const zoom = saved.zooms?.[mode];
      if (zoom && [zoom.x, zoom.y, zoom.k].every(Number.isFinite)) savedZoomByMode[mode] = {...zoom};
    });
    if (!saved.zooms && saved.zoom && [saved.zoom.x, saved.zoom.y, saved.zoom.k].every(Number.isFinite)) savedZoomByMode[currentMode] = {...saved.zoom};
    savedZoom = {...savedZoomByMode[currentMode]};
    needsInitialStructureFit = saved.structureLayoutVersion !== STRUCTURE_LAYOUT_VERSION;
    Object.keys(displayOptions).forEach(key => { if (typeof saved.displayOptions?.[key] === "boolean") displayOptions[key] = saved.displayOptions[key]; });
    Object.keys(DEFAULT_CONNECTION_FILTERS).forEach(key => { if (typeof saved.connectionFilters?.[key] === "boolean") connectionFilters[key] = saved.connectionFilters[key]; });
    if (Array.isArray(saved.hiddenRelationshipTypes)) hiddenRelationshipTypes = saved.hiddenRelationshipTypes.map(String);
    if (saved.graphFilters && typeof saved.graphFilters === "object") {
      graphFilters.unitId = saved.graphFilters.unitId == null ? "" : String(saved.graphFilters.unitId);
      graphFilters.includeDescendants = typeof saved.graphFilters.includeDescendants === "boolean" ? saved.graphFilters.includeDescendants : true;
      graphFilters.query = typeof saved.graphFilters.query === "string" ? saved.graphFilters.query : "";
      graphFilters.showOrphans = typeof saved.graphFilters.showOrphans === "boolean" ? saved.graphFilters.showOrphans : true;
      graphFilters.match = saved.graphFilters.match === "any" ? "any" : "all";
      graphFilters.rules = Array.isArray(saved.graphFilters.rules) ? saved.graphFilters.rules.slice(0, 30) : [];
    }
    if (Array.isArray(saved.colorRules)) colorRules = saved.colorRules.slice(0, 30);
    if (["category", "tag", "group", "filter"].includes(saved.graphColorMode)) graphColorMode = saved.graphColorMode;
    if (saved.positions && typeof saved.positions === "object") {
      ["network", "field", "age"].forEach(mode => { if (saved.positions[mode] && typeof saved.positions[mode] === "object") positionCache[mode] = saved.positions[mode]; });
    }
    displayOptions.primary = connectionFilters.hierarchy || connectionFilters.assignment || connectionFilters.membership;
    displayOptions.secondary = connectionFilters.relationship;
    if (needsInitialStructureFit) positionCache = {network: {}, field: {}, age: {}};
  } catch (_) {}
}

function captureGraphPositions(mode = currentMode) {
  if (mode !== "network") return;
  if (!nodeLayer || !teamLayer) return;
  const positions = {};
  nodeLayer.selectAll("g.person-node").each(node => {
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) positions[node.uid] = [Math.round(node.x * 10) / 10, Math.round(node.y * 10) / 10];
  });
  teamLayer.selectAll("g.team-node").each(node => {
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) positions[node.uid] = [Math.round(node.x * 10) / 10, Math.round(node.y * 10) / 10];
  });
  positionCache.network = positions;
}

function persistWorkspaceState(capture = false) {
  if (capture) captureGraphPositions();
  try {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify({mode: currentMode, fieldDimension, selectedFieldTagIds, fieldTagSort, fieldTagOnlyUsed, fieldSidebarExpanded, section: activeSection, searchTerm, displayOptions, connectionFilters, hiddenRelationshipTypes, graphFilters, colorRules, graphColorMode, positions: positionCache, zoom: savedZoom, zooms: savedZoomByMode, structureLayoutVersion: needsInitialStructureFit ? null : STRUCTURE_LAYOUT_VERSION}));
  } catch (_) {}
}

function scheduleWorkspaceState() {
  clearTimeout(workspaceSaveTimer);
  workspaceSaveTimer = setTimeout(() => persistWorkspaceState(false), 160);
}

function syncWorkspaceControls() {
  syncPrimaryNavigation();
  syncFieldDimensionControls();
  syncFieldSidebarExpansion();
  const search = document.querySelector("#search");
  if (search) search.value = searchTerm;
}

function selectedFieldTagNames() {
  const ids = new Set(selectedFieldTagIds);
  return new Set(tagsData.filter(tag => ids.has(tag.id)).map(tag => tag.name));
}

function syncFieldTagPickerVisibility() {
  const picker = document.querySelector("#field-tag-picker");
  if (!picker) return;
  picker.hidden = currentMode !== "field" || fieldDimension !== "tags";
  if (picker.hidden) picker.open = false;
}

function applyFieldTagSearch(value = fieldTagSearchTerm) {
  const menu = document.querySelector("#field-tag-menu");
  if (!menu) return;
  fieldTagSearchTerm = value || "";
  const query = normalizeImportText(fieldTagSearchTerm);
  const labels = [...menu.querySelectorAll(".field-tag-options label")];
  let visibleCount = 0;
  labels.forEach(label => {
    const visible = !query || normalizeImportText(label.querySelector("span")?.textContent || "").includes(query);
    label.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const empty = menu.querySelector("#field-tag-search-empty");
  if (empty) empty.hidden = visibleCount > 0 || tagsData.length === 0;
  const visibleStatus = menu.querySelector("#field-tag-visible-status");
  if (visibleStatus) visibleStatus.textContent = `${visibleCount} ${visibleCount === 1 ? "štítek" : visibleCount < 5 ? "štítky" : "štítků"}`;
  const clearButton = menu.querySelector('[data-field-tag-action="clear-search"]');
  if (clearButton) clearButton.hidden = !fieldTagSearchTerm;
  const allButton = menu.querySelector('[data-field-tag-action="all"]');
  const noneButton = menu.querySelector('[data-field-tag-action="none"]');
  const invertButton = menu.querySelector('[data-field-tag-action="invert"]');
  if (allButton) {
    allButton.disabled = visibleCount === 0;
    allButton.textContent = query ? "Vybrat nalezené" : "Vybrat vše";
  }
  if (noneButton) {
    noneButton.disabled = visibleCount === 0;
    noneButton.textContent = query ? "Zrušit nalezené" : "Zrušit vše";
  }
  if (invertButton) invertButton.disabled = visibleCount === 0;
}

function renderFieldTagPicker() {
  const menu = document.querySelector("#field-tag-menu");
  if (!menu) return;
  const available = new Set(tagsData.map(tag => tag.id));
  selectedFieldTagIds = selectedFieldTagIds.filter(id => available.has(id));
  const selected = new Set(selectedFieldTagIds);
  const usage = new Map();
  people.forEach(person => (person.tagsArray || []).forEach(tag => {
    const key = normalizedValue(tag);
    usage.set(key, (usage.get(key) || 0) + 1);
  }));
  const displayedTags = tagsData
    .map(tag => ({...tag, usage: usage.get(normalizedValue(tag.name)) || 0}))
    .filter(tag => !fieldTagOnlyUsed || tag.usage > 0)
    .sort((a, b) => fieldTagSort === "usage"
      ? b.usage - a.usage || a.name.localeCompare(b.name, "cs", {sensitivity: "base"})
      : a.name.localeCompare(b.name, "cs", {sensitivity: "base"}));
  menu.innerHTML = `<div class="field-tag-menu-head"><div><span>Pole podle štítků</span><strong>Vyberte datové množiny</strong></div><b id="field-tag-selection-status">${selected.size} / ${tagsData.length}</b></div>
    <label class="field-tag-search" for="field-tag-search-input">${icons.search}<input id="field-tag-search-input" type="search" value="${escapeHtml(fieldTagSearchTerm)}" placeholder="Hledat štítek…" autocomplete="off" spellcheck="false" aria-label="Hledat štítek"><button type="button" data-field-tag-action="clear-search" aria-label="Vymazat hledání"${fieldTagSearchTerm ? "" : " hidden"}>×</button></label>
    <div class="field-tag-controls"><label><span>Řazení</span><select data-field-tag-sort aria-label="Řazení štítků"><option value="name"${fieldTagSort === "name" ? " selected" : ""}>A–Z</option><option value="usage"${fieldTagSort === "usage" ? " selected" : ""}>Nejpoužívanější</option></select></label><label class="field-tag-used-toggle"><input type="checkbox" data-field-tag-used-only${fieldTagOnlyUsed ? " checked" : ""}><span>Jen použité</span></label></div>
    <div class="field-tag-actions"><button type="button" data-field-tag-action="all">Vybrat vše</button><button type="button" data-field-tag-action="none">Zrušit vše</button><button type="button" data-field-tag-action="invert">Obrátit výběr</button></div>
    <div class="field-tag-list-head"><span id="field-tag-visible-status"></span><span>počet lidí</span></div>
    <div class="field-tag-options">${displayedTags.map(tag => `<label><input type="checkbox" value="${tag.id}" ${selected.has(tag.id) ? "checked" : ""}><span>#${escapeHtml(tag.name)}</span><small>${tag.usage}</small></label>`).join("")}${tagsData.length ? '<div class="empty-line" id="field-tag-search-empty" role="status" hidden>Žádné odpovídající štítky.</div>' : '<div class="empty-line">Databáze neobsahuje žádné štítky.</div>'}</div>`;
  const count = document.querySelector("#field-tag-count");
  if (count) count.textContent = selected.size === tagsData.length ? `(${tagsData.length})` : `(${selected.size}/${tagsData.length})`;
  applyFieldTagSearch(fieldTagSearchTerm);
  syncFieldTagPickerVisibility();
}

function updateFieldTagPickerCount() {
  const count = document.querySelector("#field-tag-count");
  if (count) count.textContent = selectedFieldTagIds.length === tagsData.length ? `(${tagsData.length})` : `(${selectedFieldTagIds.length}/${tagsData.length})`;
  const status = document.querySelector("#field-tag-selection-status");
  if (status) status.textContent = `${selectedFieldTagIds.length} / ${tagsData.length}`;
}

function databaseGateStatus(message, state = "ready") {
  const status = document.querySelector("#database-gate-status");
  const dropzone = document.querySelector("#database-dropzone");
  if (status) {
    status.dataset.state = state;
    status.innerHTML = state === "loading" ? `<span class="gate-spinner" aria-hidden="true"></span>${escapeHtml(message)}` : escapeHtml(message);
  }
  if (dropzone) {
    dropzone.dataset.state = state;
    dropzone.setAttribute("aria-busy", String(state === "loading"));
  }
}

function renderDatabaseGate() {
  document.documentElement.classList.add("landing-page");
  app.innerHTML = `
    <main class="database-gate">
      <div class="gate-orbit gate-orbit-one" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="gate-orbit gate-orbit-two" aria-hidden="true"><i></i><i></i></div>
      <header class="gate-header">
        <a class="gate-wordmark" href="." aria-label="Středisko Skuptáci Kutná Hora · úvod">
          <span class="gate-wordmark-logo" aria-hidden="true">${skuptakHorizontalSvg}</span>
          <span><b>Středisko Skuptáci</b><small>Kutná Hora 215.01</small></span>
        </a>
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Přepnout motiv"></button>
      </header>
      <section class="gate-layout" aria-labelledby="gate-title">
        <div class="gate-intro">
          <span class="gate-kicker"><i></i> Vaše data. Vaše souvislosti.</span>
          <h1 id="gate-title">Kdo tvoří<br><em>středisko?</em></h1>
          <p>Skupták promění databázi střediska v přehlednou mapu lidí, jednotek a vztahů. Soubor se zpracuje pouze ve vašem prohlížeči.</p>
          <div class="gate-promises" aria-label="Vlastnosti zpracování">
            <span>${icons.sql} Lokálně</span>
            <span>${icons.map} Bez odesílání</span>
            <span>${icons.filter} Jen pro tuto relaci</span>
          </div>
        </div>
        <div class="gate-upload-card">
          <div class="gate-emblem-wrap" aria-hidden="true">
            <div class="gate-emblem-halo"></div>
            <span class="gate-emblem">${skuptakEmblemSvg}</span>
          </div>
          <div class="gate-card-copy">
            <span class="eyebrow">První krok</span>
            <h2>Otevřete databázi</h2>
            <p>Pokračovat lze až po načtení platné databáze Skuptáku.</p>
          </div>
          <label class="database-dropzone" id="database-dropzone" for="startup-database-file" tabindex="0" role="button" aria-describedby="database-gate-status">
            <input id="startup-database-file" type="file" accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3" hidden>
            <span class="dropzone-icon">${icons.sql}<i>+</i></span>
            <strong>Přetáhněte sem soubor SQL</strong>
            <span>nebo klikněte a vyberte <b>.sqlite</b> / <b>.db</b></span>
          </label>
          <div class="gate-status" id="database-gate-status" data-state="loading" role="status" aria-live="polite"><span class="gate-spinner" aria-hidden="true"></span>Připravuji čtečku databáze…</div>
        </div>
      </section>
      <div class="maker-tag" aria-label="Made by TK">
        <span class="maker-tag-copy"><span>Made by:</span><a href="https://github.com/t0k-0" target="_blank" rel="noreferrer" aria-label="GitHub profil TK">TK</a></span>
        <span class="maker-tag-mark" aria-hidden="true">${skaviatorSvg}</span>
      </div>
      <footer class="gate-footer">
        <span>Skupták / ${new Date().getFullYear()}</span>
        <span>Databáze neopustí vaše zařízení</span>
      </footer>
    </main>`;

  const input = document.querySelector("#startup-database-file");
  const dropzone = document.querySelector("#database-dropzone");
  syncThemeControl();
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    setThemePreference(resolvedTheme() === "dark" ? "light" : "dark");
  });
  input.addEventListener("change", () => handleStartupDatabaseFile(input.files?.[0]));
  dropzone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  ["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    if (SQLRuntime) dropzone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  }));
  dropzone.addEventListener("drop", event => handleStartupDatabaseFile(event.dataTransfer?.files?.[0]));

}

async function handleStartupDatabaseFile(file) {
  if (!file) return;
  if (!SQLRuntime) {
    databaseGateStatus("Čtečka se ještě načítá. Zkuste to za okamžik.", "error");
    return;
  }
  let candidate;
  try {
    databaseGateStatus(`Kontroluji ${file.name}…`, "loading");
    candidate = new SQLRuntime.Database(new Uint8Array(await file.arrayBuffer()));
    validateImportedDatabase(candidate);
    db = candidate;
    ensureOrgSchema();
    const result = db.exec("SELECT COUNT(*) FROM people");
    const count = result[0]?.values?.[0]?.[0] ?? 0;
    loadedDatabaseName = file.name;
    databaseGateStatus(`Načteno ${count} lidí. Sestavuji mapu…`, "success");
    await new Promise(resolve => setTimeout(resolve, 240));
    await startApplication();
  } catch (error) {
    try { candidate?.close(); } catch (_) {}
    if (db === candidate) db = undefined;
    if (!document.querySelector("#database-gate-status")) renderDatabaseGate();
    databaseGateStatus(`Soubor nelze otevřít: ${error.message}`, "error");
    const input = document.querySelector("#startup-database-file");
    if (input) input.value = "";
  }
}

async function startApplication() {
  document.documentElement.classList.remove("landing-page");
  activeSection = "map";
  renderShell();
  applyAppSettings(false);
  syncWorkspaceControls();
  await loadPeople();
  fillCategoryOptions();
  bindEvents();
  initGraphV2();
  showSection("map");
}

function renderShell() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="${skuptakEmblemUrl}" alt=""><div class="brand-copy"><strong>Středisko Skuptáci</strong><span>Kutná Hora 215.01</span></div></div>
        <div class="nav-label">Pohled</div>
        <nav class="nav-list" aria-label="Hlavní navigace">
          <button class="nav-button active" data-view-mode="network">${icons.structure}<span>Struktura</span></button>
          <div class="nav-field-group${fieldSidebarExpanded ? " expanded" : ""}" id="nav-field-group">
            <div class="nav-field-main">
              <button class="nav-button" data-view-mode="field">${icons.field}<span>Field</span></button>
              <button class="field-subnav-toggle" id="field-subnav-toggle" type="button" aria-label="Rozbalit kategorie Field" aria-expanded="${fieldSidebarExpanded}"></button>
            </div>
            <div class="field-subnav" aria-label="Kategorie pohledu Field">
              <button type="button" class="field-subnav-button" data-field="oddil">Oddíly</button>
              <button type="button" class="field-subnav-button" data-field="druzina">Družiny</button>
              <button type="button" class="field-subnav-button" data-field="role">Role</button>
              <button type="button" class="field-subnav-button" data-field="city">Města</button>
              <button type="button" class="field-subnav-button" data-field="category">Kategorie</button>
              <button type="button" class="field-subnav-button" data-field="tags">Štítky</button>
            </div>
          </div>
          <button class="nav-button" data-view-mode="age">${icons.age}<span>Věk</span></button>
          <button class="nav-button" data-section="sql">${icons.sql}<span>SQL laboratoř</span></button>
        </nav>
        <div class="sidebar-spacer"></div>
        <details class="app-settings" id="app-settings">
          <summary>${icons.settings}<span>Nastavení aplikace</span></summary>
          <div class="app-settings-panel">
            <div class="app-settings-head"><span class="eyebrow">Rozhraní</span><strong>Nastavení aplikace</strong></div>
            <label class="app-setting-row"><span>Motiv</span><select id="app-theme-select"><option value="system">Podle systému</option><option value="light">Světlý</option><option value="dark">Tmavý</option></select></label>
            <label class="app-setting-row app-setting-slider"><span>Text na pracovní ploše <output id="app-text-size-output">${appSettings.textScale} %</output></span><input id="app-text-size" type="range" min="85" max="125" step="5" value="${appSettings.textScale}"></label>
            <div class="app-setting-row"><span>Pozadí mapy <small id="app-background-state">${appSettings.mapBackground ? "vlastní" : "podle motivu"}</small></span><div class="app-color-control"><input id="app-background-color" type="color" value="${appSettings.mapBackground || defaultMapBackground()}" aria-label="Barva pozadí mapy"><button type="button" id="reset-app-background"${appSettings.mapBackground ? "" : " disabled"}>Motiv</button></div></div>
            <label class="app-setting-check"><input id="app-show-hints" type="checkbox"${appSettings.showHints ? " checked" : ""}><span>Zobrazit nápovědu v mapě</span></label>
            <label class="app-setting-check"><input id="app-show-stats" type="checkbox"${appSettings.showStats ? " checked" : ""}><span>Zobrazit statistiky vpravo nahoře</span></label>
            <button class="app-settings-reset" id="reset-app-settings" type="button">Obnovit vzhled</button>
          </div>
        </details>
        <div class="db-card">
          <div class="db-card-top"><span class="db-status"><i class="db-dot"></i> SQLite aktivní</span><span id="db-size" class="eyebrow">— KB</span></div>
          <p><b class="db-file-name" title="${escapeHtml(loadedDatabaseName)}">${escapeHtml(loadedDatabaseName)}</b><span>Jen tato relace</span></p>
        </div>
        <div class="build-note">MAPA / 01 · 2026</div>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="title-block"><span class="eyebrow" id="section-kicker">Interaktivní přehled</span><h1 id="section-title">Kdo tvoří středisko?</h1></div>
          <div class="top-actions">
            <div class="search-wrap" role="search">${icons.search}<input id="search" class="search-input" type="search" placeholder="Hledat jméno, roli, štítek…" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="map-search-suggestions" aria-expanded="false"><span class="search-key">/</span><div class="map-search-suggestions" id="map-search-suggestions" role="listbox" hidden></div></div>
            <div class="export-control">
              <button class="export-top-button" id="export-toggle" type="button" aria-label="Exportovat aktuální pohled" aria-expanded="false">${icons.export}<span>Export</span></button>
              <div class="export-panel" id="export-panel" role="menu" aria-label="Možnosti exportu">
                <div class="export-title"><span class="eyebrow">Aktuální obsah</span><strong id="export-panel-title">Export pohledu</strong></div>
                <button type="button" data-map-export="pdf" data-export-kind="map"><b>PDF</b><span>Grafický pohled připravený pro tisk</span></button>
                <button type="button" data-map-export="svg" data-export-kind="map"><b>SVG</b><span>Vektorový obraz aktuální mapy</span></button>
                <button type="button" data-map-export="xlsx" data-export-kind="table"><b>XLSX</b><span>Výslednou tabulku otevřete v Excelu</span></button>
                <p id="export-panel-note">Export respektuje aktuální pohled a filtry.</p>
              </div>
            </div>
          </div>
        </header>
        <section class="view map-view" id="map-view">
          <div class="map-control-dock">
          <div class="map-toolbar" role="toolbar" aria-label="Nástroje mapy">
            <button class="options-toggle" id="fit-map" type="button">Přizpůsobit</button>
            <button class="toolbar-icon-button filter-toggle" id="filter-toggle" type="button" aria-label="Filtry a zobrazení mapy" title="Filtry a zobrazení" aria-expanded="false">${icons.filter}<span id="filter-count" class="filter-count" hidden>0</span></button>
          </div>
          <div class="filter-panel" id="filter-panel"></div>
          <div class="field-toolbar" id="field-toolbar" aria-label="Pole pro seskupení">
            <span>Field:</span>
            <button class="field-button" data-field="oddil">oddíly</button>
            <button class="field-button active" data-field="druzina">družiny</button>
            <button class="field-button" data-field="role">role</button>
            <button class="field-button" data-field="city">město</button>
            <button class="field-button" data-field="category">kategorie</button>
            <button class="field-button" data-field="tags">štítky</button>
            <details class="field-tag-picker" id="field-tag-picker" hidden><summary>Vybrat štítky <span id="field-tag-count"></span></summary><div class="field-tag-menu" id="field-tag-menu"></div></details>
          </div>
          </div>
          <div class="print-map-header" aria-hidden="true"><div><span>Kdo tvoří středisko?</span><strong id="print-map-title"></strong></div><div><b id="print-view-name"></b><small id="print-view-meta"></small></div></div>
          <div class="map-meta"><div class="stat"><strong id="people-count">0</strong><span>lidí</span></div><div class="stat"><strong id="team-count">0</strong><span>jednotek</span></div></div>
          <svg id="map" role="img" aria-label="Interaktivní mapa členů týmu"></svg>
          <div class="field-section-popover" id="field-section-popover" hidden></div>
          <div class="unit-action-popover" id="unit-action-popover" role="dialog" aria-label="Možnosti jednotky" hidden></div>
          <aside class="person-info-card" id="person-info-card" role="dialog" aria-label="Informace o osobě" hidden></aside>
          <div class="map-hint">Přetáhnout · kliknout pro detail · filtry mění zobrazení mapy</div>
        </section>
        <section class="view edit-view" id="edit-view">
          <div class="edit-dashboard" id="edit-dashboard"></div>
        </section>
        <section class="view sql-view" id="sql-view">
          <div class="sql-layout">
            <article class="panel query-panel">
              <div class="panel-head"><div><span class="eyebrow">Dotaz</span><h2>Datový průzkumník</h2></div><span class="db-status"><i class="db-dot"></i> read only</span></div>
              <details class="sql-builder" id="sql-builder" open>
                <summary><span><b>Průvodce dotazem</b><small>Bez znalosti SQL</small></span><span class="builder-summary" id="sql-builder-summary">Seznam všech lidí</span></summary>
                <div class="sql-builder-body">
                  <div class="sql-builder-grid">
                    <label><span>Co chcete zjistit</span><select id="sql-builder-kind"><option value="list">Seznam lidí</option><option value="count">Počet lidí podle skupiny</option><option value="age">Věkové shrnutí podle skupiny</option></select></label>
                    <label id="sql-builder-group-wrap" hidden><span>Rozdělit podle</span><select id="sql-builder-group"><option value="unit">Primární jednotky</option><option value="category">Kategorie</option><option value="role">Role</option><option value="city">Města</option><option value="registration">Registrační kategorie</option><option value="age">Věkové skupiny</option></select></label>
                    <label><span>Jednotka</span><select id="sql-builder-unit"><option value="">Všechny jednotky</option></select></label>
                    <label class="builder-check"><input id="sql-builder-descendants" type="checkbox" checked><span>Zahrnout potomky jednotky</span></label>
                    <label><span>Kategorie</span><select id="sql-builder-category"><option value="">Všechny kategorie</option></select></label>
                    <label><span>Štítek</span><select id="sql-builder-tag"><option value="">Všechny štítky</option></select></label>
                    <label><span>Město</span><select id="sql-builder-city"><option value="">Všechna města</option></select></label>
                    <label><span>Role obsahuje</span><input id="sql-builder-role" type="text" placeholder="např. vedoucí"></label>
                    <label><span>E-mail obsahuje</span><input id="sql-builder-email" type="text" placeholder="např. @example.cz"></label>
                    <label><span>Poznámka obsahuje</span><input id="sql-builder-notes" type="text" placeholder="např. zdravotník"></label>
                    <label><span>Věk od</span><input id="sql-builder-age-min" type="number" min="0" max="120" placeholder="bez minima"></label>
                    <label><span>Věk do</span><input id="sql-builder-age-max" type="number" min="0" max="120" placeholder="bez maxima"></label>
                    <label id="sql-builder-order-wrap"><span>Seřadit seznam</span><select id="sql-builder-order"><option value="name">Podle jména</option><option value="age">Podle věku</option><option value="unit">Podle jednotky</option><option value="category">Podle kategorie</option><option value="city">Podle města</option></select></label>
                    <label><span>Maximum řádků</span><select id="sql-builder-limit"><option>25</option><option selected>100</option><option>250</option><option>500</option><option value="0">Bez limitu</option></select></label>
                  </div>
                  <div class="sql-builder-actions"><button type="button" class="secondary-button" id="build-query">Vložit SQL</button><button type="button" class="primary-button" id="build-run-query">Vytvořit a spustit →</button></div>
                </div>
              </details>
              <div class="query-wrap"><textarea id="sql-query" class="query-editor" spellcheck="false" aria-label="SQL dotaz">SELECT
  p.name AS jmeno,
  p.nickname AS prezdivka,
  p.role AS role,
  p.birth_date AS datum_narozeni,
  p.age AS vek,
  c.name AS kategorie,
  p.registration_category AS registracni_kategorie,
  p.city AS mesto,
  p.email AS email,
  p.notes AS poznamka,
  ot.name AS primarni_jednotka,
  (SELECT GROUP_CONCAT(o.name, ', ') FROM people_teams pom JOIN teams o ON o.id=pom.team_id WHERE pom.person_id=p.id) AS jednotky,
  GROUP_CONCAT(t.name, ', ') AS stitky
FROM people p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN teams ot ON ot.id = p.org_team_id
LEFT JOIN people_tags pt ON pt.person_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
GROUP BY p.id
ORDER BY p.name;</textarea></div>
              <div class="query-footer"><span class="query-note">Ctrl / ⌘ + Enter</span><button class="primary-button" id="run-query">Spustit SELECT →</button></div>
              <div class="preset-row"><button class="preset" data-preset="all">všichni lidé</button><button class="preset" data-preset="young">do 30 let</button><button class="preset" data-preset="category">podle kategorií</button><button class="preset" data-preset="tags">nejčastější štítky</button></div>
            </article>
            <article class="panel result-panel">
              <div class="panel-head"><div><span class="eyebrow">Výsledek</span><h2>Tabulka</h2></div><span id="result-meta" class="result-meta">Připraveno</span></div>
              <div class="result-wrap" id="result-wrap"><div class="empty-result"><div><b>Čekám na dotaz</b>Výsledek SELECTu se objeví tady.</div></div></div>
            </article>
          </div>
        </section>
      </main>
    </div>
    <div class="modal-backdrop" id="person-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <div class="modal-head"><div><span class="eyebrow">Databáze lidí</span><h2 id="modal-title">Přidat člověka</h2></div><button class="close-button" id="close-modal" aria-label="Zavřít">×</button></div>
        <form class="person-form" id="person-form">
          <div class="form-grid">
            <div class="field"><label for="person-name">Jméno a příjmení</label><input id="person-name" name="name" autocomplete="name" placeholder="Volitelné"></div>
            <div class="field"><label for="person-nickname">Přezdívka</label><input id="person-nickname" name="nickname" placeholder="Volitelné"></div>
            <div class="field"><label for="person-role">Role</label><input id="person-role" name="role" placeholder="Volitelné"></div>
            <div class="field"><label for="person-age">Věk</label><input id="person-age" name="age" type="number" min="0" max="120" placeholder="Volitelné"></div>
            <div class="field"><label for="person-category">Kategorie</label><select id="person-category" name="category_id"></select></div>
            <div class="field"><label for="person-registration-category">Registrační kategorie</label><input id="person-registration-category" name="registration_category" placeholder="Volitelné"></div>
            <div class="field"><label for="person-team">Primární jednotka</label><select id="person-team" name="org_team_id"></select></div>
            <div class="field"><label for="person-city">Město</label><input id="person-city" name="city" list="city-suggestions" autocomplete="address-level2"><datalist id="city-suggestions"></datalist></div>
            <div class="field full"><label>Jednotky · lze vybrat více</label><div class="multi-check-grid" id="person-units"></div></div>
            <div class="field full"><label for="person-email">E-mail</label><input id="person-email" name="email" type="email" autocomplete="email"></div>
            <div class="field full"><label for="person-tags">Štítky · oddělené čárkou</label><div class="tag-input-wrap"><input id="person-tags" name="tags" placeholder="facilitace, design, děti" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="person-tag-suggestions" aria-expanded="false"><div class="tag-suggestion-list" id="person-tag-suggestions" role="listbox" hidden></div></div></div>
            <div class="field full"><label for="person-notes">Poznámka</label><textarea id="person-notes" name="notes"></textarea></div>
          </div>
          <div class="modal-actions"><button type="button" class="secondary-button" id="cancel-modal">Zrušit</button><button type="submit" class="primary-button">Uložit do mapy</button></div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop" id="spreadsheet-modal" role="dialog" aria-modal="true" aria-labelledby="spreadsheet-modal-title">
      <div class="modal spreadsheet-modal">
        <div class="modal-head"><div><span class="eyebrow">Kontrolovaný import</span><h2 id="spreadsheet-modal-title">Porovnání tabulky</h2></div><button class="close-button" id="close-spreadsheet-modal" aria-label="Zavřít">×</button></div>
        <div id="spreadsheet-review" class="spreadsheet-review"></div>
      </div>
    </div>
    <div class="modal-backdrop confirm-backdrop" id="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div class="confirm-dialog">
        <div class="confirm-mark">!</div>
        <div><span class="eyebrow">Potvrzení změny</span><h2 id="confirm-title">Odstranit položku?</h2><p id="confirm-message"></p></div>
        <div class="modal-actions"><button type="button" class="secondary-button" id="confirm-cancel">Zrušit</button><button type="button" class="danger-button" id="confirm-accept">Odstranit</button></div>
      </div>
    </div>
    <div class="toast" id="toast" role="status"></div>
  `;
}

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mapa-strediska", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("sqlite");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadSavedDatabase() {
  const store = await openStore();
  return new Promise((resolve, reject) => {
    const tx = store.transaction("sqlite", "readonly");
    const request = tx.objectStore("sqlite").get("main");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistDatabase() {
  const bytes = db.export();
  const store = await openStore();
  await new Promise((resolve, reject) => {
    const tx = store.transaction("sqlite", "readwrite");
    tx.objectStore("sqlite").put(bytes, "main");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  document.querySelector("#db-size").textContent = `${Math.ceil(bytes.length / 1024)} KB`;
}

function createSchema() {
  db.run(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, color TEXT NOT NULL);
    CREATE TABLE teams (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES teams(id), level INTEGER NOT NULL DEFAULT 0, registration_code TEXT);
    CREATE TABLE people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, nickname TEXT, role TEXT NOT NULL, age INTEGER, birth_date TEXT, category_id INTEGER REFERENCES categories(id), registration_category TEXT, team TEXT, city TEXT, email TEXT, notes TEXT, org_team_id INTEGER REFERENCES teams(id));
    CREATE TABLE people_teams (person_id INTEGER REFERENCES people(id), team_id INTEGER REFERENCES teams(id), PRIMARY KEY(person_id, team_id));
    CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
    CREATE TABLE people_tags (person_id INTEGER REFERENCES people(id), tag_id INTEGER REFERENCES tags(id), PRIMARY KEY(person_id, tag_id));
    CREATE TABLE relationships (source_id INTEGER REFERENCES people(id), target_id INTEGER REFERENCES people(id), type TEXT, PRIMARY KEY(source_id, target_id));
  `);
  const insertCategory = db.prepare("INSERT INTO categories VALUES (?, ?, ?, ?)");
  seed.categories.forEach(row => insertCategory.run(row));
  insertCategory.free();
  const insertPerson = db.prepare("INSERT INTO people (id,name,role,age,category_id,team,city,email,notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  seed.people.forEach(row => insertPerson.run(row));
  insertPerson.free();
  const insertTag = db.prepare("INSERT INTO tags VALUES (?, ?)");
  seed.tags.forEach(row => insertTag.run(row));
  insertTag.free();
  const insertPeopleTag = db.prepare("INSERT INTO people_tags VALUES (?, ?)");
  seed.peopleTags.forEach(row => insertPeopleTag.run(row));
  insertPeopleTag.free();
  const insertRelation = db.prepare("INSERT INTO relationships VALUES (?, ?, ?)");
  seed.relationships.forEach(row => insertRelation.run(row));
  insertRelation.free();
}

function ensureOrgSchema() {
  const tableExists = queryObjects("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='teams'")[0].n;
  if (!tableExists) db.run("CREATE TABLE teams (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES teams(id), level INTEGER NOT NULL DEFAULT 0, registration_code TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS people_teams (person_id INTEGER REFERENCES people(id), team_id INTEGER REFERENCES teams(id), PRIMARY KEY(person_id, team_id))");
  const columns = queryObjects("PRAGMA table_info(people)").map(column => column.name);
  const hasOrgTeam = columns.includes("org_team_id");
  if (!hasOrgTeam) {
    db.run("ALTER TABLE people ADD COLUMN org_team_id INTEGER REFERENCES teams(id)");
    const renameCategory = db.prepare("UPDATE categories SET name=?, description=? WHERE id=?");
    seed.categories.forEach(([id, name, description]) => renameCategory.run([name, description, id]));
    renameCategory.free();
  }
  if (!columns.includes("nickname")) db.run("ALTER TABLE people ADD COLUMN nickname TEXT");
  if (!columns.includes("registration_category")) db.run("ALTER TABLE people ADD COLUMN registration_category TEXT");
  if (!columns.includes("age")) db.run("ALTER TABLE people ADD COLUMN age INTEGER");
  if (!columns.includes("birth_date")) db.run("ALTER TABLE people ADD COLUMN birth_date TEXT");
  if (!columns.includes("team")) db.run("ALTER TABLE people ADD COLUMN team TEXT");
  if (!columns.includes("city")) db.run("ALTER TABLE people ADD COLUMN city TEXT");
  if (!columns.includes("email")) db.run("ALTER TABLE people ADD COLUMN email TEXT");
  if (!columns.includes("notes")) db.run("ALTER TABLE people ADD COLUMN notes TEXT");
  const teamColumns = queryObjects("PRAGMA table_info(teams)").map(column => column.name);
  if (!teamColumns.includes("registration_code")) db.run("ALTER TABLE teams ADD COLUMN registration_code TEXT");
  const shouldSeedStructure = !tableExists || +queryObjects("SELECT COUNT(*) AS n FROM teams")[0].n === 0;
  if (shouldSeedStructure) {
    const insertTeam = db.prepare("INSERT OR IGNORE INTO teams (id,name,parent_id,level) VALUES (?,?,?,?)");
    seed.teams.forEach(row => insertTeam.run(row));
    insertTeam.free();
    const assignTeam = db.prepare("UPDATE people SET org_team_id=? WHERE id=? AND org_team_id IS NULL");
    seed.personTeams.forEach(([personId, teamId]) => assignTeam.run([teamId, personId]));
    assignTeam.free();
  }
  db.run(`INSERT OR IGNORE INTO people_teams (person_id, team_id)
    SELECT p.id, CASE WHEN ot.level=1 THEN ot.id ELSE ot.parent_id END
    FROM people p JOIN teams ot ON ot.id=p.org_team_id
    WHERE CASE WHEN ot.level=1 THEN ot.id ELSE ot.parent_id END IS NOT NULL`);
  db.run(`INSERT OR IGNORE INTO people_teams (person_id, team_id)
    SELECT id, org_team_id FROM people WHERE org_team_id IS NOT NULL`);
}

function queryObjects(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function normalizeBirthDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  let match = text.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})(?:\D.*)?$/);
  if (!match) {
    const local = text.match(/^(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})(?:\D.*)?$/);
    if (local) match = [local[0], local[3], local[2], local[1]];
  }
  if (!match) return "";
  const year = +match[1];
  const month = +match[2];
  const day = +match[3];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function ageFromBirthDate(value, now = new Date()) {
  const normalized = normalizeBirthDate(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

function birthDateLabel(value) {
  const normalized = normalizeBirthDate(value);
  if (!normalized) return "Neuvedeno";
  const [year, month, day] = normalized.split("-").map(Number);
  return new Intl.DateTimeFormat("cs-CZ", {day: "numeric", month: "numeric", year: "numeric"}).format(new Date(year, month - 1, day));
}

function refreshDerivedAges() {
  const rows = queryObjects("SELECT id,birth_date,age FROM people WHERE birth_date IS NOT NULL AND TRIM(birth_date)<>''");
  const update = db.prepare("UPDATE people SET age=? WHERE id=?");
  rows.forEach(row => {
    const age = ageFromBirthDate(row.birth_date);
    const currentAge = row.age == null || row.age === "" ? null : +row.age;
    if (currentAge !== age) update.run([age, row.id]);
  });
  update.free();
}

async function loadPeople() {
  refreshDerivedAges();
  people = queryObjects(`
    SELECT p.*, c.name AS category, c.color, ot.name AS org_team,
      GROUP_CONCAT(t.name, ' · ') AS tags
    FROM people p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN teams ot ON ot.id = p.org_team_id
    LEFT JOIN people_tags pt ON pt.person_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    GROUP BY p.id ORDER BY p.name
  `).map(d => ({...d, id: +d.id, birth_date: normalizeBirthDate(d.birth_date), age: d.birth_date ? ageFromBirthDate(d.birth_date) : (d.age == null || d.age === "" ? null : +d.age), category: d.category || "Bez kategorie", color: d.color || "#72766f", tagsArray: d.tags ? d.tags.split(" · ") : []}));
  teams = queryObjects("SELECT id, name, parent_id, level FROM teams ORDER BY level, parent_id, id")
    .map(d => ({...d, id: +d.id, parent_id: d.parent_id == null ? null : +d.parent_id, level: +d.level, nodeType: "team", uid: `team-${d.id}`}));
  const memberships = queryObjects(`SELECT pt.person_id, pt.team_id, t.name, t.level, t.parent_id
    FROM people_teams pt JOIN teams t ON t.id=pt.team_id
    ORDER BY t.level, t.parent_id, t.name`);
  const membershipsByPerson = d3.group(memberships, membership => +membership.person_id);
  people.forEach(person => {
    const personMemberships = membershipsByPerson.get(person.id) || [];
    person.unitIds = personMemberships.map(membership => +membership.team_id);
    person.unitNames = personMemberships.map(membership => membership.name);
    person.jednotky = person.unitNames.join(" · ");
    person.oddilIds = [...new Set(personMemberships.map(membership => {
      if (+membership.level === 1) return +membership.team_id;
      if (+membership.level === 2) return +membership.parent_id;
      return null;
    }).filter(Boolean))];
    person.oddilNames = person.oddilIds.map(id => teams.find(team => team.id === id)?.name).filter(Boolean);
    person.oddily = person.oddilNames.join(" · ");
  });
  relationships = queryObjects("SELECT source_id AS source, target_id AS target, type FROM relationships").map(d => ({...d, source: +d.source, target: +d.target}));
  categoriesData = queryObjects("SELECT id, name, description, color FROM categories ORDER BY name").map(d => ({...d, id: +d.id}));
  tagsData = queryObjects("SELECT id, name FROM tags ORDER BY name").map(d => ({...d, id: +d.id}));
  computeGraphSelection();
  updateGraphFilterMeta();
  renderGraphFilterPanel();
  renderFieldTagPicker();
  renderSqlBuilderOptions();
}

function teamById(id) { return teams.find(team => team.id === +id); }

function primaryOddilId(person) {
  let team = teamById(person.org_team_id);
  while (team && team.level > 1) team = teamById(team.parent_id);
  return team?.id ?? person.oddilIds?.[0] ?? null;
}

function personHomeTeamId(person) {
  return person.org_team_id ?? primaryOddilId(person);
}

function graphHomeTeamId(person) {
  const visible = new Set(graphTeams.map(team => team.id));
  const primary = personHomeTeamId(person);
  if (visible.has(+primary)) return +primary;
  return (person.unitIds || []).find(id => visible.has(+id)) ?? primary;
}

function oddilForPerson(person) {
  return teamById(primaryOddilId(person))?.name || "Bez oddílu";
}

function fieldValues(person) {
  let values;
  if (fieldDimension === "oddil") values = person.oddilNames?.length ? person.oddilNames : [oddilForPerson(person)];
  else if (fieldDimension === "druzina") {
    values = [...new Set((person.unitIds || []).map(teamById).filter(team => team?.level === 2).map(team => team.name))];
    const primaryTeam = teamById(person.org_team_id);
    if (primaryTeam?.level === 2) values.push(primaryTeam.name);
    if (!values.length) values = ["Bez družiny"];
  } else if (fieldDimension === "role") values = [person.role || "Bez role"];
  else if (fieldDimension === "city") values = [person.city || "Neuvedeno"];
  else if (fieldDimension === "tags") {
    const selectedNames = selectedFieldTagNames();
    values = (person.tagsArray || []).filter(tag => selectedNames.has(tag));
  }
  else values = [person.category || "Bez kategorie"];
  return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))];
}

function fieldValue(person) {
  return fieldValues(person)[0] || "Neuvedeno";
}

function fieldColor(name, index) {
  const fieldKey = ["oddil", "druzina"].includes(fieldDimension) ? "unit" : fieldDimension;
  const custom = colorRules.find(rule => rule.field === fieldKey && valueMatches(name, rule.value, rule.operator || "equals"));
  if (custom?.color) return custom.color;
  const category = categoriesData.find(item => item.name === name);
  return category?.color || ["#ef765f", "#6ba29b", "#d4ae72", "#8daec4", "#bbc85d", "#9b8fc2", "#c58caa"][index % 7];
}

function legacyFieldLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const fallbackField = "Všichni";
  const valuesFor = person => displayOptions.categories ? fieldValues(person) : [fallbackField];
  const membersByName = new Map();
  graphPeople.forEach(person => valuesFor(person).forEach(name => {
    if (!membersByName.has(name)) membersByName.set(name, new Set());
    membersByName.get(name).add(person.id);
  }));

  const grouped = d3.group(graphPeople, person => JSON.stringify([...valuesFor(person)].sort((a, b) => a.localeCompare(b, "cs"))));
  const groups = Array.from(grouped, ([signature, members]) => {
    const names = JSON.parse(signature);
    const ordered = [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
    const boxes = ordered.map(nodeCollisionBox);
    const cellWidth = Math.max(44, d3.max(boxes, box => box.halfWidth * 2) || 44) + 18;
    const cellHeight = Math.max(34, d3.max(boxes, box => box.halfHeight * 2) || 34) + 14;
    const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length * cellHeight / cellWidth)));
    const rows = Math.max(1, Math.ceil(ordered.length / columns));
    return {
      signature,
      names,
      members: ordered,
      cellWidth,
      cellHeight,
      columns,
      rows,
      width: columns * cellWidth + 30,
      height: rows * cellHeight + 30,
      x: 0,
      y: 0
    };
  }).sort((a, b) => b.names.length - a.names.length || b.members.length - a.members.length || a.signature.localeCompare(b.signature, "cs"));

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  groups.forEach((group, index) => {
    const radius = index ? Math.sqrt(index) * 230 : 0;
    const angle = index * goldenAngle - Math.PI / 2;
    group.x = Math.cos(angle) * radius;
    group.y = Math.sin(angle) * radius;
  });

  for (let iteration = 0; iteration < 280; iteration += 1) {
    const cooling = 1 - iteration / 330;
    for (let left = 0; left < groups.length; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        const a = groups[left];
        const b = groups[right];
        const sharedFields = a.names.filter(name => b.names.includes(name)).length;
        const clearGap = sharedFields ? 50 : 86;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (!dx && !dy) {
          const angle = (left * 67 + right * 101) * Math.PI / 180;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
        }
        const overlapX = (a.width + b.width) / 2 + clearGap - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + clearGap - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const movement = (overlapX + 1) * .52;
            const direction = dx < 0 ? -1 : 1;
            a.x -= direction * movement;
            b.x += direction * movement;
          } else {
            const movement = (overlapY + 1) * .52;
            const direction = dy < 0 ? -1 : 1;
            a.y -= direction * movement;
            b.y += direction * movement;
          }
          continue;
        }
        if (!sharedFields) continue;
        const distance = Math.hypot(dx, dy) || 1;
        const desired = Math.hypot((a.width + b.width) / 2, (a.height + b.height) / 2) + 16;
        if (distance <= desired) continue;
        const pull = Math.min(18, (distance - desired) * .022 * sharedFields) * cooling;
        a.x += dx / distance * pull;
        a.y += dy / distance * pull;
        b.x -= dx / distance * pull;
        b.y -= dy / distance * pull;
      }
    }
    groups.forEach(group => {
      group.x *= .999;
      group.y *= .999;
    });
  }

  for (let pass = 0; pass < 80; pass += 1) {
    let overlaps = 0;
    for (let left = 0; left < groups.length; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        const a = groups[left];
        const b = groups[right];
        const sharedFields = a.names.some(name => b.names.includes(name));
        const clearGap = sharedFields ? 46 : 78;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const overlapX = (a.width + b.width) / 2 + clearGap - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + clearGap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        overlaps += 1;
        if (!dx && !dy) dx = 1;
        if (overlapX < overlapY) {
          const direction = dx < 0 ? -1 : 1;
          a.x -= direction * (overlapX + 1) / 2;
          b.x += direction * (overlapX + 1) / 2;
        } else {
          const direction = dy < 0 ? -1 : 1;
          a.y -= direction * (overlapY + 1) / 2;
          b.y += direction * (overlapY + 1) / 2;
        }
      }
    }
    if (!overlaps) break;
  }

  if (groups.length) {
    const minX = d3.min(groups, group => group.x - group.width / 2);
    const maxX = d3.max(groups, group => group.x + group.width / 2);
    const minY = d3.min(groups, group => group.y - group.height / 2);
    const maxY = d3.max(groups, group => group.y + group.height / 2);
    const shiftX = centerX - (minX + maxX) / 2;
    const shiftY = centerY - (minY + maxY) / 2;
    groups.forEach(group => { group.x += shiftX; group.y += shiftY; });
  }

  const targets = new Map();
  groups.forEach(group => group.members.forEach((person, index) => {
    const row = Math.floor(index / group.columns);
    const column = index % group.columns;
    const columnsInRow = Math.min(group.columns, group.members.length - row * group.columns);
    targets.set(person.id, [
      group.x + (column - (columnsInRow - 1) / 2) * group.cellWidth,
      group.y + (row - (group.rows - 1) / 2) * group.cellHeight
    ]);
  }));

  function roundedRegionPath(minX, minY, maxX, maxY) {
    const radius = Math.max(12, Math.min(30, (maxX - minX) / 5, (maxY - minY) / 5));
    return `M${minX + radius},${minY} H${maxX - radius} Q${maxX},${minY} ${maxX},${minY + radius} V${maxY - radius} Q${maxX},${maxY} ${maxX - radius},${maxY} H${minX + radius} Q${minX},${maxY} ${minX},${maxY - radius} V${minY + radius} Q${minX},${minY} ${minX + radius},${minY} Z`;
  }

  const regions = groups.map(group => {
    const boxes = group.members.map(person => {
      const [x, y] = targets.get(person.id) || [centerX, centerY];
      return {x, y, box: nodeCollisionBox(person)};
    });
    const contentMinX = d3.min(boxes, item => item.x - item.box.halfWidth);
    const contentMaxX = d3.max(boxes, item => item.x + item.box.halfWidth);
    const contentMinY = d3.min(boxes, item => item.y - item.box.halfHeight);
    const contentMaxY = d3.max(boxes, item => item.y + item.box.halfHeight);
    let signatureHash = 0;
    for (const character of group.signature) signatureHash = (signatureHash * 31 + character.codePointAt(0)) >>> 0;
    const angleOffset = signatureHash % 360 * Math.PI / 180;
    const shift = group.names.length > 1 ? Math.min(12, 7 + group.names.length * 2) : 0;
    const partsByName = Object.fromEntries(group.names.map((name, index) => {
      const angle = angleOffset + index * Math.PI * 2 / group.names.length;
      const dx = Math.cos(angle) * shift;
      const dy = Math.sin(angle) * shift;
      const minX = contentMinX - 32 + dx;
      const maxX = contentMaxX + 32 + dx;
      const minY = contentMinY - 32 + dy;
      const maxY = contentMaxY + 32 + dy;
      return [name, {
        name,
        path: roundedRegionPath(minX, minY, maxX, maxY),
        bounds: {minX, maxX, minY, maxY},
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      }];
    }));
    const lobeParts = Object.values(partsByName);
    const neutralBounds = {minX: contentMinX - 26, maxX: contentMaxX + 26, minY: contentMinY - 26, maxY: contentMaxY + 26};
    const bounds = lobeParts.length ? lobeParts.reduce((result, part) => ({
      minX: Math.min(result.minX, part.bounds.minX),
      maxX: Math.max(result.maxX, part.bounds.maxX),
      minY: Math.min(result.minY, part.bounds.minY),
      maxY: Math.max(result.maxY, part.bounds.maxY)
    }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity}) : neutralBounds;
    const overlapBounds = lobeParts.length ? lobeParts.reduce((result, part) => ({
      minX: Math.max(result.minX, part.bounds.minX),
      maxX: Math.min(result.maxX, part.bounds.maxX),
      minY: Math.max(result.minY, part.bounds.minY),
      maxY: Math.min(result.maxY, part.bounds.maxY)
    }), {minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity}) : neutralBounds;
    return {
      signature: group.signature,
      names: group.names,
      members: new Set(group.members.map(person => person.id)),
      count: group.members.length,
      x: (overlapBounds.minX + overlapBounds.maxX) / 2,
      y: (overlapBounds.minY + overlapBounds.maxY) / 2,
      partsByName,
      overlapPath: roundedRegionPath(overlapBounds.minX, overlapBounds.minY, overlapBounds.maxX, overlapBounds.maxY),
      polygon: [[overlapBounds.minX, overlapBounds.minY], [overlapBounds.maxX, overlapBounds.minY], [overlapBounds.maxX, overlapBounds.maxY], [overlapBounds.minX, overlapBounds.maxY]],
      bounds
    };
  });

  const names = [...membersByName.keys()].sort((a, b) => a.localeCompare(b, "cs"));
  const fields = names.map((name, index) => {
    const parts = regions.filter(region => region.names.includes(name));
    const shapeParts = parts.map(region => region.partsByName[name]).filter(Boolean);
    const exclusiveParts = parts.filter(region => region.names.length === 1);
    const labelRegion = [...(exclusiveParts.length ? exclusiveParts : parts)].sort((a, b) => b.count - a.count)[0];
    const labelPart = labelRegion?.partsByName[name];
    const bounds = shapeParts.reduce((result, part) => ({
      minX: Math.min(result.minX, part.bounds.minX),
      maxX: Math.max(result.maxX, part.bounds.maxX),
      minY: Math.min(result.minY, part.bounds.minY),
      maxY: Math.max(result.maxY, part.bounds.maxY)
    }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity});
    return {
      name,
      color: fieldColor(name, index),
      members: membersByName.get(name),
      count: membersByName.get(name).size,
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
      path: shapeParts.map(part => part.path).join(" "),
      parts,
      bounds,
      labelX: labelPart?.x ?? centerX,
      labelY: labelPart ? (exclusiveParts.length ? labelPart.bounds.minY + 17 : labelPart.bounds.minY - 10 - index % 3 * 14) : centerY
    };
  });
  const fieldByName = new Map(fields.map(field => [field.name, field]));
  regions.forEach(region => { region.fieldEntries = region.names.map(name => fieldByName.get(name)).filter(Boolean); });
  return {fields, regions, targets};
}

function fieldLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const fallbackField = "Všichni";
  const valuesFor = person => displayOptions.categories ? fieldValues(person) : [fallbackField];
  const membersByName = new Map();
  graphPeople.forEach(person => valuesFor(person).forEach(name => {
    if (!membersByName.has(name)) membersByName.set(name, new Set());
    membersByName.get(name).add(person.id);
  }));

  const grouped = d3.group(graphPeople, person => JSON.stringify([...valuesFor(person)].sort((a, b) => a.localeCompare(b, "cs"))));
  const zones = Array.from(grouped, ([signature, members]) => {
    const names = JSON.parse(signature);
    const ordered = [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
    const boxes = ordered.map(nodeCollisionBox);
    const nodeWidth = Math.max(26, d3.max(boxes, box => box.halfWidth * 2) || 26);
    const nodeHeight = Math.max(26, d3.max(boxes, box => box.halfHeight * 2) || 26);
    const cellWidth = nodeWidth + 18;
    const cellHeight = nodeHeight + 16;
    const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length * cellHeight / cellWidth)));
    const rows = Math.max(1, Math.ceil(ordered.length / columns));
    const contentWidth = Math.max(nodeWidth, (Math.min(columns, ordered.length) - 1) * cellWidth + nodeWidth);
    const contentHeight = Math.max(nodeHeight, (rows - 1) * cellHeight + nodeHeight);
    const halfContentWidth = contentWidth / 2;
    const halfContentHeight = contentHeight / 2;
    const lobeShift = names.length > 1 ? Math.min(28, 12 + names.length * 4) : 0;
    const radiusX = Math.max(62, halfContentWidth * 1.5 + 46);
    const radiusY = Math.max(54, halfContentHeight * 1.5 + 42);
    return {
      signature,
      names,
      members: ordered,
      columns,
      rows,
      cellWidth,
      cellHeight,
      contentWidth,
      contentHeight,
      lobeShift,
      radiusX,
      radiusY,
      width: (radiusX + lobeShift) * 2 + 18,
      height: (radiusY + lobeShift) * 2 + 18,
      x: 0,
      y: 0
    };
  }).sort((a, b) => b.names.length - a.names.length || b.members.length - a.members.length || a.signature.localeCompare(b.signature, "cs"));

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  zones.forEach((zone, index) => {
    const radius = index ? Math.sqrt(index) * 280 : 0;
    const angle = index * goldenAngle - Math.PI / 2;
    zone.x = Math.cos(angle) * radius;
    zone.y = Math.sin(angle) * radius;
  });

  for (let iteration = 0; iteration < 340; iteration += 1) {
    const cooling = 1 - iteration / 390;
    for (let left = 0; left < zones.length; left += 1) {
      for (let right = left + 1; right < zones.length; right += 1) {
        const a = zones[left];
        const b = zones[right];
        const shared = a.names.filter(name => b.names.includes(name)).length;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (!dx && !dy) {
          const angle = ((left + 1) * 97 + (right + 1) * 53) * Math.PI / 180;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
        }
        const clearGap = shared ? 38 : 92;
        const overlapX = (a.width + b.width) / 2 + clearGap - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + clearGap - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const direction = dx < 0 ? -1 : 1;
            const movement = (overlapX + 1) * .52;
            a.x -= direction * movement;
            b.x += direction * movement;
          } else {
            const direction = dy < 0 ? -1 : 1;
            const movement = (overlapY + 1) * .52;
            a.y -= direction * movement;
            b.y += direction * movement;
          }
          continue;
        }
        if (!shared) continue;
        const distance = Math.hypot(dx, dy) || 1;
        const desired = Math.hypot((a.width + b.width) / 2, (a.height + b.height) / 2) + 30;
        if (distance <= desired) continue;
        const pull = Math.min(16, (distance - desired) * .018 * shared) * cooling;
        a.x += dx / distance * pull;
        a.y += dy / distance * pull;
        b.x -= dx / distance * pull;
        b.y -= dy / distance * pull;
      }
    }
    zones.forEach(zone => { zone.x *= .9992; zone.y *= .9992; });
  }

  for (let pass = 0; pass < 100; pass += 1) {
    let collisions = 0;
    for (let left = 0; left < zones.length; left += 1) {
      for (let right = left + 1; right < zones.length; right += 1) {
        const a = zones[left];
        const b = zones[right];
        const shared = a.names.some(name => b.names.includes(name));
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const clearGap = shared ? 34 : 82;
        const overlapX = (a.width + b.width) / 2 + clearGap - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + clearGap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        collisions += 1;
        if (!dx && !dy) dx = 1;
        if (overlapX < overlapY) {
          const direction = dx < 0 ? -1 : 1;
          a.x -= direction * (overlapX + 1) / 2;
          b.x += direction * (overlapX + 1) / 2;
        } else {
          const direction = dy < 0 ? -1 : 1;
          a.y -= direction * (overlapY + 1) / 2;
          b.y += direction * (overlapY + 1) / 2;
        }
      }
    }
    if (!collisions) break;
  }

  if (zones.length) {
    const minX = d3.min(zones, zone => zone.x - zone.width / 2);
    const maxX = d3.max(zones, zone => zone.x + zone.width / 2);
    const minY = d3.min(zones, zone => zone.y - zone.height / 2);
    const maxY = d3.max(zones, zone => zone.y + zone.height / 2);
    const shiftX = centerX - (minX + maxX) / 2;
    const shiftY = centerY - (minY + maxY) / 2;
    zones.forEach(zone => { zone.x += shiftX; zone.y += shiftY; });
  }

  const targets = new Map();
  zones.forEach(zone => zone.members.forEach((person, index) => {
    const row = Math.floor(index / zone.columns);
    const column = index % zone.columns;
    const columnsInRow = Math.min(zone.columns, zone.members.length - row * zone.columns);
    targets.set(person.id, [
      zone.x + (column - (columnsInRow - 1) / 2) * zone.cellWidth,
      zone.y + (row - (zone.rows - 1) / 2) * zone.cellHeight
    ]);
  }));

  function ellipsePath(cx, cy, rx, ry) {
    return `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;
  }

  function corePath(bounds) {
    const radius = Math.max(10, Math.min(24, (bounds.maxX - bounds.minX) / 5, (bounds.maxY - bounds.minY) / 5));
    return `M${bounds.minX + radius},${bounds.minY} H${bounds.maxX - radius} Q${bounds.maxX},${bounds.minY} ${bounds.maxX},${bounds.minY + radius} V${bounds.maxY - radius} Q${bounds.maxX},${bounds.maxY} ${bounds.maxX - radius},${bounds.maxY} H${bounds.minX + radius} Q${bounds.minX},${bounds.maxY} ${bounds.minX},${bounds.maxY - radius} V${bounds.minY + radius} Q${bounds.minX},${bounds.minY} ${bounds.minX + radius},${bounds.minY} Z`;
  }

  const fieldNames = [...membersByName.keys()].sort((a, b) => a.localeCompare(b, "cs"));
  const fieldIndex = new Map(fieldNames.map((name, index) => [name, index]));
  const lobes = [];
  const regions = zones.map(zone => {
    let signatureHash = 0;
    for (const character of zone.signature) signatureHash = (signatureHash * 31 + character.codePointAt(0)) >>> 0;
    const angleOffset = signatureHash % 360 * Math.PI / 180;
    zone.names.forEach((name, index) => {
      const angle = zone.names.length > 1 ? angleOffset + index * Math.PI * 2 / zone.names.length : -Math.PI / 2;
      const cx = zone.x + Math.cos(angle) * zone.lobeShift;
      const cy = zone.y + Math.sin(angle) * zone.lobeShift;
      lobes.push({
        key: `${zone.signature}:${name}`,
        signature: zone.signature,
        name,
        color: fieldColor(name, fieldIndex.get(name) || 0),
        cx,
        cy,
        rx: zone.radiusX,
        ry: zone.radiusY,
        path: ellipsePath(cx, cy, zone.radiusX, zone.radiusY),
        bounds: {minX: cx - zone.radiusX, maxX: cx + zone.radiusX, minY: cy - zone.radiusY, maxY: cy + zone.radiusY},
        zone
      });
    });
    const memberBoxes = zone.members.map(person => {
      const [x, y] = targets.get(person.id);
      return {x, y, box: nodeCollisionBox(person)};
    });
    const bounds = {
      minX: d3.min(memberBoxes, item => item.x - item.box.halfWidth) - 10,
      maxX: d3.max(memberBoxes, item => item.x + item.box.halfWidth) + 10,
      minY: d3.min(memberBoxes, item => item.y - item.box.halfHeight) - 10,
      maxY: d3.max(memberBoxes, item => item.y + item.box.halfHeight) + 10
    };
    const zoneLobes = lobes.filter(lobe => lobe.signature === zone.signature);
    const outerBounds = zoneLobes.length ? zoneLobes.reduce((result, lobe) => ({
      minX: Math.min(result.minX, lobe.bounds.minX),
      maxX: Math.max(result.maxX, lobe.bounds.maxX),
      minY: Math.min(result.minY, lobe.bounds.minY),
      maxY: Math.max(result.maxY, lobe.bounds.maxY)
    }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity}) : bounds;
    return {
      signature: zone.signature,
      names: zone.names,
      lobes: zoneLobes,
      members: new Set(zone.members.map(person => person.id)),
      count: zone.members.length,
      x: zone.x,
      y: zone.y,
      overlapPath: corePath(bounds),
      polygon: [[bounds.minX, bounds.minY], [bounds.maxX, bounds.minY], [bounds.maxX, bounds.maxY], [bounds.minX, bounds.maxY]],
      bounds: outerBounds
    };
  });

  const fields = fieldNames.map((name, index) => {
    const fieldLobes = lobes.filter(lobe => lobe.name === name);
    const exclusiveLobes = fieldLobes.filter(lobe => lobe.zone.names.length === 1);
    const labelLobe = [...(exclusiveLobes.length ? exclusiveLobes : fieldLobes)].sort((a, b) => b.zone.members.length - a.zone.members.length)[0];
    const bounds = fieldLobes.reduce((result, lobe) => ({
      minX: Math.min(result.minX, lobe.bounds.minX),
      maxX: Math.max(result.maxX, lobe.bounds.maxX),
      minY: Math.min(result.minY, lobe.bounds.minY),
      maxY: Math.max(result.maxY, lobe.bounds.maxY)
    }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity});
    return {
      name,
      color: fieldColor(name, index),
      members: membersByName.get(name),
      count: membersByName.get(name).size,
      lobes: fieldLobes,
      bounds,
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
      labelX: labelLobe?.cx ?? centerX,
      labelY: labelLobe ? (exclusiveLobes.length ? labelLobe.cy - labelLobe.ry + 22 : labelLobe.cy - labelLobe.ry - 12 - index % 3 * 14) : centerY
    };
  });
  const fieldByName = new Map(fields.map(field => [field.name, field]));
  regions.forEach(region => { region.fieldEntries = region.names.map(name => fieldByName.get(name)).filter(Boolean); });
  lobes.forEach(lobe => { lobe.field = fieldByName.get(lobe.name); });
  return {fields, regions, lobes, targets};
}

function singleShapeFieldLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const fallbackField = "Všichni";
  const valuesFor = person => displayOptions.categories ? fieldValues(person) : [fallbackField];
  const memberIdsByField = new Map();
  graphPeople.forEach(person => valuesFor(person).forEach(name => {
    if (!memberIdsByField.has(name)) memberIdsByField.set(name, new Set());
    memberIdsByField.get(name).add(person.id);
  }));
  const fieldNames = [...memberIdsByField.keys()].sort((a, b) => a.localeCompare(b, "cs"));
  const fieldIndex = new Map(fieldNames.map((name, index) => [name, index]));

  const grouped = d3.group(graphPeople, person => JSON.stringify([...valuesFor(person)].sort((a, b) => a.localeCompare(b, "cs"))));
  const zones = Array.from(grouped, ([signature, members]) => {
    const names = JSON.parse(signature);
    const ordered = [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
    const boxes = ordered.map(nodeCollisionBox);
    const nodeWidth = Math.max(26, d3.max(boxes, box => box.halfWidth * 2) || 26);
    const nodeHeight = Math.max(26, d3.max(boxes, box => box.halfHeight * 2) || 26);
    const cellWidth = nodeWidth + 20;
    const cellHeight = nodeHeight + 18;
    const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length * cellHeight / cellWidth)));
    const rows = Math.max(1, Math.ceil(ordered.length / columns));
    const contentWidth = Math.max(nodeWidth, (Math.min(columns, ordered.length) - 1) * cellWidth + nodeWidth);
    const contentHeight = Math.max(nodeHeight, (rows - 1) * cellHeight + nodeHeight);
    return {
      signature,
      names,
      members: ordered,
      columns,
      rows,
      cellWidth,
      cellHeight,
      width: contentWidth + 94,
      height: contentHeight + 88,
      idealX: 0,
      idealY: 0,
      x: 0,
      y: 0
    };
  }).sort((a, b) => b.names.length - a.names.length || b.members.length - a.members.length || a.signature.localeCompare(b.signature, "cs"));

  const adjacency = new Map(fieldNames.map(name => [name, new Set()]));
  zones.filter(zone => zone.names.length > 1).forEach(zone => {
    zone.names.forEach((name, index) => zone.names.slice(index + 1).forEach(other => {
      adjacency.get(name)?.add(other);
      adjacency.get(other)?.add(name);
    }));
  });
  const components = [];
  const unseen = new Set(fieldNames);
  while (unseen.size) {
    const first = unseen.values().next().value;
    const stack = [first];
    const names = [];
    unseen.delete(first);
    while (stack.length) {
      const name = stack.pop();
      names.push(name);
      adjacency.get(name)?.forEach(other => {
        if (!unseen.has(other)) return;
        unseen.delete(other);
        stack.push(other);
      });
    }
    components.push({key: names.sort((a, b) => a.localeCompare(b, "cs")).join("|"), names});
  }
  if (zones.some(zone => !zone.names.length)) components.push({key: "__unassigned__", names: []});

  const maxZoneWidth = d3.max(zones, zone => zone.width) || 180;
  const maxZoneHeight = d3.max(zones, zone => zone.height) || 140;
  components.forEach(component => {
    const count = Math.max(1, component.names.length);
    component.radius = count > 1 ? Math.max(230, count * 72 + Math.max(maxZoneWidth, maxZoneHeight) * .16) : 0;
    component.width = Math.max(maxZoneWidth + 180, component.radius * 2 + maxZoneWidth + 220);
    component.height = Math.max(maxZoneHeight + 160, component.radius * 2 + maxZoneHeight + 200);
  });
  const totalArea = d3.sum(components, component => component.width * component.height);
  const rowLimit = Math.max(900, Math.sqrt(totalArea) * 1.35);
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  components.forEach(component => {
    if (cursorX && cursorX + component.width > rowLimit) {
      cursorX = 0;
      cursorY += rowHeight + 180;
      rowHeight = 0;
    }
    component.x = cursorX + component.width / 2;
    component.y = cursorY + component.height / 2;
    cursorX += component.width + 180;
    rowHeight = Math.max(rowHeight, component.height);
  });
  const minComponentX = d3.min(components, component => component.x - component.width / 2) || 0;
  const maxComponentX = d3.max(components, component => component.x + component.width / 2) || 0;
  const minComponentY = d3.min(components, component => component.y - component.height / 2) || 0;
  const maxComponentY = d3.max(components, component => component.y + component.height / 2) || 0;
  const componentShiftX = centerX - (minComponentX + maxComponentX) / 2;
  const componentShiftY = centerY - (minComponentY + maxComponentY) / 2;
  components.forEach(component => {
    component.x += componentShiftX;
    component.y += componentShiftY;
  });

  const componentByField = new Map();
  const anchors = new Map();
  components.forEach(component => {
    component.names.forEach((name, index) => {
      componentByField.set(name, component);
      const angle = component.names.length > 1 ? -Math.PI / 2 + index * Math.PI * 2 / component.names.length : 0;
      anchors.set(name, {
        x: component.x + Math.cos(angle) * component.radius,
        y: component.y + Math.sin(angle) * component.radius
      });
    });
  });
  const unassignedComponent = components.find(component => component.key === "__unassigned__");
  zones.forEach(zone => {
    if (!zone.names.length) {
      zone.idealX = unassignedComponent?.x ?? centerX;
      zone.idealY = unassignedComponent?.y ?? centerY;
    } else if (zone.names.length === 1) {
      const anchor = anchors.get(zone.names[0]);
      const component = componentByField.get(zone.names[0]);
      let dx = anchor.x - component.x;
      let dy = anchor.y - component.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (component.names.length === 1) { dx = 0; dy = 0; }
      zone.idealX = anchor.x + dx / distance * 90;
      zone.idealY = anchor.y + dy / distance * 90;
    } else {
      zone.idealX = d3.mean(zone.names, name => anchors.get(name).x);
      zone.idealY = d3.mean(zone.names, name => anchors.get(name).y);
    }
    zone.x = zone.idealX;
    zone.y = zone.idealY;
  });

  for (let iteration = 0; iteration < 240; iteration += 1) {
    const cooling = 1 - iteration / 280;
    zones.forEach(zone => {
      zone.x += (zone.idealX - zone.x) * .025 * cooling;
      zone.y += (zone.idealY - zone.y) * .025 * cooling;
    });
    for (let left = 0; left < zones.length; left += 1) {
      for (let right = left + 1; right < zones.length; right += 1) {
        const a = zones[left];
        const b = zones[right];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (!dx && !dy) dx = 1;
        const overlapX = (a.width + b.width) / 2 + 72 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + 72 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX < overlapY) {
          const direction = dx < 0 ? -1 : 1;
          a.x -= direction * overlapX * .52;
          b.x += direction * overlapX * .52;
        } else {
          const direction = dy < 0 ? -1 : 1;
          a.y -= direction * overlapY * .52;
          b.y += direction * overlapY * .52;
        }
      }
    }
  }

  const targets = new Map();
  zones.forEach(zone => zone.members.forEach((person, index) => {
    const row = Math.floor(index / zone.columns);
    const column = index % zone.columns;
    const columnsInRow = Math.min(zone.columns, zone.members.length - row * zone.columns);
    targets.set(person.id, [
      zone.x + (column - (columnsInRow - 1) / 2) * zone.cellWidth,
      zone.y + (row - (zone.rows - 1) / 2) * zone.cellHeight
    ]);
  }));
  zones.forEach(zone => {
    const memberBoxes = zone.members.map(person => {
      const [x, y] = targets.get(person.id);
      return {x, y, box: nodeCollisionBox(person)};
    });
    zone.bounds = {
      minX: d3.min(memberBoxes, item => item.x - item.box.halfWidth) - 38,
      maxX: d3.max(memberBoxes, item => item.x + item.box.halfWidth) + 38,
      minY: d3.min(memberBoxes, item => item.y - item.box.halfHeight) - 36,
      maxY: d3.max(memberBoxes, item => item.y + item.box.halfHeight) + 36
    };
  });

  function roundedRectContains(x, y, bounds, radius = 30) {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const halfWidth = (bounds.maxX - bounds.minX) / 2;
    const halfHeight = (bounds.maxY - bounds.minY) / 2;
    const usableRadius = Math.min(radius, halfWidth, halfHeight);
    const dx = Math.max(Math.abs(x - cx) - (halfWidth - usableRadius), 0);
    const dy = Math.max(Math.abs(y - cy) - (halfHeight - usableRadius), 0);
    return dx * dx + dy * dy <= usableRadius * usableRadius;
  }

  function distanceToSegment(x, y, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    return Math.hypot(x - (start.x + dx * t), y - (start.y + dy * t));
  }

  function minimumSpanningSegments(items) {
    if (items.length < 2) return [];
    const included = new Set([0]);
    const segments = [];
    while (included.size < items.length) {
      let best = null;
      included.forEach(fromIndex => items.forEach((item, toIndex) => {
        if (included.has(toIndex)) return;
        const distance = Math.hypot(items[fromIndex].x - item.x, items[fromIndex].y - item.y);
        if (!best || distance < best.distance) best = {fromIndex, toIndex, distance};
      }));
      if (!best) break;
      included.add(best.toIndex);
      segments.push({start: items[best.fromIndex], end: items[best.toIndex]});
    }
    return segments;
  }

  const routingPadding = 120;
  const routingStep = 16;
  const routingBounds = zones.reduce((result, zone) => ({
    minX: Math.min(result.minX, zone.bounds.minX),
    maxX: Math.max(result.maxX, zone.bounds.maxX),
    minY: Math.min(result.minY, zone.bounds.minY),
    maxY: Math.max(result.maxY, zone.bounds.maxY)
  }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity});
  routingBounds.minX -= routingPadding;
  routingBounds.maxX += routingPadding;
  routingBounds.minY -= routingPadding;
  routingBounds.maxY += routingPadding;

  function simplifyOrthogonalPath(points) {
    if (points.length < 3) return points;
    const simplified = [points[0]];
    for (let index = 1; index < points.length - 1; index += 1) {
      const previous = simplified[simplified.length - 1];
      const current = points[index];
      const next = points[index + 1];
      const sameColumn = Math.abs(previous.x - current.x) < .1 && Math.abs(current.x - next.x) < .1;
      const sameRow = Math.abs(previous.y - current.y) < .1 && Math.abs(current.y - next.y) < .1;
      if (!sameColumn && !sameRow) simplified.push(current);
    }
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  function routeAroundForeignZones(start, end, fieldName, clearance) {
    const obstacles = zones.filter(zone => !zone.names.includes(fieldName));
    const originX = Math.floor(routingBounds.minX / routingStep) * routingStep;
    const originY = Math.floor(routingBounds.minY / routingStep) * routingStep;
    const columns = Math.max(3, Math.ceil((routingBounds.maxX - originX) / routingStep) + 1);
    const rows = Math.max(3, Math.ceil((routingBounds.maxY - originY) / routingStep) + 1);
    const cellFor = point => ({
      column: Math.max(0, Math.min(columns - 1, Math.round((point.x - originX) / routingStep))),
      row: Math.max(0, Math.min(rows - 1, Math.round((point.y - originY) / routingStep)))
    });
    const pointFor = (column, row) => ({x: originX + column * routingStep, y: originY + row * routingStep});
    const blocked = (column, row) => {
      const point = pointFor(column, row);
      return obstacles.some(zone =>
        point.x >= zone.bounds.minX - clearance && point.x <= zone.bounds.maxX + clearance &&
        point.y >= zone.bounds.minY - clearance && point.y <= zone.bounds.maxY + clearance
      );
    };
    const startCell = cellFor(start);
    const endCell = cellFor(end);
    const startId = startCell.row * columns + startCell.column;
    const endId = endCell.row * columns + endCell.column;
    const previous = new Int32Array(columns * rows);
    previous.fill(-1);
    const visited = new Uint8Array(columns * rows);
    const queue = new Int32Array(columns * rows);
    let head = 0;
    let tail = 0;
    queue[tail++] = startId;
    visited[startId] = 1;
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    while (head < tail && !visited[endId]) {
      const id = queue[head++];
      const column = id % columns;
      const row = Math.floor(id / columns);
      directions.forEach(([dc, dr]) => {
        const nextColumn = column + dc;
        const nextRow = row + dr;
        if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows) return;
        const nextId = nextRow * columns + nextColumn;
        if (visited[nextId] || (nextId !== endId && blocked(nextColumn, nextRow))) return;
        visited[nextId] = 1;
        previous[nextId] = id;
        queue[tail++] = nextId;
      });
    }
    if (!visited[endId]) return [start, end];
    const routed = [];
    for (let id = endId; id !== -1; id = previous[id]) {
      routed.push(pointFor(id % columns, Math.floor(id / columns)));
      if (id === startId) break;
    }
    routed.reverse();
    routed[0] = start;
    routed[routed.length - 1] = end;
    return simplifyOrthogonalPath(routed);
  }

  const fields = fieldNames.map((name, index) => {
    const fieldZones = zones.filter(zone => zone.names.includes(name));
    const zonePoints = fieldZones.map(zone => ({x: zone.x, y: zone.y, zone}));
    const bridgeHalfWidth = 22;
    const routes = minimumSpanningSegments(zonePoints).map(segment =>
      routeAroundForeignZones(segment.start, segment.end, name, bridgeHalfWidth + 10)
    );
    const segments = routes.flatMap(route => route.slice(1).map((end, pointIndex) => ({start: route[pointIndex], end})));
    const memberIds = memberIdsByField.get(name);
    const rawContains = (x, y) => fieldZones.some(zone => roundedRectContains(x, y, zone.bounds))
      || segments.some(segment => distanceToSegment(x, y, segment.start, segment.end) <= bridgeHalfWidth);
    const bounds = [...fieldZones.flatMap(zone => [
      {x: zone.bounds.minX, y: zone.bounds.minY},
      {x: zone.bounds.maxX, y: zone.bounds.maxY}
    ]), ...routes.flat()].reduce((result, point) => ({
      minX: Math.min(result.minX, point.x - bridgeHalfWidth),
      maxX: Math.max(result.maxX, point.x + bridgeHalfWidth),
      minY: Math.min(result.minY, point.y - bridgeHalfWidth),
      maxY: Math.max(result.maxY, point.y + bridgeHalfWidth)
    }), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity});
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    const cellSize = Math.max(4, Math.min(9, Math.max(spanX, spanY) / 240));
    const columns = Math.max(3, Math.ceil(spanX / cellSize) + 3);
    const rows = Math.max(3, Math.ceil(spanY / cellSize) + 3);
    const originX = bounds.minX - cellSize;
    const originY = bounds.minY - cellSize;
    const values = new Float64Array(columns * rows);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        values[row * columns + column] = rawContains(originX + column * cellSize, originY + row * cellSize) ? 1 : 0;
      }
    }
    const contour = d3.contours().size([columns, rows]).smooth(true).thresholds([.5])(values)[0];
    const projection = d3.geoIdentity().scale(cellSize).translate([originX, originY]);
    const exclusiveZones = fieldZones.filter(zone => zone.names.length === 1);
    const labelZone = [...(exclusiveZones.length ? exclusiveZones : fieldZones)].sort((a, b) => b.members.length - a.members.length)[0];
    return {
      name,
      color: fieldColor(name, index),
      members: memberIds,
      count: memberIds.size,
      path: contour ? d3.geoPath(projection)(contour) : "",
      outlinePath: contour ? d3.geoPath(projection)(contour) : "",
      contains: rawContains,
      bounds,
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
      labelX: labelZone?.x ?? centerX,
      labelY: labelZone ? labelZone.bounds.minY + 22 : centerY
    };
  });

  const fieldByName = new Map(fields.map(field => [field.name, field]));
  const regions = zones.map(zone => ({
    signature: zone.signature,
    names: zone.names,
    members: new Set(zone.members.map(person => person.id)),
    count: zone.members.length,
    x: zone.x,
    y: zone.y,
    polygon: [[zone.bounds.minX, zone.bounds.minY], [zone.bounds.maxX, zone.bounds.minY], [zone.bounds.maxX, zone.bounds.maxY], [zone.bounds.minX, zone.bounds.maxY]],
    bounds: zone.bounds,
    fieldEntries: zone.names.map(name => fieldByName.get(name)).filter(Boolean)
  }));
  return {fields, regions, targets};
}

function rectangularFieldLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const denseOddilLayout = fieldDimension === "oddil";
  const fallbackField = "Všichni";
  const valuesFor = person => displayOptions.categories ? fieldValues(person) : [fallbackField];
  const memberships = new Map();
  const memberIdsByField = new Map();
  graphPeople.forEach(person => {
    const names = [...valuesFor(person)].sort((a, b) => a.localeCompare(b, "cs"));
    memberships.set(person.id, names);
    names.forEach(name => {
      if (!memberIdsByField.has(name)) memberIdsByField.set(name, new Set());
      memberIdsByField.get(name).add(person.id);
    });
  });
  // In tag mode an empty membership means that the person is outside the
  // selected data sets. Do not invent an unassigned region for them.
  const layoutPeople = graphPeople.filter(person => (memberships.get(person.id) || []).length > 0);
  const fieldNames = [...memberIdsByField.keys()].sort((a, b) => a.localeCompare(b, "cs"));
  const subsetCounts = new Map();
  layoutPeople.forEach(person => {
    const names = memberships.get(person.id);
    const maxSubsetSize = Math.min(4, names.length);
    function countSubsets(start, wanted, chosen) {
      if (!wanted) {
        const key = JSON.stringify(chosen);
        subsetCounts.set(key, (subsetCounts.get(key) || 0) + 1);
        return;
      }
      for (let index = start; index <= names.length - wanted; index += 1) {
        chosen.push(names[index]);
        countSubsets(index + 1, wanted - 1, chosen);
        chosen.pop();
      }
    }
    for (let size = 2; size <= maxSubsetSize; size += 1) countSubsets(0, size, []);
    // Pairwise and small intersections guide the general shape, while the
    // complete signature guarantees that highly-tagged people still receive
    // a real shared region instead of falling outside every field.
    if (names.length > maxSubsetSize) {
      const key = JSON.stringify(names);
      subsetCounts.set(key, (subsetCounts.get(key) || 0) + 1);
    }
  });
  const areas = fieldNames.map(name => ({sets: [name], size: Math.max(1, memberIdsByField.get(name).size)}));
  subsetCounts.forEach((size, key) => {
    if (size > 0) areas.push({sets: JSON.parse(key), size, weight: 2});
  });
  for (let first = 0; first < fieldNames.length; first += 1) {
    for (let second = first + 1; second < fieldNames.length; second += 1) {
      const sets = [fieldNames[first], fieldNames[second]];
      if (!subsetCounts.has(JSON.stringify(sets))) areas.push({sets, size: 0, weight: 3});
      if (fieldNames.length <= 32) {
        for (let third = second + 1; third < fieldNames.length; third += 1) {
          const triple = [fieldNames[first], fieldNames[second], fieldNames[third]];
          if (!subsetCounts.has(JSON.stringify(triple))) areas.push({sets: triple, size: 0, weight: 2});
        }
      }
    }
  }

  const peopleScale = Math.max(1, Math.sqrt(Math.max(1, layoutPeople.length)));
  const fieldScale = Math.max(1, Math.sqrt(Math.max(1, fieldNames.length)));
  // Oddíl fields can contain hundreds of people, but their geometry must not
  // grow with the full label grid on both axes. Give the Venn solver enough
  // room to separate sets, then let each exact membership region pack its own
  // compact grid inside that geometry.
  const peopleSpacing = denseOddilLayout ? 82 : fieldDimension === "oddil" ? 168 : 220;
  const fieldSpacing = fieldDimension === "oddil" ? 280 : 380;
  const minimumWidth = fieldDimension === "oddil" ? 760 : 1050;
  const worldWidth = Math.max(width * .9, peopleScale * peopleSpacing, fieldScale * fieldSpacing, minimumWidth);
  const worldHeight = fieldDimension === "oddil"
    ? Math.max(height * .82, worldWidth * .62, 680)
    : Math.max(height * .88, worldWidth * .72, 760);
  let circles = {};
  if (fieldNames.length === 1) {
    const name = fieldNames[0];
    circles[name] = {
      x: centerX,
      y: centerY,
      radius: Math.max(120, Math.sqrt(memberIdsByField.get(name).size) * 48)
    };
  } else if (fieldNames.length > 1) {
    const solved = vennLibrary.normalizeSolution(vennLibrary.venn(areas, {maxIterations: 700}), Math.PI / 2, null);
    const scaled = vennLibrary.scaleSolution(solved, worldWidth, worldHeight, 88);
    const shiftX = centerX - worldWidth / 2;
    const shiftY = centerY - worldHeight / 2;
    fieldNames.forEach(name => {
      circles[name] = {
        x: scaled[name].x + shiftX,
        y: scaled[name].y + shiftY,
        radius: scaled[name].radius
      };
    });
  }

  // The Venn solver supplies stable set centres and overlap relationships.
  // Landscape rectangles fully contain their source circles, so required
  // intersections remain available while the groups gain a clearer grid.
  const rectangles = {};
  fieldNames.forEach(name => {
    const circle = circles[name];
    const halfWidth = fieldDimension === "oddil"
      ? Math.max(72, circle.radius * 1.08)
      : Math.max(64, circle.radius * 1.05);
    const halfHeight = fieldDimension === "oddil"
      ? Math.max(58, circle.radius)
      : Math.max(50, circle.radius);
    rectangles[name] = {
      x: circle.x,
      y: circle.y,
      halfWidth,
      halfHeight,
      radius: fieldDimension === "oddil"
        ? Math.max(20, Math.min(halfWidth * .48, halfHeight * .62))
        : Math.max(16, circle.radius * .32)
    };
  });

  function roundedRectangleDistance(rectangle, x, y) {
    const innerHalfWidth = Math.max(0, rectangle.halfWidth - rectangle.radius);
    const innerHalfHeight = Math.max(0, rectangle.halfHeight - rectangle.radius);
    const dx = Math.abs(x - rectangle.x) - innerHalfWidth;
    const dy = Math.abs(y - rectangle.y) - innerHalfHeight;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - rectangle.radius;
  }

  function pointMatchesMembership(x, y, names, margin = 0) {
    const expected = new Set(names);
    return fieldNames.every(name => {
      const distance = roundedRectangleDistance(rectangles[name], x, y);
      return expected.has(name) ? distance <= -margin : distance >= margin;
    });
  }

  function roundedRectanglePath(rectangle) {
    const left = rectangle.x - rectangle.halfWidth;
    const right = rectangle.x + rectangle.halfWidth;
    const top = rectangle.y - rectangle.halfHeight;
    const bottom = rectangle.y + rectangle.halfHeight;
    const radius = Math.min(rectangle.radius, rectangle.halfWidth, rectangle.halfHeight);
    return `M${left + radius},${top} H${right - radius} Q${right},${top} ${right},${top + radius} V${bottom - radius} Q${right},${bottom} ${right - radius},${bottom} H${left + radius} Q${left},${bottom} ${left},${bottom - radius} V${top + radius} Q${left},${top} ${left + radius},${top} Z`;
  }

  const fields = fieldNames.map((name, index) => {
    const rectangle = rectangles[name];
    const exclusions = [];
    return {
      name,
      color: fieldColor(name, index),
      members: memberIdsByField.get(name),
      count: memberIdsByField.get(name).size,
      rectangle,
      exclusions,
      outlinePath: roundedRectanglePath(rectangle),
      path: roundedRectanglePath(rectangle),
      contains: (x, y) => roundedRectangleDistance(rectangle, x, y) <= 0 && !exclusions.some(hole => roundedRectangleDistance(hole, x, y) <= 0),
      bounds: {
        minX: rectangle.x - rectangle.halfWidth,
        maxX: rectangle.x + rectangle.halfWidth,
        minY: rectangle.y - rectangle.halfHeight,
        maxY: rectangle.y + rectangle.halfHeight
      },
      x: rectangle.x,
      y: rectangle.y,
      labelX: rectangle.x,
      labelY: rectangle.y - rectangle.halfHeight + 24
    };
  });
  const fieldByName = new Map(fields.map(field => [field.name, field]));
  function syncFieldGeometry() {
    fields.forEach(field => {
      const rectangle = rectangles[field.name];
      field.rectangle = rectangle;
      field.outlinePath = roundedRectanglePath(rectangle);
      // Exclusions repair memberships that an axis-aligned rectangle cannot
      // represent. Keep them in hit testing, but never cut one visible hole
      // per person: dense intersections otherwise become a tiled checkerboard.
      field.path = field.outlinePath;
      field.bounds = {
        minX: rectangle.x - rectangle.halfWidth,
        maxX: rectangle.x + rectangle.halfWidth,
        minY: rectangle.y - rectangle.halfHeight,
        maxY: rectangle.y + rectangle.halfHeight
      };
      field.x = rectangle.x;
      field.y = rectangle.y;
      field.labelX = rectangle.x;
      field.labelY = rectangle.y - rectangle.halfHeight + 24;
    });
  }
  const grouped = d3.group(layoutPeople, person => JSON.stringify(memberships.get(person.id)));
  const zones = Array.from(grouped, ([signature, members]) => ({
    signature,
    names: JSON.parse(signature),
    members: [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id)
  })).sort((a, b) => b.names.length - a.names.length || b.members.length - a.members.length || a.signature.localeCompare(b.signature, "cs"));

  // Venn's numeric solution can occasionally leave a real membership
  // intersection too narrow (or entirely absent) after circles are converted
  // to rectangles. Reserve an actual shared interior for every populated
  // Oddil signature before placing a single person.
  if (fieldDimension === "oddil") zones.filter(zone => zone.names.length > 1).forEach(zone => {
    const involved = zone.names.map(name => rectangles[name]).filter(Boolean);
    if (involved.length !== zone.names.length) return;
    const columns = Math.max(1, Math.ceil(Math.sqrt(zone.members.length * 1.25)));
    const rows = Math.max(1, Math.ceil(zone.members.length / columns));
    const requiredHalfWidth = (Math.min(columns, zone.members.length) - 1) * 15 + ODDIL_FIELD_NODE_CLEARANCE + 12;
    const requiredHalfHeight = (rows - 1) * 15 + ODDIL_FIELD_NODE_CLEARANCE + 12;
    const anchor = {
      x: d3.mean(involved, rectangle => rectangle.x),
      y: d3.mean(involved, rectangle => rectangle.y)
    };
    involved.forEach(rectangle => {
      rectangle.halfWidth = Math.max(rectangle.halfWidth, Math.abs(anchor.x - rectangle.x) + requiredHalfWidth + rectangle.radius);
      rectangle.halfHeight = Math.max(rectangle.halfHeight, Math.abs(anchor.y - rectangle.y) + requiredHalfHeight + rectangle.radius);
    });
  });

  function regionCentre(names) {
    const interior = names.map(name => rectangles[name]);
    const minX = d3.max(interior, rectangle => rectangle.x - rectangle.halfWidth);
    const maxX = d3.min(interior, rectangle => rectangle.x + rectangle.halfWidth);
    const minY = d3.max(interior, rectangle => rectangle.y - rectangle.halfHeight);
    const maxY = d3.min(interior, rectangle => rectangle.y + rectangle.halfHeight);
    const centre = {x: (minX + maxX) / 2, y: (minY + maxY) / 2};
    if (Number.isFinite(centre.x) && Number.isFinite(centre.y) && pointMatchesMembership(centre.x, centre.y, names)) return centre;
    return {x: d3.mean(interior, rectangle => rectangle.x), y: d3.mean(interior, rectangle => rectangle.y)};
  }

  function candidatePoints(zone) {
    const centre = regionCentre(zone.names);
    const bounds = {
      minX: d3.max(zone.names, name => rectangles[name].x - rectangles[name].halfWidth),
      maxX: d3.min(zone.names, name => rectangles[name].x + rectangles[name].halfWidth),
      minY: d3.max(zone.names, name => rectangles[name].y - rectangles[name].halfHeight),
      maxY: d3.min(zone.names, name => rectangles[name].y + rectangles[name].halfHeight)
    };
    if (![bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(Number.isFinite) || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return [];
    const result = [];
    const steps = [42, 34, 27, 21, 16, 12, 8, 5, 3, 2, 1];
    const widestLabel = denseOddilLayout ? 24 : d3.max(zone.members, person => estimatedPersonLabelWidth(person)) || 48;
    const desiredInset = denseOddilLayout ? 12 : Math.max(16, Math.min(30, widestLabel / 3));
    const insetFactors = [1, .9, .75, .58, .42, .28, .16, .08, 0, 0, 0];
    const minimumCandidateCount = fieldDimension === "oddil"
      ? Math.max(zone.members.length * 12, 120)
      : zone.members.length;
    for (let attempt = 0; attempt < steps.length; attempt += 1) {
      const step = steps[attempt];
      result.length = 0;
      const inset = fieldDimension === "oddil"
        ? ODDIL_FIELD_NODE_CLEARANCE
        : insetFactors[attempt] === 0 ? 0 : Math.max(2, desiredInset * insetFactors[attempt]);
      for (let y = bounds.minY + step / 2; y <= bounds.maxY - step / 2; y += step) {
        for (let x = bounds.minX + step / 2; x <= bounds.maxX - step / 2; x += step) {
          if (!pointMatchesMembership(x, y, zone.names, inset)) continue;
          result.push({x, y, score: (x - centre.x) ** 2 + (y - centre.y) ** 2});
        }
      }
      if (result.length >= minimumCandidateCount) break;
    }
    return result.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x);
  }

  function structuredCandidatePoints(candidates, members, horizontalSpacing, verticalSpacing, occupied) {
    if (!members.length || !candidates.length) return [];
    const minX = d3.min(candidates, candidate => candidate.x);
    const maxX = d3.max(candidates, candidate => candidate.x);
    const minY = d3.min(candidates, candidate => candidate.y);
    const maxY = d3.max(candidates, candidate => candidate.y);
    const availableWidth = Math.max(horizontalSpacing, maxX - minX);
    const availableHeight = Math.max(verticalSpacing, maxY - minY);
    const compactOddilGrid = fieldDimension === "oddil";
    const idealColumns = compactOddilGrid
      ? Math.ceil(Math.sqrt(members.length * verticalSpacing / horizontalSpacing * 1.25))
      : Math.ceil(Math.sqrt(members.length * availableWidth / availableHeight * verticalSpacing / horizontalSpacing));
    const columns = Math.max(1, Math.min(members.length, idealColumns));
    const rows = Math.ceil(members.length / columns);
    // Candidate lists are ordered from the most representative interior point
    // outwards. Oddíl mode builds a compact grid around that anchor instead of
    // distributing names over the complete (and sometimes very large) set.
    const anchor = candidates[0];
    const used = new Set();
    const selected = new Array(members.length).fill(null);
    members.forEach((person, index) => {
      const row = Math.floor(index / columns);
      const itemsInRow = Math.min(columns, members.length - row * columns);
      const column = index - row * columns;
      const targetX = compactOddilGrid
        ? anchor.x + (column - (itemsInRow - 1) / 2) * horizontalSpacing
        : itemsInRow === 1 ? (minX + maxX) / 2 : minX + column / (itemsInRow - 1) * (maxX - minX);
      const targetY = compactOddilGrid
        ? anchor.y + (row - (rows - 1) / 2) * verticalSpacing
        : rows === 1 ? (minY + maxY) / 2 : minY + row / (rows - 1) * (maxY - minY);
      const halfWidth = denseOddilLayout ? 12 : estimatedPersonLabelWidth(person) / 2 + 7;
      const ordered = candidates.map((candidate, candidateIndex) => ({candidate, candidateIndex}))
        .filter(entry => !used.has(entry.candidateIndex))
        .sort((a, b) => (a.candidate.x - targetX) ** 2 + (a.candidate.y - targetY) ** 2 - ((b.candidate.x - targetX) ** 2 + (b.candidate.y - targetY) ** 2));
      const chosen = ordered.find(({candidate}) => occupied.every(other =>
        Math.abs(candidate.x - other.x) >= halfWidth + other.halfWidth ||
        Math.abs(candidate.y - other.y) >= verticalSpacing
      ));
      if (!chosen) return;
      used.add(chosen.candidateIndex);
      selected[index] = chosen.candidate;
      occupied.push({x: chosen.candidate.x, y: chosen.candidate.y, halfWidth});
    });
    return selected;
  }

  function placeZoneMembers() {
    const nextTargets = new Map();
    const occupied = [];
    zones.forEach(zone => {
      const candidates = candidatePoints(zone);
      const widestLabel = d3.max(zone.members, person => estimatedPersonLabelWidth(person)) || 48;
      const horizontalSpacing = denseOddilLayout ? 30 : Math.max(72, Math.min(190, widestLabel + 22));
      const verticalSpacing = denseOddilLayout ? 30 : 44;
      const orderedMembers = denseOddilLayout
        ? [...zone.members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id)
        : [...zone.members].sort((a, b) => estimatedPersonLabelWidth(b) - estimatedPersonLabelWidth(a) || personName(a).localeCompare(personName(b), "cs"));
      const chosenCandidates = structuredCandidatePoints(candidates, orderedMembers, horizontalSpacing, verticalSpacing, occupied);
      orderedMembers.forEach((person, index) => {
        const candidate = chosenCandidates[index];
        if (candidate) nextTargets.set(person.id, [candidate.x, candidate.y]);
      });
      zone.valid = zone.members.every(person => nextTargets.has(person.id));
    });
    return nextTargets;
  }

  let targets = placeZoneMembers();
  const geometryRetries = fieldDimension === "oddil" ? 6 : 4;
  for (let retry = 0; retry < geometryRetries && zones.some(zone => !zone.valid); retry += 1) {
    const factor = fieldDimension === "oddil" ? 1.16 : 1.24;
    fieldNames.forEach(name => {
      const rectangle = rectangles[name];
      rectangle.x = centerX + (rectangle.x - centerX) * factor;
      rectangle.y = centerY + (rectangle.y - centerY) * factor;
      rectangle.halfWidth *= factor;
      rectangle.halfHeight *= factor;
      rectangle.radius *= factor;
    });
    targets = placeZoneMembers();
  }

  // Axis-aligned rectangles cannot express every possible combination of
  // four or more overlapping oddíly. When that rare topology occurs, keep
  // the main rectangles and add a computational exclusion bay to any
  // unrelated field covering the remaining member. The bay affects exact
  // hit testing without punching a visible hole into the field.
  if (fieldDimension === "oddil" && zones.some(zone => !zone.valid)) {
    const personById = new Map(layoutPeople.map(person => [person.id, person]));
    const repairOccupied = [...targets.entries()].map(([personId, point]) => ({
      x: point[0],
      y: point[1],
      halfWidth: denseOddilLayout ? 12 : estimatedPersonLabelWidth(personById.get(personId)) / 2 + 7
    }));
    function assignedCandidates(zone) {
      const selected = new Set(zone.names);
      const interior = zone.names.map(name => rectangles[name]);
      const bounds = {
        minX: d3.max(interior, rectangle => rectangle.x - rectangle.halfWidth),
        maxX: d3.min(interior, rectangle => rectangle.x + rectangle.halfWidth),
        minY: d3.max(interior, rectangle => rectangle.y - rectangle.halfHeight),
        maxY: d3.min(interior, rectangle => rectangle.y + rectangle.halfHeight)
      };
      if (![bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(Number.isFinite) || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return [];
      const centre = {x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2};
      const result = [];
      const steps = [28, 20, 14, 10, 7, 4, 2];
      const minimumCandidateCount = Math.max(zone.members.length * 16, 160);
      for (const step of steps) {
        result.length = 0;
        for (let y = bounds.minY + step / 2; y <= bounds.maxY - step / 2; y += step) {
          for (let x = bounds.minX + step / 2; x <= bounds.maxX - step / 2; x += step) {
            if (![...selected].every(name => roundedRectangleDistance(rectangles[name], x, y) <= -ODDIL_FIELD_NODE_CLEARANCE)) continue;
            result.push({x, y, score: (x - centre.x) ** 2 + (y - centre.y) ** 2});
          }
        }
        if (result.length >= minimumCandidateCount) break;
      }
      return result.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x);
    }
    zones.filter(zone => !zone.valid).forEach(zone => {
      const remaining = zone.members.filter(person => !targets.has(person.id));
      const widestLabel = d3.max(remaining, person => estimatedPersonLabelWidth(person)) || 48;
      const horizontalSpacing = denseOddilLayout ? 30 : Math.max(72, Math.min(190, widestLabel + 22));
      const verticalSpacing = denseOddilLayout ? 30 : 44;
      const candidates = assignedCandidates(zone);
      const chosen = structuredCandidatePoints(candidates, remaining, horizontalSpacing, verticalSpacing, repairOccupied);
      const expected = new Set(zone.names);
      remaining.forEach((person, index) => {
        const candidate = chosen[index];
        if (!candidate) return;
        targets.set(person.id, [candidate.x, candidate.y]);
        fieldNames.forEach(name => {
          if (expected.has(name) || roundedRectangleDistance(rectangles[name], candidate.x, candidate.y) > 0) return;
          fieldByName.get(name).exclusions.push({
            x: candidate.x,
            y: candidate.y - (denseOddilLayout ? 0 : 8),
            halfWidth: denseOddilLayout ? 26 : estimatedPersonLabelWidth(person) / 2 + 13,
            halfHeight: denseOddilLayout ? 26 : 28,
            radius: denseOddilLayout ? 26 : 28
          });
        });
      });
      zone.valid = zone.members.every(person => targets.has(person.id));
    });
  }

  // Hard visibility invariant for Oddily: filters may remove people before
  // layout, but geometry may never remove anyone who remains. If the regular
  // solver and intersection repair still cannot place a populated signature,
  // create a deterministic shared bay, expand only its participating fields,
  // and cut unrelated fields away from those people.
  if (fieldDimension === "oddil" && zones.some(zone => !zone.valid)) {
    const occupied = [...targets.entries()].map(([personId, point]) => ({
      personId,
      x: point[0],
      y: point[1],
      halfWidth: 12,
      halfHeight: 12
    }));
    const spacing = 34;
    zones.filter(zone => !zone.valid).forEach((zone, zoneIndex) => {
      const missing = zone.members.filter(person => !targets.has(person.id));
      if (!missing.length) {
        zone.valid = true;
        return;
      }
      const involved = zone.names.map(name => rectangles[name]).filter(Boolean);
      const base = {
        x: d3.mean(involved, rectangle => rectangle.x) ?? centerX,
        y: d3.mean(involved, rectangle => rectangle.y) ?? centerY
      };
      const columns = Math.max(1, Math.ceil(Math.sqrt(missing.length * 1.25)));
      const rows = Math.ceil(missing.length / columns);
      const pointsAt = (x, y) => missing.map((person, index) => {
        const row = Math.floor(index / columns);
        const itemsInRow = Math.min(columns, missing.length - row * columns);
        const column = index % columns;
        return {
          person,
          x: x + (column - (itemsInRow - 1) / 2) * spacing,
          y: y + (row - (rows - 1) / 2) * spacing
        };
      });
      let chosen = null;
      for (let attempt = 0; attempt < 320 && !chosen; attempt += 1) {
        const radius = Math.sqrt(attempt) * Math.max(42, Math.max(columns, rows) * 8);
        const angle = attempt * 2.399963229728653 + zoneIndex * .71;
        const candidates = pointsAt(base.x + Math.cos(angle) * radius, base.y + Math.sin(angle) * radius);
        const clear = candidates.every(candidate => occupied.every(other =>
          Math.abs(candidate.x - other.x) >= 27 || Math.abs(candidate.y - other.y) >= 30
        ));
        if (clear) chosen = candidates;
      }
      chosen ||= pointsAt(base.x + zoneIndex * (columns * spacing + 80), base.y + zoneIndex * 48);
      chosen.forEach(candidate => {
        targets.set(candidate.person.id, [candidate.x, candidate.y]);
        occupied.push({personId: candidate.person.id, x: candidate.x, y: candidate.y, halfWidth: 12, halfHeight: 12});
        zone.names.forEach(name => {
          const rectangle = rectangles[name];
          if (!rectangle) return;
          rectangle.halfWidth = Math.max(rectangle.halfWidth, Math.abs(candidate.x - rectangle.x) + ODDIL_FIELD_NODE_CLEARANCE + rectangle.radius);
          rectangle.halfHeight = Math.max(rectangle.halfHeight, Math.abs(candidate.y - rectangle.y) + ODDIL_FIELD_NODE_CLEARANCE + rectangle.radius);
        });
      });
      zone.valid = zone.members.every(person => targets.has(person.id));
    });

    // Expanding a required intersection can cover people who do not belong to
    // that field. Preserve exact set membership with a hit-testing clearance.
    fields.forEach(field => {
      targets.forEach((point, personId) => {
        if (field.members.has(personId)) return;
        if (roundedRectangleDistance(field.rectangle, point[0], point[1]) >= ODDIL_FIELD_NODE_CLEARANCE) return;
        if (field.exclusions.some(hole => roundedRectangleDistance(hole, point[0], point[1]) <= 0)) return;
        field.exclusions.push({x: point[0], y: point[1], halfWidth: 30, halfHeight: 30, radius: 30});
      });
    });
  }
  syncFieldGeometry();

  const regions = zones.filter(zone => zone.valid).map(zone => ({
    signature: zone.signature,
    names: zone.names,
    members: new Set(zone.members.map(person => person.id)),
    count: zone.members.length,
    fieldEntries: zone.names.map(name => fieldByName.get(name)).filter(Boolean)
  }));
  return {fields, regions, targets};
}

const FILTER_ATTRIBUTES = [
  ["name", "Jméno"], ["nickname", "Přezdívka"], ["role", "Role"],
  ["birth_date", "Datum narození"], ["age", "Věk (vypočtený)"],
  ["category", "Kategorie"], ["registration_category", "Registrační kategorie"], ["city", "Město"],
  ["email", "E-mail"], ["tags", "Štítky"], ["unit", "Jednotka"], ["notes", "Poznámky"]
];

const FILTER_OPERATORS = [
  ["contains", "obsahuje"], ["equals", "je přesně"], ["notcontains", "neobsahuje"],
  ["gte", "je alespoň"], ["lte", "je nejvýše"], ["empty", "není vyplněno"]
];

const COLOR_MODES = [
  ["category", "Podle kategorie"],
  ["tag", "Podle štítku"],
  ["group", "Podle skupiny"],
  ["filter", "Podle atributu"]
];

const COLOR_MODE_HINTS = {
  category: "Použije uloženou barvu kategorie každého člověka.",
  tag: "Použije stabilní barvu prvního štítku v abecedním pořadí.",
  group: "Použije barvu primární jednotky člověka.",
  filter: "Vyberte atribut, podmínku a barvu. První odpovídající pravidlo vyhrává."
};

function normalizedValue(value) {
  return String(value ?? "").trim().toLocaleLowerCase("cs");
}

function valueMatches(source, query, operator = "contains") {
  const values = Array.isArray(source) ? source : [source];
  const needle = normalizedValue(query);
  if (operator === "empty") return values.every(value => !normalizedValue(value));
  if (!needle) return true;
  if (operator === "gte" || operator === "lte") {
    const expected = Number(query);
    return Number.isFinite(expected) && values.some(value => {
      const actual = Number(value);
      return Number.isFinite(actual) && (operator === "gte" ? actual >= expected : actual <= expected);
    });
  }
  if (operator === "equals") return values.some(value => normalizedValue(value) === needle);
  if (operator === "notcontains") return values.every(value => !normalizedValue(value).includes(needle));
  return values.some(value => normalizedValue(value).includes(needle));
}

function personAttribute(person, field) {
  if (field === "tags") return person.tagsArray || [];
  if (field === "unit") return person.unitNames || [];
  return person[field] ?? "";
}

function personMatchesRule(person, rule) {
  return valueMatches(personAttribute(person, rule.field), rule.value, rule.operator);
}

const QUERY_FIELD_ALIASES = {
  name: "name", jmeno: "name",
  nickname: "nickname", prezdivka: "nickname",
  role: "role",
  birth_date: "birth_date", datum_narozeni: "birth_date", narozeni: "birth_date",
  age: "age", vek: "age",
  category: "category", kategorie: "category",
  registration_category: "registration_category", registrace: "registration_category",
  city: "city", mesto: "city",
  email: "email", mail: "email",
  tag: "tags", tags: "tags", stitek: "tags", stitky: "tags",
  unit: "unit", jednotka: "unit", jednotky: "unit",
  notes: "notes", poznamka: "notes", poznamky: "notes"
};

function normalizedFilterKey(value) {
  return normalizedValue(value).normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function graphQueryTokens(query) {
  const tokens = [];
  let buffer = "";
  let quoted = false;
  let bracketDepth = 0;
  for (const character of String(query || "").trim()) {
    if (character === '"') quoted = !quoted;
    if (!quoted && character === "[") bracketDepth += 1;
    if (!quoted && character === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (/\s/.test(character) && !quoted && !bracketDepth) {
      if (buffer) tokens.push(buffer);
      buffer = "";
    } else buffer += character;
  }
  if (buffer) tokens.push(buffer);
  return tokens;
}

function unwrapGraphQueryValue(value) {
  let result = String(value || "").trim();
  if (result.startsWith("(") && result.endsWith(")")) result = result.slice(1, -1).trim();
  if (result.startsWith('"') && result.endsWith('"')) result = result.slice(1, -1).replace(/\\"/g, '"');
  return result;
}

function graphQueryTermMatches(person, rawTerm) {
  let term = String(rawTerm || "").trim();
  if (!term) return true;
  let negate = false;
  if (term.startsWith("-") && term.length > 1) {
    negate = true;
    term = term.slice(1);
  }
  if (term.startsWith("[") && term.endsWith("]")) term = term.slice(1, -1).trim();
  const separator = term.indexOf(":");
  const possibleKey = separator > 0 ? normalizedFilterKey(term.slice(0, separator)) : "";
  const field = QUERY_FIELD_ALIASES[possibleKey];
  let query = unwrapGraphQueryValue(field ? term.slice(separator + 1) : term);
  let matches;
  if (field) {
    const source = personAttribute(person, field);
    if (normalizedFilterKey(query) === "null") matches = valueMatches(source, "", "empty");
    else {
      const comparison = query.match(/^(>=|<=|>|<|=)\s*(.+)$/);
      if (comparison && field === "age") {
        const actual = Number(Array.isArray(source) ? source[0] : source);
        const expected = Number(comparison[2]);
        matches = Number.isFinite(actual) && Number.isFinite(expected) && ({">": actual > expected, ">=": actual >= expected, "<": actual < expected, "<=": actual <= expected, "=": actual === expected})[comparison[1]];
      } else {
        if (field === "tags") query = query.replace(/^#/, "");
        matches = valueMatches(source, query, "contains");
      }
    }
  } else {
    matches = FILTER_ATTRIBUTES.some(([attribute]) => valueMatches(personAttribute(person, attribute), query, "contains"));
  }
  return negate ? !matches : matches;
}

function personMatchesGraphQuery(person, query) {
  const clauses = [[]];
  graphQueryTokens(query).forEach(token => {
    if (token.toLocaleUpperCase("cs") === "OR") clauses.push([]);
    else clauses[clauses.length - 1].push(token);
  });
  return clauses.some(clause => clause.length && clause.every(term => graphQueryTermMatches(person, term)));
}

function descendantUnitIds(rootId, includeDescendants = true) {
  const root = +rootId;
  if (!root || !teams.some(team => team.id === root)) return new Set();
  const included = new Set([root]);
  if (!includeDescendants) return included;
  let changed = true;
  while (changed) {
    changed = false;
    teams.forEach(team => {
      if (team.parent_id != null && included.has(team.parent_id) && !included.has(team.id)) {
        included.add(team.id);
        changed = true;
      }
    });
  }
  return included;
}

function activeFilterRules() {
  return graphFilters.rules.filter(rule => rule.operator === "empty" || String(rule.value ?? "").trim());
}

function computeGraphSelection() {
  const unitIds = descendantUnitIds(graphFilters.unitId, graphFilters.includeDescendants);
  const hasUnitFilter = unitIds.size > 0;
  const rules = activeFilterRules();
  graphTeams = hasUnitFilter ? teams.filter(team => unitIds.has(team.id)) : [...teams];
  let selectedPeople = people.filter(person => {
    const personUnits = new Set([person.org_team_id, ...(person.unitIds || [])].filter(Boolean).map(Number));
    if (hasUnitFilter && ![...personUnits].some(id => unitIds.has(id))) return false;
    if (String(graphFilters.query || "").trim() && !personMatchesGraphQuery(person, graphFilters.query)) return false;
    if (rules.length) {
      const matches = rules.map(rule => personMatchesRule(person, rule));
      if (!(graphFilters.match === "any" ? matches.some(Boolean) : matches.every(Boolean))) return false;
    }
    return true;
  });
  if (!graphFilters.showOrphans) {
    const visiblePeople = new Set(selectedPeople.map(person => person.id));
    const visibleTeams = new Set(graphTeams.map(team => team.id));
    const linkedPeople = new Set();
    if (connectionFilters.assignment) selectedPeople.forEach(person => {
      if (visibleTeams.has(+person.org_team_id)) linkedPeople.add(person.id);
    });
    if (connectionFilters.membership) selectedPeople.forEach(person => {
      if ((person.unitIds || []).some(id => visibleTeams.has(+id))) linkedPeople.add(person.id);
    });
    if (connectionFilters.relationship) relationships.forEach(link => {
      if (!hiddenRelationshipTypes.includes(link.type || "bez typu") && visiblePeople.has(link.source) && visiblePeople.has(link.target)) {
        linkedPeople.add(link.source);
        linkedPeople.add(link.target);
      }
    });
    selectedPeople = selectedPeople.filter(person => linkedPeople.has(person.id));
  }
  graphPeople = selectedPeople;
}

function colorRuleMatchesPerson(person, rule) {
  return (rule.operator === "empty" || String(rule.value ?? "").trim())
    && valueMatches(personAttribute(person, rule.field), rule.value, rule.operator || "equals");
}

function personGraphColor(person, useCategory = true) {
  return colorRules.find(rule => colorRuleMatchesPerson(person, rule))?.color || (useCategory ? person.color : "#72766f") || "#72766f";
}

function stableAttributeColor(value) {
  const text = String(value || "").trim().toLocaleLowerCase("cs");
  if (!text) return "#8c9089";
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 58% 44%)`;
}

function selectedPersonColor(person) {
  if (graphColorMode === "category") return person.color || stableAttributeColor(person.category);
  if (graphColorMode === "tag") {
    const tag = [...(person.tagsArray || [])].sort((a, b) => a.localeCompare(b, "cs"))[0];
    return stableAttributeColor(tag);
  }
  if (graphColorMode === "filter") return colorRules.find(rule => colorRuleMatchesPerson(person, rule))?.color || "#8c9089";
  return unitClusterColor(teamById(graphHomeTeamId(person)));
}

function teamGraphColor(team) {
  return colorRules.find(rule => rule.field === "unit" && colorRuleMatchesPerson({unitNames: [team.name]}, rule))?.color || "";
}

function unitClusterColor(team) {
  if (!team) return "#72766f";
  const custom = teamGraphColor(team);
  if (custom) return custom;
  const hue = Math.round((team.id * 137.508 + (team.parent_id || 0) * 19) % 360);
  return `hsl(${hue} 58% 44%)`;
}

function structureLinkColor(link) {
  if (link.kind === "relationship") return "#72766f";
  const endpoint = link.kind === "hierarchy" ? link.target : link.source;
  const uid = typeof endpoint === "string" ? endpoint : endpoint?.uid;
  const teamId = Number(String(uid || "").replace("team-", ""));
  return unitClusterColor(teamById(teamId));
}

function updateGraphFilterMeta() {
  const peopleCount = document.querySelector("#people-count");
  const teamCount = document.querySelector("#team-count");
  if (peopleCount) peopleCount.textContent = graphPeople.length === people.length ? people.length : `${graphPeople.length} / ${people.length}`;
  const visibleTeamCount = graphTeams.filter(team => team.level > 0).length;
  const totalTeamCount = teams.filter(team => team.level > 0).length;
  if (teamCount) teamCount.textContent = visibleTeamCount === totalTeamCount ? totalTeamCount : `${visibleTeamCount} / ${totalTeamCount}`;
  const count = activeFilterRules().length + (graphFilters.unitId ? 1 : 0)
    + (String(graphFilters.query || "").trim() ? 1 : 0)
    + (graphFilters.showOrphans ? 0 : 1)
    + (graphColorMode === "group" ? 0 : 1)
    + (graphColorMode === "filter" ? colorRules.filter(rule => rule.operator === "empty" || String(rule.value ?? "").trim()).length : 0)
    + Object.values(connectionFilters).filter(value => !value).length + hiddenRelationshipTypes.length
    + (displayOptions.tags ? 1 : 0) + (displayOptions.categories ? 0 : 1) + (displayOptions.titles ? 0 : 1);
  const badge = document.querySelector("#filter-count");
  if (badge) {
    badge.textContent = count;
    badge.hidden = !count;
  }
}

function syncConnectionDisplayOptions() {
  displayOptions.primary = connectionFilters.hierarchy || connectionFilters.assignment || connectionFilters.membership;
  displayOptions.secondary = connectionFilters.relationship;
}

function unitFilterOptions() {
  const childrenByParent = d3.group(teams.filter(team => team.parent_id != null), team => team.parent_id);
  const ordered = [];
  function append(team, depth = 0) {
    if (!team || ordered.some(item => item.team.id === team.id)) return;
    ordered.push({team, depth});
    (childrenByParent.get(team.id) || []).forEach(child => append(child, depth + 1));
  }
  teams.filter(team => team.parent_id == null).forEach(team => append(team));
  teams.forEach(team => append(team, Math.max(0, team.level)));
  return `<option value="">Všechny jednotky</option>` + ordered.map(({team, depth}) =>
    `<option value="${team.id}"${String(team.id) === String(graphFilters.unitId) ? " selected" : ""}>${escapeHtml("· ".repeat(depth) + team.name)}</option>`
  ).join("");
}

function selectOptions(options, selected) {
  return options.map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
}

const FILTER_QUERY_PREFIXES = {
  name: "jméno", nickname: "přezdívka", role: "role", birth_date: "narození", age: "věk",
  category: "kategorie", registration_category: "registrace", city: "město", email: "email",
  tags: "štítek", unit: "jednotka", notes: "poznámka"
};

function filterAttributeValues(field) {
  const values = [];
  if (field === "category") values.push(...categoriesData.map(item => item.name));
  if (field === "tags") values.push(...tagsData.map(item => item.name));
  if (field === "unit") values.push(...teams.map(item => item.name));
  people.forEach(person => {
    const source = personAttribute(person, field);
    values.push(...(Array.isArray(source) ? source : [source]));
  });
  const unique = new Map();
  values.forEach(value => {
    const text = String(value ?? "").trim();
    const key = normalizedValue(text);
    if (text && !unique.has(key)) unique.set(key, text);
  });
  const result = [...unique.values()];
  return field === "age"
    ? result.sort((a, b) => Number(a) - Number(b))
    : result.sort((a, b) => a.localeCompare(b, "cs", {numeric: true, sensitivity: "base"}));
}

function filterQueryTokenRange(input) {
  const text = input.value || "";
  const cursor = input.selectionStart ?? text.length;
  let start = 0;
  let quoted = false;
  for (let index = 0; index < cursor; index += 1) {
    if (text[index] === '"') quoted = !quoted;
    if (/\s/.test(text[index]) && !quoted) start = index + 1;
  }
  let end = cursor;
  for (let index = cursor; index < text.length; index += 1) {
    if (text[index] === '"') quoted = !quoted;
    if (/\s/.test(text[index]) && !quoted) break;
    end = index + 1;
  }
  return {start, end, raw: text.slice(start, cursor)};
}

function filterQueryValue(value) {
  const text = String(value ?? "");
  return /\s|[\[\]"]/u.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
}

function queryFilterSuggestions(input) {
  const range = filterQueryTokenRange(input);
  const negative = range.raw.startsWith("-");
  const body = negative ? range.raw.slice(1) : range.raw;
  const separator = body.indexOf(":");
  const prefix = negative ? "-" : "";
  const fields = FILTER_ATTRIBUTES.map(([field, label]) => ({field, label, prefix: FILTER_QUERY_PREFIXES[field] || field}));
  const items = [];
  if (separator < 0) {
    const needle = normalizedFilterKey(body);
    if (range.start > 0 && !negative && (!needle || "or".includes(needle))) {
      items.push({label: "OR", meta: "Stačí jedna z možností", insert: "OR ", ...range});
    }
    fields.filter(item => !needle || normalizedFilterKey(`${item.prefix} ${item.label}`).includes(needle)).forEach(item => {
      items.push({label: `${item.label}:`, meta: "Atribut", insert: `${prefix}${item.prefix}:`, ...range});
    });
    if (needle) fields.forEach(item => {
      filterAttributeValues(item.field).forEach(value => {
        if (items.length >= 40 || !normalizedFilterKey(value).includes(needle)) return;
        items.push({label: value, meta: item.label, insert: `${prefix}${item.prefix}:${filterQueryValue(value)}`, ...range});
      });
    });
    return items.slice(0, 40);
  }
  const enteredKey = body.slice(0, separator);
  const field = QUERY_FIELD_ALIASES[normalizedFilterKey(enteredKey)];
  if (!field) {
    const needle = normalizedFilterKey(enteredKey);
    return fields.filter(item => normalizedFilterKey(`${item.prefix} ${item.label}`).includes(needle)).map(item => ({
      label: `${item.label}:`, meta: "Atribut", insert: `${prefix}${item.prefix}:`, ...range
    }));
  }
  const descriptor = fields.find(item => item.field === field);
  const typedValue = body.slice(separator + 1).replace(/^"/, "");
  const comparison = field === "age" ? (typedValue.match(/^(>=|<=|>|<|=)/)?.[1] || "") : "";
  const needle = normalizedFilterKey(typedValue.slice(comparison.length));
  if (!comparison && (!needle || "null".includes(needle))) {
    items.push({label: "null", meta: `${descriptor?.label || field} není vyplněno`, insert: `${prefix}${descriptor?.prefix || enteredKey}:null`, ...range});
  }
  filterAttributeValues(field).forEach(value => {
    if (needle && !normalizedFilterKey(value).includes(needle)) return;
    items.push({
      label: value,
      meta: descriptor?.label || field,
      insert: `${prefix}${descriptor?.prefix || enteredKey}:${comparison}${filterQueryValue(value)}`,
      ...range
    });
  });
  if (field === "age" && !typedValue) {
    [[">=", "alespoň"], ["<=", "nejvýše"], [">", "více než"], ["<", "méně než"]].forEach(([operator, label]) => {
      items.unshift({label: `${operator}…`, meta: `Věk · ${label}`, insert: `${prefix}${descriptor.prefix}:${operator}`, ...range});
    });
  }
  return items;
}

function valueFilterSuggestions(input, field) {
  const needle = normalizedFilterKey(input.value);
  const label = FILTER_ATTRIBUTES.find(([key]) => key === field)?.[1] || field;
  return filterAttributeValues(field)
    .filter(value => !needle || normalizedFilterKey(value).includes(needle))
    .map(value => ({label: value, meta: label, insert: value}));
}

function hideFilterSuggestions() {
  document.querySelectorAll("[data-filter-suggestion-list]").forEach(list => {
    list.hidden = true;
    list.innerHTML = "";
  });
  filterSuggestionInput?.setAttribute("aria-expanded", "false");
  filterSuggestionItems = [];
  filterSuggestionIndex = -1;
  filterSuggestionInput = null;
}

function renderFilterSuggestions(input) {
  const list = input.closest(".filter-query, .filter-value-wrap")?.querySelector("[data-filter-suggestion-list]");
  if (!list) return;
  document.querySelectorAll("[data-filter-suggestion-list]").forEach(other => { if (other !== list) other.hidden = true; });
  let items = [];
  if (input.matches("[data-filter-query]")) items = queryFilterSuggestions(input);
  else if (input.matches("[data-filter-rule-value]")) items = valueFilterSuggestions(input, graphFilters.rules[+input.dataset.filterRuleValue]?.field);
  else if (input.matches("[data-color-rule-value]")) items = valueFilterSuggestions(input, colorRules[+input.dataset.colorRuleValue]?.field);
  filterSuggestionInput = input;
  filterSuggestionItems = items;
  filterSuggestionIndex = -1;
  list.innerHTML = items.map((item, index) => `<button type="button" role="option" data-filter-suggestion="${index}"><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.meta)}</small></button>`).join("");
  list.hidden = !items.length;
  input.setAttribute("aria-expanded", String(Boolean(items.length)));
}

function setFilterSuggestionIndex(index) {
  if (!filterSuggestionItems.length) return;
  filterSuggestionIndex = (index + filterSuggestionItems.length) % filterSuggestionItems.length;
  const list = filterSuggestionInput?.closest(".filter-query, .filter-value-wrap")?.querySelector("[data-filter-suggestion-list]");
  list?.querySelectorAll("[data-filter-suggestion]").forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === filterSuggestionIndex));
  list?.querySelector(`[data-filter-suggestion="${filterSuggestionIndex}"]`)?.scrollIntoView({block: "nearest"});
}

function applyFilterSuggestion(index) {
  const input = filterSuggestionInput;
  const item = filterSuggestionItems[index];
  if (!input || !item) return;
  let cursor;
  if (input.matches("[data-filter-query]")) {
    input.value = `${input.value.slice(0, item.start)}${item.insert}${input.value.slice(item.end)}`;
    cursor = item.start + item.insert.length;
  } else {
    input.value = item.insert;
    cursor = input.value.length;
  }
  input.dispatchEvent(new Event("input", {bubbles: true}));
  hideFilterSuggestions();
  input.focus();
  input.setSelectionRange?.(cursor, cursor);
}

function renderGraphFilterPanel() {
  const panel = document.querySelector("#filter-panel");
  if (!panel) return;
  const previousScrollTop = panel.scrollTop;
  hideFilterSuggestions();
  panel.innerHTML = `
    <div class="filter-head"><div><span class="eyebrow">Graf</span><strong>Filtry, vrstvy a barvy</strong></div><button class="text-button" type="button" data-filter-action="reset">Výchozí</button></div>
    <section class="filter-section">
      <div class="filter-section-head"><strong>Výřez struktury</strong><span>místní graf</span></div>
      <label class="filter-field"><span>Zobrazit pouze</span><select data-filter-unit>${unitFilterOptions()}</select></label>
      <label class="filter-checkbox filter-descendants"><input type="checkbox" data-filter-descendants${graphFilters.includeDescendants ? " checked" : ""}${graphFilters.unitId ? "" : " disabled"}><span>Zobrazit potomky</span></label>
    </section>
    <section class="filter-section">
      <div class="filter-section-head"><strong>Filtrační dotaz</strong><span>jako v Obsidianu</span></div>
      <div class="filter-query"><span class="filter-query-icon">${icons.search}</span><input data-filter-query value="${escapeHtml(graphFilters.query || "")}" placeholder="Začněte psát atribut nebo hodnotu…" aria-label="Filtrační dotaz" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="filter-query-suggestions"><span class="filter-suggestion-hint">↓ návrhy</span><div class="filter-suggestion-list" id="filter-query-suggestions" data-filter-suggestion-list role="listbox" hidden></div></div>
      <label class="filter-checkbox"><input type="checkbox" data-filter-orphans${graphFilters.showOrphans ? " checked" : ""}><span>Zobrazit lidi bez spojení</span></label>
    </section>
    <section class="filter-section">
      <div class="filter-section-head"><strong>Vrstvy mapy</strong><span>viditelné prvky</span></div>
      <div class="connection-filter-grid display-filter-grid">
        <label><input type="checkbox" data-display-option="tags"${displayOptions.tags ? " checked" : ""}><span>Štítky u lidí</span></label>
        <label><input type="checkbox" data-display-option="categories"${displayOptions.categories ? " checked" : ""}><span>Pole a kategorie</span></label>
        <label><input type="checkbox" data-display-option="titles"${displayOptions.titles ? " checked" : ""}><span>Názvy jednotek</span></label>
      </div>
    </section>
    <section class="filter-section">
      <div class="filter-section-head"><strong>Spojení</strong><span>nezávislé vrstvy</span></div>
      <div class="connection-filter-grid">
        ${[["hierarchy", "Hierarchie jednotek"], ["assignment", "Primární přiřazení"], ["membership", "Další jednotky"], ["relationship", "Vztahy lidí"]].map(([key, label]) => `<label><input type="checkbox" data-connection-filter="${key}"${connectionFilters[key] ? " checked" : ""}><span>${label}</span></label>`).join("")}
      </div>
      ${[...new Set(relationships.map(link => link.type || "bez typu"))].length ? `<div class="relationship-type-filter"><span>Typy vztahů</span><div>${[...new Set(relationships.map(link => link.type || "bez typu"))].sort((a, b) => a.localeCompare(b, "cs")).map(type => `<label><input type="checkbox" data-relationship-type="${escapeHtml(type)}"${hiddenRelationshipTypes.includes(type) ? "" : " checked"}><span>${escapeHtml(type)}</span></label>`).join("")}</div></div>` : ""}
    </section>
    <section class="filter-section">
      <div class="filter-section-head"><strong>Atributy lidí</strong><select data-filter-match><option value="all"${graphFilters.match === "all" ? " selected" : ""}>splnit vše</option><option value="any"${graphFilters.match === "any" ? " selected" : ""}>splnit alespoň jeden</option></select></div>
      <div class="filter-rule-list">
        ${graphFilters.rules.length ? graphFilters.rules.map((rule, index) => `<div class="filter-rule">
          <select data-filter-rule-field="${index}">${selectOptions(FILTER_ATTRIBUTES, rule.field)}</select>
          <select data-filter-rule-operator="${index}">${selectOptions(FILTER_OPERATORS, rule.operator)}</select>
          <span class="filter-value-wrap"><input data-filter-rule-value="${index}" value="${escapeHtml(rule.value || "")}" placeholder="hodnota" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"${rule.operator === "empty" ? " disabled" : ""}><div class="filter-suggestion-list" data-filter-suggestion-list role="listbox" hidden></div></span>
          <button type="button" class="row-icon-button" data-filter-remove="${index}" aria-label="Odebrat filtr">×</button>
        </div>`).join("") : '<p class="filter-empty">Zatím se zobrazují lidé se všemi atributy.</p>'}
      </div>
      <button class="filter-add-button" type="button" data-filter-action="add-rule">+ Přidat podmínku</button>
    </section>
    <section class="filter-section color-filter-section">
      <div class="filter-section-head"><strong>Barevné rozlišení</strong><span>barvy uzlů</span></div>
      <label class="filter-field"><span>Barvit podle</span><select data-color-mode>${selectOptions(COLOR_MODES, graphColorMode)}</select></label>
      <p class="color-mode-note">${COLOR_MODE_HINTS[graphColorMode]}</p>
      ${graphColorMode === "filter" ? `<div class="color-rule-list">
        ${colorRules.length ? colorRules.map((rule, index) => `<div class="color-rule">
          <input type="color" value="${escapeHtml(rule.color || "#6ba29b")}" data-color-rule-color="${index}" aria-label="Barva skupiny">
          <select data-color-rule-field="${index}" aria-label="Atribut pro barvu">${selectOptions(FILTER_ATTRIBUTES, rule.field)}</select>
          <select data-color-rule-operator="${index}" aria-label="Podmínka pro barvu">${selectOptions(FILTER_OPERATORS, rule.operator || "equals")}</select>
          <span class="filter-value-wrap"><input data-color-rule-value="${index}" value="${escapeHtml(rule.value || "")}" placeholder="hodnota" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"${rule.operator === "empty" ? " disabled" : ""}><div class="filter-suggestion-list" data-filter-suggestion-list role="listbox" hidden></div></span>
          <span class="color-rule-order"><button type="button" data-color-move="${index}" data-direction="-1" aria-label="Posunout nahoru">↑</button><button type="button" data-color-move="${index}" data-direction="1" aria-label="Posunout dolů">↓</button></span>
          <button type="button" class="row-icon-button" data-color-remove="${index}" aria-label="Odebrat barvu">×</button>
        </div>`).join("") : '<p class="filter-empty">Přidejte pravidlo a obarvěte odpovídající lidi. Bez shody zůstanou neutrální.</p>'}
      </div>
      <button class="filter-add-button" type="button" data-filter-action="add-color">+ Přidat barevné pravidlo</button>` : ""}
    </section>`;
  panel.scrollTop = previousScrollTop;
  updateGraphFilterMeta();
}

function scheduleGraphFilterUpdate() {
  clearTimeout(graphFilterFrame);
  graphFilterFrame = setTimeout(() => {
    computeGraphSelection();
    updateGraphFilterMeta();
    renderGraphV2();
    clearTimeout(graphFitTimer);
    graphFitTimer = setTimeout(() => fitMapToStructure(true), 700);
    scheduleWorkspaceState();
  }, 120);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
}

function personName(person) { return person.name?.trim() || "Bez jména"; }
function ageLabel(age) { return Number.isFinite(age) ? `${age} let` : "Neuvedeno"; }

function initials(name) {
  return name.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
}

function categoryPositions(width, height) {
  const names = [...new Set(people.map(person => person.category))];
  const anchors = [[.5,.2],[.27,.43],[.73,.43],[.36,.74],[.67,.74]];
  return Object.fromEntries(names.map((name, index) => [name, [width * anchors[index % anchors.length][0], height * anchors[index % anchors.length][1]]]));
}

function initGraph() {
  svg = d3.select("#map");
  rootLayer = svg.append("g").attr("class", "root-layer");
  zoneLayer = rootLayer.append("g").attr("class", "zones");
  axisLayer = rootLayer.append("g").attr("class", "axes");
  linkLayer = rootLayer.append("g").attr("class", "links");
  nodeLayer = rootLayer.append("g").attr("class", "nodes");
  svg.call(d3.zoom().scaleExtent([.45, 2.2]).on("zoom", e => rootLayer.attr("transform", e.transform)));
  renderGraph();
  new ResizeObserver(() => updateMode(currentMode, false)).observe(document.querySelector("#map-view"));
}

function renderGraph() {
  if (simulation) simulation.stop();
  const width = document.querySelector("#map-view").clientWidth || 1000;
  const height = document.querySelector("#map-view").clientHeight || 650;
  const oldPositions = new Map();
  nodeLayer?.selectAll("g.person-node").each(d => oldPositions.set(d.id, [d.x, d.y]));
  people.forEach((d, i) => {
    const old = oldPositions.get(d.id);
    d.x = old?.[0] ?? width / 2 + Math.cos(i) * 80;
    d.y = old?.[1] ?? height / 2 + Math.sin(i) * 80;
    d.expanded = false;
  });
  const links = relationships.map(d => ({...d}));
  linkLayer.selectAll("line").data(links).join("line").attr("class", "link");
  const nodes = nodeLayer.selectAll("g.person-node").data(people, d => d.id).join(enter => {
    const g = enter.append("g").attr("class", "person-node");
    g.append("foreignObject").attr("width", 178).attr("height", 150).html(d => nodeHtml(d));
    return g;
  });
  nodes.style("--node-color", d => d.color)
    .on("click", function(event, d) {
      if (event.target.closest(".node-edit")) return;
      d.expanded = !d.expanded;
      d3.select(this).classed("expanded", d.expanded);
      simulation.force("collide", d3.forceCollide().radius(p => p.expanded ? 106 : 82).iterations(2)).alpha(.35).restart();
    })
    .call(graphDragBehavior());
  nodes.selectAll(".node-edit").on("click", (event, d) => { event.stopPropagation(); openPersonModal(d.id); });
  simulation = d3.forceSimulation(people)
    .force("link", d3.forceLink(links).id(d => d.id).distance(210).strength(.18))
    .force("charge", d3.forceManyBody().strength(-480))
    .force("collide", d3.forceCollide().radius(82).iterations(2))
    .force("x", d3.forceX(width / 2).strength(.045))
    .force("y", d3.forceY(height / 2).strength(.055))
    .on("tick", () => {
      linkLayer.selectAll("line").attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      nodeLayer.selectAll("g.person-node").attr("transform", d => `translate(${d.x - 89},${d.y - 31})`);
    });
  updateMode(currentMode, false);
  applySearch();
}

function nodeHtml(d) {
  const tags = d.tagsArray.slice(0,3).map(t => `<span class="node-tag">#${escapeHtml(t)}</span>`).join("");
  return `<div class="node-card" xmlns="http://www.w3.org/1999/xhtml">
    <div class="node-main"><div class="node-initials">${initials(d.name)}</div><div class="node-text"><div class="node-name">${escapeHtml(d.name)}</div><div class="node-role">${escapeHtml(d.role)}</div></div><div class="node-chevron">⌄</div></div>
    <div class="node-more"><div class="node-rule"></div><div class="node-facts"><div><b>${d.age} let</b>věk</div><div><b>${escapeHtml(d.city || "—")}</b>město</div><div><b>${escapeHtml(d.category)}</b>kategorie</div><div><b>${escapeHtml(d.team || "—")}</b>tým</div></div><div class="node-tags">${tags || '<span class="node-tag">bez štítků</span>'}</div></div>
  </div>`;
}

function updateMode(mode, animate = true) {
  if (!simulation) return;
  currentMode = mode;
  if (mode !== "field") {
    activeFieldRegions = [];
    activeFieldShapes = [];
    hideFieldSectionInfo();
  }
  syncPrimaryNavigation();
  const width = document.querySelector("#map-view").clientWidth || 1000;
  const height = document.querySelector("#map-view").clientHeight || 650;
  zoneLayer.selectAll("*").remove();
  axisLayer.selectAll("*").remove();
  if (mode === "network") {
    linkLayer.transition().duration(animate ? 400 : 0).style("opacity", 1);
    simulation.force("link").strength(.18);
    simulation.force("charge", d3.forceManyBody().strength(-480));
    simulation.force("x", d3.forceX(width / 2).strength(.045));
    simulation.force("y", d3.forceY(height / 2).strength(.055));
  } else if (mode === "category") {
    linkLayer.transition().duration(animate ? 400 : 0).style("opacity", .04);
    simulation.force("link").strength(0);
    simulation.force("charge", d3.forceManyBody().strength(-90));
    const positions = categoryPositions(width, height);
    const cats = Object.keys(CATEGORY_COLORS).map(name => ({name, x: positions[name][0], y: positions[name][1], color: CATEGORY_COLORS[name]}));
    const zone = zoneLayer.selectAll("g").data(cats).join("g").attr("class", "category-zone").attr("transform", d => `translate(${d.x},${d.y})`).style("opacity", 0);
    zone.append("ellipse").attr("rx", Math.min(150, width * .14)).attr("ry", 92).attr("stroke", d => d.color);
    zone.append("text").attr("text-anchor", "middle").attr("y", -105).text(d => d.name);
    zone.transition().duration(animate ? 600 : 0).style("opacity", 1);
    simulation.force("x", d3.forceX(d => positions[d.category]?.[0] ?? width/2).strength(.19));
    simulation.force("y", d3.forceY(d => positions[d.category]?.[1] ?? height/2).strength(.19));
  } else {
    linkLayer.transition().duration(animate ? 400 : 0).style("opacity", 0);
    simulation.force("link").strength(0);
    simulation.force("charge", d3.forceManyBody().strength(-75));
    const ages = people.map(d => d.age);
    const scale = d3.scaleLinear().domain([Math.floor((d3.min(ages)-2)/5)*5, Math.ceil((d3.max(ages)+2)/5)*5]).range([135, width - 90]);
    const axisY = Math.max(100, height - 70);
    axisLayer.append("g").attr("class", "age-axis").attr("transform", `translate(0,${axisY})`).call(d3.axisBottom(scale).ticks(Math.min(8, width/110)).tickFormat(d => `${d} let`));
    scale.ticks(8).forEach(t => axisLayer.append("line").attr("class", "age-guide").attr("x1", scale(t)).attr("x2", scale(t)).attr("y1", 115).attr("y2", axisY));
    simulation.force("x", d3.forceX(d => scale(d.age)).strength(.22));
    simulation.force("y", d3.forceY(d => height * .5 + ((d.id % 3)-1)*72).strength(.12));
  }
  simulation.alpha(animate ? .9 : .4).restart();
}

function estimatedTeamWidth(team) {
  if (Number.isFinite(team?.boxWidth)) return team.boxWidth;
  const base = team?.level === 0 ? 122 : team?.level === 1 ? 84 : 76;
  return Math.max(base, Math.min(team?.level === 0 ? 238 : team?.level === 1 ? 184 : 164, String(team?.name || "").length * 7 + 28));
}

function clusterSeedRadius(members = []) {
  const widestLabel = d3.max(members, person => estimatedPersonLabelWidth(person)) || 72;
  return Math.max(120, 76 + Math.sqrt(Math.max(1, members.length)) * 42 + widestLabel * .24);
}

function hierarchyLayoutModel() {
  const groups = d3.group(graphPeople, person => +(graphHomeTeamId(person) || 0));
  const byStableName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "cs") || a.id - b.id;
  const departments = graphTeams.filter(team => team.level === 1).sort(byStableName);
  const childTeams = graphTeams.filter(team => team.level === 2);
  const childrenFor = team => childTeams.filter(child => child.parent_id === team.id);
  const directPopulation = team => (groups.get(team.id) || []).length;
  const clusterRadius = team => {
    const members = groups.get(team.id) || [];
    return members.length
      ? clusterSeedRadius(members) + 54
      : Math.max(76, estimatedTeamWidth(team) / 2 + 28);
  };
  const childFootprint = team => clusterRadius(team) * 2 + (directPopulation(team) ? CLUSTER_CLEAR_GAP : 70);
  const childOrbitRadius = team => {
    const children = childrenFor(team);
    if (!children.length) return 0;
    const hasPopulatedChild = children.some(directPopulation);
    return Math.max(hasPopulatedChild ? 340 : 190, d3.sum(children, childFootprint) / (Math.PI * 2) * 1.1);
  };
  const departmentClusterRadius = team => {
    const children = childrenFor(team);
    if (!children.length) return clusterRadius(team);
    return childOrbitRadius(team) + (d3.max(children, clusterRadius) || 80);
  };
  const departmentFootprint = team => departmentClusterRadius(team) * 2 + DEPARTMENT_CLEAR_GAP;
  const departmentWeight = team => Math.max(360, departmentFootprint(team));
  const totalPeople = graphPeople.length;
  const largestGroupSize = d3.max(Array.from(groups.values()), members => members.length) || 1;
  const childrenByParent = d3.group(graphTeams.filter(team => team.parent_id != null), team => +team.parent_id);
  const populationCount = (team, visited = new Set()) => {
    if (!team || visited.has(team.id)) return 0;
    const nextVisited = new Set(visited).add(team.id);
    return (groups.get(team.id) || []).length
      + (childrenByParent.get(team.id) || []).reduce((sum, child) => sum + populationCount(child, nextVisited), 0);
  };
  const populationOffset = team => {
    const count = populationCount(team);
    const scale = Math.max(0, Math.sqrt(count) - 1);
    // Space for a crowded branch is created on the Středisko → oddíl edge.
    // The oddíl → družina edge deliberately stays compact below.
    return team.level === 1 ? Math.min(340, scale * 34) : Math.min(180, scale * 24);
  };
  const populationDistanceFactor = (team, siblings) => {
    const count = populationCount(team);
    const largest = d3.max(siblings, sibling => populationCount(sibling)) || 0;
    if (!count || !largest) return .48;
    return .6 + .4 * Math.sqrt(count / largest);
  };
  const oddil = Math.max(720, d3.sum(departments, departmentFootprint) / (Math.PI * 2) * 1.08);
  const druzina = Math.max(oddil + 370, childTeams.length * 68, 410 + Math.sqrt(Math.max(1, totalPeople)) * 25 + Math.sqrt(largestGroupSize) * 22);
  const largestCluster = d3.max(Array.from(groups.values()), clusterSeedRadius) || 160;
  return {groups, departments, childTeams, childrenFor, directPopulation, clusterRadius, childFootprint, childOrbitRadius, departmentClusterRadius, departmentFootprint, departmentWeight, populationCount, populationOffset, populationDistanceFactor, byStableName, oddil, druzina, people: druzina + largestCluster + 360};
}

function structureRadii() {
  const model = hierarchyLayoutModel();
  return {oddil: model.oddil, druzina: model.druzina, people: model.people};
}

function teamPositions(width, height) {
  const positions = new Map();
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const model = hierarchyLayoutModel();
  const selectedRoot = graphFilters.unitId ? graphTeams.find(team => team.id === +graphFilters.unitId) : null;
  const root = selectedRoot?.level > 0 ? selectedRoot : graphTeams.find(team => team.level === 0);
  if (root) positions.set(root.id, [centerX, centerY]);

  const departments = selectedRoot?.level > 0
    ? [selectedRoot]
    : model.departments;
  const weights = departments.map(model.departmentWeight);
  const totalWeight = d3.sum(weights) || departments.length || 1;
  let cursor = -Math.PI / 2;
  departments.forEach((department, departmentIndex) => {
    const span = Math.PI * 2 * weights[departmentIndex] / totalWeight;
    const departmentAngle = departments.length === 1 ? -Math.PI / 2 : cursor + span / 2;
    const localChildOrbit = model.childOrbitRadius(department);
    const departmentDistanceFactor = model.populationDistanceFactor(department, departments);
    const outerDepartmentRadius = Math.max(
      model.oddil + model.populationOffset(department),
      localChildOrbit ? localChildOrbit * 1.55 + 300 : model.oddil
    );
    const departmentRadius = Math.max(
      model.populationCount(department) ? 460 : 340,
      outerDepartmentRadius * departmentDistanceFactor,
      localChildOrbit ? localChildOrbit * 1.18 + 180 : 0
    );
    if (department !== root) positions.set(department.id, [
      centerX + Math.cos(departmentAngle) * departmentRadius,
      centerY + Math.sin(departmentAngle) * departmentRadius
    ]);
    const children = model.childrenFor(department).sort(model.byStableName);
    const childWeights = children.map(model.childFootprint);
    const totalChildWeight = d3.sum(childWeights) || 1;
    const childSpanTotal = Math.PI * 2;
    let childCursor = departmentAngle - Math.PI;
    children.forEach((team, childIndex) => {
      const childSpan = childSpanTotal * childWeights[childIndex] / totalChildWeight;
      const angle = childCursor + childSpan / 2;
      const parentPosition = positions.get(department.id) || [centerX, centerY];
      const parentRootDistance = Math.hypot(parentPosition[0] - centerX, parentPosition[1] - centerY);
      // Reserve a complete non-overlapping orbit for this oddíl's družiny.
      const compactBranchDistance = Math.max(340, localChildOrbit);
      const childDistanceFactor = model.populationDistanceFactor(team, children);
      const populationScaledDistance = compactBranchDistance * childDistanceFactor;
      const childLinkDistance = parentRootDistance > 1
        ? Math.max(model.populationCount(team) ? 210 : 145, Math.min(parentRootDistance * .68, populationScaledDistance))
        : Math.max(model.populationCount(team) ? 210 : 145, populationScaledDistance);
      positions.set(team.id, [
        parentPosition[0] + Math.cos(angle) * childLinkDistance,
        parentPosition[1] + Math.sin(angle) * childLinkDistance
      ]);
      childCursor += childSpan;
    });
    cursor += span;
  });

  graphTeams.filter(team => !positions.has(team.id)).sort(model.byStableName).forEach((team, index, remainder) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, remainder.length);
    const radius = team.level === 2 ? model.druzina + model.populationOffset(team) : team.level === 1 ? model.oddil + model.populationOffset(team) : 0;
    positions.set(team.id, [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]);
  });
  return positions;
}

function personOrbitTargets(width, height, layout) {
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const targets = new Map();
  const groups = d3.group(graphPeople, person => +(graphHomeTeamId(person) || 0));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  groups.forEach((members, teamId) => {
    const home = layout.get(teamId) || [centerX, centerY];
    const homeTeam = teamById(teamId);
    const parentHome = homeTeam?.parent_id != null ? layout.get(+homeTeam.parent_id) : null;
    const directionOrigin = parentHome || [centerX, centerY];
    let directionX = home[0] - directionOrigin[0];
    let directionY = home[1] - directionOrigin[1];
    if (Math.hypot(directionX, directionY) < 1) {
      directionX = home[0] - centerX;
      directionY = home[1] - centerY;
    }
    const baseAngle = Math.hypot(directionX, directionY) < 1 ? 0 : Math.atan2(directionY, directionX);
    const ordered = [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
    const populationRadius = Math.max(72, 30 + Math.sqrt(Math.max(1, ordered.length)) * 34);
    const islandOffset = 44 + populationRadius * .34;
    const islandX = home[0] + Math.cos(baseAngle) * islandOffset;
    const islandY = home[1] + Math.sin(baseAngle) * islandOffset;
    ordered.forEach((person, index) => {
      const radius = index ? 24 + Math.sqrt(index) * 36 : 22;
      const angle = baseAngle + index * goldenAngle;
      targets.set(person.id, [islandX + Math.cos(angle) * radius, islandY + Math.sin(angle) * radius]);
    });
  });
  return targets;
}

function hierarchyGuideForce(width, height) {
  let nodes = [];
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const teamTargets = teamPositions(width, height);
  const personTargets = personOrbitTargets(width, height, teamTargets);
  const teamNodes = new Map();
  const personOffsets = new Map();
  graphPeople.forEach(person => {
    const homeTarget = teamTargets.get(+(graphHomeTeamId(person) || 0));
    const target = personTargets.get(person.id);
    if (homeTarget && target) personOffsets.set(person.id, [target[0] - homeTarget[0], target[1] - homeTarget[1]]);
  });
  function force(alpha) {
    teamNodes.clear();
    nodes.forEach(node => { if (node.nodeType === "team") teamNodes.set(node.id, node); });
    nodes.forEach(node => {
      if (node.fx != null || node.fy != null) return;
      if (node.nodeType === "team") {
        const target = teamTargets.get(node.id);
        if (!target) return;
        if (node.level === 2) {
          const parent = teamNodes.get(+node.parent_id);
          const parentTarget = teamTargets.get(+node.parent_id);
          if (parent && parentTarget) {
            const liveTargetX = parent.x + target[0] - parentTarget[0];
            const liveTargetY = parent.y + target[1] - parentTarget[1];
            node.vx += (liveTargetX - node.x) * .34 * alpha;
            node.vy += (liveTargetY - node.y) * .34 * alpha;
            return;
          }
        }
        const targetDx = target[0] - centerX;
        const targetDy = target[1] - centerY;
        const targetRadius = Math.hypot(targetDx, targetDy);
        if (node.level === 0 || targetRadius < 1) {
          node.vx += (target[0] - node.x) * .72 * alpha;
          node.vy += (target[1] - node.y) * .72 * alpha;
          return;
        }
        let dx = node.x - centerX;
        let dy = node.y - centerY;
        let radius = Math.hypot(dx, dy);
        if (radius < 1) { dx = targetDx; dy = targetDy; radius = targetRadius; }
        const radialX = dx / radius;
        const radialY = dy / radius;
        const radialStrength = node.level === 1 ? .26 : .21;
        const radialError = targetRadius - radius;
        node.vx += radialX * radialError * radialStrength * alpha;
        node.vy += radialY * radialError * radialStrength * alpha;
        const currentAngle = Math.atan2(dy, dx);
        const targetAngle = Math.atan2(targetDy, targetDx);
        const angleError = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        const tangentX = -radialY;
        const tangentY = radialX;
        const tangentStrength = node.level === 1 ? .055 : .04;
        node.vx += tangentX * angleError * radius * tangentStrength * alpha;
        node.vy += tangentY * angleError * radius * tangentStrength * alpha;
        return;
      }
      const teamId = +(graphHomeTeamId(node) || 0);
      const home = teamNodes.get(teamId);
      const offset = personOffsets.get(node.id);
      if (!home || !offset) return;
      const strength = .1;
      node.vx += (home.x + offset[0] - node.x) * strength * alpha;
      node.vy += (home.y + offset[1] - node.y) * strength * alpha;
    });
  }
  force.initialize = nextNodes => { nodes = nextNodes; };
  return force;
}

function restoreNetworkLayout(width, height) {
  const layout = teamPositions(width, height);
  const peopleTargets = personOrbitTargets(width, height, layout);
  const saved = positionCache.network || {};
  graphTeams.forEach(team => {
    const target = saved[team.uid] || layout.get(team.id) || [width / 2, height / 2 + 20];
    team.x = target[0];
    team.y = target[1];
    team.vx = 0;
    team.vy = 0;
    team.fx = null;
    team.fy = null;
  });
  graphPeople.forEach(person => {
    const target = saved[person.uid] || peopleTargets.get(person.id) || [width / 2, height / 2 + 20];
    person.x = target[0];
    person.y = target[1];
    person.vx = 0;
    person.vy = 0;
    person.fx = null;
    person.fy = null;
  });
  updateGraphGeometry();
}

function usesCompactPeopleNodes(mode = currentMode) {
  return mode === "network" || mode === "age" || (mode === "field" && fieldDimension === "oddil") || graphPeople.length > 48;
}

function showsPersonGraphLabels(mode = currentMode) {
  // Large field diagrams use labelled-on-hover dots. Keeping every long name
  // permanently visible would force the data sets to grow to several times
  // their useful size and scatter the people across those oversized fields.
  if (mode === "field" && fieldDimension === "oddil") return false;
  return usesCompactPeopleNodes(mode) && mode !== "age";
}

function estimatedPersonLabelWidth(person) {
  if (Number.isFinite(person?.labelWidth)) return person.labelWidth;
  return Math.max(42, Array.from(personName(person)).reduce((width, character) => width + (/[MWÁÉÍÓÚÝŠČŘŽĎŤŇ]/.test(character) ? 9.6 : 8), 0) + 18);
}

function collisionForceV2() {
  return d3.forceCollide().radius(d => {
    const box = nodeCollisionBox(d);
    return Math.hypot(box.halfWidth, box.halfHeight) + (d.nodeType === "team" ? 12 : 7);
  }).strength(1).iterations(3);
}

function automaticLinkDistance(link) {
  const distance = physicsSettings.linkDistance;
  if (link.kind === "relationship") return distance * .9;
  if (link.kind === "membership") return distance * 1.35;
  if (link.kind === "assignment") {
    const endpoint = link.source?.nodeType === "team" ? link.source : link.target;
    const members = endpoint?.id ? graphPeople.filter(person => +(graphHomeTeamId(person) || 0) === endpoint.id) : [];
    return Math.max(64, distance * .62, Math.min(155, clusterSeedRadius(members) * .48));
  }
  const child = link.target?.nodeType === "team" ? link.target : link.source;
  const parent = child === link.target ? link.source : link.target;
  if (child?.id && parent?.id) {
    const targets = teamPositions(graphViewport.width, graphViewport.height);
    const childTarget = targets.get(child.id);
    const parentTarget = targets.get(parent.id);
    if (childTarget && parentTarget) {
      const minimum = child.level === 2 ? 120 : 260;
      return Math.max(minimum, Math.hypot(childTarget[0] - parentTarget[0], childTarget[1] - parentTarget[1]));
    }
  }
  const radii = structureRadii();
  return child?.level === 1 ? radii.oddil : Math.max(240, radii.druzina - radii.oddil);
}

function structureClusters(nodes) {
  const directPopulation = d3.rollup(
    nodes.filter(node => node.nodeType === "person" && graphHomeTeamId(node)),
    members => members.length,
    person => +(graphHomeTeamId(person) || 0)
  );
  const clusters = new Map();
  nodes.forEach(node => {
    const clusterId = node.nodeType === "person"
      ? +(graphHomeTeamId(node) || 0)
      : directPopulation.has(node.id) ? node.id : 0;
    if (!clusterId) return;
    if (!clusters.has(clusterId)) clusters.set(clusterId, {id: clusterId, members: []});
    clusters.get(clusterId).members.push(node);
  });
  return Array.from(clusters.values()).sort((a, b) => a.id - b.id);
}

function structureClusterBounds(cluster) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  cluster.members.forEach(node => {
    const box = nodeCollisionBox(node);
    minX = Math.min(minX, node.x - box.halfWidth);
    maxX = Math.max(maxX, node.x + box.halfWidth);
    minY = Math.min(minY, node.y - box.halfHeight);
    maxY = Math.max(maxY, node.y + box.halfHeight);
  });
  return {...cluster, minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2};
}

function translateStructureCluster(cluster, dx, dy) {
  cluster.members.forEach(node => {
    if (node.fx != null || node.fy != null) return;
    node.x += dx;
    node.y += dy;
    if (dx) node.vx = dx < 0 ? Math.min(node.vx || 0, 0) : Math.max(node.vx || 0, 0);
    if (dy) node.vy = dy < 0 ? Math.min(node.vy || 0, 0) : Math.max(node.vy || 0, 0);
  });
}

function resolveStructureClusterBuffers(nodes, strength = 1, passes = 1, maxStep = Infinity) {
  if (!displayOptions.primary) return 0;
  const clusters = structureClusters(nodes);
  let unresolved = 0;
  for (let pass = 0; pass < passes; pass += 1) {
    unresolved = 0;
    for (let left = 0; left < clusters.length; left += 1) for (let right = left + 1; right < clusters.length; right += 1) {
      const a = structureClusterBounds(clusters[left]);
      const b = structureClusterBounds(clusters[right]);
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) + PEOPLE_CLUSTER_BUFFER;
      const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) + PEOPLE_CLUSTER_BUFFER;
      if (overlapX <= .5 || overlapY <= .5) continue;
      unresolved += 1;
      const horizontal = overlapX < overlapY || (Math.abs(overlapX - overlapY) < .5 && a.id < b.id);
      const penetration = horizontal ? overlapX : overlapY;
      const correction = Math.min(maxStep, penetration * strength);
      const aLocked = a.members.every(node => node.fx != null || node.fy != null);
      const bLocked = b.members.every(node => node.fx != null || node.fy != null);
      const aShare = aLocked ? 0 : bLocked ? 1 : .5;
      const bShare = bLocked ? 0 : aLocked ? 1 : .5;
      const direction = horizontal
        ? (a.cx < b.cx || (a.cx === b.cx && a.id < b.id) ? -1 : 1)
        : (a.cy < b.cy || (a.cy === b.cy && a.id < b.id) ? -1 : 1);
      translateStructureCluster(a, horizontal ? direction * correction * aShare : 0, horizontal ? 0 : direction * correction * aShare);
      translateStructureCluster(b, horizontal ? -direction * correction * bShare : 0, horizontal ? 0 : -direction * correction * bShare);
    }
    if (!unresolved) break;
  }
  return unresolved;
}

function clusterSeparationForce() {
  let nodes = [];
  function force(alpha) {
    const strength = Math.min(.46, .2 + alpha * .55);
    resolveStructureClusterBuffers(nodes, strength, 3, 150);
  }
  force.initialize = nextNodes => { nodes = nextNodes; };
  return force;
}

function interGroupPersonSeparationForce() {
  let nodes = [];
  function force(alpha) {
    if (!displayOptions.primary) return;
    const peopleNodes = nodes.filter(node => node.nodeType === "person" && graphHomeTeamId(node));
    if (peopleNodes.length < 2) return;
    const order = new Map(peopleNodes.map((node, index) => [node, index]));
    const radii = new Map(peopleNodes.map(node => {
      const box = nodeCollisionBox(node);
      return [node, Math.min(74, Math.max(17, Math.hypot(box.halfWidth, box.halfHeight) * .72))];
    }));
    const maxRadius = d3.max(peopleNodes, node => radii.get(node)) || 17;
    const tree = d3.quadtree(peopleNodes, node => node.x, node => node.y);
    peopleNodes.forEach(node => {
      const radius = radii.get(node);
      const search = radius + maxRadius + CROSS_GROUP_PERSON_BUFFER;
      tree.visit((quad, x0, y0, x1, y1) => {
        if (x0 > node.x + search || x1 < node.x - search || y0 > node.y + search || y1 < node.y - search) return true;
        if (!quad.length) {
          let leaf = quad;
          do {
            const other = leaf.data;
            if (other && order.get(other) > order.get(node) && graphHomeTeamId(other) !== graphHomeTeamId(node)) {
              let dx = other.x - node.x;
              let dy = other.y - node.y;
              let distance = Math.hypot(dx, dy);
              if (distance < .001) {
                const angle = ((node.id * 97 + other.id * 53) % 360) * Math.PI / 180;
                dx = Math.cos(angle);
                dy = Math.sin(angle);
                distance = 1;
              }
              const minimum = radius + radii.get(other) + CROSS_GROUP_PERSON_BUFFER;
              if (distance < minimum) {
                const impulse = Math.min(13, (minimum - distance) * .06) * alpha;
                const pushX = dx / distance * impulse;
                const pushY = dy / distance * impulse;
                if (node.fx == null && node.fy == null) { node.vx -= pushX; node.vy -= pushY; }
                if (other.fx == null && other.fy == null) { other.vx += pushX; other.vy += pushY; }
              }
            }
            leaf = leaf.next;
          } while (leaf);
        }
        return false;
      });
    });
  }
  force.initialize = nextNodes => { nodes = nextNodes; };
  return force;
}

function unitOriginSeparationForce() {
  let nodes = [];
  const populationByTeam = d3.rollup(graphPeople, members => members.length, person => +(graphHomeTeamId(person) || 0));
  const layout = hierarchyLayoutModel();
  const exclusionRadius = team => {
    const hasPeople = layout.populationCount(team) > 0;
    if (team.level === 1) return layout.departmentClusterRadius(team) + (hasPeople ? DEPARTMENT_CLEAR_GAP / 2 : 70);
    return layout.clusterRadius(team) + (hasPeople ? CLUSTER_CLEAR_GAP / 2 : 35);
  };
  function force(alpha) {
    if (!displayOptions.primary) return;
    const origins = nodes.filter(node => node.nodeType === "team" && node.level > 0);
    for (let left = 0; left < origins.length; left += 1) for (let right = left + 1; right < origins.length; right += 1) {
      const a = origins[left];
      const b = origins[right];
      const directParentChild = +a.parent_id === b.id || +b.parent_id === a.id;
      if (directParentChild) continue;
      const aPopulation = populationByTeam.get(a.id) || 0;
      const bPopulation = populationByTeam.get(b.id) || 0;
      const crossStage = a.level !== b.level;
      if (crossStage && (!aPopulation || !bPopulation)) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      if (distance < .001) {
        const angle = ((a.id * 137 + b.id * 61) % 360) * Math.PI / 180;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 1;
      }
      const minimum = (exclusionRadius(a) + exclusionRadius(b)) * (crossStage ? .92 : 1);
      if (distance >= minimum) continue;
      const impulse = Math.min(crossStage ? 26 : 20, (minimum - distance) * (crossStage ? .08 : .065)) * alpha;
      const pushX = dx / distance * impulse;
      const pushY = dy / distance * impulse;
      if (a.fx == null && a.fy == null) { a.vx -= pushX; a.vy -= pushY; }
      if (b.fx == null && b.fy == null) { b.vx += pushX; b.vy += pushY; }
    }
  }
  force.initialize = nextNodes => { nodes = nextNodes; };
  return force;
}

function nodeCollisionBox(node) {
  if (node.nodeType === "team") {
    const brandedCenterClearance = currentMode === "network" && isSkuptaciCenterNode(node) ? 36 : 0;
    return {
      halfWidth: Math.max(48, (node.boxWidth || estimatedTeamWidth(node)) / 2 + (currentMode === "network" ? 22 : 14) + brandedCenterClearance),
      halfHeight: Math.max(28, (node.boxHeight || 32) / 2 + (currentMode === "network" ? 18 : 12) + brandedCenterClearance)
    };
  }
  // The details card is an overlay, not part of the graph's physical body.
  // Letting it alter collision bounds makes a click push the whole cluster.
  if (usesCompactPeopleNodes()) {
    if (showsPersonGraphLabels()) return {
      halfWidth: Math.max(13, estimatedPersonLabelWidth(node) / 2 + (currentMode === "network" ? 12 : 5)),
      halfHeight: currentMode === "network" ? 39 : 31
    };
    return {halfWidth: 13, halfHeight: 13};
  }
  return {halfWidth: 59, halfHeight: 19};
}

function boxesOverlap(a, b, boxes) {
  const aBox = boxes.get(a);
  const bBox = boxes.get(b);
  return Math.abs(a.x - b.x) < aBox.halfWidth + bBox.halfWidth && Math.abs(a.y - b.y) < aBox.halfHeight + bBox.halfHeight;
}

function enforceNoNodeOverlap(nodes, maxPasses = 24) {
  if (nodes.length < 2) return;
  const order = new Map(nodes.map((node, index) => [node, index]));
  const boxes = new Map(nodes.map(node => [node, nodeCollisionBox(node)]));
  const maxHalfWidth = d3.max(nodes, node => boxes.get(node).halfWidth) || 0;
  const maxHalfHeight = d3.max(nodes, node => boxes.get(node).halfHeight) || 0;
  let clean = false;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let overlaps = 0;
    const tree = d3.quadtree(nodes, node => node.x, node => node.y);
    nodes.forEach(node => {
      const box = boxes.get(node);
      const searchX = box.halfWidth + maxHalfWidth;
      const searchY = box.halfHeight + maxHalfHeight;
      tree.visit((quad, x0, y0, x1, y1) => {
        if (x0 > node.x + searchX || x1 < node.x - searchX || y0 > node.y + searchY || y1 < node.y - searchY) return true;
        if (!quad.length) {
          let leaf = quad;
          do {
            const other = leaf.data;
            if (other && order.get(other) > order.get(node)) {
              const otherBox = boxes.get(other);
              let dx = other.x - node.x;
              let dy = other.y - node.y;
              const overlapX = box.halfWidth + otherBox.halfWidth - Math.abs(dx);
              const overlapY = box.halfHeight + otherBox.halfHeight - Math.abs(dy);
              if (overlapX > 0 && overlapY > 0) {
                overlaps += 1;
                if (!dx && !dy) {
                  const seedValue = ((node.id || 1) * 31 + (other.id || 1) * 17) % 360;
                  dx = Math.cos(seedValue * Math.PI / 180) || 1;
                  dy = Math.sin(seedValue * Math.PI / 180) || 1;
                }
                const nodeFixed = node.fx != null || node.fy != null;
                const otherFixed = other.fx != null || other.fy != null;
                const nodeShare = nodeFixed ? 0 : otherFixed ? 1 : .5;
                const otherShare = otherFixed ? 0 : nodeFixed ? 1 : .5;
                if (overlapX < overlapY) {
                  const direction = dx < 0 ? -1 : 1;
                  node.x -= direction * (overlapX + .5) * nodeShare;
                  other.x += direction * (overlapX + .5) * otherShare;
                } else {
                  const direction = dy < 0 ? -1 : 1;
                  node.y -= direction * (overlapY + .5) * nodeShare;
                  other.y += direction * (overlapY + .5) * otherShare;
                }
                node.vx *= .35; node.vy *= .35;
                other.vx *= .35; other.vy *= .35;
              }
            }
            leaf = leaf.next;
          } while (leaf);
        }
        return false;
      });
    });
    if (!overlaps) {
      clean = true;
      break;
    }
  }
  if (clean) return;
  const ordered = [...nodes].sort((a, b) => {
    const fixedDifference = Number(b.fx != null || b.fy != null) - Number(a.fx != null || a.fy != null);
    if (fixedDifference) return fixedDifference;
    return Number(b.nodeType === "team") - Number(a.nodeType === "team");
  });
  const placed = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  ordered.forEach(node => {
    if (!placed.some(other => boxesOverlap(node, other, boxes))) {
      placed.push(node);
      return;
    }
    const originX = node.x;
    const originY = node.y;
    const box = boxes.get(node);
    const step = Math.max(28, Math.max(box.halfWidth, box.halfHeight) * .72);
    let attempt = 1;
    do {
      const radius = step * Math.sqrt(attempt);
      const angle = attempt * goldenAngle;
      node.x = originX + Math.cos(angle) * radius;
      node.y = originY + Math.sin(angle) * radius;
      attempt += 1;
    } while (placed.some(other => boxesOverlap(node, other, boxes)));
    node.vx = 0;
    node.vy = 0;
    placed.push(node);
  });
}

function ageGraphLayout(width, height) {
  const targets = new Map();
  const known = graphPeople
    .filter(person => Number.isFinite(person.age))
    .sort((a, b) => a.age - b.age || personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
  const unknown = graphPeople
    .filter(person => !Number.isFinite(person.age))
    .sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
  const ages = known.map(person => Math.floor(person.age));
  let minAge = ages.length ? Math.floor(d3.min(ages) / 5) * 5 : 0;
  let maxAge = ages.length ? Math.ceil(d3.max(ages) / 5) * 5 : 10;
  if (maxAge - minAge < 10) {
    minAge = Math.max(0, minAge - 5);
    maxAge += 5;
  }
  const grouped = d3.group(known, person => Math.floor(person.age));
  const largestAgeGroup = d3.max([...grouped.values()], members => members.length) || 1;
  const dotGap = 23;
  const plotHeight = Math.max(310, height - 205, largestAgeGroup * dotGap + 76);
  const top = 76;
  const axisY = top + plotHeight;
  const unknownColumns = unknown.length ? Math.max(1, Math.min(5, Math.ceil(Math.sqrt(unknown.length)))) : 0;
  const unknownLaneWidth = unknown.length ? Math.max(146, unknownColumns * dotGap + 58) : 0;
  const ageSpan = Math.max(10, maxAge - minAge);
  const plotWidth = Math.max(680, width - 150 - unknownLaneWidth, ageSpan * 20);
  const left = 76;
  const right = left + plotWidth;
  const scale = d3.scaleLinear().domain([minAge, maxAge]).range([left, right]);
  const middleY = top + plotHeight / 2;
  grouped.forEach((members, age) => {
    const ordered = [...members].sort((a, b) => personName(a).localeCompare(personName(b), "cs") || a.id - b.id);
    ordered.forEach((person, index) => {
      const step = index === 0 ? 0 : Math.ceil(index / 2) * (index % 2 ? -1 : 1);
      targets.set(person.id, [scale(+age), middleY + step * dotGap]);
    });
  });
  const unknownStartX = right + (unknown.length ? 78 : 0);
  unknown.forEach((person, index) => {
    const row = Math.floor(index / unknownColumns);
    const column = index % unknownColumns;
    targets.set(person.id, [unknownStartX + column * dotGap, top + 42 + row * dotGap]);
  });
  const unknownRows = unknown.length ? Math.ceil(unknown.length / unknownColumns) : 0;
  const maxX = unknown.length ? unknownStartX + (unknownColumns - 1) * dotGap + 50 : right + 30;
  const maxY = Math.max(axisY + 58, unknown.length ? top + 70 + unknownRows * dotGap : 0);
  return {
    targets,
    scale,
    axisY,
    top,
    right,
    unknown,
    unknownStartX,
    tickCount: Math.max(4, Math.min(16, Math.floor(plotWidth / 105))),
    bounds: {
      minX: 30,
      minY: 24,
      maxX,
      maxY
    }
  };
}

function structureClusterHaloPath(cluster) {
  const points = [cluster.team, ...cluster.members].flatMap(node => {
    const box = nodeCollisionBox(node);
    const paddingX = node.nodeType === "team" ? 30 : 26;
    const paddingY = node.nodeType === "team" ? 24 : 22;
    return [
      [node.x - box.halfWidth - paddingX, node.y - box.halfHeight - paddingY],
      [node.x + box.halfWidth + paddingX, node.y - box.halfHeight - paddingY],
      [node.x + box.halfWidth + paddingX, node.y + box.halfHeight + paddingY],
      [node.x - box.halfWidth - paddingX, node.y + box.halfHeight + paddingY]
    ];
  });
  const hull = d3.polygonHull(points);
  return hull ? d3.line().curve(d3.curveLinearClosed)(hull) : "";
}

function graphLinkEndpoint(node, other) {
  const dx = other.x - node.x;
  const dy = other.y - node.y;
  const distance = Math.hypot(dx, dy);
  if (distance < .001) return [node.x, node.y];
  if (node.nodeType === "person") {
    const radius = usesCompactPeopleNodes("network") ? 5.5 : 9;
    return [node.x + dx / distance * radius, node.y + dy / distance * radius];
  }
  const halfWidth = Math.max(28, (node.boxWidth || estimatedTeamWidth(node)) / 2);
  const halfHeight = Math.max(14, (node.boxHeight || 32) / 2);
  const scale = Math.min(
    Math.abs(dx) > .001 ? halfWidth / Math.abs(dx) : Infinity,
    Math.abs(dy) > .001 ? halfHeight / Math.abs(dy) : Infinity
  );
  return [node.x + dx * scale, node.y + dy * scale];
}

function updateGraphGeometry() {
  zoneLayer?.selectAll("path.unit-cluster-halo").attr("d", structureClusterHaloPath);
  [structureLinkLayer, relationshipLinkLayer].forEach(layer => layer?.selectAll("line")
    .attr("x1", d => graphLinkEndpoint(d.source, d.target)[0])
    .attr("y1", d => graphLinkEndpoint(d.source, d.target)[1])
    .attr("x2", d => graphLinkEndpoint(d.target, d.source)[0])
    .attr("y2", d => graphLinkEndpoint(d.target, d.source)[1]));
  nodeLayer?.selectAll("g.person-node").attr("transform", d => `translate(${d.x},${d.y})`);
  teamLayer?.selectAll("g.team-node").attr("transform", d => `translate(${d.x},${d.y})`);
}

function applyStaticGraphLayout(targets, animate = true) {
  simulation.stop().alphaTarget(0);
  simulation.force("charge", null).force("center", null).force("radial", null).force("x", null).force("y", null).force("bounds", null).force("collide", null).force("clusterSeparation", null).force("personGroupSeparation", null).force("originSeparation", null).force("hierarchyGuide", null);
  simulation.nodes(graphPeople);
  simulation.force("link").links(displayOptions.secondary ? relationshipGraphLinks : []).strength(0);
  graphPeople.forEach(person => {
    const target = targets.get(person.id) || [graphViewport.width / 2, graphViewport.height / 2];
    person.fx = target[0];
    person.fy = target[1];
    person.x = target[0];
    person.y = target[1];
    person.vx = 0;
    person.vy = 0;
  });
  const duration = animate ? 480 : 0;
  const peopleSelection = nodeLayer.selectAll("g.person-node").interrupt();
  const relationshipSelection = relationshipLinkLayer.selectAll("line").interrupt();
  if (!duration) {
    peopleSelection.attr("transform", d => `translate(${d.x},${d.y})`);
    relationshipSelection.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    return;
  }
  peopleSelection.transition().duration(duration).ease(d3.easeCubicOut).attr("transform", d => `translate(${d.x},${d.y})`);
  relationshipSelection.transition().duration(duration).ease(d3.easeCubicOut)
    .attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
}

function viewportForce(width, height, padding = 62, strength = .2) {
  let nodes = [];
  function force(alpha) {
    const pull = strength * Math.max(alpha, .18);
    nodes.forEach(node => {
      const extentX = node.nodeType === "team" ? Math.max(padding, (node.boxWidth || 100) / 2 + 12) : padding;
      const extentY = node.nodeType === "team" ? Math.max(25, (node.boxHeight || 32) / 2 + 12) : padding;
      const left = Math.min(extentX, width / 2);
      const right = Math.max(left, width - extentX);
      const top = Math.min(extentY, height / 2);
      const bottom = Math.max(top, height - extentY);
      if (node.x < left) node.vx += (left - node.x) * pull;
      if (node.x > right) node.vx -= (node.x - right) * pull;
      if (node.y < top) node.vy += (top - node.y) * pull;
      if (node.y > bottom) node.vy -= (node.y - bottom) * pull;
    });
  }
  force.initialize = value => { nodes = value; };
  return force;
}

function containGraphNodes(nodes, width, height) {
  if (currentMode === "network") return;
  const dotsOnly = usesCompactPeopleNodes();
  nodes.forEach(node => {
    if (node.fx != null || node.fy != null) return;
    const extentX = node.nodeType === "team" ? Math.max(42, (node.boxWidth || 100) / 2 + 10) : dotsOnly ? 14 : node.expanded ? 84 : 58;
    const extentY = node.nodeType === "team" ? Math.max(22, (node.boxHeight || 32) / 2 + 10) : dotsOnly ? 14 : node.expanded ? 92 : 18;
    const left = Math.min(extentX, width / 2);
    const right = Math.max(left, width - extentX);
    const top = Math.min(extentY, height / 2);
    const bottom = Math.max(top, height - extentY);
    if (node.x < left) { node.x = left; node.vx = Math.max(0, node.vx || 0) * .18; }
    else if (node.x > right) { node.x = right; node.vx = Math.min(0, node.vx || 0) * .18; }
    if (node.y < top) { node.y = top; node.vy = Math.max(0, node.vy || 0) * .18; }
    else if (node.y > bottom) { node.y = bottom; node.vy = Math.min(0, node.vy || 0) * .18; }
  });
}

function settleSimulationWhenStill(nodes) {
  if (!simulation || simulation.alphaTarget() > 0 || simulation.alpha() > .035) {
    stableSimulationTicks = 0;
    return;
  }
  const moving = nodes.some(node => Math.hypot(node.vx || 0, node.vy || 0) > .045);
  stableSimulationTicks = moving ? 0 : stableSimulationTicks + 1;
  if (stableSimulationTicks < 14) return;
  nodes.forEach(node => { node.vx = 0; node.vy = 0; });
  if (currentMode === "network" && displayOptions.primary) {
    enforceNoNodeOverlap(nodes, 12);
    resolveStructureClusterBuffers(nodes, 1, 30);
    updateGraphGeometry();
  }
  simulation.stop();
  stableSimulationTicks = 0;
  persistWorkspaceState(true);
}

function nodeHtmlV2(d) {
  const facts = [
    ["přezdívka", d.nickname],
    ["role", d.role],
    ["datum narození", d.birth_date ? birthDateLabel(d.birth_date) : ""],
    ["věk", ageLabel(d.age)],
    ["kategorie", d.category],
    ["registrační kategorie", d.registration_category],
    ["město", d.city],
    ["primární jednotka", d.org_team, true],
    ["oddíly", d.oddily, true],
    ["e-mail", d.email, true, false, "email"],
    ["poznámky", d.notes, true, true]
  ].filter(([, value]) => value != null && String(value).trim());
  const factHtml = facts.map(([label, value, wide, notes, action]) => {
    const content = action === "email"
      ? `<a class="node-action-link node-email-link" href="${escapeHtml(`mailto:${String(value).trim()}`)}">${escapeHtml(value)}</a>`
      : `<b>${escapeHtml(value)}</b>`;
    return `<div class="node-fact${wide ? " wide" : ""}${notes ? " notes" : ""}${action ? " actionable" : ""}">${content}${escapeHtml(label)}</div>`;
  }).join("");
  const unitNames = (d.unitNames?.length ? d.unitNames : String(d.jednotky || "").split(" · "))
    .map(name => String(name).trim())
    .filter(Boolean);
  const unitHtml = unitNames.length
    ? `<div class="node-fact node-units wide"><b>${unitNames.map(name => `<span>${escapeHtml(name)}</span>`).join("")}</b>všechny jednotky</div>`
    : "";
  const tags = d.tagsArray.map(tag => `<span class="node-tag">#${escapeHtml(tag)}</span>`).join("");
  return `<div class="node-card" xmlns="http://www.w3.org/1999/xhtml">
    <div class="node-main"><div class="node-name">${escapeHtml(personName(d))}</div><button class="node-close" type="button" aria-label="Zavřít informace o osobě">&times;</button></div>
    <div class="node-more"><div class="node-rule"></div><div class="node-facts">${factHtml}${unitHtml}</div><div class="node-tag-section"><span>Kvalifikace / štítky</span><div class="node-tags">${tags || '<span class="node-tag">bez štítků</span>'}</div></div></div>
  </div>`;
}

function splitMapTitle(value, maxChars, maxLines = 2) {
  const label = String(value || "Bez názvu").trim() || "Bez názvu";
  if (label.length <= maxChars) return [label];
  const words = label.split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  if (lines.length === 1 && lines[0].length > maxChars) {
    lines.splice(0, 1, ...Array.from({length: Math.ceil(label.length / maxChars)}, (_, index) => label.slice(index * maxChars, (index + 1) * maxChars)));
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const remainder = lines.slice(maxLines - 1).join(" ");
    kept[maxLines - 1] = remainder.length > maxChars ? `${remainder.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : remainder;
    return kept;
  }
  return lines.map(line => line.length > maxChars ? `${line.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : line);
}

function setSvgTitleLines(textSelection, lines, lineHeight, x = 0, y = 0) {
  textSelection.attr("x", x).attr("y", y - ((lines.length - 1) * lineHeight) / 2);
  textSelection.selectAll("tspan").data(lines).join("tspan")
    .attr("x", x)
    .attr("dy", (_, index) => index ? lineHeight : 0)
    .text(line => line);
}

function isSkuptaciCenterNode(team) {
  return team?.level === 0 && team?.name?.trim() === "Středisko Skuptáci";
}

function applyAdaptiveTeamTitles(selection, viewportWidth) {
  const compactFactor = Math.max(.84, Math.min(1, viewportWidth / 920));
  const boardTextScale = appSettings.textScale / 100;
  selection.each(function(d) {
    const label = d.name?.trim() || "Bez názvu";
    const isSkuptaciCenter = isSkuptaciCenterNode(d);
    const baseFontSize = d.level === 0 ? 20 : d.level === 1 ? 14 : 13;
    const fontSize = Math.round(baseFontSize * compactFactor * boardTextScale * 10) / 10;
    const group = d3.select(this);

    if (isSkuptaciCenter) {
      const horizontalPadding = 22;
      const topPadding = 17;
      const bottomPadding = 18;
      const logoWidth = Math.round(80 * compactFactor * 10) / 10;
      const logoHeight = Math.round(49 * compactFactor * 10) / 10;
      const logoGap = 14;
      const minimumWidth = Math.min(304, Math.max(264, viewportWidth - 28));
      const preferredWidth = Math.max(minimumWidth, Math.min(336, viewportWidth * .7));
      const availableTextWidth = Math.max(190, preferredWidth - horizontalPadding * 2);
      const maxChars = Math.max(10, Math.floor(availableTextWidth / (fontSize * .56)));
      const lines = splitMapTitle(label, maxChars);
      const lineHeight = Math.round(fontSize * 1.12 * 10) / 10;
      const measuredTextWidth = Math.max(...lines.map(line => line.length)) * fontSize * .56;
      const textBlockHeight = lines.length * lineHeight;
      d.boxWidth = Math.min(preferredWidth, Math.max(minimumWidth, horizontalPadding * 2 + measuredTextWidth));
      d.boxHeight = topPadding + logoHeight + logoGap + textBlockHeight + bottomPadding;
      const logoY = -d.boxHeight / 2 + topPadding;
      const textY = logoY + logoHeight + logoGap + textBlockHeight / 2;

      group.select("rect")
        .attr("x", -d.boxWidth / 2).attr("y", -d.boxHeight / 2)
        .attr("width", d.boxWidth).attr("height", d.boxHeight).attr("rx", 14);
      group.select("image.team-node-logo")
        .style("display", null)
        .attr("x", -logoWidth / 2)
        .attr("y", logoY)
        .attr("width", logoWidth)
        .attr("height", logoHeight);
      const text = group.select("text").style("font-size", `${fontSize}px`);
      setSvgTitleLines(text, lines, lineHeight, 0, textY);
      group.select("title").text(label);
      return;
    }

    const minWidth = d.level === 0 ? 146 : d.level === 1 ? 108 : 102;
    const preferredMax = d.level === 0 ? 280 : d.level === 1 ? 220 : 198;
    const viewportShare = d.level === 0 ? .42 : d.level === 1 ? .31 : .28;
    const maxWidth = Math.max(minWidth, Math.min(preferredMax, viewportWidth * viewportShare));
    const maxChars = Math.max(7, Math.floor((maxWidth - 26) / (fontSize * .56)));
    const lines = splitMapTitle(label, maxChars);
    const lineHeight = Math.round(fontSize * 1.12 * 10) / 10;
    const measuredWidth = Math.max(...lines.map(line => line.length)) * fontSize * .56 + 26;
    d.boxWidth = Math.max(minWidth, Math.min(maxWidth, measuredWidth));
    d.boxHeight = (d.level === 0 ? 46 : 38) + (lines.length - 1) * lineHeight;
    const cornerRadius = d.level === 0 ? 10 : d.level === 1 ? 7 : Math.min(19, d.boxHeight / 2);
    group.select("rect").attr("x", -d.boxWidth / 2).attr("y", -d.boxHeight / 2).attr("width", d.boxWidth).attr("height", d.boxHeight).attr("rx", cornerRadius);
    group.select("image.team-node-logo").style("display", "none");
    const text = group.select("text").style("font-size", `${fontSize}px`);
    setSvgTitleLines(text, lines, lineHeight);
    group.select("title").text(label);
  });
}

function addAdaptiveFieldTitles(zone, viewportWidth, fields) {
  const fontSize = Math.max(10.5, Math.min(14, viewportWidth / Math.max(68, fields.length * 18))) * appSettings.textScale / 100;
  const maxChars = Math.max(9, Math.min(24, Math.floor(viewportWidth / Math.max(42, fields.length * 6))));
  const titles = zone.append("text")
    .attr("class", "field-title")
    .attr("text-anchor", "middle")
    .style("font-size", `${fontSize}px`)
    .each(function(field) {
      const label = Number.isFinite(field.count) ? `${field.name} · ${field.count}` : field.name;
      const lines = splitMapTitle(label, maxChars);
      setSvgTitleLines(d3.select(this), lines, fontSize * 1.12, field.labelX, field.labelY);
    });
  return titles;
}

function hideFieldSectionInfo() {
  const popover = document.querySelector("#field-section-popover");
  if (popover) popover.hidden = true;
}

function graphPersonId(endpoint) {
  return typeof endpoint === "object"
    ? +endpoint.id
    : +String(endpoint).replace(/^person-/, "");
}

function oddilReachIsAvailable() {
  return currentMode === "field" && fieldDimension === "oddil";
}

function activeOddilReachField() {
  if (!oddilReachIsAvailable()) return null;
  const name = pinnedOddilReachName || hoveredOddilReachName;
  return name ? activeFieldShapes.find(field => field.name === name) || null : null;
}

function applyOddilReachHighlight() {
  const field = activeOddilReachField();
  const active = Boolean(field);
  svg?.classed("oddil-reach-active", active).classed("oddil-reach-pinned", Boolean(active && pinnedOddilReachName));
  zoneLayer?.selectAll("g.field-region")
    .classed("reach-focus", candidate => active && candidate.name === field.name)
    .classed("reach-muted", candidate => active && candidate.name !== field.name);
  nodeLayer?.selectAll("g.person-node")
    .classed("reach-member", person => active && field.members.has(person.id))
    .classed("reach-shared", person => active && field.members.has(person.id) && fieldValues(person).length > 1)
    .classed("reach-muted", person => active && !field.members.has(person.id));
  relationshipLinkLayer?.selectAll("line.relationship-link")
    .classed("reach-inside", link => active && field.members.has(graphPersonId(link.source)) && field.members.has(graphPersonId(link.target)))
    .classed("reach-crossing", link => active && field.members.has(graphPersonId(link.source)) !== field.members.has(graphPersonId(link.target)))
    .classed("reach-muted", link => active && !field.members.has(graphPersonId(link.source)) && !field.members.has(graphPersonId(link.target)));
}

function clearOddilReachHighlight({hideInfo = false} = {}) {
  hoveredOddilReachName = null;
  pinnedOddilReachName = null;
  applyOddilReachHighlight();
  if (hideInfo) hideFieldSectionInfo();
}

function oddilReachSummary(field) {
  const members = graphPeople.filter(person => field.members.has(person.id));
  const exclusiveCount = members.filter(person => fieldValues(person).length === 1).length;
  const sharedCount = members.length - exclusiveCount;
  const overlaps = new Map();
  members.forEach(person => fieldValues(person).forEach(name => {
    if (name !== field.name) overlaps.set(name, (overlaps.get(name) || 0) + 1);
  }));
  return {
    memberCount: members.length,
    exclusiveCount,
    sharedCount,
    overlaps: [...overlaps].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "cs"))
  };
}

function showOddilReachInfo(event, field) {
  const popover = document.querySelector("#field-section-popover");
  const view = document.querySelector("#map-view");
  if (!popover || !view) return;
  const summary = oddilReachSummary(field);
  const overlapHtml = summary.overlaps.length
    ? `<div class="reach-overlap-list">${summary.overlaps.map(([name, count]) => `<b style="--section-color:${escapeHtml(field.color)}">${escapeHtml(name)} <small>${count}</small></b>`).join("")}</div>`
    : `<p class="reach-empty">Bez sdílených členů s jiným oddílem</p>`;
  popover.innerHTML = `
    <span data-map-panel-drag>Dosah oddílu · připnuto</span>
    <div class="reach-summary-heading"><i style="--section-color:${escapeHtml(field.color)}"></i><strong>${escapeHtml(field.name)}</strong><em>${summary.memberCount} ${summary.memberCount === 1 ? "člověk" : "lidí"}</em></div>
    <div class="reach-stats"><b><small>Jen zde</small>${summary.exclusiveCount}</b><b><small>Sdílení</small>${summary.sharedCount}</b></div>
    ${summary.sharedCount ? `<span class="reach-overlap-caption">Sdíleno s jednotkami</span>${overlapHtml}` : overlapHtml}
    <p class="reach-dismiss">Kliknutí mimo nebo Esc zvýraznění zavře.</p>`;
  popover.hidden = false;
  const bounds = view.getBoundingClientRect();
  const wantedLeft = event.clientX - bounds.left + 14;
  const wantedTop = event.clientY - bounds.top + 14;
  popover.style.left = `${Math.max(12, Math.min(bounds.width - popover.offsetWidth - 12, wantedLeft))}px`;
  popover.style.top = `${Math.max(82, Math.min(bounds.height - popover.offsetHeight - 12, wantedTop))}px`;
}

function previewOddilReach(field) {
  if (!oddilReachIsAvailable() || pinnedOddilReachName) return;
  hoveredOddilReachName = field.name;
  applyOddilReachHighlight();
}

function stopOddilReachPreview(field) {
  if (pinnedOddilReachName || hoveredOddilReachName !== field.name) return;
  hoveredOddilReachName = null;
  applyOddilReachHighlight();
}

function toggleOddilReach(event, field) {
  if (!oddilReachIsAvailable()) return false;
  const shouldPin = pinnedOddilReachName !== field.name;
  pinnedOddilReachName = shouldPin ? field.name : null;
  hoveredOddilReachName = shouldPin ? field.name : null;
  applyOddilReachHighlight();
  if (shouldPin) showOddilReachInfo(event, field);
  else hideFieldSectionInfo();
  return true;
}

function unitAndDescendantIds(teamId) {
  const ids = new Set([+teamId]);
  let changed = true;
  while (changed) {
    changed = false;
    teams.forEach(team => {
      if (team.parent_id != null && ids.has(+team.parent_id) && !ids.has(team.id)) {
        ids.add(team.id);
        changed = true;
      }
    });
  }
  return ids;
}

function peopleInUnit(teamId, includeDescendants = true) {
  const ids = includeDescendants ? unitAndDescendantIds(teamId) : new Set([+teamId]);
  return people.filter(person => ids.has(+person.org_team_id) || (person.unitIds || []).some(id => ids.has(+id)));
}

function hideUnitActionPopover() {
  selectedUnitActionId = null;
  const popover = document.querySelector("#unit-action-popover");
  if (popover) popover.hidden = true;
}

function showUnitActionPopover(event, team) {
  if (currentMode !== "network") return;
  hideFieldSectionInfo();
  closeExpandedPersonInfo();
  const popover = document.querySelector("#unit-action-popover");
  const view = document.querySelector("#map-view");
  if (!popover || !view) return;
  selectedUnitActionId = team.id;
  const memberCount = peopleInUnit(team.id, true).length;
  const kind = team.level === 0 ? "Středisko" : team.level === 1 ? "Oddíl / jednotka" : "Družina";
  popover.innerHTML = `<button type="button" class="unit-popover-close" data-unit-action="close" aria-label="Zavřít">×</button><span class="eyebrow" data-map-panel-drag>${kind}</span><strong>${escapeHtml(team.name)}</strong><small>${memberCount} ${memberCount === 1 ? "člověk" : "lidí"} včetně potomků</small><button type="button" class="primary-button" data-unit-action="sql" data-unit-id="${team.id}">Zobrazit lidi v SQL laboratoři →</button>`;
  popover.hidden = false;
  const bounds = view.getBoundingClientRect();
  const wantedLeft = event.clientX - bounds.left + 14;
  const wantedTop = event.clientY - bounds.top + 14;
  popover.style.left = `${Math.max(12, Math.min(bounds.width - popover.offsetWidth - 12, wantedLeft))}px`;
  popover.style.top = `${Math.max(82, Math.min(bounds.height - popover.offsetHeight - 12, wantedTop))}px`;
}

function personInformationSections(person) {
  const clean = value => value == null ? "" : String(value).trim();
  const unitNames = [...new Set((person.unitNames?.length ? person.unitNames : clean(person.jednotky).split(" · "))
    .map(clean)
    .filter(Boolean))];
  const relatedPeople = [...new Set(relationships
    .filter(relation => relation.source === person.id || relation.target === person.id)
    .map(relation => {
      const otherId = relation.source === person.id ? relation.target : relation.source;
      const other = people.find(candidate => candidate.id === otherId);
      return other ? `${personName(other)}${clean(relation.type) ? ` (${clean(relation.type)})` : ""}` : "";
    })
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "cs"));
  const sections = [
    {
      title: "Základní informace",
      items: [
        ["Jméno", personName(person)],
        ["Přezdívka", person.nickname],
        ["Role", person.role]
      ]
    },
    {
      title: "Osobní údaje",
      items: [
        ["Datum narození", person.birth_date ? birthDateLabel(person.birth_date) : ""],
        ["Věk", person.age == null || person.age === "" ? "" : ageLabel(person.age)],
        ["Kategorie", person.category],
        ["Registrační kategorie", person.registration_category],
        ["Město", person.city]
      ]
    },
    {
      title: "Zařazení",
      items: [
        ["Primární jednotka", person.org_team],
        ["Všechny jednotky", unitNames.join(" · ")],
        ["Oddíly", person.oddily],
        ["Tým / skupina", person.team && person.team !== person.org_team ? person.team : ""]
      ]
    },
    {
      title: "Kontakt",
      items: [["E-mail", person.email, "email"]]
    },
    {
      title: "Vztahy",
      items: [["Propojení s lidmi", relatedPeople.join(" · ")]]
    }
  ];

  const knownKeys = new Set([
    "id", "name", "nickname", "role", "age", "birth_date", "category_id", "category", "registration_category",
    "team", "city", "email", "notes", "org_team_id", "org_team", "color", "tags", "tagsArray", "unitIds",
    "unitNames", "jednotky", "oddilIds", "oddilNames", "oddily", "nodeType", "uid", "index", "x", "y", "vx",
    "vy", "fx", "fy", "expanded", "labelWidth"
  ]);
  const extraItems = Object.entries(person)
    .filter(([key, value]) => !knownKeys.has(key) && !key.startsWith("_") && ["string", "number", "boolean"].includes(typeof value) && clean(value))
    .map(([key, value]) => [key.replaceAll("_", " ").replace(/^./, letter => letter.toLocaleUpperCase("cs")), value]);
  if (extraItems.length) sections.push({title: "Další údaje", items: extraItems});

  return sections
    .map(section => ({...section, items: section.items.filter(([, value]) => clean(value))}))
    .filter(section => section.items.length);
}

function personClipboardText(person) {
  const blocks = personInformationSections(person).map(section => [
    section.title.toLocaleUpperCase("cs"),
    ...section.items.map(([label, value]) => `${label}: ${String(value).trim()}`)
  ].join("\n"));
  if (person.tagsArray?.length) blocks.push(`ŠTÍTKY\n${person.tagsArray.map(tag => `#${tag}`).join(", ")}`);
  if (String(person.notes || "").trim()) blocks.push(`POZNÁMKA\n${String(person.notes).trim()}`);
  return blocks.join("\n\n");
}

function personInfoFactHtml(label, value, type) {
  const content = type === "email"
    ? `<a href="${escapeHtml(`mailto:${String(value).trim()}`)}">${escapeHtml(value)}</a>`
    : `<b>${escapeHtml(value)}</b>`;
  return `<div class="person-info-fact${type === "email" ? " is-email" : ""}"><span>${escapeHtml(label)}</span>${content}</div>`;
}

function collapsiblePersonInfoHtml(person) {
  const tags = person.tagsArray || [];
  const notes = String(person.notes || "").trim();
  const tagLimit = 7;
  const noteLimit = 190;
  const tagsNeedMore = tags.length > tagLimit;
  const noteNeedsMore = notes.length > noteLimit;
  const tagHtml = tags.length
    ? `<section class="person-info-extra" data-person-info-expandable data-expanded="false"><span>Štítky</span><div class="person-info-tags">${tags.map((tag, index) => `<i${index >= tagLimit ? ' class="person-info-overflow"' : ""}>#${escapeHtml(tag)}</i>`).join("")}</div>${tagsNeedMore ? `<button type="button" data-person-info-toggle>Zobrazit další (${tags.length - tagLimit})</button>` : ""}</section>`
    : "";
  const noteHtml = notes
    ? `<section class="person-info-extra person-info-note" data-person-info-expandable data-expanded="false"><span>Poznámka</span><p class="person-info-note-preview">${escapeHtml(noteNeedsMore ? `${notes.slice(0, noteLimit).trimEnd()}…` : notes)}</p>${noteNeedsMore ? `<p class="person-info-note-full">${escapeHtml(notes)}</p><button type="button" data-person-info-toggle>Zobrazit více</button>` : ""}</section>`
    : "";
  return `${tagHtml}${noteHtml}`;
}

function clampPersonInfoCard(left, top) {
  const card = document.querySelector("#person-info-card");
  clampMapFloatingPanel(card, left, top);
}

function clampMapFloatingPanel(panel, left, top) {
  const view = document.querySelector("#map-view");
  if (!panel || !view || panel.hidden) return;
  const bounds = view.getBoundingClientRect();
  const safe = 12;
  const maxLeft = Math.max(safe, bounds.width - panel.offsetWidth - safe);
  const maxTop = Math.max(safe, bounds.height - panel.offsetHeight - safe);
  panel.style.left = `${Math.max(safe, Math.min(maxLeft, left))}px`;
  panel.style.top = `${Math.max(safe, Math.min(maxTop, top))}px`;
}

function positionPersonInfoCard(clientX, clientY) {
  const card = document.querySelector("#person-info-card");
  const view = document.querySelector("#map-view");
  if (!card || !view) return;
  const bounds = view.getBoundingClientRect();
  const localX = Number.isFinite(clientX) ? clientX - bounds.left : bounds.width / 2;
  const localY = Number.isFinite(clientY) ? clientY - bounds.top : bounds.height / 2;
  requestAnimationFrame(() => {
    const preferredLeft = localX + 18 + card.offsetWidth <= bounds.width - 12 ? localX + 18 : localX - card.offsetWidth - 18;
    const preferredTop = localY - 28;
    clampPersonInfoCard(preferredLeft, preferredTop);
  });
}

function openPersonInfoCard(event, person, personNode) {
  const card = document.querySelector("#person-info-card");
  if (!card) return;
  selectedPersonId = person.id;
  nodeLayer.selectAll("g.person-node")
    .classed("selected", candidate => candidate.id === person.id)
    .classed("expanded", false)
    .each(candidate => { candidate.expanded = false; });
  d3.select(personNode).raise();
  const sectionsHtml = personInformationSections(person).map(section => `
    <section class="person-info-section">
      <h3>${escapeHtml(section.title)}</h3>
      <div class="person-info-facts">${section.items.map(item => personInfoFactHtml(...item)).join("")}</div>
    </section>`).join("");
  card.dataset.personId = person.id;
  card.innerHTML = `
    <header class="person-info-header" data-person-info-drag>
      <div><span>Osoba</span><strong>${escapeHtml(personName(person))}</strong></div>
      <div class="person-info-actions">
        <button type="button" data-person-info-copy aria-label="Kopírovat všechny informace" title="Kopírovat všechny informace">${icons.copy}</button>
        <button type="button" data-person-info-close aria-label="Zavřít informace">&times;</button>
      </div>
    </header>
    <div class="person-info-scroll">${sectionsHtml}${collapsiblePersonInfoHtml(person)}</div>`;
  card.hidden = false;
  const dotRect = personNode?.querySelector(".person-dot, .node-card")?.getBoundingClientRect();
  positionPersonInfoCard(
    Number.isFinite(event?.clientX) ? event.clientX : dotRect ? dotRect.right : undefined,
    Number.isFinite(event?.clientY) ? event.clientY : dotRect ? dotRect.top : undefined
  );
}

async function copySelectedPersonInformation(button) {
  const person = people.find(candidate => candidate.id === selectedPersonId);
  if (!person) return;
  const text = personClipboardText(person);
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else throw new Error("Clipboard API není dostupné");
  } catch (_) {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  button?.classList.add("copied");
  setTimeout(() => button?.classList.remove("copied"), 900);
  showToast("Informace o osobě jsou zkopírované.");
}

function startPersonInfoCardDrag(event) {
  const card = document.querySelector("#person-info-card");
  startMapFloatingPanelDrag(event, card);
}

function startMapFloatingPanelDrag(event, panel) {
  if (event.button !== 0 || event.target.closest("button, a") || !panel || panel.hidden) return;
  event.preventDefault();
  event.stopPropagation();
  const startLeft = parseFloat(panel.style.left) || 0;
  const startTop = parseFloat(panel.style.top) || 0;
  const startX = event.clientX;
  const startY = event.clientY;
  panel.classList.add("is-dragging");
  const move = moveEvent => clampMapFloatingPanel(panel, startLeft + moveEvent.clientX - startX, startTop + moveEvent.clientY - startY);
  const end = () => {
    panel.classList.remove("is-dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, {once: true});
  window.addEventListener("pointercancel", end, {once: true});
}

function expandedPersonCardTransform(scale = savedZoom.k) {
  return `scale(${1 / Math.max(.035, scale || 1)})`;
}

const expandedPersonCardWidth = 348;

function sizeExpandedPersonCard(foreignObject) {
  if (!foreignObject || foreignObject.empty()) return;
  const measure = () => {
    foreignObject.each(function() {
      const card = this.querySelector(".node-card");
      const personNode = this.closest("g.person-node");
      if (!card || !personNode?.classList.contains("expanded")) return;
      const contentHeight = Math.ceil(card.scrollHeight || card.getBoundingClientRect().height || 0);
      const height = Math.max(98, contentHeight + 2);
      const dotRect = personNode?.querySelector(".person-dot")?.getBoundingClientRect();
      const viewportRect = document.querySelector("#map-view")?.getBoundingClientRect();
      let x = -expandedPersonCardWidth / 2;
      let y = -height / 2;
      if (dotRect && viewportRect) {
        const centerX = dotRect.left + dotRect.width / 2;
        const centerY = dotRect.top + dotRect.height / 2;
        const safeLeft = viewportRect.left + 14;
        const safeRight = viewportRect.right - 14;
        const safeTop = viewportRect.top + 88;
        const safeBottom = viewportRect.bottom - 14;
        if (centerX + x < safeLeft) x += safeLeft - (centerX + x);
        if (centerX + x + expandedPersonCardWidth > safeRight) x -= centerX + x + expandedPersonCardWidth - safeRight;
        if (centerY + y < safeTop) y += safeTop - (centerY + y);
        if (centerY + y + height > safeBottom) y -= centerY + y + height - safeBottom;
        if (height > safeBottom - safeTop) y = safeTop - centerY;
      }
      d3.select(this).attr("x", x).attr("y", y).attr("height", height);
    });
  };
  requestAnimationFrame(measure);
  setTimeout(measure, 320);
}

function updateExpandedPersonCardScale(scale = savedZoom.k) {
  nodeLayer?.selectAll("g.person-node.expanded").select("foreignObject")
    .attr("transform", expandedPersonCardTransform(scale));
}

function closeExpandedPersonInfo() {
  const card = document.querySelector("#person-info-card");
  const hadOverlay = Boolean(card && !card.hidden);
  if (card) {
    card.hidden = true;
    card.removeAttribute("data-person-id");
  }
  if (!nodeLayer) return hadOverlay;
  const expanded = nodeLayer.selectAll("g.person-node.expanded");
  const hadExpanded = hadOverlay || expanded.size() > 0 || selectedPersonId != null;
  if (!hadExpanded) return false;
  selectedPersonId = null;
  nodeLayer.selectAll("g.person-node")
    .classed("selected", false)
    .classed("expanded", false)
    .each(person => { person.expanded = false; });
  const dotsOnly = usesCompactPeopleNodes();
  nodeLayer.selectAll("foreignObject").interrupt()
    .attr("x", -53).attr("y", -15).attr("width", 106).attr("height", 30)
    .attr("transform", null)
    .style("opacity", dotsOnly ? 0 : 1)
    .style("pointer-events", dotsOnly ? "none" : "auto");
  return true;
}

function showFieldSectionInfo(event, fallbackField) {
  const point = d3.pointer(event, rootLayer.node());
  const exactRegion = activeFieldRegions.find(region => region.polygon?.length >= 3 && d3.polygonContains(region.polygon, point));
  let covering = exactRegion?.fieldEntries?.length
    ? [...exactRegion.fieldEntries]
    : activeFieldShapes.filter(field => field.contains?.(point[0], point[1]));
  if (!covering.length && fallbackField) covering = [fallbackField];
  if (!covering.length) return hideFieldSectionInfo();
  covering.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  const popover = document.querySelector("#field-section-popover");
  const view = document.querySelector("#map-view");
  if (!popover || !view) return;
  const title = fieldDimension === "tags"
    ? (covering.length > 1 ? "Překryv štítků" : "Štítek")
    : (covering.length > 1 ? "Překryv polí" : "Pole");
  popover.innerHTML = `<span data-map-panel-drag>${title}</span><div>${covering.map(field => `<b style="--section-color:${escapeHtml(field.color)}">${fieldDimension === "tags" ? "#" : ""}${escapeHtml(field.name)}</b>`).join("")}</div>`;
  popover.hidden = false;
  const bounds = view.getBoundingClientRect();
  const wantedLeft = event.clientX - bounds.left + 14;
  const wantedTop = event.clientY - bounds.top + 14;
  popover.style.left = `${Math.max(12, Math.min(bounds.width - popover.offsetWidth - 12, wantedLeft))}px`;
  popover.style.top = `${Math.max(12, Math.min(bounds.height - popover.offsetHeight - 12, wantedTop))}px`;
}

function updateAdaptiveTitleVisibility(scale = savedZoom.k) {
  if (!teamLayer) return;
  teamLayer.selectAll("g.level-2").style("opacity", 1).style("pointer-events", "auto");
  teamLayer.selectAll("g.level-1").style("opacity", 1);
  teamLayer.selectAll("g.level-0").style("opacity", 1);
  const showCompactLabels = showsPersonGraphLabels();
  const personLabelOpacity = !showCompactLabels || scale <= .52 ? 0 : scale >= .78 ? 1 : (scale - .52) / .26;
  nodeLayer?.selectAll(".person-graph-label").style("opacity", personLabelOpacity);
}

function fitMapToStructure(animate = true) {
  if (!svg || !zoomBehavior) return;
  const view = document.querySelector("#map-view");
  const width = view.clientWidth || 1000;
  const height = view.clientHeight || 650;
  const nodes = (simulation?.nodes() || []).filter(node => Number.isFinite(node.x) && Number.isFinite(node.y));
  let minX, maxX, minY, maxY;
  if (nodes.length) {
    minX = d3.min(nodes, node => node.x - nodeCollisionBox(node).halfWidth);
    maxX = d3.max(nodes, node => node.x + nodeCollisionBox(node).halfWidth);
    minY = d3.min(nodes, node => node.y - nodeCollisionBox(node).halfHeight);
    maxY = d3.max(nodes, node => node.y + nodeCollisionBox(node).halfHeight);
    if (currentMode === "field") {
      const fields = [];
      zoneLayer?.selectAll("g.field-region").each(field => fields.push(field));
      if (fields.length) {
        minX = Math.min(minX, d3.min(fields, field => field.bounds?.minX ?? field.x));
        maxX = Math.max(maxX, d3.max(fields, field => field.bounds?.maxX ?? field.x));
        minY = Math.min(minY, d3.min(fields, field => field.bounds?.minY ?? field.y));
        maxY = Math.max(maxY, d3.max(fields, field => field.bounds?.maxY ?? field.y));
      }
    }
    if (currentMode === "age") {
      const ageBounds = axisLayer?.select("rect.age-plot-bounds").datum();
      if (ageBounds) {
        minX = Math.min(minX, ageBounds.minX);
        maxX = Math.max(maxX, ageBounds.maxX);
        minY = Math.min(minY, ageBounds.minY);
        maxY = Math.max(maxY, ageBounds.maxY);
      }
    }
  } else {
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const extent = structureRadii(width, height).people + 62;
    minX = centerX - extent; maxX = centerX + extent;
    minY = centerY - extent; maxY = centerY + extent;
  }
  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const scale = Math.max(.035, Math.min(1, (width - 54) / contentWidth, (height - 54) / contentHeight));
  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;
  const transform = d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-contentCenterX, -contentCenterY);
  const target = animate ? svg.transition().duration(520).ease(d3.easeCubicOut) : svg;
  target.call(zoomBehavior.transform, transform);
}

function zoomMapToSearchResults(matches, animate = true) {
  if (!svg || !zoomBehavior || !matches.length) return;
  const view = document.querySelector("#map-view");
  const width = view?.clientWidth || 1000;
  const height = view?.clientHeight || 650;
  const positioned = matches.filter(node => Number.isFinite(node.x) && Number.isFinite(node.y));
  if (!positioned.length) return;
  const worldPadding = positioned.length === 1 ? 48 : 64;
  const minX = d3.min(positioned, node => node.x - nodeCollisionBox(node).halfWidth) - worldPadding;
  const maxX = d3.max(positioned, node => node.x + nodeCollisionBox(node).halfWidth) + worldPadding;
  const minY = d3.min(positioned, node => node.y - nodeCollisionBox(node).halfHeight) - worldPadding;
  const maxY = d3.max(positioned, node => node.y + nodeCollisionBox(node).halfHeight) + worldPadding;
  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const maximumScale = positioned.length === 1 ? 1.55 : 1.35;
  const scale = Math.max(.06, Math.min(maximumScale, (width - 110) / contentWidth, (height - 110) / contentHeight));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const transform = d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-centerX, -centerY);
  const target = animate ? svg.interrupt().transition().duration(460).ease(d3.easeCubicOut) : svg.interrupt();
  target.call(zoomBehavior.transform, transform);
}

function restoreMapZoomAfterSearch(animate = true) {
  clearTimeout(mapSearchZoomTimer);
  const restore = mapSearchRestoreByMode[currentMode];
  Object.entries(mapSearchRestoreByMode).forEach(([mode, transform]) => {
    savedZoomByMode[mode] = {...transform};
  });
  mapSearchRestoreByMode = {};
  if (!restore || !svg || !zoomBehavior) return;
  savedZoom = {...restore};
  const transform = d3.zoomIdentity.translate(restore.x, restore.y).scale(restore.k);
  const target = animate ? svg.interrupt().transition().duration(420).ease(d3.easeCubicOut) : svg.interrupt();
  target.call(zoomBehavior.transform, transform);
}

function scheduleMapSearchZoom(query, delay = 180) {
  clearTimeout(mapSearchZoomTimer);
  const needle = normalizeMapSearchValue(query);
  if (!needle) {
    restoreMapZoomAfterSearch(true);
    return;
  }
  const matches = graphPeople.filter(person => mapPersonSearchText(person).includes(needle));
  if (!matches.length) return;
  if (!mapSearchRestoreByMode[currentMode]) mapSearchRestoreByMode[currentMode] = {...savedZoom};
  mapSearchZoomTimer = setTimeout(() => {
    if (needle !== normalizeMapSearchValue(searchTerm) || activeSection !== "map") return;
    zoomMapToSearchResults(matches, true);
  }, delay);
}

function initGraphV2() {
  svg = d3.select("#map");
  rootLayer = svg.append("g").attr("class", "root-layer");
  zoneLayer = rootLayer.append("g").attr("class", "zones");
  axisLayer = rootLayer.append("g").attr("class", "axes");
  structureLinkLayer = rootLayer.append("g").attr("class", "structure-links");
  relationshipLinkLayer = rootLayer.append("g").attr("class", "relationship-links");
  teamLayer = rootLayer.append("g").attr("class", "team-nodes");
  nodeLayer = rootLayer.append("g").attr("class", "nodes");
  zoomBehavior = d3.zoom().scaleExtent([.035, 3]).on("zoom", event => {
    rootLayer.attr("transform", event.transform);
    savedZoom = {x: event.transform.x, y: event.transform.y, k: event.transform.k};
    savedZoomByMode[currentMode] = {...savedZoom};
    updateAdaptiveTitleVisibility(event.transform.k);
    updateExpandedPersonCardScale(event.transform.k);
    scheduleWorkspaceState();
  });
  svg.call(zoomBehavior);
  if (savedZoom.x || savedZoom.y || savedZoom.k !== 1) svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(savedZoom.x, savedZoom.y).scale(savedZoom.k));
  svg.on("click.close-card", closeExpandedPersonInfo);
  renderGraphV2();
  if (needsInitialStructureFit) {
    needsInitialStructureFit = false;
    requestAnimationFrame(() => fitMapToStructure(false));
  }
  new ResizeObserver(() => {
    updateModeV2(currentMode, false);
    ["#person-info-card", "#field-section-popover", "#unit-action-popover"].forEach(selector => {
      const panel = document.querySelector(selector);
      if (panel && !panel.hidden) clampMapFloatingPanel(panel, parseFloat(panel.style.left) || 12, parseFloat(panel.style.top) || 12);
    });
  }).observe(document.querySelector("#map-view"));
}

function renderGraphV2() {
  if (simulation) simulation.stop();
  const mapView = document.querySelector("#map-view");
  const graphIsVisible = mapView.clientWidth > 1 && mapView.clientHeight > 1;
  const width = mapView.clientWidth || graphViewport.width || 1000;
  const height = mapView.clientHeight || graphViewport.height || 650;
  graphViewport = {width, height};
  stableSimulationTicks = 0;
  const oldPositions = new Map();
  nodeLayer?.selectAll("g.person-node").each(d => oldPositions.set(d.uid, [d.x, d.y]));
  teamLayer?.selectAll("g.team-node").each(d => oldPositions.set(d.uid, [d.x, d.y]));
  const layout = teamPositions(width, height);
  const orbitTargets = personOrbitTargets(width, height, layout);
  const savedPositions = positionCache[currentMode] || {};
  graphPeople.forEach((person, index) => {
    person.nodeType = "person";
    person.uid = `person-${person.id}`;
    const old = oldPositions.get(person.uid) ?? savedPositions[person.uid];
    const home = orbitTargets.get(person.id) ?? [width / 2, height / 2];
    person.x = old?.[0] ?? home[0];
    person.y = old?.[1] ?? home[1];
    person.expanded = false;
  });
  graphTeams.forEach(team => {
    const old = oldPositions.get(team.uid) ?? savedPositions[team.uid];
    const target = layout.get(team.id) ?? [width / 2, height / 2];
    team.x = old?.[0] ?? target[0];
    team.y = old?.[1] ?? target[1];
  });

  const visibleTeamIds = new Set(graphTeams.map(team => team.id));
  const visiblePersonIds = new Set(graphPeople.map(person => person.id));
  const hierarchyLinks = connectionFilters.hierarchy ? graphTeams
    .filter(team => team.parent_id && visibleTeamIds.has(team.parent_id))
    .map(team => ({source: `team-${team.parent_id}`, target: team.uid, kind: "hierarchy"})) : [];
  const assignmentLinks = connectionFilters.assignment ? graphPeople
    .filter(person => person.org_team_id && visibleTeamIds.has(+person.org_team_id))
    .map(person => ({source: `team-${person.org_team_id}`, target: person.uid, kind: "assignment"})) : [];
  const membershipLinks = connectionFilters.membership ? graphPeople.flatMap(person => {
    const primary = teamById(person.org_team_id);
    return (person.unitIds || [])
      .filter(teamId => visibleTeamIds.has(+teamId) && teamId !== person.org_team_id && +teamId !== primary?.parent_id)
      .map(teamId => ({source: `team-${teamId}`, target: person.uid, kind: "membership"}));
  }) : [];
  const relationshipLinks = connectionFilters.relationship ? relationships
    .filter(link => !hiddenRelationshipTypes.includes(link.type || "bez typu") && visiblePersonIds.has(link.source) && visiblePersonIds.has(link.target))
    .map(link => ({source: `person-${link.source}`, target: `person-${link.target}`, kind: "relationship", type: link.type})) : [];
  const structureLinks = [...hierarchyLinks, ...assignmentLinks, ...membershipLinks];
  structureGraphLinks = structureLinks;
  relationshipGraphLinks = relationshipLinks;
  allGraphLinks = [...structureLinks, ...relationshipLinks];

  structureLinkLayer.selectAll("line").data(structureLinks).join("line")
    .attr("class", d => `structure-link ${d.kind}`)
    .style("--link-color", structureLinkColor);
  relationshipLinkLayer.selectAll("line").data(relationshipLinks).join("line").attr("class", "relationship-link");

  const nodes = nodeLayer.selectAll("g.person-node").data(graphPeople, d => d.id).join(enter => {
    const group = enter.append("g").attr("class", "person-node");
    group.append("circle").attr("class", "person-unit-ring").attr("r", 10);
    group.append("circle").attr("class", "person-dot").attr("r", 7);
    group.append("text").attr("class", "person-graph-label").attr("text-anchor", "middle").attr("x", 0).attr("y", -18);
    group.append("text").attr("class", "person-tags-label").attr("text-anchor", "middle").attr("y", 27);
    group.append("title");
    group.append("foreignObject").attr("x", -53).attr("y", -15).attr("width", 106).attr("height", 30).html(d => nodeHtmlV2(d));
    return group;
  });
  nodes.select("foreignObject").attr("x", -53).attr("y", -15).attr("width", 106).attr("height", 30).attr("transform", null).html(d => nodeHtmlV2(d));
  nodes.style("--node-color", selectedPersonColor)
    .style("--cluster-color", d => unitClusterColor(teamById(graphHomeTeamId(d))));
  nodes.select(".person-graph-label")
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("y", -18)
    .text(d => personName(d))
    .each(function(d) {
      const fallbackWidth = estimatedPersonLabelWidth(d);
      d.labelWidth = Math.max(fallbackWidth, Math.ceil(this.getComputedTextLength()) + 16);
    });
  nodes.select(".person-tags-label").text(d => d.tagsArray.slice(0, 2).map(tag => `#${tag}`).join(" · "));
  nodes.select("title").text(d => `${personName(d)} · ${birthDateLabel(d.birth_date)} · ${ageLabel(d.age)} · ${d.org_team || "bez primární jednotky"} · ${d.jednotky || "bez jednotky"}`);
  nodes.selectAll(".node-action-link")
    .on("pointerdown", event => event.stopPropagation())
    .on("click", event => event.stopPropagation());
  nodes.on("pointerenter.readable-label", function() {
    d3.select(this).raise();
  }).on("click", function(event, d) {
    event.stopPropagation();
    hideFieldSectionInfo();
    openPersonInfoCard(event, d, this);
  }).call(graphDragBehavior());
  nodes.select(".node-edit")
    .on("pointerdown", event => event.stopPropagation())
    .on("click", (event, d) => {
      event.stopPropagation();
      closeExpandedPersonInfo();
      openPersonModal(d.id);
    });
  nodes.selectAll(".node-close").on("click", event => { event.stopPropagation(); closeExpandedPersonInfo(); });

  const teamNodes = teamLayer.selectAll("g.team-node").data(graphTeams, d => d.id).join(enter => {
    const group = enter.append("g").attr("class", d => `team-node level-${d.level}`);
    group.append("rect");
    group.append("image")
      .attr("class", "team-node-logo")
      .attr("href", skuptakV1DataUrl)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("aria-hidden", "true")
      .style("display", "none");
    group.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "middle");
    group.append("title");
    return group;
  });
  teamNodes.attr("class", d => `team-node level-${d.level}${d.level === 1 && d.parent_id == null ? " standalone" : ""}${isSkuptaciCenterNode(d) ? " skuptaci-center" : ""}`);
  teamNodes.style("--unit-color", d => d.level > 0 ? unitClusterColor(d) : (teamGraphColor(d) || null)).classed("custom-color", d => d.level > 0 || Boolean(teamGraphColor(d)));
  applyAdaptiveTeamTitles(teamNodes, width);
  updateAdaptiveTitleVisibility();
  teamNodes.on("click", (event, team) => {
    event.stopPropagation();
    showUnitActionPopover(event, team);
  })
    .call(graphDragBehavior());

  const initialNodes = [...graphTeams, ...graphPeople];
  simulation = d3.forceSimulation(initialNodes)
    .alphaDecay(.026)
    .alphaMin(.0025)
    .velocityDecay(.32)
    .force("link", d3.forceLink(allGraphLinks).id(d => d.uid).distance(automaticLinkDistance).strength(.08).iterations(2))
    .force("hierarchyGuide", hierarchyGuideForce(width, height))
    .force("clusterSeparation", clusterSeparationForce())
    .force("personGroupSeparation", interGroupPersonSeparationForce())
    .force("originSeparation", unitOriginSeparationForce())
    .force("charge", d3.forceManyBody().strength(d => d.nodeType === "team" ? -180 : -52).distanceMin(30).distanceMax(1500).theta(.9))
    .force("center", d3.forceCenter(width / 2, height / 2 + 18).strength(.04))
    .force("collide", collisionForceV2())
    .on("tick", () => {
      const activeNodes = simulation.nodes();
      updateGraphGeometry();
      settleSimulationWhenStill(activeNodes);
    })
    .on("end", () => {
      enforceNoNodeOverlap(simulation.nodes(), 12);
      resolveStructureClusterBuffers(simulation.nodes(), 1, 30);
      updateGraphGeometry();
      simulation.nodes().forEach(node => { node.vx = 0; node.vy = 0; });
      persistWorkspaceState(true);
    });
  if (graphIsVisible) updateModeV2(currentMode, false);
  else simulation.stop();
  applySearch();
  persistWorkspaceState(true);
}

function updateModeV2(mode, animate = true) {
  if (!simulation) return;
  const mapView = document.querySelector("#map-view");
  if (mapView.clientWidth < 2 || mapView.clientHeight < 2) {
    simulation.stop();
    return;
  }
  const viewChanged = mode !== currentMode;
  if (viewChanged) captureGraphPositions(currentMode);
  clearOddilReachHighlight({hideInfo: true});
  currentMode = mode;
  if (mode !== "field") {
    activeFieldRegions = [];
    activeFieldShapes = [];
    hideFieldSectionInfo();
  }
  svg.attr("data-mode", mode).attr("data-field-dimension", mode === "field" ? fieldDimension : null);
  syncPrimaryNavigation();
  syncFieldDimensionControls();
  syncSectionHeader();
  document.querySelector("#field-toolbar").classList.toggle("visible", mode === "field");
  const mapHint = document.querySelector(".map-hint");
  if (mapHint) mapHint.textContent = mode === "field" && fieldDimension === "oddil"
    ? "Najet na oddíl = ukázat dosah · kliknout = připnout · Esc = zavřít"
    : mode === "age"
      ? "Věk je vypočítaný z data narození · každý bod je člověk · kliknout pro detail"
      : "Přetáhnout · kliknout pro detail";
  syncFieldTagPickerVisibility();
  const width = mapView.clientWidth;
  const height = mapView.clientHeight;
  graphViewport = {width, height};
  if (viewChanged && zoomBehavior) {
    savedZoom = {...(savedZoomByMode[mode] || {x: 0, y: 0, k: 1})};
    svg.interrupt().call(zoomBehavior.transform, d3.zoomIdentity.translate(savedZoom.x, savedZoom.y).scale(savedZoom.k));
  }
  if (viewChanged && mode === "network") restoreNetworkLayout(width, height);
  stableSimulationTicks = 0;
  applyAdaptiveTeamTitles(teamLayer.selectAll("g.team-node"), width);
  updateAdaptiveTitleVisibility();
  zoneLayer.selectAll("*").remove();
  axisLayer.selectAll("*").remove();
  const dotsOnly = usesCompactPeopleNodes(mode);
  nodeLayer.selectAll("foreignObject").transition().duration(animate ? 320 : 0).style("opacity", dotsOnly ? 0 : 1).style("pointer-events", dotsOnly ? "none" : "auto");
  nodeLayer.selectAll("circle.person-dot")
    .attr("r", mode === "field" && fieldDimension === "oddil" ? 5.5 : 7)
    .transition().duration(animate ? 320 : 0).style("opacity", dotsOnly ? 1 : 0);
  nodeLayer.selectAll("circle.person-unit-ring").transition().duration(animate ? 320 : 0).style("opacity", mode === "network" && displayOptions.primary ? .82 : 0);
  nodeLayer.selectAll(".person-tags-label").transition().duration(animate ? 240 : 0).style("opacity", displayOptions.tags && !dotsOnly ? 1 : 0);
  nodeLayer.selectAll("g.person-node")
    .style("display", null)
    .style("--node-color", selectedPersonColor)
    .style("--cluster-color", person => unitClusterColor(teamById(graphHomeTeamId(person))));
  relationshipLinkLayer.selectAll("line").style("display", null);
  if (selectedPersonId != null && !graphPeople.some(person => person.id === selectedPersonId)) closeExpandedPersonInfo();
  nodeLayer.selectAll("g.person-node")
    .classed("selected", person => person.id === selectedPersonId)
    .classed("expanded", false)
    .each(d => { d.expanded = false; });
  nodeLayer.selectAll("foreignObject").attr("x", -53).attr("y", -15).attr("width", 106).attr("height", 30).attr("transform", null);
  updateAdaptiveTitleVisibility(savedZoom.k);

  if (mode === "network") {
    simulation.alphaDecay(.026).alphaMin(.0025).velocityDecay(.32);
    graphTeams.forEach(team => { team.fx = null; team.fy = null; });
    graphPeople.forEach(person => { person.fx = null; person.fy = null; });
    simulation.nodes(displayOptions.primary ? [...graphTeams, ...graphPeople] : graphPeople);
    simulation.force("link").links(displayOptions.primary ? allGraphLinks : (displayOptions.secondary ? relationshipGraphLinks : []));
    teamLayer.transition().duration(animate ? 420 : 0).style("opacity", displayOptions.primary && displayOptions.titles ? 1 : 0).style("pointer-events", displayOptions.primary && displayOptions.titles ? "auto" : "none");
    structureLinkLayer.transition().duration(animate ? 420 : 0).style("opacity", displayOptions.primary ? 1 : 0);
    relationshipLinkLayer.transition().duration(animate ? 420 : 0).style("opacity", displayOptions.secondary ? (displayOptions.primary ? .13 : .42) : 0);
    const radii = structureRadii(width, height);
    if (displayOptions.primary) {
      const orbitRadii = graphFilters.unitId && teamById(graphFilters.unitId)?.level > 0 ? [] : [radii.oddil];
      zoneLayer.selectAll("circle.structure-orbit").data(orbitRadii).join("circle")
        .attr("class", "orbit-ring structure-orbit")
        .attr("cx", width / 2)
        .attr("cy", height / 2 + 20)
        .attr("r", radius => radius)
        .style("opacity", 0)
        .transition().duration(animate ? 520 : 0).style("opacity", 1);
      const peopleByUnit = d3.group(graphPeople, person => +(graphHomeTeamId(person) || 0));
      const clusterHalos = graphTeams.filter(team => team.level > 0 && peopleByUnit.has(team.id)).map(team => ({
        team,
        members: peopleByUnit.get(team.id),
        color: unitClusterColor(team)
      }));
      zoneLayer.selectAll("path.unit-cluster-halo").data(clusterHalos, cluster => cluster.team.id).join("path")
        .attr("class", "unit-cluster-halo")
        .attr("d", structureClusterHaloPath)
        .style("--cluster-color", cluster => cluster.color || "#777b74");
    }
    simulation.force("link").distance(automaticLinkDistance).strength(link => {
      if (link.kind === "relationship") return displayOptions.secondary ? (displayOptions.primary ? .035 : .22) * physicsSettings.linkForce : 0;
      if (!displayOptions.primary) return 0;
      // Additional memberships stay visible, but must not pull a person's
      // home cluster through another cluster's protected envelope.
      if (link.kind === "membership") return .018 * physicsSettings.linkForce;
      if (link.kind === "hierarchy") {
        const child = link.target?.nodeType === "team" ? link.target : link.source;
        return (child?.level === 2 ? .72 : .42) * physicsSettings.linkForce;
      }
      return .32 * physicsSettings.linkForce;
    }).iterations(2);
    simulation.force("clusterSeparation", displayOptions.primary ? clusterSeparationForce() : null);
    simulation.force("personGroupSeparation", displayOptions.primary ? interGroupPersonSeparationForce() : null);
    simulation.force("originSeparation", displayOptions.primary ? unitOriginSeparationForce() : null);
    simulation.force("hierarchyGuide", displayOptions.primary ? hierarchyGuideForce(width, height) : null);
    simulation.force("charge", d3.forceManyBody().strength(node => node.nodeType === "team" ? -18 * physicsSettings.repel : -5.2 * physicsSettings.repel).distanceMin(30).distanceMax(displayOptions.primary ? 1600 : 900).theta(.9));
    simulation.force("center", displayOptions.primary ? null : d3.forceCenter(width / 2, height / 2 + 20).strength(.04));
    simulation.force("radial", null);
    simulation.force("x", displayOptions.primary ? null : d3.forceX(width / 2).strength(.004 + physicsSettings.center * .02));
    simulation.force("y", displayOptions.primary ? null : d3.forceY(height / 2 + 20).strength(.004 + physicsSettings.center * .02));
    simulation.force("bounds", null);
  } else if (mode === "field") {
    graphTeams.forEach(team => { team.fx = null; team.fy = null; });
    teamLayer.transition().duration(animate ? 320 : 0).style("opacity", 0);
    structureLinkLayer.transition().duration(animate ? 320 : 0).style("opacity", 0);
    relationshipLinkLayer.transition().duration(animate ? 320 : 0).style("opacity", displayOptions.secondary ? .32 : 0);
    // Oddíl memberships can form combinations that one rectangle per set
    // cannot express without false overlaps or per-person holes. Route only
    // this view through exact membership regions; all other Field views keep
    // their existing rectangular layout and behaviour.
    const {fields, regions, targets} = fieldDimension === "oddil"
      ? singleShapeFieldLayout(width, height)
      : rectangularFieldLayout(width, height);
    activeFieldRegions = regions;
    activeFieldShapes = fields;
    hideFieldSectionInfo();
    const visibleFieldPeople = new Set(targets.keys());
    nodeLayer.selectAll("g.person-node")
      .style("display", person => visibleFieldPeople.has(person.id) ? null : "none")
      .style("--node-color", selectedPersonColor);
    relationshipLinkLayer.selectAll("line").style("display", link =>
      visibleFieldPeople.has(graphPersonId(link.source)) && visibleFieldPeople.has(graphPersonId(link.target)) ? null : "none"
    );
    if (displayOptions.categories || displayOptions.titles) {
      const zone = zoneLayer.selectAll("g.field-region").data(fields, field => field.name).join("g")
        .attr("class", "field-region")
        .style("--field-color", field => field.color)
        .style("opacity", 0);
      if (displayOptions.categories) zone.each(function(field) {
        d3.select(this).selectAll("path.field-shape")
          .data([field], item => item.name)
          .join("path")
          .attr("class", "field-shape")
          .attr("d", item => item.path)
          .attr("fill", field.color)
          .attr("stroke", "none")
          .on("pointerenter", () => previewOddilReach(field))
          .on("pointerleave", () => stopOddilReachPreview(field))
          .on("click", event => {
            event.stopPropagation();
            closeExpandedPersonInfo();
            if (!toggleOddilReach(event, field)) showFieldSectionInfo(event, field);
          });
        d3.select(this).selectAll("path.field-outline")
          .data([field], item => item.name)
          .join("path")
          .attr("class", "field-outline")
          .attr("d", item => item.outlinePath)
          .attr("fill", "none")
          .attr("stroke", field.color);
      });
      if (displayOptions.titles) {
        const titles = addAdaptiveFieldTitles(zone, width, fields);
        if (fieldDimension === "oddil") titles
          .on("pointerenter", (event, field) => previewOddilReach(field))
          .on("pointerleave", (event, field) => stopOddilReachPreview(field))
          .on("click", (event, field) => {
            event.stopPropagation();
            closeExpandedPersonInfo();
            toggleOddilReach(event, field);
          });
      }
      zone.transition().duration(animate ? 600 : 0).style("opacity", 1);
    }
    applyStaticGraphLayout(targets, animate && !viewChanged);
    clearTimeout(graphFitTimer);
    graphFitTimer = setTimeout(() => {
      if (currentMode === "field") fitMapToStructure(animate);
    }, animate ? 520 : 20);
  } else {
    graphTeams.forEach(team => { team.fx = null; team.fy = null; });
    teamLayer.transition().duration(animate ? 250 : 0).style("opacity", 0);
    structureLinkLayer.transition().duration(animate ? 250 : 0).style("opacity", 0);
    relationshipLinkLayer.transition().duration(animate ? 250 : 0).style("opacity", displayOptions.secondary ? .16 : 0);
    const ageLayout = ageGraphLayout(width, height);
    axisLayer.append("rect")
      .datum(ageLayout.bounds)
      .attr("class", "age-plot-bounds")
      .attr("x", ageLayout.bounds.minX)
      .attr("y", ageLayout.bounds.minY)
      .attr("width", ageLayout.bounds.maxX - ageLayout.bounds.minX)
      .attr("height", ageLayout.bounds.maxY - ageLayout.bounds.minY);
    axisLayer.append("text")
      .attr("class", "age-plot-heading")
      .attr("x", ageLayout.bounds.minX + 46)
      .attr("y", 42)
      .text("Věk lidí");
    axisLayer.append("text")
      .attr("class", "age-plot-note")
      .attr("x", ageLayout.bounds.minX + 46)
      .attr("y", 59)
      .text("Každý bod představuje jednoho člověka");
    axisLayer.append("g")
      .attr("class", "age-axis age-axis-graph")
      .attr("transform", `translate(0,${ageLayout.axisY})`)
      .call(d3.axisBottom(ageLayout.scale)
        .ticks(ageLayout.tickCount)
        .tickFormat(value => `${value}`)
        .tickSize(-(ageLayout.axisY - ageLayout.top))
        .tickPadding(12));
    axisLayer.append("text")
      .attr("class", "age-axis-title")
      .attr("x", ageLayout.right)
      .attr("y", ageLayout.axisY + 48)
      .attr("text-anchor", "end")
      .text("věk v letech");
    if (ageLayout.unknown.length) {
      axisLayer.append("line")
        .attr("class", "age-unknown-divider")
        .attr("x1", ageLayout.right + 38)
        .attr("x2", ageLayout.right + 38)
        .attr("y1", ageLayout.top - 18)
        .attr("y2", ageLayout.axisY);
      axisLayer.append("text")
        .attr("class", "age-unknown-title")
        .attr("x", ageLayout.unknownStartX)
        .attr("y", ageLayout.top - 18)
        .text(`Věk neuveden · ${ageLayout.unknown.length}`);
    }
    nodeLayer.selectAll("circle.person-dot").attr("r", 6.5);
    applyStaticGraphLayout(ageLayout.targets, animate && !viewChanged);
    clearTimeout(graphFitTimer);
    graphFitTimer = setTimeout(() => {
      if (currentMode === "age") fitMapToStructure(animate);
    }, animate ? 520 : 20);
  }
  if (mode === "network") {
    simulation.force("collide", collisionForceV2()).alpha(animate ? .42 : .2).restart();
  }
  if (needsInitialStructureFit) {
    needsInitialStructureFit = false;
    requestAnimationFrame(() => fitMapToStructure(false));
  }
  if (normalizeMapSearchValue(searchTerm)) applySearch(mode === "network" ? 240 : 620);
  persistWorkspaceState(false);
}

function dragStart(event, d) {
  if (currentMode !== "network") return;
  d.dragGesture = {
    pointerX: event.x,
    pointerY: event.y,
    nodeX: d.x,
    nodeY: d.y,
    moved: false
  };
}

function dragged(event, d) {
  if (currentMode !== "network") return;
  const gesture = d.dragGesture || {
    pointerX: event.x,
    pointerY: event.y,
    nodeX: d.x,
    nodeY: d.y,
    moved: false
  };
  d.dragGesture = gesture;
  if (!gesture.moved) {
    if (Math.hypot(event.x - gesture.pointerX, event.y - gesture.pointerY) < 4) return;
    gesture.moved = true;
    stableSimulationTicks = 0;
    simulation.alphaTarget(.16).restart();
    d.fx = gesture.nodeX;
    d.fy = gesture.nodeY;
  }
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnd(event, d) {
  if (currentMode !== "network") return;
  const moved = Boolean(d.dragGesture?.moved);
  delete d.dragGesture;
  if (!moved) return;
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
  persistWorkspaceState(true);
}

function graphDragBehavior() {
  return d3.drag()
    .clickDistance(4)
    .on("start", dragStart)
    .on("drag", dragged)
    .on("end", dragEnd);
}

async function renameTeam(team) {
  const kind = team.level === 1 ? "oddílu" : "družiny";
  const nextName = window.prompt(`Zadejte název ${kind}:`, team.name)?.trim();
  if (!nextName || nextName === team.name) return;
  persistWorkspaceState(true);
  db.run("UPDATE teams SET name=? WHERE id=?", [nextName, team.id]);
  await persistDatabase();
  await loadPeople();
  renderGraphV2();
  fillCategoryOptions();
  renderEditDashboard();
  showToast(`Název ${kind} je uložený.`);
}

function normalizeMapSearchValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs")
    .trim();
}

function mapPersonSearchText(person) {
  return normalizeMapSearchValue([
    personName(person), person.nickname, person.role, person.category,
    person.registration_category, person.org_team, person.jednotky,
    person.oddily, person.city, person.email, person.notes, person.tags, person.birth_date,
    birthDateLabel(person.birth_date), ageLabel(person.age)
  ].join(" "));
}

function mapSearchCountLabel(count) {
  if (count === 1) return "1 člověk";
  if (count >= 2 && count <= 4) return `${count} lidé`;
  return `${count} lidí`;
}

function buildMapSearchSuggestions(query) {
  const needle = normalizeMapSearchValue(query);
  if (!needle) return [];
  const visiblePeople = graphPeople || [];
  const personItems = visiblePeople.map(person => {
    const name = personName(person);
    const normalizedName = normalizeMapSearchValue(name);
    const normalizedNickname = normalizeMapSearchValue(person.nickname);
    const haystack = mapPersonSearchText(person);
    let score = 99;
    if (normalizedName.startsWith(needle)) score = 0;
    else if (normalizedNickname.startsWith(needle)) score = 1;
    else if (normalizedName.split(/\s+/).some(part => part.startsWith(needle))) score = 2;
    else if (normalizedName.includes(needle) || normalizedNickname.includes(needle)) score = 3;
    else if (haystack.includes(needle)) score = 4;
    return {person, name, score};
  }).filter(item => item.score < 99)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "cs"))
    .slice(0, 6)
    .map(({person, name}) => ({
      kind: "person",
      label: name,
      value: name,
      personId: person.id,
      meta: [person.nickname, person.role, person.org_team || person.oddily].filter(Boolean).join(" · ") || "Člověk"
    }));

  const facets = new Map();
  function addFacet(kind, value, label = value) {
    const clean = String(value || "").trim();
    const normalized = normalizeMapSearchValue(clean);
    if (!clean || !normalized.includes(needle)) return;
    const key = `${kind}:${normalized}`;
    const existing = facets.get(key);
    if (existing) existing.count += 1;
    else facets.set(key, {kind, label, value: clean, normalized, count: 1});
  }
  visiblePeople.forEach(person => {
    addFacet("role", person.role);
    addFacet("city", person.city);
    addFacet("category", person.category);
    (person.tagsArray || []).forEach(tag => addFacet("tag", tag, `#${tag}`));
    const units = new Set([
      person.org_team,
      ...(person.oddilNames || []),
      ...(person.unitNames || [])
    ].filter(Boolean));
    units.forEach(unit => addFacet("unit", unit));
  });
  const kindLabels = {tag: "Štítek", role: "Role", city: "Město", category: "Kategorie", unit: "Jednotka"};
  const facetItems = [...facets.values()]
    .sort((a, b) => Number(!a.normalized.startsWith(needle)) - Number(!b.normalized.startsWith(needle)) || b.count - a.count || a.label.localeCompare(b.label, "cs"))
    .map(item => ({...item, meta: `${kindLabels[item.kind]} · ${mapSearchCountLabel(item.count)}`}));
  return [...personItems, ...facetItems].slice(0, 9);
}

function setActiveMapSearchSuggestion(index) {
  const panel = document.querySelector("#map-search-suggestions");
  const input = document.querySelector("#search");
  if (!panel || !mapSearchSuggestions.length) return;
  activeMapSearchSuggestion = (index + mapSearchSuggestions.length) % mapSearchSuggestions.length;
  panel.querySelectorAll("[data-map-search-index]").forEach((item, itemIndex) => {
    const active = itemIndex === activeMapSearchSuggestion;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    if (active) item.scrollIntoView({block: "nearest"});
  });
  input?.setAttribute("aria-activedescendant", `map-search-suggestion-${activeMapSearchSuggestion}`);
}

function hideMapSearchSuggestions() {
  const panel = document.querySelector("#map-search-suggestions");
  const input = document.querySelector("#search");
  if (panel) panel.hidden = true;
  input?.setAttribute("aria-expanded", "false");
  input?.removeAttribute("aria-activedescendant");
  activeMapSearchSuggestion = -1;
}

function renderMapSearchSuggestions(query = searchTerm) {
  const panel = document.querySelector("#map-search-suggestions");
  const input = document.querySelector("#search");
  if (!panel || !input || !normalizeMapSearchValue(query)) return hideMapSearchSuggestions();
  mapSearchSuggestions = buildMapSearchSuggestions(query);
  activeMapSearchSuggestion = -1;
  panel.innerHTML = mapSearchSuggestions.length
    ? mapSearchSuggestions.map((item, index) => `<button type="button" id="map-search-suggestion-${index}" role="option" aria-selected="false" data-map-search-index="${index}"><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.meta)}</small></span><em>${item.kind === "person" ? "Osoba" : "Filtr"}</em></button>`).join("")
    : '<div class="map-search-empty">Žádná shoda v aktuální mapě.</div>';
  panel.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function chooseMapSearchSuggestion(index) {
  const item = mapSearchSuggestions[index];
  if (!item) return;
  closeExpandedPersonInfo();
  searchTerm = item.value;
  const input = document.querySelector("#search");
  if (input) input.value = searchTerm;
  applySearch();
  if (item.personId != null) {
    selectedPersonId = item.personId;
    nodeLayer?.selectAll("g.person-node").classed("selected", person => person.id === item.personId);
  }
  hideMapSearchSuggestions();
  persistWorkspaceState(false);
}

function applySearch(zoomDelay = 180) {
  const q = normalizeMapSearchValue(searchTerm);
  nodeLayer?.selectAll("g.person-node").classed("is-dimmed", d => q && !mapPersonSearchText(d).includes(q));
  scheduleMapSearchZoom(q, zoomDelay);
}

function syncPrimaryNavigation() {
  document.querySelectorAll(".nav-button").forEach(button => {
    const active = button.dataset.section === "sql"
      ? activeSection === "sql"
      : activeSection === "map" && button.dataset.viewMode === currentMode;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function syncFieldDimensionControls() {
  document.querySelectorAll("[data-field]").forEach(button => {
    const isSidebarButton = button.classList.contains("field-subnav-button");
    const active = button.dataset.field === fieldDimension && (!isSidebarButton || (activeSection === "map" && currentMode === "field"));
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    if (isSidebarButton && active) button.setAttribute("aria-current", "page");
    else if (isSidebarButton) button.removeAttribute("aria-current");
  });
}

function syncFieldSidebarExpansion() {
  const group = document.querySelector("#nav-field-group");
  const toggle = document.querySelector("#field-subnav-toggle");
  if (!group || !toggle) return;
  group.classList.toggle("expanded", fieldSidebarExpanded);
  toggle.setAttribute("aria-expanded", String(fieldSidebarExpanded));
  toggle.setAttribute("aria-label", fieldSidebarExpanded ? "Sbalit kategorie Field" : "Rozbalit kategorie Field");
}

function syncSectionHeader() {
  const kicker = document.querySelector("#section-kicker");
  const title = document.querySelector("#section-title");
  if (!kicker || !title) return;
  if (activeSection === "sql") {
    kicker.textContent = "SQLite databáze";
    title.textContent = "Ptejte se dat";
    return;
  }
  const headings = {
    network: ["Struktura", "Kdo tvoří středisko?"],
    field: ["Field", "Pole a jejich průniky"],
    age: ["Věk", "Věkové rozložení"]
  };
  [kicker.textContent, title.textContent] = headings[currentMode] || headings.network;
}

function showSection(section) {
  if (section !== "map" && section !== "sql") section = "map";
  activeSection = section;
  syncPrimaryNavigation();
  syncFieldDimensionControls();
  const isMap = section === "map";
  document.querySelector("#map-view").style.display = isMap ? "block" : "none";
  document.querySelector("#edit-view").style.display = "none";
  document.querySelector("#sql-view").style.display = section === "sql" ? "block" : "none";
  document.querySelector("#search").closest(".search-wrap").style.display = isMap ? "block" : "none";
  syncSectionHeader();
  syncExportMenu();
  if (!isMap) {
    simulation?.stop();
    hideMapSearchSuggestions();
    hideUnitActionPopover();
  }
  if (isMap) setTimeout(() => updateModeV2(currentMode, false), 20);
  persistWorkspaceState(true);
}

function renderEditDashboard() {
  const target = document.querySelector("#edit-dashboard");
  if (!target || !db) return;
  editorAutosaveTimers.forEach(timer => clearTimeout(timer));
  editorAutosaveTimers.clear();
  const root = teams.find(team => team.level === 0);
  const oddily = teams.filter(team => team.level === 1);
  const pickerBaseLabels = new Map(people.map(person => [person.id, [
    personName(person),
    person.nickname ? `(${person.nickname})` : "",
    person.role,
    person.org_team
  ].filter(Boolean).join(" · ")]));
  const pickerLabelCounts = d3.rollup(people, members => members.length, person => normalizeImportText(pickerBaseLabels.get(person.id)));
  const personOptions = people.map(person => {
    const base = pickerBaseLabels.get(person.id);
    const label = pickerLabelCounts.get(normalizeImportText(base)) > 1 ? `${base} · #${person.id}` : base;
    return `<option value="${escapeHtml(label)}" data-person-id="${person.id}"></option>`;
  }).join("");
  const structure = oddily.map(oddil => {
    const children = teams.filter(team => team.parent_id === oddil.id);
    const teamIds = new Set([oddil.id, ...children.map(team => team.id)]);
    const isStandalone = oddil.parent_id == null;
    const memberCount = people.filter(person => teamIds.has(person.org_team_id) || person.oddilIds?.includes(oddil.id)).length;
    return `<div class="structure-group" data-oddil-group="${oddil.id}">
      <div class="editor-row strong-row" data-team-id="${oddil.id}"><span class="row-kind">${isStandalone ? "Základní uzel" : "Oddíl"}</span><input value="${escapeHtml(oddil.name)}" aria-label="Název ${isStandalone ? "základního uzlu" : "oddílu"}"><span class="autosave-state" aria-live="polite"></span><button type="button" class="icon-button danger" data-action="delete-team" title="Smazat">×</button></div>
      <div class="structure-summary">${isStandalone ? "Samostatný · " : ""}${children.length} ${children.length === 1 ? "družina" : "družin"} · ${memberCount} ${memberCount === 1 ? "člověk" : "lidí"}</div>
      ${children.map(team => `<div class="editor-row child-row" data-team-id="${team.id}"><span class="row-kind">Družina</span><input value="${escapeHtml(team.name)}" aria-label="Název družiny"><span class="autosave-state" aria-live="polite"></span><button type="button" class="icon-button danger" data-action="delete-team" title="Smazat">×</button></div>`).join("") || '<div class="empty-line child-empty">Zatím bez družin.</div>'}
      <form class="inline-form add-child-form" data-editor-form="add-druzina">
        <input type="hidden" name="parent_id" value="${oddil.id}">
        <span class="tree-add-mark" aria-hidden="true">+</span>
        <input name="name" placeholder="Nová družina · název volitelný" aria-label="Název nové družiny v oddílu ${escapeHtml(oddil.name || "bez názvu")}">
        <button class="secondary-button" type="submit">Přidat družinu</button>
      </form>
    </div>`;
  }).join("");
  target.innerHTML = `
    <div class="autosave-banner"><i></i><span>Změny názvů, barev a štítků se ukládají automaticky.</span></div>
    <article class="editor-card editor-wide">
      <div class="editor-head"><div><span class="eyebrow">Hierarchie</span><h2>Středisko · oddíly · družiny</h2></div><span class="count-badge">${teams.length} uzlů</span></div>
      <div class="editor-body">
        ${root ? `<div class="editor-row root-row" data-team-id="${root.id}"><span class="row-kind">Titulek</span><input value="${escapeHtml(root.name)}" aria-label="Název střediska"><span class="autosave-state" aria-live="polite"></span></div>` : ""}
        <div class="structure-add-actions">
          <form class="inline-form add-oddil-form" data-editor-form="add-oddil"><span class="row-kind">Středisko</span><input name="name" placeholder="Nový oddíl · název volitelný" aria-label="Název nového oddílu"><button class="secondary-button" type="submit">Přidat oddíl</button></form>
          <form class="inline-form add-oddil-form add-base-form" data-editor-form="add-base"><span class="row-kind">Samostatně</span><input name="name" placeholder="Nový základní uzel · název volitelný" aria-label="Název samostatného základního uzlu"><button class="secondary-button" type="submit">Přidat uzel</button></form>
        </div>
        <div class="structure-list">${structure || '<div class="empty-line">Přidejte první oddíl.</div>'}</div>
      </div>
    </article>
    <article class="editor-card">
      <div class="editor-head"><div><span class="eyebrow">Vlastní pole</span><h2>Kategorie</h2></div><span class="count-badge">${categoriesData.length}</span></div>
      <div class="editor-body compact-list">
        ${categoriesData.map(category => `<div class="editor-row category-row" data-category-id="${category.id}"><input class="color-input" type="color" value="${escapeHtml(category.color || "#6ba29b")}" aria-label="Barva"><input value="${escapeHtml(category.name)}" aria-label="Název kategorie"><span class="autosave-state" aria-live="polite"></span><button type="button" class="icon-button danger" data-action="delete-category">×</button></div>`).join("")}
        <form class="inline-form" data-editor-form="add-category"><input type="color" name="color" value="#6ba29b" class="color-input"><input name="name" placeholder="Nová kategorie · volitelné"><button class="secondary-button" type="submit">Přidat</button></form>
      </div>
    </article>
    <article class="editor-card">
      <div class="editor-head"><div><span class="eyebrow">Metadata</span><h2>Štítky</h2></div><span class="count-badge">${tagsData.length}</span></div>
      <div class="editor-body compact-list tag-editor-list">
        ${tagsData.map(tag => `<div class="editor-row" data-tag-id="${tag.id}"><input value="${escapeHtml(tag.name)}" aria-label="Název štítku"><span class="autosave-state" aria-live="polite"></span><button type="button" class="icon-button danger" data-action="delete-tag">×</button></div>`).join("") || '<div class="empty-line">Žádné štítky.</div>'}
        <form class="inline-form" data-editor-form="add-tag"><input name="name" placeholder="Nový štítek · volitelné"><button class="secondary-button" type="submit">Přidat</button></form>
      </div>
    </article>
    <article class="editor-card">
      <div class="editor-head"><div><span class="eyebrow">Sekundární spojení</span><h2>Vztahy lidí</h2></div><span class="count-badge">${relationships.length}</span></div>
      <div class="editor-body compact-list relationship-list">
        ${relationships.map(relation => {
          const sourcePerson = people.find(person => person.id === relation.source);
          const targetPerson = people.find(person => person.id === relation.target);
          const source = sourcePerson ? personName(sourcePerson) : "?";
          const targetName = targetPerson ? personName(targetPerson) : "?";
          return `<div class="relation-row"><span><b>${escapeHtml(source)}</b> ↔ ${escapeHtml(targetName)}<small>${escapeHtml(relation.type || "vztah")}</small></span><button type="button" class="icon-button danger" data-action="delete-relationship" data-source="${relation.source}" data-target="${relation.target}">×</button></div>`;
        }).join("") || '<div class="empty-line">Žádné vztahy.</div>'}
        <datalist id="relationship-person-options">${personOptions}</datalist>
        <form class="relation-form" data-editor-form="add-relationship">
          <label class="relation-person-picker"><input type="search" list="relationship-person-options" data-person-picker data-person-picker-target="source" placeholder="Hledat první osobu…" aria-label="První osoba" autocomplete="off" required><input type="hidden" name="source"></label>
          <label class="relation-person-picker"><input type="search" list="relationship-person-options" data-person-picker data-person-picker-target="target" placeholder="Hledat druhou osobu…" aria-label="Druhá osoba" autocomplete="off" required><input type="hidden" name="target"></label>
          <input name="type" placeholder="typ vztahu · volitelné"><button class="secondary-button" type="submit" ${people.length > 1 ? "" : "disabled"}>Propojit</button>
        </form>
      </div>
    </article>
    <article class="editor-card editor-wide">
      <div class="editor-head"><div><span class="eyebrow">Lidé a role</span><h2>Členové</h2></div><button type="button" class="secondary-button" data-action="add-person">+ Přidat člověka</button></div>
      <div class="people-editor-tools">
        <label class="people-editor-search">${icons.search}<input id="people-editor-search" type="search" value="${escapeHtml(peopleEditorSearch)}" placeholder="Hledat jméno, roli, jednotku, štítek…" autocomplete="off" aria-label="Hledat mezi členy"></label>
        <span class="people-search-count" id="people-search-count">${people.length} lidí</span>
      </div>
      <div class="people-editor-grid">${people.map(person => {
        const searchable = normalizeImportText([personName(person), person.nickname, person.role, person.category, person.registration_category, person.org_team, person.jednotky, person.oddily, person.city, person.email, person.tags].join(" "));
        return `<div class="person-editor-row" data-person-search="${escapeHtml(searchable)}"><span><b>${escapeHtml(personName(person))}</b><small>${escapeHtml(person.role || "bez role")} · ${escapeHtml(person.org_team || "bez primární jednotky")}<br>${escapeHtml(person.jednotky || "bez jednotky")}</small></span><div><button type="button" class="mini-button" data-action="edit-person" data-person-id="${person.id}">Upravit</button><button type="button" class="icon-button danger" data-action="delete-person" data-person-id="${person.id}">×</button></div></div>`;
      }).join("")}</div>
      <div class="people-editor-empty" id="people-editor-empty" hidden>Žádný člen neodpovídá hledání.</div>
    </article>
    <article class="editor-card editor-wide spreadsheet-card">
      <div class="editor-head"><div><span class="eyebrow">Hromadné doplnění</span><h2>Import lidí z Excelu</h2></div><span class="count-badge">A–E</span></div>
      <div class="spreadsheet-workflow">
        <button type="button" class="spreadsheet-dropzone" data-action="import-spreadsheet">
          <span class="dropzone-mark" aria-hidden="true">↥</span>
          <span><b>Přetáhněte sem .xlsx</b><small>nebo klikněte a vyberte soubor</small></span>
        </button>
        <div class="spreadsheet-copy"><b>Nejdřív porovnat, potom uložit</b><p>Načtou se pouze sloupce A–E. Noví lidé, oddíl a družiny se připraví k vytvoření; existující lidé se zobrazí vedle nových údajů k ručnímu rozhodnutí.</p><span>Podporované sloupce: Osoba · Evidenční číslo · Jednotka · Výchovná kategorie · Registrační kategorie</span></div>
        <input id="spreadsheet-file" type="file" multiple accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
      </div>
    </article>
    <article class="editor-card editor-wide database-card">
      <div class="editor-head"><div><span class="eyebrow">Přenos dat</span><h2>Databáze</h2></div><span class="count-badge">SQLite</span></div>
      <div class="database-workflow"><div><b>Vlastní databáze</b><p>Načtěte dříve exportovaný soubor z této mapy. Před nahrazením se ověří struktura databáze.</p></div><div class="database-buttons"><button type="button" class="secondary-button" data-action="import-database">Načíst .sqlite</button><button type="button" class="secondary-button" data-action="export-database">Stáhnout zálohu</button></div></div>
    </article>`;
  applyPeopleEditorSearch(peopleEditorSearch);
}

function applyPeopleEditorSearch(value) {
  peopleEditorSearch = value || "";
  const query = normalizeImportText(peopleEditorSearch);
  const rows = [...document.querySelectorAll(".person-editor-row[data-person-search]")];
  let visible = 0;
  rows.forEach(row => {
    const match = !query || row.dataset.personSearch.includes(query);
    row.hidden = !match;
    if (match) visible += 1;
  });
  const count = document.querySelector("#people-search-count");
  if (count) count.textContent = query ? `${visible} / ${rows.length} lidí` : `${rows.length} lidí`;
  const empty = document.querySelector("#people-editor-empty");
  if (empty) empty.hidden = visible > 0;
}

async function refreshEditedData(message) {
  persistWorkspaceState(true);
  await persistDatabase();
  await loadPeople();
  fillCategoryOptions();
  renderGraphV2();
  renderEditDashboard();
  showToast(message);
}

function focusEditorControl(selector) {
  requestAnimationFrame(() => {
    const control = document.querySelector(selector);
    if (!control) return;
    control.scrollIntoView({behavior: "smooth", block: "nearest"});
    control.focus({preventScroll: true});
    if (control instanceof HTMLInputElement && control.type !== "color") control.select();
  });
}

function setAutosaveState(row, state, message) {
  const status = row.querySelector(".autosave-state");
  if (!status) return;
  status.className = `autosave-state ${state || ""}`.trim();
  status.textContent = message;
  status.title = message;
}

async function commitInlineEdit(row, version) {
  if (!row.isConnected || editorAutosaveVersions.get(row) !== version) return;
  try {
    setAutosaveState(row, "saving", "Ukládám…");
    persistWorkspaceState(true);
    if (row.dataset.teamId) {
      const id = +row.dataset.teamId;
      const name = row.querySelector("input").value.trim();
      runTransaction(() => {
        db.run("UPDATE teams SET name=? WHERE id=?", [name, id]);
        db.run("UPDATE people SET team=? WHERE org_team_id=?", [name, id]);
      });
    } else if (row.dataset.categoryId) {
      const inputs = row.querySelectorAll("input");
      const name = inputs[1].value.trim();
      db.run("UPDATE categories SET color=?, name=? WHERE id=?", [inputs[0].value, name, +row.dataset.categoryId]);
    } else if (row.dataset.tagId) {
      const input = row.querySelector("input");
      const name = input.value.trim().toLocaleLowerCase("cs");
      db.run("UPDATE tags SET name=? WHERE id=?", [name, +row.dataset.tagId]);
      input.value = name;
    } else return;
    await persistDatabase();
    await loadPeople();
    fillCategoryOptions();
    renderGraphV2();
    if (!row.isConnected || editorAutosaveVersions.get(row) !== version) return;
    setAutosaveState(row, "saved", "Uloženo");
    setTimeout(() => { if (row.isConnected && editorAutosaveVersions.get(row) === version) setAutosaveState(row, "", ""); }, 1400);
  } catch (error) {
    if (row.isConnected && editorAutosaveVersions.get(row) === version) setAutosaveState(row, "error", error.message);
  }
}

function scheduleInlineAutosave(target, immediate = false) {
  if (!(target instanceof HTMLInputElement) || target.closest("form")) return;
  const row = target.closest("[data-team-id], [data-category-id], [data-tag-id]");
  if (!row) return;
  const oldTimer = editorAutosaveTimers.get(row);
  if (oldTimer) clearTimeout(oldTimer);
  const version = (editorAutosaveVersions.get(row) || 0) + 1;
  editorAutosaveVersions.set(row, version);
  setAutosaveState(row, "pending", "Čeká…");
  const timer = setTimeout(() => {
    editorAutosaveTimers.delete(row);
    editorAutosaveQueue = editorAutosaveQueue.then(() => commitInlineEdit(row, version));
  }, immediate ? 0 : 650);
  editorAutosaveTimers.set(row, timer);
}

function syncRelationshipPersonPicker(input) {
  const form = input.closest("form");
  const hidden = form?.elements[input.dataset.personPickerTarget];
  const list = input.list;
  const option = list ? [...list.options].find(item => item.value === input.value) : null;
  if (hidden) hidden.value = option?.dataset.personId || "";
  input.setCustomValidity(!input.value || option ? "" : "Vyberte osobu z nabízených výsledků.");
}

function cancelInlineAutosave(row) {
  const timer = editorAutosaveTimers.get(row);
  if (timer) clearTimeout(timer);
  editorAutosaveTimers.delete(row);
  editorAutosaveVersions.set(row, (editorAutosaveVersions.get(row) || 0) + 1);
}

function runTransaction(work) {
  db.run("BEGIN");
  try {
    work();
    db.run("COMMIT");
  } catch (error) {
    try { db.run("ROLLBACK"); } catch (_) {}
    throw error;
  }
}

function confirmAction(title, message, confirmLabel = "Odstranit") {
  if (confirmResolver) confirmResolver(false);
  document.querySelector("#confirm-title").textContent = title;
  document.querySelector("#confirm-message").textContent = message;
  document.querySelector("#confirm-accept").textContent = confirmLabel;
  document.querySelector("#confirm-modal").classList.add("open");
  setTimeout(() => document.querySelector("#confirm-cancel").focus(), 30);
  return new Promise(resolve => { confirmResolver = resolve; });
}

function closeConfirm(result = false) {
  document.querySelector("#confirm-modal")?.classList.remove("open");
  const resolve = confirmResolver;
  confirmResolver = null;
  resolve?.(result);
}

function validateImportedDatabase(candidate) {
  const quickCheck = candidate.exec("PRAGMA quick_check");
  if (!quickCheck.length || quickCheck[0].values[0][0] !== "ok") throw new Error("Soubor neprošel kontrolou SQLite.");
  const tables = new Set();
  const stmt = candidate.prepare("SELECT name FROM sqlite_master WHERE type='table'");
  while (stmt.step()) tables.add(stmt.getAsObject().name);
  stmt.free();
  const required = ["people", "categories", "tags", "people_tags", "relationships"];
  const missing = required.filter(name => !tables.has(name));
  if (missing.length) throw new Error(`Chybí tabulky: ${missing.join(", ")}.`);
  const columns = new Set();
  const columnStmt = candidate.prepare("PRAGMA table_info(people)");
  while (columnStmt.step()) columns.add(columnStmt.getAsObject().name);
  columnStmt.free();
  const missingColumns = ["id", "name", "role", "category_id"].filter(name => !columns.has(name));
  if (missingColumns.length) throw new Error(`Tabulka people nemá sloupce: ${missingColumns.join(", ")}.`);
  if (!columns.has("age") && !columns.has("birth_date")) throw new Error("Tabulka people musí obsahovat sloupec age nebo birth_date.");
}

async function importDatabaseFile(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  let candidate;
  const previous = db;
  try {
    candidate = new SQLRuntime.Database(new Uint8Array(await file.arrayBuffer()));
    validateImportedDatabase(candidate);
    const result = candidate.exec("SELECT COUNT(*) AS n FROM people");
    const count = result[0]?.values[0]?.[0] ?? 0;
    const accepted = await confirmAction("Načíst vlastní databázi?", `Soubor „${file.name}“ obsahuje ${count} lidí. Nahradí aktuální data uložená v tomto prohlížeči.`, "Načíst databázi");
    if (!accepted) { candidate.close(); return; }
    db = candidate;
    ensureOrgSchema();
    await loadPeople();
    if (!categoriesData.length) throw new Error("Databáze neobsahuje žádnou kategorii.");
    await persistDatabase();
    fillCategoryOptions();
    renderGraphV2();
    renderEditDashboard();
    previous.close();
    showToast(`Databáze „${file.name}“ byla načtena.`);
  } catch (error) {
    if (db === candidate) db = previous;
    try { candidate?.close(); } catch (_) {}
    await loadPeople();
    fillCategoryOptions();
    renderGraphV2();
    renderEditDashboard();
    showToast(`Databázi nelze načíst: ${error.message}`);
  } finally {
    input.value = "";
  }
}

function normalizeImportText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("cs")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function reverseNameKey(value) {
  const parts = normalizeImportText(value).split(" ").filter(Boolean);
  return parts.length > 1 ? [...parts.slice(1), parts[0]].join(" ") : parts.join(" ");
}

function parseExportedName(value) {
  const rawName = String(value ?? "").trim();
  const nicknameMatches = [...rawName.matchAll(/\(([^()]*)\)/g)];
  const nickname = nicknameMatches.at(-1)?.[1]?.trim() || "";
  const base = rawName.replace(/\s*\([^()]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  let name = base;
  if (base.includes(",")) {
    const [surname, ...rest] = base.split(",").map(part => part.trim()).filter(Boolean);
    name = [...rest, surname].join(" ");
  } else {
    const parts = base.split(" ").filter(Boolean);
    if (parts.length > 1) name = [...parts.slice(1), parts[0]].join(" ");
  }
  return {rawName, name, nickname, base};
}

function matchImportedPerson(imported) {
  const importedKeys = new Set([
    normalizeImportText(imported.name),
    normalizeImportText(imported.base),
    reverseNameKey(imported.name),
  ].filter(Boolean));
  const nicknameKey = normalizeImportText(imported.nickname);
  const candidates = people.map(person => {
    const personKeys = new Set([normalizeImportText(person.name), reverseNameKey(person.name)].filter(Boolean));
    const personNickname = normalizeImportText(person.nickname);
    let score = [...importedKeys].some(key => personKeys.has(key)) ? 100 : 0;
    if (!score && nicknameKey && (personKeys.has(nicknameKey) || personNickname === nicknameKey)) score = 95;
    if (!score) {
      const importedParts = normalizeImportText(imported.name).split(" ").filter(Boolean);
      const personParts = normalizeImportText(person.name).split(" ").filter(Boolean);
      const importedSurname = importedParts.at(-1);
      const personSurname = personParts.at(-1);
      const importedGiven = importedParts[0] || "";
      const personGiven = personParts[0] || "";
      let prefix = 0;
      while (prefix < importedGiven.length && prefix < personGiven.length && importedGiven[prefix] === personGiven[prefix]) prefix++;
      if (importedSurname && importedSurname === personSurname && prefix >= 4) score = 85;
    }
    return {person, score};
  }).filter(candidate => candidate.score > 0).sort((a, b) => b.score - a.score);
  if (!candidates.length || candidates.length > 1 && candidates[0].score === candidates[1].score) return null;
  return candidates[0];
}

function parseRegistrationTitle(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^Registrace\s+([^\s]+)\s*[-–]\s*(.+?)(?:\s*\(\d{4}\))?$/i);
  return match ? {code: match[1].trim(), name: match[2].trim()} : null;
}

function parseSpreadsheetSheet(sheetRows, sheetName, fileName) {
  const rows = sheetRows.map(row => Array.from({length: 5}, (_, index) => String(row[index] ?? "").trim()));
  const headerIndex = rows.findIndex(row => normalizeImportText(row[0]) === "osoba" && normalizeImportText(row[2]) === "jednotka");
  if (headerIndex < 0) return [];
  const title = rows.slice(0, headerIndex).map(row => parseRegistrationTitle(row[0])).find(Boolean);
  const sourceRows = rows.slice(headerIndex + 1).filter(row => {
    const first = normalizeImportText(row[0]);
    return first && first !== "osoba" && row[1] && row[2];
  });
  const codes = [...new Set(sourceRows.map(row => row[1]).filter(Boolean))].sort((a, b) => a.length - b.length);
  const fallbackRootCode = codes.find(code => codes.some(other => other !== code && other.startsWith(`${code}.`))) || codes[0] || "";
  const rootCode = title?.code || fallbackRootCode;
  const rootRow = sourceRows.find(row => row[1] === rootCode);
  const rootName = title?.name || rootRow?.[2] || "Oddíl";
  const fileLabel = fileName.replace(/\.(xlsx|xls)$/i, "").trim();
  const oddilDisplayName = normalizeImportText(fileLabel).includes("oddil") && !normalizeImportText(fileLabel).includes(normalizeImportText(rootName))
    ? `${fileLabel} – ${rootName}` : rootName;
  return sourceRows.map(row => {
    const parsedName = parseExportedName(row[0]);
    return {
      ...parsedName,
      educationCategory: row[3],
      registrationCategory: row[4],
      assignments: [{
        code: row[1],
        name: row[2],
        oddilCode: rootCode || row[1],
        oddilName: rootName,
        oddilDisplayName,
        sourceFile: fileName,
        sourceSheet: sheetName,
      }],
    };
  });
}

async function parseSpreadsheetFiles(files) {
  const imported = [];
  for (const file of files) {
    if (!/\.xlsx$/i.test(file.name)) throw new Error(`Soubor „${file.name}“ není Excel ve formátu .xlsx.`);
    if (file.size > 20 * 1024 * 1024) throw new Error(`Soubor „${file.name}“ je větší než 20 MB.`);
    const sheets = await readExcelFile(file);
    sheets.forEach(sheet => imported.push(...parseSpreadsheetSheet(sheet.data, sheet.sheet, file.name)));
  }
  const merged = new Map();
  imported.forEach(row => {
    const key = `${normalizeImportText(row.name)}|${normalizeImportText(row.nickname)}`;
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, row);
      return;
    }
    row.assignments.forEach(assignment => {
      if (!previous.assignments.some(item => item.code === assignment.code && normalizeImportText(item.name) === normalizeImportText(assignment.name))) previous.assignments.push(assignment);
    });
    if (!previous.educationCategory) previous.educationCategory = row.educationCategory;
    if (!previous.registrationCategory) previous.registrationCategory = row.registrationCategory;
  });
  return [...merged.values()];
}

function prepareSpreadsheetImport(rows, fileNames) {
  const stagedRows = rows.map((row, index) => {
    const match = matchImportedPerson(row);
    return {
      ...row,
      id: index + 1,
      matchId: match?.person.id ?? null,
      matchScore: match?.score ?? 0,
      action: match ? "pending" : "create",
      draft: {
        name: row.name,
        nickname: row.nickname,
        educationCategory: row.educationCategory,
        registrationCategory: row.registrationCategory,
      },
    };
  });
  spreadsheetImportState = {rows: stagedRows, fileNames};
}

function importValue(label, value) {
  return `<div class="comparison-value"><span>${escapeHtml(label)}</span><b>${escapeHtml(value || "—")}</b></div>`;
}

function importedUnitLabel(row) {
  return [...new Set(row.assignments.map(assignment => assignment.name).filter(Boolean))].join(" · ");
}

function renderSpreadsheetReview() {
  const target = document.querySelector("#spreadsheet-review");
  if (!target || !spreadsheetImportState) return;
  const rows = spreadsheetImportState.rows;
  const conflicts = rows.filter(row => row.matchId);
  const newRows = rows.filter(row => !row.matchId);
  target.innerHTML = `
    <div class="import-summary">
      <div><span class="eyebrow">${spreadsheetImportState.fileNames.map(escapeHtml).join(" · ")}</span><h3>${rows.length} lidí připraveno ke kontrole</h3><p>${newRows.length} nových · ${conflicts.length} nalezených v mapě. Žádná změna ještě nebyla uložena.</p></div>
      ${conflicts.length ? `<div class="import-bulk-actions"><button type="button" class="mini-button" data-import-bulk="current">U všech ponechat současné</button><button type="button" class="mini-button" data-import-bulk="new">U všech použít nové</button></div>` : ""}
    </div>
    ${conflicts.length ? `<section class="conflict-section"><div class="review-section-head"><div><span class="eyebrow">Vyžaduje rozhodnutí</span><h3>Existující lidé</h3></div><span class="count-badge">${conflicts.length}</span></div>
      <div class="conflict-list">${conflicts.map(row => {
        const current = people.find(person => person.id === row.matchId);
        return `<article class="conflict-card" data-import-row="${row.id}" data-resolution="${row.action}">
          <div class="conflict-title"><div><span class="match-badge">Nalezená shoda</span><h4>${escapeHtml(personName(current))} ↔ ${escapeHtml(row.rawName)}</h4></div><span class="match-confidence">${row.matchScore === 100 ? "jméno" : row.matchScore === 95 ? "přezdívka" : "podobné jméno"}</span></div>
          <div class="comparison-grid">
            <div class="comparison-column current-column"><div class="comparison-label">Současné</div>${importValue("Jméno", personName(current))}${importValue("Přezdívka", current.nickname)}${importValue("Jednotka", current.org_team)}${importValue("Výchovná kategorie", current.category === "Bez kategorie" ? "" : current.category)}${importValue("Registrační kategorie", current.registration_category)}</div>
            <div class="comparison-column new-column"><div class="comparison-label">Nové z tabulky</div>${importValue("Jméno", row.draft.name)}${importValue("Přezdívka", row.draft.nickname)}${importValue("Jednotka", importedUnitLabel(row))}${importValue("Výchovná kategorie", row.draft.educationCategory)}${importValue("Registrační kategorie", row.draft.registrationCategory)}</div>
          </div>
          <div class="resolution-options" role="radiogroup" aria-label="Rozhodnutí pro ${escapeHtml(personName(current))}">
            <label><input type="radio" name="resolution-${row.id}" value="current"> Ponechat současné</label>
            <label><input type="radio" name="resolution-${row.id}" value="new"> Použít nové</label>
            <label><input type="radio" name="resolution-${row.id}" value="edit"> Upravit před uložením</label>
          </div>
          <div class="import-edit-fields">
            <label>Jméno<input data-import-field="name" value="${escapeHtml(row.draft.name)}"></label>
            <label>Přezdívka<input data-import-field="nickname" value="${escapeHtml(row.draft.nickname)}"></label>
            <label>Výchovná kategorie<input data-import-field="educationCategory" value="${escapeHtml(row.draft.educationCategory)}"></label>
            <label>Registrační kategorie<input data-import-field="registrationCategory" value="${escapeHtml(row.draft.registrationCategory)}"></label>
          </div>
        </article>`;
      }).join("")}</div></section>` : ""}
    <section class="new-import-section"><div class="review-section-head"><div><span class="eyebrow">Automaticky připraveno</span><h3>Noví lidé</h3></div><span class="count-badge">${newRows.length}</span></div>
      ${newRows.length ? `<div class="new-import-list">${newRows.map(row => `<label class="new-import-row" data-import-row="${row.id}"><input type="checkbox" data-import-new checked><span><b>${escapeHtml(row.draft.name)}</b>${row.draft.nickname ? `<em>${escapeHtml(row.draft.nickname)}</em>` : ""}<small>${escapeHtml(importedUnitLabel(row))} · ${escapeHtml(row.draft.educationCategory || "bez kategorie")} · ${escapeHtml(row.draft.registrationCategory || "bez registrační kategorie")}</small></span></label>`).join("")}</div>` : '<div class="empty-line">V tabulce nejsou žádná nová jména.</div>'}
    </section>
    <div class="import-review-actions"><button type="button" class="secondary-button" data-import-action="cancel">Zrušit</button><span id="import-resolution-status"></span><button type="button" class="primary-button" data-import-action="save">Uložit import</button></div>`;
  updateImportReviewStatus();
}

function updateImportReviewStatus() {
  if (!spreadsheetImportState) return;
  const pending = spreadsheetImportState.rows.filter(row => row.matchId && row.action === "pending").length;
  const selected = spreadsheetImportState.rows.filter(row => row.action === "create" || row.action === "new" || row.action === "edit").length;
  const status = document.querySelector("#import-resolution-status");
  const save = document.querySelector('[data-import-action="save"]');
  if (status) status.textContent = pending ? `Ještě rozhodnout: ${pending}` : `Bude uloženo: ${selected}`;
  if (save) {
    save.disabled = pending > 0 || selected === 0;
    save.textContent = pending ? "Dokončete kontrolu" : `Uložit ${selected} ${selected === 1 ? "člověka" : "lidí"}`;
  }
}

function openSpreadsheetReview() {
  renderSpreadsheetReview();
  document.querySelector("#spreadsheet-modal").classList.add("open");
}

function closeSpreadsheetReview() {
  document.querySelector("#spreadsheet-modal")?.classList.remove("open");
  spreadsheetImportState = null;
}

async function handleSpreadsheetFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  try {
    showToast("Načítám tabulku a porovnávám jména…");
    const rows = await parseSpreadsheetFiles(files);
    if (!rows.length) throw new Error("Nenašel jsem řádky se záhlavím Osoba · Evidenční číslo · Jednotka ve sloupcích A–E.");
    prepareSpreadsheetImport(rows, files.map(file => file.name));
    openSpreadsheetReview();
  } catch (error) {
    spreadsheetImportState = null;
    showToast(`Tabulku nelze načíst: ${error.message}`);
  }
}

function ensureImportedCategory(name) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName) return null;
  const existing = queryObjects("SELECT id,name FROM categories").find(category => normalizeImportText(category.name) === normalizeImportText(cleanName));
  if (existing) return +existing.id;
  const colors = ["#6ba29b", "#d4ae72", "#8daec4", "#bbc85d", "#ef765f"];
  db.run("INSERT INTO categories (name,description,color) VALUES (?,?,?)", [cleanName, "Importováno z Excelu", colors[queryObjects("SELECT COUNT(*) AS n FROM categories")[0].n % colors.length]]);
  return +queryObjects("SELECT last_insert_rowid() AS id")[0].id;
}

function ensureImportedTeam(assignment) {
  const allTeams = () => queryObjects("SELECT id,name,parent_id,level,registration_code FROM teams").map(team => ({...team, id: +team.id, parent_id: team.parent_id == null ? null : +team.parent_id, level: +team.level}));
  let currentTeams = allTeams();
  let oddil = currentTeams.find(team => team.level === 1 && assignment.oddilCode && team.registration_code === assignment.oddilCode);
  if (!oddil) {
    const oddilNameKey = normalizeImportText(assignment.oddilName);
    oddil = currentTeams.find(team => team.level === 1 && oddilNameKey && (normalizeImportText(team.name) === oddilNameKey || normalizeImportText(team.name).includes(oddilNameKey)));
  }
  if (!oddil) {
    const root = currentTeams.find(team => team.level === 0);
    db.run("INSERT INTO teams (name,parent_id,level,registration_code) VALUES (?,?,1,?)", [assignment.oddilDisplayName || assignment.oddilName || "Oddíl", root?.id ?? null, assignment.oddilCode || null]);
    oddil = {id: +queryObjects("SELECT last_insert_rowid() AS id")[0].id, name: assignment.oddilDisplayName || assignment.oddilName || "Oddíl", parent_id: root?.id ?? null, level: 1, registration_code: assignment.oddilCode || null};
  } else if (assignment.oddilCode && !oddil.registration_code) {
    db.run("UPDATE teams SET registration_code=? WHERE id=?", [assignment.oddilCode, oddil.id]);
  }
  const isOddil = assignment.code === assignment.oddilCode || normalizeImportText(assignment.name) === normalizeImportText(assignment.oddilName);
  if (isOddil) return {teamId: oddil.id, oddilId: oddil.id};
  currentTeams = allTeams();
  let unit = currentTeams.find(team => team.level === 2 && assignment.code && team.registration_code === assignment.code);
  if (!unit) unit = currentTeams.find(team => team.level === 2 && team.parent_id === oddil.id && normalizeImportText(team.name) === normalizeImportText(assignment.name));
  if (!unit) {
    db.run("INSERT INTO teams (name,parent_id,level,registration_code) VALUES (?,?,2,?)", [assignment.name || "Družina", oddil.id, assignment.code || null]);
    unit = {id: +queryObjects("SELECT last_insert_rowid() AS id")[0].id};
  } else if (assignment.code && !unit.registration_code) {
    db.run("UPDATE teams SET registration_code=? WHERE id=?", [assignment.code, unit.id]);
  }
  return {teamId: unit.id, oddilId: oddil.id};
}

async function saveSpreadsheetImport() {
  if (!spreadsheetImportState) return;
  const selectedRows = spreadsheetImportState.rows.filter(row => ["create", "new", "edit"].includes(row.action));
  if (spreadsheetImportState.rows.some(row => row.matchId && row.action === "pending") || !selectedRows.length) return;
  persistWorkspaceState(true);
  try {
    runTransaction(() => {
      selectedRows.forEach(row => {
        const assignments = row.assignments.map(ensureImportedTeam);
        const primary = assignments[0];
        const primaryTeam = primary ? queryObjects("SELECT name FROM teams WHERE id=?", [primary.teamId])[0] : null;
        const categoryId = ensureImportedCategory(row.draft.educationCategory);
        let personId = row.matchId;
        const values = [row.draft.name.trim(), row.draft.nickname.trim(), categoryId, row.draft.registrationCategory.trim(), primaryTeam?.name || "", primary?.teamId ?? null];
        if (row.action === "create") {
          db.run("INSERT INTO people (name,nickname,role,age,category_id,registration_category,team,city,email,notes,org_team_id) VALUES (?,?,?,NULL,?,?,?,?,?,?,?)", [values[0], values[1], "", values[2], values[3], values[4], "", "", "", values[5]]);
          personId = +queryObjects("SELECT last_insert_rowid() AS id")[0].id;
        } else {
          db.run("UPDATE people SET name=?,nickname=?,category_id=?,registration_category=?,team=?,org_team_id=? WHERE id=?", [...values, personId]);
        }
        [...new Set(assignments.flatMap(assignment => [assignment.teamId, assignment.oddilId]).filter(Boolean))].forEach(unitId => {
          db.run("INSERT OR IGNORE INTO people_teams (person_id,team_id) VALUES (?,?)", [personId, unitId]);
        });
      });
    });
    const count = selectedRows.length;
    document.querySelector("#spreadsheet-modal").classList.remove("open");
    spreadsheetImportState = null;
    await refreshEditedData(`Import je uložený: ${count} ${count === 1 ? "člověk" : "lidí"}.`);
    if (currentMode === "network") {
      clearTimeout(graphFitTimer);
      graphFitTimer = setTimeout(() => fitMapToStructure(true), 900);
    }
  } catch (error) {
    showToast(`Import se nepodařilo uložit: ${error.message}`);
  }
}

async function handleEditorSubmit(event) {
  const form = event.target.closest("[data-editor-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  try {
    if (form.dataset.editorForm === "add-oddil") {
      const root = teams.find(team => team.level === 0);
      db.run("INSERT INTO teams (name,parent_id,level) VALUES (?,?,1)", [data.get("name").trim(), root?.id ?? null]);
      const createdId = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
      await refreshEditedData("Oddíl byl přidán.");
      focusEditorControl(`[data-team-id="${createdId}"] input`);
    } else if (form.dataset.editorForm === "add-base") {
      db.run("INSERT INTO teams (name,parent_id,level) VALUES (?,NULL,1)", [data.get("name").trim()]);
      const createdId = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
      await refreshEditedData("Samostatný základní uzel byl přidán.");
      focusEditorControl(`[data-team-id="${createdId}"] input`);
    } else if (form.dataset.editorForm === "add-druzina") {
      db.run("INSERT INTO teams (name,parent_id,level) VALUES (?,?,2)", [data.get("name").trim(), +data.get("parent_id")]);
      const createdId = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
      await refreshEditedData("Družina byla přidána.");
      focusEditorControl(`[data-team-id="${createdId}"] input`);
    } else if (form.dataset.editorForm === "add-category") {
      db.run("INSERT INTO categories (name,description,color) VALUES (?,?,?)", [data.get("name").trim(), "", data.get("color")]);
      const createdId = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
      await refreshEditedData("Kategorie byla přidána.");
      focusEditorControl(`[data-category-id="${createdId}"] input:not([type="color"])`);
    } else if (form.dataset.editorForm === "add-tag") {
      db.run("INSERT INTO tags (name) VALUES (?)", [data.get("name").trim().toLocaleLowerCase("cs")]);
      const createdId = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
      await refreshEditedData("Štítek byl přidán.");
      focusEditorControl(`[data-tag-id="${createdId}"] input`);
    } else if (form.dataset.editorForm === "add-relationship") {
      const source = +data.get("source");
      const target = +data.get("target");
      if (!source || !target) throw new Error("Pro vztah vyberte dva lidi.");
      if (source === target) throw new Error("Vyberte dva různé lidi.");
      db.run("INSERT OR REPLACE INTO relationships (source_id,target_id,type) VALUES (?,?,?)", [source, target, data.get("type").trim()]);
      await refreshEditedData("Vztah byl přidán.");
      focusEditorControl('[data-editor-form="add-relationship"] select[name="source"]');
    }
  } catch (error) { showToast(`Nelze uložit: ${error.message}`); }
}

async function handleEditorClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  try {
    if (action === "add-person") return openPersonModal();
    if (action === "edit-person") return openPersonModal(+button.dataset.personId);
    if (action === "import-spreadsheet") return document.querySelector("#spreadsheet-file")?.click();
    if (action === "import-database") return document.querySelector("#import-db-file").click();
    if (action === "export-database") return exportDatabase();
    if (action === "delete-team") {
      const row = button.closest("[data-team-id]");
      const id = +row.dataset.teamId;
      const team = teams.find(item => item.id === id);
      const ids = [id];
      for (let index = 0; index < ids.length; index++) teams.filter(item => item.parent_id === ids[index]).forEach(item => ids.push(item.id));
      const placeholders = ids.map(() => "?").join(",");
      const assigned = queryObjects(`SELECT COUNT(DISTINCT p.id) AS n FROM people p
        WHERE p.org_team_id IN (${placeholders}) OR p.id IN (SELECT person_id FROM people_teams WHERE team_id IN (${placeholders}))`, [...ids, ...ids])[0].n;
      const childCount = ids.length - 1;
      const message = `${team?.name || "Tato část"} bude odstraněna${childCount ? ` včetně ${childCount} podřízených družin` : ""}. ${assigned ? `${assigned} lidí ztratí přiřazení k této části struktury; ostatní oddílová přiřazení zůstanou zachována.` : "Žádní lidé nebudou odpojeni."}`;
      if (!await confirmAction("Odstranit část struktury?", message)) return;
      cancelInlineAutosave(row);
      runTransaction(() => {
        db.run(`UPDATE people SET org_team_id=NULL, team='' WHERE org_team_id IN (${placeholders})`, ids);
        db.run(`DELETE FROM people_teams WHERE team_id IN (${placeholders})`, ids);
        [...ids].reverse().forEach(teamId => db.run("DELETE FROM teams WHERE id=?", [teamId]));
      });
      return await refreshEditedData("Část struktury byla odstraněna; ostatní přiřazení lidí zůstala zachována.");
    }
    if (action === "delete-category") {
      const row = button.closest("[data-category-id]");
      const id = +row.dataset.categoryId;
      const used = queryObjects("SELECT COUNT(*) AS n FROM people WHERE category_id=?", [id])[0].n;
      if (categoriesData.length <= 1) throw new Error("Musí zůstat alespoň jedna kategorie.");
      const category = categoriesData.find(item => item.id === id);
      const replacement = categoriesData.find(item => item.id !== id);
      const message = used ? `${used} lidí bude přeřazeno do kategorie „${replacement.name}“.` : "Kategorie není přiřazena žádnému člověku.";
      if (!await confirmAction(`Odstranit kategorii „${category?.name || ""}“?`, message)) return;
      cancelInlineAutosave(row);
      runTransaction(() => {
        db.run("UPDATE people SET category_id=? WHERE category_id=?", [replacement.id, id]);
        db.run("DELETE FROM categories WHERE id=?", [id]);
      });
      return await refreshEditedData(used ? `Kategorie byla odstraněna; ${used} lidí bylo přeřazeno.` : "Kategorie byla odstraněna.");
    }
    if (action === "delete-tag") {
      const row = button.closest("[data-tag-id]");
      const id = +row.dataset.tagId;
      const tag = tagsData.find(item => item.id === id);
      const used = queryObjects("SELECT COUNT(*) AS n FROM people_tags WHERE tag_id=?", [id])[0].n;
      if (!await confirmAction(`Odstranit štítek #${tag?.name || ""}?`, used ? `Zmizí také u ${used} lidí.` : "Štítek není nikomu přiřazen.")) return;
      cancelInlineAutosave(row);
      runTransaction(() => { db.run("DELETE FROM people_tags WHERE tag_id=?", [id]); db.run("DELETE FROM tags WHERE id=?", [id]); });
      return await refreshEditedData("Štítek byl odstraněn.");
    }
    if (action === "delete-relationship") {
      if (!await confirmAction("Odstranit vztah?", "Sekundární spojení mezi těmito lidmi zmizí z mapy.")) return;
      db.run("DELETE FROM relationships WHERE source_id=? AND target_id=?", [+button.dataset.source, +button.dataset.target]);
      return await refreshEditedData("Vztah byl odstraněn.");
    }
    if (action === "delete-person") {
      const id = +button.dataset.personId;
      const person = people.find(item => item.id === id);
      if (!await confirmAction(`Odstranit ${person ? personName(person) : "člověka"}?`, "Zmizí také všechny štítky a sekundární vztahy této osoby.")) return;
      runTransaction(() => {
        db.run("DELETE FROM people_tags WHERE person_id=?", [id]);
        db.run("DELETE FROM people_teams WHERE person_id=?", [id]);
        db.run("DELETE FROM relationships WHERE source_id=? OR target_id=?", [id, id]);
        db.run("DELETE FROM people WHERE id=?", [id]);
      });
      return await refreshEditedData("Člověk byl odstraněn.");
    }
  } catch (error) {
    try { db.run("ROLLBACK"); } catch (_) {}
    showToast(`Nelze provést změnu: ${error.message}`);
  }
}

function replaceSelectOptions(select, placeholder, options) {
  if (!select) return;
  const previous = select.value;
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}`;
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
}

function renderSqlBuilderOptions() {
  if (!document.querySelector("#sql-builder")) return;
  replaceSelectOptions(document.querySelector("#sql-builder-unit"), "Všechny jednotky", teams.map(team => ({
    value: String(team.id),
    label: `${"— ".repeat(Math.max(0, team.level))}${team.name}`
  })));
  replaceSelectOptions(document.querySelector("#sql-builder-category"), "Všechny kategorie", categoriesData.map(category => ({value: String(category.id), label: category.name})));
  replaceSelectOptions(document.querySelector("#sql-builder-tag"), "Všechny štítky", tagsData.map(tag => ({value: String(tag.id), label: `#${tag.name}`})));
  const cities = [...new Set(people.map(person => String(person.city || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "cs"));
  replaceSelectOptions(document.querySelector("#sql-builder-city"), "Všechna města", cities.map(city => ({value: city, label: city})));
  syncSqlBuilderUi();
}

function sqlLiteral(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

const SQL_BUILDER_GROUPS = {
  unit: "COALESCE(NULLIF(TRIM(ot.name), ''), 'Bez primární jednotky')",
  category: "COALESCE(NULLIF(TRIM(c.name), ''), 'Bez kategorie')",
  role: "COALESCE(NULLIF(TRIM(p.role), ''), 'Bez role')",
  city: "COALESCE(NULLIF(TRIM(p.city), ''), 'Neuvedeno')",
  registration: "COALESCE(NULLIF(TRIM(p.registration_category), ''), 'Neuvedeno')",
  age: `CASE
    WHEN p.age IS NULL THEN 'Neuvedeno'
    WHEN p.age < 7 THEN '0–6'
    WHEN p.age < 11 THEN '7–10'
    WHEN p.age < 15 THEN '11–14'
    WHEN p.age < 18 THEN '15–17'
    WHEN p.age < 26 THEN '18–25'
    WHEN p.age < 41 THEN '26–40'
    WHEN p.age < 61 THEN '41–60'
    ELSE '61+'
  END`
};

function sqlBuilderState() {
  const numericValue = id => {
    const raw = document.querySelector(id)?.value;
    if (raw == null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  return {
    kind: document.querySelector("#sql-builder-kind")?.value || "list",
    group: document.querySelector("#sql-builder-group")?.value || "unit",
    unitId: numericValue("#sql-builder-unit"),
    includeDescendants: Boolean(document.querySelector("#sql-builder-descendants")?.checked),
    categoryId: numericValue("#sql-builder-category"),
    tagId: numericValue("#sql-builder-tag"),
    city: document.querySelector("#sql-builder-city")?.value || "",
    role: document.querySelector("#sql-builder-role")?.value.trim() || "",
    email: document.querySelector("#sql-builder-email")?.value.trim() || "",
    notes: document.querySelector("#sql-builder-notes")?.value.trim() || "",
    ageMin: numericValue("#sql-builder-age-min"),
    ageMax: numericValue("#sql-builder-age-max"),
    order: document.querySelector("#sql-builder-order")?.value || "name",
    limit: Math.max(0, numericValue("#sql-builder-limit") ?? 100)
  };
}

function buildSqlLabQuery() {
  const state = sqlBuilderState();
  const cte = state.unitId == null ? "" : state.includeDescendants
    ? `WITH RECURSIVE selected_units(id) AS (\n  SELECT ${Math.trunc(state.unitId)}\n  UNION ALL\n  SELECT t.id FROM teams t JOIN selected_units su ON t.parent_id = su.id\n)\n`
    : `WITH selected_units(id) AS (SELECT ${Math.trunc(state.unitId)})\n`;
  const where = ["1 = 1"];
  if (state.unitId != null) where.push(`(p.org_team_id IN (SELECT id FROM selected_units) OR EXISTS (SELECT 1 FROM people_teams fpt WHERE fpt.person_id = p.id AND fpt.team_id IN (SELECT id FROM selected_units)))`);
  if (state.categoryId != null) where.push(`p.category_id = ${Math.trunc(state.categoryId)}`);
  if (state.tagId != null) where.push(`EXISTS (SELECT 1 FROM people_tags ftag WHERE ftag.person_id = p.id AND ftag.tag_id = ${Math.trunc(state.tagId)})`);
  if (state.city) where.push(`TRIM(COALESCE(p.city, '')) = ${sqlLiteral(state.city)} COLLATE NOCASE`);
  if (state.role) where.push(`COALESCE(p.role, '') LIKE ${sqlLiteral(`%${state.role}%`)} COLLATE NOCASE`);
  if (state.email) where.push(`COALESCE(p.email, '') LIKE ${sqlLiteral(`%${state.email}%`)} COLLATE NOCASE`);
  if (state.notes) where.push(`COALESCE(p.notes, '') LIKE ${sqlLiteral(`%${state.notes}%`)} COLLATE NOCASE`);
  if (state.ageMin != null) where.push(`p.age >= ${Math.max(0, Math.min(120, Math.trunc(state.ageMin)))}`);
  if (state.ageMax != null) where.push(`p.age <= ${Math.max(0, Math.min(120, Math.trunc(state.ageMax)))}`);
  const from = `FROM people p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN teams ot ON ot.id = p.org_team_id
WHERE ${where.join("\n  AND ")}`;
  const limit = state.limit ? `\nLIMIT ${Math.min(5000, Math.trunc(state.limit))}` : "";
  if (state.kind === "list") {
    const order = {
      name: "p.name COLLATE NOCASE, p.id",
      age: "p.age IS NULL, p.age, p.name COLLATE NOCASE",
      unit: "ot.name COLLATE NOCASE, p.name COLLATE NOCASE",
      category: "c.name COLLATE NOCASE, p.name COLLATE NOCASE",
      city: "p.city COLLATE NOCASE, p.name COLLATE NOCASE"
    }[state.order] || "p.name COLLATE NOCASE, p.id";
    return `${cte}SELECT
  p.name AS jmeno,
  p.nickname AS prezdivka,
  p.role AS role,
  p.birth_date AS datum_narozeni,
  p.age AS vek,
  c.name AS kategorie,
  p.registration_category AS registracni_kategorie,
  p.city AS mesto,
  p.email AS email,
  p.notes AS poznamka,
  ot.name AS primarni_jednotka,
  (SELECT GROUP_CONCAT(unit_name, ', ') FROM (SELECT u.name AS unit_name FROM people_teams pu JOIN teams u ON u.id = pu.team_id WHERE pu.person_id = p.id ORDER BY u.level, u.name)) AS jednotky,
  (SELECT GROUP_CONCAT(tag_name, ', ') FROM (SELECT tg.name AS tag_name FROM people_tags ptag JOIN tags tg ON tg.id = ptag.tag_id WHERE ptag.person_id = p.id ORDER BY tg.name)) AS stitky
${from}
ORDER BY ${order}${limit};`;
  }
  const groupExpression = SQL_BUILDER_GROUPS[state.group] || SQL_BUILDER_GROUPS.unit;
  const metrics = state.kind === "age"
    ? `COUNT(DISTINCT p.id) AS pocet_lidi,\n  ROUND(AVG(p.age), 1) AS prumerny_vek,\n  MIN(p.age) AS nejnizsi_vek,\n  MAX(p.age) AS nejvyssi_vek`
    : "COUNT(DISTINCT p.id) AS pocet_lidi";
  return `${cte}SELECT
  ${groupExpression} AS skupina,
  ${metrics}
${from}
GROUP BY ${groupExpression}
ORDER BY pocet_lidi DESC, skupina COLLATE NOCASE${limit};`;
}

function syncSqlBuilderUi() {
  const builder = document.querySelector("#sql-builder");
  if (!builder) return;
  const state = sqlBuilderState();
  document.querySelector("#sql-builder-group-wrap").hidden = state.kind === "list";
  document.querySelector("#sql-builder-order-wrap").hidden = state.kind !== "list";
  const descendants = document.querySelector("#sql-builder-descendants");
  descendants.disabled = state.unitId == null;
  const filters = [];
  const unit = state.unitId == null ? null : teamById(state.unitId);
  if (unit) filters.push(`${unit.name}${state.includeDescendants ? " + potomci" : ""}`);
  if (state.categoryId != null) filters.push(categoriesData.find(category => category.id === state.categoryId)?.name || "kategorie");
  if (state.tagId != null) filters.push(`#${tagsData.find(tag => tag.id === state.tagId)?.name || "štítek"}`);
  if (state.city) filters.push(state.city);
  if (state.role) filters.push(`role: ${state.role}`);
  if (state.email) filters.push(`e-mail: ${state.email}`);
  if (state.notes) filters.push(`poznámka: ${state.notes}`);
  if (state.ageMin != null || state.ageMax != null) filters.push(`věk ${state.ageMin ?? 0}–${state.ageMax ?? 120}`);
  const action = state.kind === "list" ? "Seznam lidí" : state.kind === "age" ? "Věkové shrnutí" : "Počet lidí";
  const summary = document.querySelector("#sql-builder-summary");
  if (summary) summary.textContent = `${action} · ${filters.length ? filters.join(" · ") : "bez filtrů"}`;
}

function createQueryFromBuilder(run = false) {
  const query = buildSqlLabQuery();
  document.querySelector("#sql-query").value = query;
  document.querySelector("#sql-builder").open = true;
  if (run) runSelect();
  else showToast("SQL dotaz je připravený.");
}

function openUnitPeopleInSql(teamId) {
  const team = teamById(teamId);
  if (!team) return;
  showSection("sql");
  renderSqlBuilderOptions();
  document.querySelector("#sql-builder-kind").value = "list";
  document.querySelector("#sql-builder-unit").value = String(team.id);
  document.querySelector("#sql-builder-descendants").checked = true;
  document.querySelector("#sql-builder-category").value = "";
  document.querySelector("#sql-builder-tag").value = "";
  document.querySelector("#sql-builder-city").value = "";
  document.querySelector("#sql-builder-role").value = "";
  document.querySelector("#sql-builder-email").value = "";
  document.querySelector("#sql-builder-notes").value = "";
  document.querySelector("#sql-builder-age-min").value = "";
  document.querySelector("#sql-builder-age-max").value = "";
  document.querySelector("#sql-builder-order").value = "name";
  document.querySelector("#sql-builder-limit").value = "0";
  document.querySelector("#sql-builder").open = true;
  syncSqlBuilderUi();
  createQueryFromBuilder(true);
  hideUnitActionPopover();
}

function runSelect() {
  const sql = document.querySelector("#sql-query").value.trim();
  const output = document.querySelector("#result-wrap");
  const meta = document.querySelector("#result-meta");
  const executableSql = sql.replace(/'(?:''|[^'])*'/g, "''").replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  if (!/^(select|with)\b/i.test(executableSql.trim()) || /\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum)\b/i.test(executableSql)) {
    output.innerHTML = '<div class="error-box">Tato konzole přijímá pouze bezpečné SELECT dotazy. Změny lidí provádějte přes formulář „Přidat člověka“.</div>';
    meta.textContent = "Dotaz odmítnut";
    syncExportMenu();
    return;
  }
  const started = performance.now();
  try {
    const results = db.exec(sql);
    if (!results.length) {
      output.innerHTML = '<div class="empty-result"><div><b>0 řádků</b>Dotaz proběhl v pořádku, ale nic nenašel.</div></div>';
      meta.textContent = `0 řádků · ${Math.round(performance.now()-started)} ms`;
      syncExportMenu();
      return;
    }
    const {columns, values} = results[0];
    const table = document.createElement("table");
    table.className = "result-table";
    const thead = table.createTHead().insertRow();
    columns.forEach(c => { const th = document.createElement("th"); th.textContent = c; thead.appendChild(th); });
    const tbody = table.createTBody();
    values.forEach(row => {
      const tr = tbody.insertRow();
      row.forEach((value, index) => {
        const td = tr.insertCell();
        const text = String(value ?? "");
        const columnKey = normalizeImportText(columns[index]);
        const isEmail = ["email", "e mail"].includes(columnKey) && text.includes("@");
        if (isEmail) {
          const link = document.createElement("a");
          link.className = "result-action-link result-email-link";
          link.href = `mailto:${text.trim()}`;
          link.textContent = text.trim();
          td.className = "result-cell-action";
          td.appendChild(link);
        } else {
          td.textContent = value ?? "—";
        }
        td.title = text;
      });
    });
    output.replaceChildren(table);
    meta.textContent = `${values.length} ${values.length === 1 ? "řádek" : "řádků"} · ${Math.round(performance.now()-started)} ms`;
    syncExportMenu();
  } catch (error) {
    output.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
    meta.textContent = "Chyba v dotazu";
    syncExportMenu();
  }
}

const presets = {
  all: `SELECT p.name AS jmeno, p.nickname AS prezdivka, p.role, p.birth_date AS datum_narozeni, p.age AS vek, c.name AS kategorie, p.registration_category AS registracni_kategorie, p.city AS mesto, p.email AS email, p.notes AS poznamka, ot.name AS primarni_jednotka,\n  (SELECT GROUP_CONCAT(o.name, ', ') FROM people_teams pom JOIN teams o ON o.id=pom.team_id WHERE pom.person_id=p.id) AS jednotky,\n  GROUP_CONCAT(t.name, ', ') AS stitky\nFROM people p\nLEFT JOIN categories c ON c.id = p.category_id\nLEFT JOIN teams ot ON ot.id = p.org_team_id\nLEFT JOIN people_tags pt ON pt.person_id = p.id\nLEFT JOIN tags t ON t.id = pt.tag_id\nGROUP BY p.id\nORDER BY p.name;`,
  young: `SELECT p.name AS jmeno, p.birth_date AS datum_narozeni, p.age AS vek, p.role, p.email AS email, ot.name AS primarni_jednotka,\n  (SELECT GROUP_CONCAT(o.name, ', ') FROM people_teams pom JOIN teams o ON o.id=pom.team_id WHERE pom.person_id=p.id) AS jednotky\nFROM people p\nLEFT JOIN teams ot ON ot.id = p.org_team_id\nWHERE p.age <= 30\nORDER BY p.age;`,
  category: `SELECT c.name AS kategorie, COUNT(p.id) AS pocet_lidi, ROUND(AVG(p.age), 1) AS prumerny_vek\nFROM categories c\nLEFT JOIN people p ON p.category_id = c.id\nGROUP BY c.id\nORDER BY pocet_lidi DESC;`,
  tags: `SELECT t.name AS stitek, COUNT(pt.person_id) AS pocet_lidi\nFROM tags t\nLEFT JOIN people_tags pt ON pt.tag_id = t.id\nGROUP BY t.id\nORDER BY pocet_lidi DESC, t.name;`
};

function fillCitySuggestions() {
  const list = document.querySelector("#city-suggestions");
  if (!list) return;
  const cities = queryObjects(`SELECT TRIM(city) AS city, COUNT(*) AS usage_count
    FROM people
    WHERE TRIM(COALESCE(city, '')) <> ''
    GROUP BY city COLLATE NOCASE
    ORDER BY usage_count DESC, city COLLATE NOCASE
    LIMIT 15`);
  list.innerHTML = cities.map(item => `<option value="${escapeHtml(item.city)}" label="${item.usage_count}×"></option>`).join("");
}

function hidePersonTagSuggestions() {
  const input = document.querySelector("#person-tags");
  const list = document.querySelector("#person-tag-suggestions");
  if (list) {
    list.hidden = true;
    list.replaceChildren();
  }
  if (input) {
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  personTagSuggestionIndex = -1;
  personTagSuggestionValues = [];
}

function renderPersonTagSuggestions(input) {
  const list = document.querySelector("#person-tag-suggestions");
  if (!list) return;
  const parts = input.value.split(",");
  const fragment = normalizeImportText(parts.at(-1)?.trim() || "");
  const selected = new Set(parts.slice(0, -1).map(value => normalizeImportText(value.trim())).filter(Boolean));
  const usage = new Map();
  people.forEach(person => (person.tagsArray || []).forEach(tag => {
    const key = normalizeImportText(tag);
    usage.set(key, (usage.get(key) || 0) + 1);
  }));
  personTagSuggestionValues = tagsData
    .map(tag => ({name: String(tag.name || "").trim(), key: normalizeImportText(tag.name), count: usage.get(normalizeImportText(tag.name)) || 0}))
    .filter(tag => tag.name && !selected.has(tag.key) && (!fragment || tag.key.includes(fragment)))
    .sort((a, b) => Number(b.key.startsWith(fragment)) - Number(a.key.startsWith(fragment)) || b.count - a.count || a.name.localeCompare(b.name, "cs"))
    .slice(0, 8);
  if (!personTagSuggestionValues.length) return hidePersonTagSuggestions();
  personTagSuggestionIndex = fragment ? 0 : -1;
  list.innerHTML = personTagSuggestionValues.map((tag, index) => `<button type="button" id="person-tag-option-${index}" role="option" aria-selected="${index === personTagSuggestionIndex}" data-tag-suggestion="${index}" class="${index === personTagSuggestionIndex ? "is-active" : ""}"><span>#${escapeHtml(tag.name)}</span><small>${tag.count ? `${tag.count}× použito` : "nepoužito"}</small></button>`).join("");
  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
  if (personTagSuggestionIndex >= 0) input.setAttribute("aria-activedescendant", `person-tag-option-${personTagSuggestionIndex}`);
  else input.removeAttribute("aria-activedescendant");
}

function setPersonTagSuggestionIndex(input, nextIndex) {
  const list = document.querySelector("#person-tag-suggestions");
  if (!list || list.hidden || !personTagSuggestionValues.length) return;
  personTagSuggestionIndex = (nextIndex + personTagSuggestionValues.length) % personTagSuggestionValues.length;
  list.querySelectorAll("[data-tag-suggestion]").forEach((button, index) => {
    button.classList.toggle("is-active", index === personTagSuggestionIndex);
    button.setAttribute("aria-selected", String(index === personTagSuggestionIndex));
  });
  input.setAttribute("aria-activedescendant", `person-tag-option-${personTagSuggestionIndex}`);
  list.querySelector(`[data-tag-suggestion="${personTagSuggestionIndex}"]`)?.scrollIntoView({block: "nearest"});
}

function choosePersonTagSuggestion(input, index) {
  const suggestion = personTagSuggestionValues[index];
  if (!suggestion) return;
  const completed = input.value.split(",").slice(0, -1).map(value => value.trim()).filter(Boolean);
  input.value = [...completed, suggestion.name].join(", ") + ", ";
  renderPersonTagSuggestions(input);
  input.focus({preventScroll: true});
}

function handlePersonTagSuggestionKeydown(event) {
  const input = event.target;
  if (input.id !== "person-tags") return false;
  const list = document.querySelector("#person-tag-suggestions");
  if (event.key === "Escape" && list && !list.hidden) {
    event.preventDefault();
    hidePersonTagSuggestions();
    return true;
  }
  if (!list || list.hidden) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    setPersonTagSuggestionIndex(input, personTagSuggestionIndex < 0 ? (direction > 0 ? 0 : personTagSuggestionValues.length - 1) : personTagSuggestionIndex + direction);
    return true;
  }
  if ((event.key === "Enter" || event.key === "Tab") && personTagSuggestionIndex >= 0) {
    if (event.key === "Enter") event.preventDefault();
    choosePersonTagSuggestion(input, personTagSuggestionIndex);
    return event.key === "Enter";
  }
  return false;
}

function fillCategoryOptions() {
  const categories = queryObjects("SELECT id, name FROM categories ORDER BY id");
  document.querySelector("#person-category").innerHTML = `<option value="">Bez kategorie</option>${categories.map(c => `<option value="${c.id}">${escapeHtml(c.name || "Bez názvu")}</option>`).join("")}`;
  const root = teams.find(team => team.level === 0);
  const rootedOddily = teams.filter(team => team.level === 1 && team.parent_id === root?.id);
  const independent = teams.filter(team => team.level === 1 && team.parent_id == null);
  const orderedUnits = [
    ...(root ? [root] : []),
    ...rootedOddily.flatMap(oddil => [oddil, ...teams.filter(team => team.parent_id === oddil.id)]),
    ...independent.flatMap(unit => [unit, ...teams.filter(team => team.parent_id === unit.id)]),
  ];
  const includedIds = new Set(orderedUnits.map(team => team.id));
  orderedUnits.push(...teams.filter(team => !includedIds.has(team.id)));
  const kindLabel = team => team.level === 0 ? "středisko" : team.level === 1 && team.parent_id == null ? "nezávislá jednotka" : team.level === 1 ? "oddíl" : team.level === 2 ? "družina" : "jednotka";
  const depth = team => team.level === 0 ? 0 : team.level === 1 ? 1 : 2;
  const teamOptions = orderedUnits.map(team => `<option value="${team.id}">${"— ".repeat(depth(team))}${escapeHtml(team.name || "Bez názvu")} · ${kindLabel(team)}</option>`).join("");
  document.querySelector("#person-team").innerHTML = `<option value="">Bez primární jednotky</option>${teamOptions}`;
  document.querySelector("#person-units").innerHTML = orderedUnits.map(team => `
    <label class="multi-check-option unit-level-${depth(team)}"><input type="checkbox" name="unit_ids" value="${team.id}"><span>${escapeHtml(team.name || "Bez názvu")}</span><small>${kindLabel(team)}</small></label>`).join("") || '<span class="empty-line">Nejdříve přidejte jednotku.</span>';
  fillCitySuggestions();
}

function openPersonModal(id = null) {
  editingId = id;
  const form = document.querySelector("#person-form");
  hidePersonTagSuggestions();
  fillCitySuggestions();
  form.reset();
  document.querySelector("#modal-title").textContent = id ? "Upravit člověka" : "Přidat člověka";
  if (id) {
    const person = people.find(p => p.id === id);
    for (const key of ["name","nickname","role","age","category_id","registration_category","org_team_id","city","email","notes"]) if (form.elements[key]) form.elements[key].value = person[key] ?? "";
    form.elements.tags.value = person.tagsArray.join(", ");
    form.querySelectorAll('input[name="unit_ids"]').forEach(input => { input.checked = person.unitIds.includes(+input.value); });
  }
  document.querySelector("#person-modal").classList.add("open");
  setTimeout(() => form.elements.name.focus(), 80);
}

function closePersonModal() { document.querySelector("#person-modal").classList.remove("open"); editingId = null; }

async function savePerson(event) {
  event.preventDefault();
  const wasEditing = Boolean(editingId);
  const form = new FormData(event.currentTarget);
  const orgTeamValue = form.get("org_team_id");
  const categoryValue = form.get("category_id");
  const ageValue = form.get("age");
  const orgTeamId = orgTeamValue === "" ? null : +orgTeamValue;
  const categoryId = categoryValue === "" ? null : +categoryValue;
  const age = ageValue === "" ? null : +ageValue;
  const selectedUnitIds = form.getAll("unit_ids").map(Number).filter(Boolean);
  const unitIds = [...new Set([...selectedUnitIds, ...(orgTeamId ? [orgTeamId] : [])])];
  const teamName = orgTeamId == null ? "" : teams.find(team => team.id === orgTeamId)?.name ?? "";
  const values = [form.get("name").trim(), form.get("nickname").trim(), form.get("role").trim(), age, categoryId, form.get("registration_category").trim(), teamName, form.get("city").trim(), form.get("email").trim(), form.get("notes").trim(), orgTeamId];
  persistWorkspaceState(true);
  db.run("BEGIN");
  try {
    let id = editingId;
    if (id) {
      db.run("UPDATE people SET name=?, nickname=?, role=?, age=?, category_id=?, registration_category=?, team=?, city=?, email=?, notes=?, org_team_id=? WHERE id=?", [...values, id]);
      db.run("DELETE FROM people_tags WHERE person_id=?", [id]);
      db.run("DELETE FROM people_teams WHERE person_id=?", [id]);
    } else {
      db.run("INSERT INTO people (name,nickname,role,age,category_id,registration_category,team,city,email,notes,org_team_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)", values);
      id = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
    }
    const tags = [...new Set(form.get("tags").split(",").map(t => t.trim().toLocaleLowerCase("cs")).filter(Boolean))];
    tags.forEach(tag => {
      db.run("INSERT OR IGNORE INTO tags (name) VALUES (?)", [tag]);
      const tagId = queryObjects("SELECT id FROM tags WHERE name=?", [tag])[0].id;
      db.run("INSERT OR IGNORE INTO people_tags VALUES (?,?)", [id, tagId]);
    });
    const insertMembership = db.prepare("INSERT OR IGNORE INTO people_teams (person_id,team_id) VALUES (?,?)");
    unitIds.forEach(teamId => insertMembership.run([id, teamId]));
    insertMembership.free();
    db.run("COMMIT");
    await persistDatabase();
    await loadPeople();
    renderGraphV2();
    renderEditDashboard();
    closePersonModal();
    showToast(wasEditing ? "Změny jsou uložené." : "Nový člověk je na mapě.");
  } catch (error) {
    db.run("ROLLBACK");
    showToast(`Nepodařilo se uložit: ${error.message}`);
  }
}

function exportDatabase() {
  const blob = new Blob([db.export()], {type: "application/vnd.sqlite3"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mapa-strediska-${new Date().toISOString().slice(0,10)}.sqlite`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast("Databáze byla exportována.");
}

const FIELD_EXPORT_LABELS = {
  oddil: "oddíly",
  druzina: "družiny",
  role: "role",
  city: "města",
  category: "kategorie",
  tags: "štítky"
};

function currentViewExportLabel() {
  if (currentMode === "field") return `Field · ${FIELD_EXPORT_LABELS[fieldDimension] || fieldDimension}`;
  if (currentMode === "age") return "Věk";
  return "Struktura";
}

function currentMapExportContext() {
  const rootTeam = teams.find(team => +team.level === 0);
  const peopleCount = graphPeople.length;
  const teamCount = graphTeams.length;
  const date = new Date();
  return {
    title: rootTeam?.name || "Kdo tvoří středisko?",
    view: currentViewExportLabel(),
    peopleCount,
    teamCount,
    date,
    dateText: new Intl.DateTimeFormat("cs-CZ", {dateStyle: "long", timeStyle: "short"}).format(date)
  };
}

function mapExportFilename(extension) {
  const context = currentMapExportContext();
  const slug = `${context.title}-${context.view}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "mapa-strediska";
  const localDate = `${context.date.getFullYear()}-${String(context.date.getMonth() + 1).padStart(2, "0")}-${String(context.date.getDate()).padStart(2, "0")}`;
  return `${slug}-${localDate}.${extension}`;
}

function tableExportFilename() {
  const summary = document.querySelector("#sql-builder-summary")?.textContent || "sql-vysledky";
  const slug = summary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "sql-vysledky";
  const date = new Date();
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${slug}-${localDate}.xlsx`;
}

function syncExportMenu() {
  const isMap = activeSection === "map";
  const resultTable = document.querySelector("#result-wrap .result-table");
  const panelTitle = document.querySelector("#export-panel-title");
  const note = document.querySelector("#export-panel-note");
  document.querySelectorAll('[data-export-kind="map"]').forEach(button => { button.hidden = !isMap; });
  document.querySelectorAll('[data-export-kind="table"]').forEach(button => {
    button.hidden = isMap;
    button.disabled = !resultTable;
  });
  if (panelTitle) panelTitle.textContent = isMap ? "Export pohledu" : "Export tabulky";
  if (note) note.textContent = isMap
    ? "Export respektuje aktuální pohled, filtry a barevné nastavení."
    : resultTable ? "Exportuje právě zobrazený výsledek SQL dotazu." : "Nejdříve spusťte SQL dotaz, který vytvoří tabulku.";
}

function closeMapControlPanels(except = "") {
  ["filter", "export"].forEach(name => {
    if (name === except) return;
    document.querySelector(`#${name}-panel`)?.classList.remove("open");
    document.querySelector(`#${name}-toggle`)?.setAttribute("aria-expanded", "false");
  });
  if (except !== "tags") document.querySelector("#field-tag-picker")?.removeAttribute("open");
  if (except !== "filter") hideFilterSuggestions();
}

function syncPrintMapHeader() {
  const context = currentMapExportContext();
  const title = document.querySelector("#print-map-title");
  const view = document.querySelector("#print-view-name");
  const meta = document.querySelector("#print-view-meta");
  if (title) title.textContent = context.title;
  if (view) view.textContent = context.view;
  if (meta) meta.textContent = `${context.peopleCount} lidí · ${context.teamCount} jednotek · ${context.dateText}`;
  return context;
}

function exportCurrentMapAsPdf() {
  const map = document.querySelector("#map");
  if (!map) return;
  closeMapControlPanels();
  hideFieldSectionInfo();
  hideUnitActionPopover();
  const context = syncPrintMapHeader();
  const bounds = map.getBoundingClientRect();
  const previousTitle = document.title;
  const previousViewBox = map.getAttribute("viewBox");
  const previousAspectRatio = map.getAttribute("preserveAspectRatio");
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener("afterprint", cleanup);
    document.body.classList.remove("printing-map");
    document.title = previousTitle;
    if (previousViewBox == null) map.removeAttribute("viewBox"); else map.setAttribute("viewBox", previousViewBox);
    if (previousAspectRatio == null) map.removeAttribute("preserveAspectRatio"); else map.setAttribute("preserveAspectRatio", previousAspectRatio);
  };
  map.setAttribute("viewBox", `0 0 ${Math.max(1, bounds.width)} ${Math.max(1, bounds.height)}`);
  map.setAttribute("preserveAspectRatio", "xMidYMid meet");
  document.title = mapExportFilename("pdf").replace(/\.pdf$/i, "");
  document.body.classList.add("printing-map");
  window.addEventListener("afterprint", cleanup, {once: true});
  try {
    window.print();
  } finally {
    cleanup();
    showToast(`PDF pohledu „${context.view}“ je připravené v tiskovém dialogu.`);
  }
}

function collectExportStyles() {
  const chunks = [];
  [...document.styleSheets].forEach(sheet => {
    try { chunks.push([...sheet.cssRules].map(rule => rule.cssText).join("\n")); } catch (_) {}
  });
  return chunks.join("\n");
}

function freezeSvgExportTextStyles(sourceSvg, cloneSvg) {
  const sourceTexts = [...sourceSvg.querySelectorAll("text")];
  const cloneTexts = [...cloneSvg.querySelectorAll("text")];
  cloneTexts.forEach((text, index) => {
    const source = sourceTexts[index];
    if (!source) return;
    const computed = getComputedStyle(source);
    const fill = computed.fill || computed.color;
    if (fill && fill !== "none") {
      text.setAttribute("fill", fill);
      text.style.setProperty("fill", fill, "important");
    }
    if (computed.stroke) {
      text.setAttribute("stroke", computed.stroke);
      text.style.setProperty("stroke", computed.stroke, "important");
    }
    ["stroke-width", "paint-order", "font-family", "font-size", "font-style", "font-weight", "letter-spacing"].forEach(property => {
      const value = computed.getPropertyValue(property);
      if (value) text.style.setProperty(property, value);
    });
  });

  const sourceHtml = [...sourceSvg.querySelectorAll("foreignObject, foreignObject *")];
  const cloneHtml = [...cloneSvg.querySelectorAll("foreignObject, foreignObject *")];
  cloneHtml.forEach((element, index) => {
    const source = sourceHtml[index];
    if (!source) return;
    const computed = getComputedStyle(source);
    ["color", "background-color", "border-color", "font-family", "font-size", "font-style", "font-weight"].forEach(property => {
      const value = computed.getPropertyValue(property);
      if (value) element.style.setProperty(property, value, "important");
    });
  });
}

function exportCurrentMapAsSvg() {
  const map = document.querySelector("#map");
  if (!map) return;
  closeMapControlPanels();
  hideFieldSectionInfo();
  hideUnitActionPopover();
  const context = currentMapExportContext();
  const bounds = map.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const clone = map.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  clone.setAttribute("data-theme", document.documentElement.dataset.theme || "light");
  clone.classList.add("map-export-snapshot");
  freezeSvgExportTextStyles(map, clone);
  clone.setAttribute("aria-label", `${context.title} · ${context.view}`);

  const computedRoot = getComputedStyle(document.documentElement);
  ["--paper", "--paper-deep", "--ink", "--muted", "--line", "--line-strong", "--white", "--surface-soft", "--surface-subtle", "--surface-hover", "--glass", "--glass-strong", "--input-bg", "--label-halo", "--graph-link", "--graph-guide", "--focus", "--coral", "--teal", "--lime", "--sky", "--sand"].forEach(name => {
    clone.style.setProperty(name, computedRoot.getPropertyValue(name));
  });

  const namespace = "http://www.w3.org/2000/svg";
  const style = document.createElementNS(namespace, "style");
  style.textContent = collectExportStyles();
  const title = document.createElementNS(namespace, "title");
  title.textContent = `${context.title} · ${context.view}`;
  const metadata = document.createElementNS(namespace, "metadata");
  metadata.textContent = `Exportováno ${context.date.toISOString()} · ${context.peopleCount} lidí · ${context.teamCount} jednotek`;
  const background = document.createElementNS(namespace, "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", computedRoot.getPropertyValue("--paper").trim() || "#f4f2eb");
  const firstGraphic = clone.firstChild;
  clone.insertBefore(style, firstGraphic);
  clone.insertBefore(title, firstGraphic);
  clone.insertBefore(metadata, firstGraphic);
  clone.insertBefore(background, firstGraphic);

  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  const url = URL.createObjectURL(new Blob([source], {type: "image/svg+xml;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = mapExportFilename("svg");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`SVG pohledu „${context.view}“ bylo staženo.`);
}

async function exportCurrentTableAsXlsx() {
  const table = document.querySelector("#result-wrap .result-table");
  if (!table) {
    showToast("Nejdříve spusťte dotaz s tabulkovým výsledkem.");
    syncExportMenu();
    return;
  }
  try {
    const {utils: xlsxUtils, writeFileXLSX} = await import("xlsx");
    const workbook = xlsxUtils.table_to_book(table, {sheet: "Výsledky SQL"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = [...table.rows].map(row => [...row.cells].map(cell => cell.textContent?.trim() || ""));
    const columnCount = Math.max(0, ...rows.map(row => row.length));
    sheet["!cols"] = Array.from({length: columnCount}, (_, columnIndex) => ({
      wch: Math.min(52, Math.max(10, ...rows.map(row => String(row[columnIndex] || "").length + 2)))
    }));
    writeFileXLSX(workbook, tableExportFilename(), {compression: true});
    closeMapControlPanels();
    showToast("Tabulka byla exportována do XLSX.");
  } catch (error) {
    showToast(`XLSX se nepodařilo vytvořit: ${error.message}`);
  }
}

function showToast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function bindEvents() {
  syncThemeControl();
  syncAppSettingsControls();
  const personInfoCard = document.querySelector("#person-info-card");
  personInfoCard.addEventListener("click", event => {
    event.stopPropagation();
    const closeButton = event.target.closest("[data-person-info-close]");
    if (closeButton) return closeExpandedPersonInfo();
    const copyButton = event.target.closest("[data-person-info-copy]");
    if (copyButton) return copySelectedPersonInformation(copyButton);
    const toggle = event.target.closest("[data-person-info-toggle]");
    if (toggle) {
      const section = toggle.closest("[data-person-info-expandable]");
      const expanded = section.dataset.expanded === "true";
      if (!toggle.dataset.moreLabel) toggle.dataset.moreLabel = toggle.textContent;
      section.dataset.expanded = String(!expanded);
      toggle.textContent = expanded ? toggle.dataset.moreLabel : "Zobrazit méně";
      clampPersonInfoCard(parseFloat(personInfoCard.style.left) || 12, parseFloat(personInfoCard.style.top) || 12);
    }
  });
  personInfoCard.addEventListener("pointerdown", event => {
    if (event.target.closest("[data-person-info-drag]")) startPersonInfoCardDrag(event);
  });
  ["#field-section-popover", "#unit-action-popover"].forEach(selector => {
    const panel = document.querySelector(selector);
    panel.addEventListener("click", event => event.stopPropagation());
    panel.addEventListener("pointerdown", event => {
      if (event.target.closest("[data-map-panel-drag]")) startMapFloatingPanelDrag(event, panel);
    });
  });
  document.querySelector("#app-theme-select").addEventListener("change", event => setThemePreference(event.target.value));
  document.querySelector("#app-text-size").addEventListener("input", event => {
    updateAppSetting("textScale", +event.target.value);
  });
  document.querySelector("#app-background-color").addEventListener("input", event => {
    updateAppSetting("mapBackground", event.target.value);
  });
  document.querySelector("#reset-app-background").addEventListener("click", () => updateAppSetting("mapBackground", ""));
  document.querySelector("#app-show-hints").addEventListener("change", event => {
    updateAppSetting("showHints", event.target.checked);
  });
  document.querySelector("#app-show-stats").addEventListener("change", event => {
    updateAppSetting("showStats", event.target.checked);
  });
  document.querySelector("#reset-app-settings").addEventListener("click", () => {
    appSettings = {...DEFAULT_APP_SETTINGS};
    persistAppSettings();
    setThemePreference("system");
    applyAppSettings();
    showToast("Vzhled aplikace byl obnoven.");
  });
  const appSettingsPanel = document.querySelector("#app-settings");
  appSettingsPanel.addEventListener("click", event => event.stopPropagation());
  appSettingsPanel.addEventListener("toggle", () => {
    if (appSettingsPanel.open) closeMapControlPanels();
  });
  document.querySelectorAll(".nav-button").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.section === "sql") return showSection("sql");
    if (button.dataset.viewMode === "field" && !fieldSidebarExpanded) {
      fieldSidebarExpanded = true;
      syncFieldSidebarExpansion();
      scheduleWorkspaceState();
    }
    showSection("map");
    updateModeV2(button.dataset.viewMode);
    clearTimeout(graphFitTimer);
    graphFitTimer = setTimeout(() => fitMapToStructure(true), 700);
  }));
  document.querySelector("#field-subnav-toggle")?.addEventListener("click", event => {
    event.stopPropagation();
    fieldSidebarExpanded = !fieldSidebarExpanded;
    syncFieldSidebarExpansion();
    scheduleWorkspaceState();
  });
  document.querySelector("#fit-map").addEventListener("click", () => fitMapToStructure(true));
  document.querySelector("#filter-toggle").addEventListener("click", event => {
    event.stopPropagation();
    const panel = document.querySelector("#filter-panel");
    const open = !panel.classList.contains("open");
    closeMapControlPanels();
    document.querySelector("#app-settings")?.removeAttribute("open");
    panel.classList.toggle("open", open);
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll("[data-field]").forEach(button => button.addEventListener("click", () => {
    fieldDimension = button.dataset.field;
    showSection("map");
    syncFieldDimensionControls();
    syncFieldTagPickerVisibility();
    updateModeV2("field");
  }));
  const fieldTagPicker = document.querySelector("#field-tag-picker");
  fieldTagPicker.addEventListener("toggle", () => {
    if (fieldTagPicker.open) {
      closeMapControlPanels("tags");
      document.querySelector("#app-settings")?.removeAttribute("open");
      requestAnimationFrame(() => fieldTagPicker.querySelector("#field-tag-search-input")?.focus());
    }
  });
  fieldTagPicker.addEventListener("click", event => {
    event.stopPropagation();
    const action = event.target.closest("[data-field-tag-action]")?.dataset.fieldTagAction;
    if (!action) return;
    if (action === "clear-search") {
      fieldTagSearchTerm = "";
      const input = fieldTagPicker.querySelector("#field-tag-search-input");
      if (input) input.value = "";
      applyFieldTagSearch("");
      input?.focus();
      return;
    }
    const selected = new Set(selectedFieldTagIds);
    const visibleInputs = [...fieldTagPicker.querySelectorAll('.field-tag-options label:not([hidden]) input[type="checkbox"]')];
    visibleInputs.forEach(input => {
      const id = +input.value;
      if (action === "all") selected.add(id);
      else if (action === "none") selected.delete(id);
      else if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      input.checked = selected.has(id);
    });
    selectedFieldTagIds = [...selected];
    updateFieldTagPickerCount();
    updateModeV2("field");
    scheduleWorkspaceState();
  });
  fieldTagPicker.addEventListener("input", event => {
    if (event.target.id === "field-tag-search-input") applyFieldTagSearch(event.target.value);
  });
  fieldTagPicker.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    fieldTagPicker.open = false;
  });
  fieldTagPicker.addEventListener("change", event => {
    if (event.target.matches("[data-field-tag-sort]")) {
      fieldTagSort = event.target.value;
      renderFieldTagPicker();
      scheduleWorkspaceState();
      return;
    }
    if (event.target.matches("[data-field-tag-used-only]")) {
      fieldTagOnlyUsed = event.target.checked;
      renderFieldTagPicker();
      scheduleWorkspaceState();
      return;
    }
    if (!event.target.matches('.field-tag-options input[type="checkbox"]')) return;
    const selected = new Set(selectedFieldTagIds);
    const id = +event.target.value;
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    selectedFieldTagIds = [...selected];
    updateFieldTagPickerCount();
    updateModeV2("field");
    scheduleWorkspaceState();
  });
  document.querySelector("#export-toggle")?.addEventListener("click", event => {
    event.stopPropagation();
    const panel = document.querySelector("#export-panel");
    const open = !panel.classList.contains("open");
    closeMapControlPanels();
    document.querySelector("#app-settings")?.removeAttribute("open");
    syncExportMenu();
    panel.classList.toggle("open", open);
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.querySelector("#export-panel")?.addEventListener("click", event => {
    event.stopPropagation();
    const action = event.target.closest("[data-map-export]")?.dataset.mapExport;
    if (action === "pdf") exportCurrentMapAsPdf();
    if (action === "svg") exportCurrentMapAsSvg();
    if (action === "xlsx") exportCurrentTableAsXlsx();
  });
  const filterPanel = document.querySelector("#filter-panel");
  filterPanel.addEventListener("click", event => {
    event.stopPropagation();
    const suggestion = event.target.closest("[data-filter-suggestion]");
    if (suggestion) {
      applyFilterSuggestion(+suggestion.dataset.filterSuggestion);
      return;
    }
    const action = event.target.closest("[data-filter-action]")?.dataset.filterAction;
    if (action === "add-rule") {
      graphFilters.rules.push({field: "name", operator: "contains", value: ""});
      renderGraphFilterPanel();
      return;
    }
    if (action === "add-color") {
      colorRules.push({field: "category", operator: "equals", value: "", color: "#6ba29b"});
      renderGraphFilterPanel();
      return;
    }
    if (action === "reset") {
      graphFilters = {...DEFAULT_GRAPH_FILTERS, rules: []};
      connectionFilters = {...DEFAULT_CONNECTION_FILTERS};
      hiddenRelationshipTypes = [];
      colorRules = [];
      graphColorMode = "group";
      displayOptions.tags = false;
      displayOptions.categories = true;
      displayOptions.titles = true;
      syncConnectionDisplayOptions();
      renderGraphFilterPanel();
      scheduleGraphFilterUpdate();
      showToast("Filtry mapy byly vráceny na výchozí nastavení.");
      return;
    }
    const filterRemove = event.target.closest("[data-filter-remove]");
    if (filterRemove) {
      graphFilters.rules.splice(+filterRemove.dataset.filterRemove, 1);
      renderGraphFilterPanel();
      scheduleGraphFilterUpdate();
      return;
    }
    const colorRemove = event.target.closest("[data-color-remove]");
    if (colorRemove) {
      colorRules.splice(+colorRemove.dataset.colorRemove, 1);
      renderGraphFilterPanel();
      scheduleGraphFilterUpdate();
      return;
    }
    const move = event.target.closest("[data-color-move]");
    if (move) {
      const from = +move.dataset.colorMove;
      const to = from + +move.dataset.direction;
      if (to >= 0 && to < colorRules.length) colorRules.splice(to, 0, colorRules.splice(from, 1)[0]);
      renderGraphFilterPanel();
      scheduleGraphFilterUpdate();
    }
  });
  filterPanel.addEventListener("change", event => {
    if (event.target.matches("[data-filter-unit]")) {
      graphFilters.unitId = event.target.value;
      const descendants = filterPanel.querySelector("[data-filter-descendants]");
      if (descendants) descendants.disabled = !graphFilters.unitId;
    }
    else if (event.target.matches("[data-filter-descendants]")) graphFilters.includeDescendants = event.target.checked;
    else if (event.target.matches("[data-filter-orphans]")) graphFilters.showOrphans = event.target.checked;
    else if (event.target.matches("[data-display-option]")) displayOptions[event.target.dataset.displayOption] = event.target.checked;
    else if (event.target.matches("[data-filter-match]")) graphFilters.match = event.target.value;
    else if (event.target.matches("[data-color-mode]")) {
      graphColorMode = event.target.value;
      renderGraphFilterPanel();
    }
    else if (event.target.matches("[data-connection-filter]")) {
      connectionFilters[event.target.dataset.connectionFilter] = event.target.checked;
      syncConnectionDisplayOptions();
    }
    else if (event.target.matches("[data-relationship-type]")) {
      const type = event.target.dataset.relationshipType;
      hiddenRelationshipTypes = event.target.checked ? hiddenRelationshipTypes.filter(item => item !== type) : [...new Set([...hiddenRelationshipTypes, type])];
    }
    else if (event.target.matches("[data-filter-rule-field]")) {
      graphFilters.rules[+event.target.dataset.filterRuleField].field = event.target.value;
      hideFilterSuggestions();
    }
    else if (event.target.matches("[data-filter-rule-operator]")) {
      const rule = graphFilters.rules[+event.target.dataset.filterRuleOperator];
      rule.operator = event.target.value;
      const input = event.target.closest(".filter-rule")?.querySelector("[data-filter-rule-value]");
      if (input) input.disabled = rule.operator === "empty";
      hideFilterSuggestions();
    } else if (event.target.matches("[data-color-rule-field]")) {
      colorRules[+event.target.dataset.colorRuleField].field = event.target.value;
      hideFilterSuggestions();
    } else if (event.target.matches("[data-color-rule-operator]")) {
      const rule = colorRules[+event.target.dataset.colorRuleOperator];
      rule.operator = event.target.value;
      const input = event.target.closest(".color-rule")?.querySelector("[data-color-rule-value]");
      if (input) input.disabled = rule.operator === "empty";
      hideFilterSuggestions();
    }
    else return;
    scheduleGraphFilterUpdate();
  });
  filterPanel.addEventListener("input", event => {
    if (event.target.matches("[data-filter-query]")) graphFilters.query = event.target.value;
    else if (event.target.matches("[data-filter-rule-value]")) graphFilters.rules[+event.target.dataset.filterRuleValue].value = event.target.value;
    else if (event.target.matches("[data-color-rule-value]")) colorRules[+event.target.dataset.colorRuleValue].value = event.target.value;
    else if (event.target.matches("[data-color-rule-color]")) colorRules[+event.target.dataset.colorRuleColor].color = event.target.value;
    else return;
    if (event.target.matches("[data-filter-query], [data-filter-rule-value], [data-color-rule-value]")) renderFilterSuggestions(event.target);
    scheduleGraphFilterUpdate();
  });
  filterPanel.addEventListener("focusin", event => {
    if (event.target.matches("[data-filter-query], [data-filter-rule-value], [data-color-rule-value]") && !event.target.disabled) renderFilterSuggestions(event.target);
  });
  filterPanel.addEventListener("focusout", event => {
    if (!event.target.matches("[data-filter-query], [data-filter-rule-value], [data-color-rule-value]")) return;
    setTimeout(() => {
      if (!filterPanel.contains(document.activeElement) || !document.activeElement?.closest("[data-filter-suggestion-list]")) hideFilterSuggestions();
    }, 0);
  });
  filterPanel.addEventListener("keydown", event => {
    if (!event.target.matches("[data-filter-query], [data-filter-rule-value], [data-color-rule-value]")) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!filterSuggestionItems.length) renderFilterSuggestions(event.target);
      const nextIndex = filterSuggestionIndex < 0
        ? (event.key === "ArrowDown" ? 0 : filterSuggestionItems.length - 1)
        : filterSuggestionIndex + (event.key === "ArrowDown" ? 1 : -1);
      setFilterSuggestionIndex(nextIndex);
    } else if (event.key === "Enter" && filterSuggestionIndex >= 0) {
      event.preventDefault();
      applyFilterSuggestion(filterSuggestionIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      hideFilterSuggestions();
    }
  });
  const editDashboard = document.querySelector("#edit-dashboard");
  editDashboard.addEventListener("submit", handleEditorSubmit);
  editDashboard.addEventListener("click", handleEditorClick);
  editDashboard.addEventListener("input", event => {
    if (event.target.id === "people-editor-search") return applyPeopleEditorSearch(event.target.value);
    if (event.target.matches("[data-person-picker]")) syncRelationshipPersonPicker(event.target);
    scheduleInlineAutosave(event.target, false);
  });
  editDashboard.addEventListener("change", event => {
    if (event.target.matches("[data-person-picker]")) syncRelationshipPersonPicker(event.target);
    if (event.target.matches('input[type="color"]')) scheduleInlineAutosave(event.target, true);
    if (event.target.id === "spreadsheet-file") {
      handleSpreadsheetFiles(event.target.files);
      event.target.value = "";
    }
  });
  editDashboard.addEventListener("dragover", event => {
    const dropzone = event.target.closest(".spreadsheet-dropzone");
    if (!dropzone) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dropzone.classList.add("is-dragging");
  });
  editDashboard.addEventListener("dragleave", event => event.target.closest(".spreadsheet-dropzone")?.classList.remove("is-dragging"));
  editDashboard.addEventListener("drop", event => {
    const dropzone = event.target.closest(".spreadsheet-dropzone");
    if (!dropzone) return;
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
    handleSpreadsheetFiles(event.dataTransfer.files);
  });
  editDashboard.addEventListener("focusout", event => scheduleInlineAutosave(event.target, true));
  editDashboard.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target.matches("[data-team-id] input, [data-category-id] input, [data-tag-id] input")) { event.preventDefault(); event.target.blur(); }
  });
  const mapSearch = document.querySelector("#search");
  const mapSearchPanel = document.querySelector("#map-search-suggestions");
  mapSearch.addEventListener("input", event => {
    searchTerm = event.target.value;
    applySearch();
    renderMapSearchSuggestions(searchTerm);
    persistWorkspaceState(false);
  });
  mapSearch.addEventListener("focus", () => renderMapSearchSuggestions(searchTerm));
  mapSearch.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (mapSearchPanel.hidden) renderMapSearchSuggestions(searchTerm);
      if (mapSearchSuggestions.length) setActiveMapSearchSuggestion(activeMapSearchSuggestion + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && mapSearchSuggestions.length && !mapSearchPanel.hidden) {
      event.preventDefault();
      chooseMapSearchSuggestion(activeMapSearchSuggestion >= 0 ? activeMapSearchSuggestion : 0);
    } else if (event.key === "Escape" && !mapSearchPanel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      hideMapSearchSuggestions();
    }
  });
  mapSearch.addEventListener("blur", () => setTimeout(() => {
    if (!document.activeElement?.closest?.(".search-wrap")) hideMapSearchSuggestions();
  }, 0));
  mapSearchPanel.addEventListener("mousedown", event => event.preventDefault());
  mapSearchPanel.addEventListener("click", event => {
    const item = event.target.closest("[data-map-search-index]");
    if (!item) return;
    event.stopPropagation();
    chooseMapSearchSuggestion(+item.dataset.mapSearchIndex);
  });
  document.querySelector("#map").addEventListener("click", () => {
    hideFieldSectionInfo();
    closeExpandedPersonInfo();
  });
  document.querySelector("#add-person")?.addEventListener("click", () => openPersonModal());
  document.querySelector("#close-modal").addEventListener("click", closePersonModal);
  document.querySelector("#cancel-modal").addEventListener("click", closePersonModal);
  document.querySelector("#person-modal").addEventListener("click", e => { if (e.target.id === "person-modal") closePersonModal(); });
  const personForm = document.querySelector("#person-form");
  personForm.addEventListener("submit", savePerson);
  personForm.addEventListener("keydown", event => {
    if (handlePersonTagSuggestionKeydown(event)) return;
    if (event.key !== "Enter" || event.isComposing || event.repeat) return;
    const control = event.target;
    if (!control.matches('input:not([type="checkbox"]):not([type="radio"]), select')) return;
    event.preventDefault();
    personForm.requestSubmit(personForm.querySelector('button[type="submit"]'));
  });
  const personTags = document.querySelector("#person-tags");
  const personTagSuggestions = document.querySelector("#person-tag-suggestions");
  personTags.addEventListener("input", () => renderPersonTagSuggestions(personTags));
  personTags.addEventListener("focus", () => renderPersonTagSuggestions(personTags));
  personTags.addEventListener("blur", () => setTimeout(() => {
    if (!personTagSuggestions.contains(document.activeElement)) hidePersonTagSuggestions();
  }, 120));
  personTagSuggestions.addEventListener("mousedown", event => event.preventDefault());
  personTagSuggestions.addEventListener("click", event => {
    const button = event.target.closest("[data-tag-suggestion]");
    if (button) choosePersonTagSuggestion(personTags, +button.dataset.tagSuggestion);
  });
  document.querySelector("#close-spreadsheet-modal").addEventListener("click", closeSpreadsheetReview);
  document.querySelector("#spreadsheet-modal").addEventListener("click", event => {
    if (event.target.id === "spreadsheet-modal") return closeSpreadsheetReview();
    const actionButton = event.target.closest("[data-import-action]");
    if (actionButton?.dataset.importAction === "cancel") return closeSpreadsheetReview();
    if (actionButton?.dataset.importAction === "save") return saveSpreadsheetImport();
    const bulkButton = event.target.closest("[data-import-bulk]");
    if (!bulkButton || !spreadsheetImportState) return;
    const action = bulkButton.dataset.importBulk === "current" ? "current" : "new";
    spreadsheetImportState.rows.filter(row => row.matchId).forEach(row => { row.action = action; });
    document.querySelectorAll(".conflict-card").forEach(card => {
      card.dataset.resolution = action;
      const radio = card.querySelector(`input[type="radio"][value="${action}"]`);
      if (radio) radio.checked = true;
    });
    updateImportReviewStatus();
  });
  document.querySelector("#spreadsheet-modal").addEventListener("change", event => {
    if (!spreadsheetImportState) return;
    const card = event.target.closest("[data-import-row]");
    const row = card ? spreadsheetImportState.rows.find(item => item.id === +card.dataset.importRow) : null;
    if (!row) return;
    if (event.target.matches('input[type="radio"]')) {
      row.action = event.target.value;
      card.dataset.resolution = row.action;
    } else if (event.target.matches("[data-import-new]")) {
      row.action = event.target.checked ? "create" : "skip";
      card.classList.toggle("is-skipped", !event.target.checked);
    }
    updateImportReviewStatus();
  });
  document.querySelector("#spreadsheet-modal").addEventListener("input", event => {
    if (!spreadsheetImportState || !event.target.dataset.importField) return;
    const card = event.target.closest("[data-import-row]");
    const row = spreadsheetImportState.rows.find(item => item.id === +card?.dataset.importRow);
    if (row) row.draft[event.target.dataset.importField] = event.target.value;
  });
  document.querySelector("#unit-action-popover").addEventListener("click", event => {
    event.stopPropagation();
    const action = event.target.closest("[data-unit-action]")?.dataset.unitAction;
    if (action === "close") hideUnitActionPopover();
    if (action === "sql") openUnitPeopleInSql(+event.target.closest("[data-unit-id]").dataset.unitId);
  });
  document.querySelector("#sql-builder").addEventListener("change", syncSqlBuilderUi);
  document.querySelector("#sql-builder").addEventListener("input", syncSqlBuilderUi);
  document.querySelector("#build-query").addEventListener("click", () => createQueryFromBuilder(false));
  document.querySelector("#build-run-query").addEventListener("click", () => createQueryFromBuilder(true));
  document.querySelector("#run-query").addEventListener("click", runSelect);
  document.querySelector("#sql-query").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runSelect(); });
  document.querySelectorAll(".preset").forEach(b => b.addEventListener("click", () => { document.querySelector("#sql-query").value = presets[b.dataset.preset]; runSelect(); }));
  document.querySelector("#export-db")?.addEventListener("click", exportDatabase);
  document.querySelector("#import-db")?.addEventListener("click", () => document.querySelector("#import-db-file")?.click());
  document.querySelector("#import-db-file")?.addEventListener("change", importDatabaseFile);
  document.querySelector("#confirm-cancel").addEventListener("click", () => closeConfirm(false));
  document.querySelector("#confirm-accept").addEventListener("click", () => closeConfirm(true));
  document.querySelector("#confirm-modal").addEventListener("click", event => { if (event.target.id === "confirm-modal") closeConfirm(false); });
  document.addEventListener("click", event => {
    hideFieldSectionInfo();
    clearOddilReachHighlight();
    hideUnitActionPopover();
    closeExpandedPersonInfo();
    if (!event.target.closest?.(".search-wrap")) hideMapSearchSuggestions();
    closeMapControlPanels();
    if (!event.target.closest?.("#app-settings")) document.querySelector("#app-settings")?.removeAttribute("open");
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!document.querySelector("#map-search-suggestions")?.hidden) hideMapSearchSuggestions();
      else if (confirmResolver) closeConfirm(false);
      else if (document.querySelector("#spreadsheet-modal")?.classList.contains("open")) closeSpreadsheetReview();
      else if (document.querySelector("#person-modal")?.classList.contains("open")) closePersonModal();
      else {
        document.querySelector("#app-settings")?.removeAttribute("open");
        closeMapControlPanels();
        hideFieldSectionInfo();
        clearOddilReachHighlight();
        hideUnitActionPopover();
        closeExpandedPersonInfo();
      }
    }
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); document.querySelector("#search").focus(); }
  });
}

async function boot() {
  renderDatabaseGate();
  try {
    loadWorkspaceState();
    activeSection = "map";
    const SQL = await initSqlJs({locateFile: () => wasmUrl});
    SQLRuntime = SQL;
    databaseGateStatus("Čtečka je připravena. Vyberte svou databázi.", "ready");
  } catch (error) {
    databaseGateStatus(`Aplikaci se nepodařilo připravit: ${error.message}`, "error");
    console.error(error);
  }
}

boot();
