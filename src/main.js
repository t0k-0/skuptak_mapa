import * as d3 from "d3";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import "./styles.css";

const CATEGORY_COLORS = {
  "Vedení": "#ef765f",
  "Program": "#6ba29b",
  "Provoz": "#d4ae72",
  "Komunikace": "#8daec4",
  "Dobrovolníci": "#bbc85d"
};

const seed = {
  categories: [
    [1, "Vedení", "Směr, péče o tým a rozhodování", "#ef765f"],
    [2, "Program", "Obsah, metodika a akce", "#6ba29b"],
    [3, "Provoz", "Finance, prostory a logistika", "#d4ae72"],
    [4, "Komunikace", "Příběhy, grafika a vztahy navenek", "#8daec4"],
    [5, "Dobrovolníci", "Komunita a jednorázová pomoc", "#bbc85d"]
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
  relationships: [[1,2,"spolupráce"],[1,6,"spolupráce"],[1,14,"spolupráce"],[2,5,"program"],[2,10,"program"],[2,9,"akce"],[3,7,"komunikace"],[3,11,"komunikace"],[4,8,"provoz"],[4,12,"provoz"],[5,10,"metodika"],[6,12,"rozpočet"],[7,9,"kampaně"],[8,11,"akce"],[9,13,"dobrovolnictví"],[14,5,"facilitace"]]
};

const app = document.querySelector("#app");
let db;
let people = [];
let relationships = [];
let simulation;
let svg, rootLayer, linkLayer, zoneLayer, nodeLayer, axisLayer;
let currentMode = "network";
let editingId = null;
let searchTerm = "";
let toastTimer;

const icons = {
  map: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3z"/><path d="M8 3v15M16 6v15"/></svg>',
  sql: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>'
};

function renderShell() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">M</div><div class="brand-copy"><strong>Mapa lidí</strong><span>středisko</span></div></div>
        <div class="nav-label">Pohled</div>
        <nav class="nav-list" aria-label="Hlavní navigace">
          <button class="nav-button active" data-section="map">${icons.map}<span>Vizuální mapa</span></button>
          <button class="nav-button" data-section="sql">${icons.sql}<span>SQL laboratoř</span></button>
        </nav>
        <div class="sidebar-spacer"></div>
        <div class="db-card">
          <div class="db-card-top"><span class="db-status"><i class="db-dot"></i> SQLite aktivní</span><span id="db-size" class="eyebrow">— KB</span></div>
          <p>Data jsou uložena lokálně ve vašem prohlížeči.</p>
          <button class="text-button" id="export-db">Exportovat .sqlite</button>
        </div>
        <div class="build-note">MAPA / 01 · 2026</div>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="title-block"><span class="eyebrow" id="section-kicker">Interaktivní přehled</span><h1 id="section-title">Kdo tvoří středisko</h1></div>
          <div class="top-actions">
            <label class="search-wrap">${icons.search}<input id="search" class="search-input" type="search" placeholder="Hledat jméno, roli, štítek…"><span class="search-key">/</span></label>
            <button class="primary-button" id="add-person">+ Přidat člověka</button>
          </div>
        </header>
        <section class="view map-view" id="map-view">
          <div class="map-toolbar" role="tablist" aria-label="Způsob rozmístění">
            <button class="mode-button active" data-mode="network">Vztahy</button>
            <button class="mode-button" data-mode="category">Kategorie</button>
            <button class="mode-button" data-mode="age">Věk</button>
          </div>
          <div class="map-meta"><div class="stat"><strong id="people-count">0</strong><span>lidí</span></div><div class="stat"><strong id="tag-count">0</strong><span>štítků</span></div></div>
          <svg id="map" role="img" aria-label="Interaktivní mapa členů týmu"></svg>
          <div class="map-hint">PŘETÁHNOUT · PŘIBLÍŽIT · KLIKNOUT PRO DETAIL</div>
        </section>
        <section class="view sql-view" id="sql-view">
          <div class="sql-layout">
            <article class="panel query-panel">
              <div class="panel-head"><div><span class="eyebrow">Dotaz</span><h2>Datový průzkumník</h2></div><span class="db-status"><i class="db-dot"></i> read only</span></div>
              <div class="query-wrap"><textarea id="sql-query" class="query-editor" spellcheck="false" aria-label="SQL dotaz">SELECT
  p.name AS jmeno,
  p.role AS role,
  p.age AS vek,
  c.name AS kategorie,
  GROUP_CONCAT(t.name, ', ') AS stitky
FROM people p
JOIN categories c ON c.id = p.category_id
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
            <div class="field"><label for="person-name">Jméno a příjmení</label><input id="person-name" name="name" required autocomplete="name"></div>
            <div class="field"><label for="person-role">Role</label><input id="person-role" name="role" required></div>
            <div class="field"><label for="person-age">Věk</label><input id="person-age" name="age" type="number" min="15" max="100" required></div>
            <div class="field"><label for="person-category">Kategorie</label><select id="person-category" name="category_id" required></select></div>
            <div class="field"><label for="person-team">Tým</label><input id="person-team" name="team"></div>
            <div class="field"><label for="person-city">Město</label><input id="person-city" name="city"></div>
            <div class="field full"><label for="person-email">E-mail</label><input id="person-email" name="email" type="email" autocomplete="email"></div>
            <div class="field full"><label for="person-tags">Štítky · oddělené čárkou</label><input id="person-tags" name="tags" placeholder="facilitace, design, děti"></div>
            <div class="field full"><label for="person-notes">Poznámka</label><textarea id="person-notes" name="notes"></textarea></div>
          </div>
          <div class="modal-actions"><button type="button" class="secondary-button" id="cancel-modal">Zrušit</button><button type="submit" class="primary-button">Uložit do mapy</button></div>
        </form>
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
    CREATE TABLE people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, age INTEGER, category_id INTEGER REFERENCES categories(id), team TEXT, city TEXT, email TEXT, notes TEXT);
    CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
    CREATE TABLE people_tags (person_id INTEGER REFERENCES people(id), tag_id INTEGER REFERENCES tags(id), PRIMARY KEY(person_id, tag_id));
    CREATE TABLE relationships (source_id INTEGER REFERENCES people(id), target_id INTEGER REFERENCES people(id), type TEXT, PRIMARY KEY(source_id, target_id));
  `);
  const insertCategory = db.prepare("INSERT INTO categories VALUES (?, ?, ?, ?)");
  seed.categories.forEach(row => insertCategory.run(row));
  insertCategory.free();
  const insertPerson = db.prepare("INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
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

function queryObjects(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function loadPeople() {
  people = queryObjects(`
    SELECT p.*, c.name AS category, c.color,
      GROUP_CONCAT(t.name, ' · ') AS tags
    FROM people p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN people_tags pt ON pt.person_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    GROUP BY p.id ORDER BY p.name
  `).map(d => ({...d, id: +d.id, age: +d.age, tagsArray: d.tags ? d.tags.split(" · ") : []}));
  relationships = queryObjects("SELECT source_id AS source, target_id AS target, type FROM relationships").map(d => ({...d, source: +d.source, target: +d.target}));
  document.querySelector("#people-count").textContent = people.length;
  document.querySelector("#tag-count").textContent = queryObjects("SELECT COUNT(*) AS n FROM tags")[0].n;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
}

function initials(name) {
  return name.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
}

function categoryPositions(width, height) {
  const pad = Math.min(width, height) * .16;
  return {
    "Vedení": [width * .5, pad + 30],
    "Program": [width * .28, height * .42],
    "Provoz": [width * .72, height * .42],
    "Komunikace": [width * .36, height * .73],
    "Dobrovolníci": [width * .68, height * .73]
  };
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
    .call(d3.drag().on("start", dragStart).on("drag", dragged).on("end", dragEnd));
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
    <div class="node-more"><div class="node-rule"></div><div class="node-facts"><div><b>${d.age} let</b>věk</div><div><b>${escapeHtml(d.city || "—")}</b>město</div><div><b>${escapeHtml(d.category)}</b>kategorie</div><div><b>${escapeHtml(d.team || "—")}</b>tým</div></div><div class="node-tags">${tags || '<span class="node-tag">bez štítků</span>'}</div><button class="node-edit" type="button">upravit</button></div>
  </div>`;
}

function updateMode(mode, animate = true) {
  if (!simulation) return;
  currentMode = mode;
  document.querySelectorAll(".mode-button").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
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

function dragStart(event, d) { if (!event.active) simulation.alphaTarget(.2).restart(); d.fx = d.x; d.fy = d.y; }
function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
function dragEnd(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

function applySearch() {
  const q = searchTerm.trim().toLocaleLowerCase("cs");
  nodeLayer?.selectAll("g.person-node").classed("is-dimmed", d => q && ![d.name,d.role,d.category,d.team,d.city,d.tags].join(" ").toLocaleLowerCase("cs").includes(q));
}

function showSection(section) {
  document.querySelectorAll(".nav-button").forEach(b => b.classList.toggle("active", b.dataset.section === section));
  const isMap = section === "map";
  document.querySelector("#map-view").style.display = isMap ? "block" : "none";
  document.querySelector("#sql-view").style.display = isMap ? "none" : "block";
  document.querySelector("#search").closest("label").style.display = isMap ? "block" : "none";
  document.querySelector("#section-kicker").textContent = isMap ? "Interaktivní přehled" : "SQLite databáze";
  document.querySelector("#section-title").textContent = isMap ? "Kdo tvoří středisko" : "Ptejte se dat";
  if (isMap) setTimeout(() => updateMode(currentMode, false), 20);
}

function runSelect() {
  const sql = document.querySelector("#sql-query").value.trim();
  const output = document.querySelector("#result-wrap");
  const meta = document.querySelector("#result-meta");
  if (!/^(select|with)\b/i.test(sql) || /\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum)\b/i.test(sql)) {
    output.innerHTML = '<div class="error-box">Tato konzole přijímá pouze bezpečné SELECT dotazy. Změny lidí provádějte přes formulář „Přidat člověka“.</div>';
    meta.textContent = "Dotaz odmítnut";
    return;
  }
  const started = performance.now();
  try {
    const results = db.exec(sql);
    if (!results.length) {
      output.innerHTML = '<div class="empty-result"><div><b>0 řádků</b>Dotaz proběhl v pořádku, ale nic nenašel.</div></div>';
      meta.textContent = `0 řádků · ${Math.round(performance.now()-started)} ms`;
      return;
    }
    const {columns, values} = results[0];
    const table = document.createElement("table");
    table.className = "result-table";
    const thead = table.createTHead().insertRow();
    columns.forEach(c => { const th = document.createElement("th"); th.textContent = c; thead.appendChild(th); });
    const tbody = table.createTBody();
    values.forEach(row => { const tr = tbody.insertRow(); row.forEach(value => { const td = tr.insertCell(); td.textContent = value ?? "—"; td.title = String(value ?? ""); }); });
    output.replaceChildren(table);
    meta.textContent = `${values.length} ${values.length === 1 ? "řádek" : "řádků"} · ${Math.round(performance.now()-started)} ms`;
  } catch (error) {
    output.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
    meta.textContent = "Chyba v dotazu";
  }
}

const presets = {
  all: `SELECT p.name AS jmeno, p.role, p.age AS vek, c.name AS kategorie, GROUP_CONCAT(t.name, ', ') AS stitky\nFROM people p\nJOIN categories c ON c.id = p.category_id\nLEFT JOIN people_tags pt ON pt.person_id = p.id\nLEFT JOIN tags t ON t.id = pt.tag_id\nGROUP BY p.id\nORDER BY p.name;`,
  young: `SELECT name AS jmeno, age AS vek, role, team AS tym\nFROM people\nWHERE age <= 30\nORDER BY age;`,
  category: `SELECT c.name AS kategorie, COUNT(p.id) AS pocet_lidi, ROUND(AVG(p.age), 1) AS prumerny_vek\nFROM categories c\nLEFT JOIN people p ON p.category_id = c.id\nGROUP BY c.id\nORDER BY pocet_lidi DESC;`,
  tags: `SELECT t.name AS stitek, COUNT(pt.person_id) AS pocet_lidi\nFROM tags t\nLEFT JOIN people_tags pt ON pt.tag_id = t.id\nGROUP BY t.id\nORDER BY pocet_lidi DESC, t.name;`
};

function fillCategoryOptions() {
  const categories = queryObjects("SELECT id, name FROM categories ORDER BY id");
  document.querySelector("#person-category").innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

function openPersonModal(id = null) {
  editingId = id;
  const form = document.querySelector("#person-form");
  form.reset();
  document.querySelector("#modal-title").textContent = id ? "Upravit člověka" : "Přidat člověka";
  if (id) {
    const person = people.find(p => p.id === id);
    for (const key of ["name","role","age","category_id","team","city","email","notes"]) if (form.elements[key]) form.elements[key].value = person[key] ?? "";
    form.elements.tags.value = person.tagsArray.join(", ");
  }
  document.querySelector("#person-modal").classList.add("open");
  setTimeout(() => form.elements.name.focus(), 80);
}

function closePersonModal() { document.querySelector("#person-modal").classList.remove("open"); editingId = null; }

async function savePerson(event) {
  event.preventDefault();
  const wasEditing = Boolean(editingId);
  const form = new FormData(event.currentTarget);
  const values = [form.get("name").trim(), form.get("role").trim(), +form.get("age"), +form.get("category_id"), form.get("team").trim(), form.get("city").trim(), form.get("email").trim(), form.get("notes").trim()];
  db.run("BEGIN");
  try {
    let id = editingId;
    if (id) {
      db.run("UPDATE people SET name=?, role=?, age=?, category_id=?, team=?, city=?, email=?, notes=? WHERE id=?", [...values, id]);
      db.run("DELETE FROM people_tags WHERE person_id=?", [id]);
    } else {
      db.run("INSERT INTO people (name,role,age,category_id,team,city,email,notes) VALUES (?,?,?,?,?,?,?,?)", values);
      id = queryObjects("SELECT last_insert_rowid() AS id")[0].id;
    }
    const tags = [...new Set(form.get("tags").split(",").map(t => t.trim().toLocaleLowerCase("cs")).filter(Boolean))];
    tags.forEach(tag => {
      db.run("INSERT OR IGNORE INTO tags (name) VALUES (?)", [tag]);
      const tagId = queryObjects("SELECT id FROM tags WHERE name=?", [tag])[0].id;
      db.run("INSERT OR IGNORE INTO people_tags VALUES (?,?)", [id, tagId]);
    });
    db.run("COMMIT");
    await persistDatabase();
    await loadPeople();
    renderGraph();
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
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Databáze byla exportována.");
}

function showToast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach(b => b.addEventListener("click", () => showSection(b.dataset.section)));
  document.querySelectorAll(".mode-button").forEach(b => b.addEventListener("click", () => updateMode(b.dataset.mode)));
  document.querySelector("#search").addEventListener("input", e => { searchTerm = e.target.value; applySearch(); });
  document.querySelector("#add-person").addEventListener("click", () => openPersonModal());
  document.querySelector("#close-modal").addEventListener("click", closePersonModal);
  document.querySelector("#cancel-modal").addEventListener("click", closePersonModal);
  document.querySelector("#person-modal").addEventListener("click", e => { if (e.target.id === "person-modal") closePersonModal(); });
  document.querySelector("#person-form").addEventListener("submit", savePerson);
  document.querySelector("#run-query").addEventListener("click", runSelect);
  document.querySelector("#sql-query").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runSelect(); });
  document.querySelectorAll(".preset").forEach(b => b.addEventListener("click", () => { document.querySelector("#sql-query").value = presets[b.dataset.preset]; runSelect(); }));
  document.querySelector("#export-db").addEventListener("click", exportDatabase);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePersonModal();
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); document.querySelector("#search").focus(); }
  });
}

async function boot() {
  try {
    const SQL = await initSqlJs({locateFile: () => wasmUrl});
    let saved = null;
    try { saved = await loadSavedDatabase(); } catch (_) {}
    db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
    if (!saved) { createSchema(); await persistDatabase(); }
    renderShell();
    fillCategoryOptions();
    await loadPeople();
    await persistDatabase();
    bindEvents();
    initGraph();
  } catch (error) {
    app.innerHTML = `<div class="empty-result" style="height:100vh"><div><b>Mapa se neotevřela</b><span>${escapeHtml(error.message)}</span></div></div>`;
    console.error(error);
  }
}

boot();
