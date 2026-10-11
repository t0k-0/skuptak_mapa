# Mapa střediska

Interaktivní mapa lidí v týmu. Nabízí tři plynule přepínatelné pohledy (vztahy, kategorie a věk), rozbalovací karty lidí a SQLite laboratoř pro vlastní `SELECT` dotazy.

## Spuštění

```bash
npm install
npm run dev
```

Produkční sestavení vytvoří příkaz `npm run build` ve složce `dist/`.

## Data

Databáze běží přímo v prohlížeči přes SQLite/WASM a ukládá se do IndexedDB. V levém panelu ji lze exportovat jako skutečný soubor `.sqlite`. Formulář **Přidat člověka** slouží pro přidávání a úpravy záznamů; SQL laboratoř je záměrně pouze pro čtení.

Hlavní tabulky:

- `people` – lidé, role, věk, tým a kontakt
- `categories` – hlavní barevné oblasti mapy
- `tags` a `people_tags` – flexibilní štítky
- `relationships` – vazby mezi lidmi

Součástí je fiktivní demonstrační dataset, který lze rovnou nahradit vlastními lidmi.
