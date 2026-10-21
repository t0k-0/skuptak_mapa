# Středisko Skuptáci · Kutná Hora

Interaktivní mapa lidí v týmu. Nabízí samostatné pohledy Struktura, Field a Věk, adaptivní jmenné popisky a SQLite laboratoř pro vlastní `SELECT` dotazy. Field zobrazuje oddíly, družiny, role, města, vlastní kategorie nebo štítky jako průsvitné Vennovy oblasti: lidé jsou abecedně seřazeni v pevných mřížkách podle přesné kombinace svých polí, sdílení lidé leží ve skutečném průniku a hranice každého pole se automaticky zvětší nebo zmenší podle jeho obsahu. Field a Věk používají pevné, deterministické rozložení bez sil mezi lidmi a bez ručního přesouvání, takže kategorie ani věková osa nemohou driftovat; sekundární vztahy přitom zůstávají viditelné jako spojnice. Přepnutí pohledu obnoví jeho vlastní souřadnice, takže Field ani Věk nemohou ovlivnit fyziku Struktury. Vrstvy struktury, vztahů, štítků, oblastí a titulků lze zapínat nezávisle. Panel fyziky nabízí čtyři ovladače známé z Obsidianu: středovou sílu, odpuzování, sílu spojení a délku spojení. Struktura používá pro lidi kompaktní body, větší virtuální plochu a automatické přizpůsobení přiblížení, takže zůstává čitelná i s desítkami lidí.

Ikona filtru v mapě otevírá pokročilé nastavení: lze zobrazit jen zvolenou jednotku a všechny její potomky, kombinovat podmínky nad libovolnými atributy lidí, samostatně vypínat jednotlivé druhy spojení a vytvářet seřazené barevné skupiny. První odpovídající barevné pravidlo má přednost. Filtry, barvy i vrstvy spojení se automaticky uchovávají v prohlížeči.

Mapa používá neomezenou virtuální plochu. Struktura začíná velikostně váženým radiálním stromem: Středisko je uprostřed, oddíly tvoří vyváženou první vrstvu a družiny druhou, vzdálenější vrstvu. Družiny s většími skupinami se mohou posunout dále od středu a každý člověk dostane stabilní místo ve vějíři směřujícím ven od své primární jednotky; tím se zkracují a méně kříží primární spojnice. Jeden společný fyzikální systém používá pružiny spojení, Barnes–Hutovo odpuzování, hierarchickou vodicí sílu, kolize zahrnující rozměry jmen a clusterovou sílu, která mezi skupinami udržuje volný prostor. Síly mění rychlost uzlů; souřadnice se během ticku nepřepisují ani neomezují do buněk. Díky nižšímu tlumení se pohyb přenáší přes pružiny na okolní uzly a po uvolnění se síť plynule ochladí. Hierarchie má větší sílu než další členství a vedlejší vztahy, ale žádná běžná jednotka není napevno ukotvena. Každá primární jednotka má vlastní stálou barvu, která propojuje její téměř neviditelnou prostorovou obálku, titulek, primární spojnice a barevný prstenec kolem každého člena; výplň bodu může nadále vyjadřovat filtrovaný atribut. Skupiny rozlišuje především fyzický volný prostor mezi nimi, ne výrazný okraj. Vedlejší vztahy jsou vizuálně potlačené, aby nepřebíjely organizační skupiny. Kliknutí na bod člověka v libovolném pohledu otevře jeho informační kartu; současně může být otevřená pouze jedna karta. Tlačítko **Přizpůsobit** počítá skutečné hranice aktuálního grafu ve všech pohledech.

## Spuštění

```bash
npm install
npm run dev
```

Potom otevřete adresu, kterou Vite vypíše — obvykle `http://localhost:5173/`. Vstupní obrazovka vás vyzve k nahrání vlastní SQLite databáze.

Produkční sestavení vytvoří příkaz `npm run build` ve složce `site/`. Složka je součástí repozitáře, aby aplikace fungovala i při starším nastavení GitHub Pages „Deploy from a branch“; při nasazení přes GitHub Actions se publikuje stejný build přímo.

## Data

Při každém otevření aplikace se nejprve zobrazí vstupní obrazovka pro nahrání souboru `.sqlite`, `.sqlite3` nebo `.db`. Bez platné databáze nelze pokračovat. Soubor projde kontrolou integrity a očekávaného schématu a potom se otevře přímo v prohlížeči přes SQLite/WASM. Nikam se neodesílá a po obnovení stránky je nutné jej vybrat znovu.

Ve veřejné aplikaci nejsou editační, přidávací, načítací ani exportní ovladače. Mapa slouží pro prohlížení, filtrování a analýzu; SQL laboratoř přijímá pouze dotazy `SELECT` a `WITH`. Nastavení zobrazení, například filtry, aktivní pohled a přiblížení, se mohou uchovat lokálně, samotná databáze se však mezi relacemi neukládá.

Hlavní tabulky:

- `people` – lidé, přezdívky, role, věk, registrační kategorie, tým a kontakt
- `teams` – hierarchie středisko → oddíly → družiny, evidenční kódy jednotek i samostatné základní uzly na úrovni oddílu
- `people_teams` – více přiřazení člověka k libovolným jednotkám (středisko, oddíly, družiny i nezávislé jednotky)
- `categories` – vlastní barevné oblasti mapy
- `tags` a `people_tags` – flexibilní štítky
- `relationships` – vazby mezi lidmi

## GitHub Pages

Repozitář je připravený pro nasazení přes GitHub Actions. Konfigurace Vite používá relativní cesty, takže sestavení funguje na `uzivatel.github.io/nazev-repozitare/`, na uživatelské Pages doméně i na vlastní doméně bez další změny `base`.

1. Vytvořte na GitHubu repozitář a odešlete do něj větev `main`.
2. V **Settings → Pages → Build and deployment** vyberte jako zdroj **GitHub Actions**.
3. Workflow `.github/workflows/deploy-pages.yml` při každém pushi do `main` nainstaluje závislosti, vytvoří `dist/` a nasadí jej na Pages.

Databáze zůstává pouze v paměti konkrétní karty prohlížeče. Nasazení ani GitHub Actions ji neodesílají na GitHub a data se mezi lidmi nebo zařízeními nesynchronizují. Každý uživatel při otevření nahraje vlastní `.sqlite` soubor. Databázové a tabulkové soubory jsou v `.gitignore`, aby nešly omylem commitnout.

> GitHub Pages je ve standardním nastavení veřejný web. Samotný soukromý repozitář není přístupová ochrana pro data vložená přímo do zdrojového kódu.
