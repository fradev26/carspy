1. Verwijder het "Zakelijk" preset-item uit de `FILTER_PRESETS` array in `src/modules/search/FilterPresets.tsx`.
2. Wijzig de container van `flex flex-wrap gap-2` naar `grid grid-cols-5 gap-2` zodat de overige 5 presets gelijkmatig over de volledige breedte verdeeld zijn.
3. Pas de `Button`-styling aan zodat elk item `w-full` krijgt en consistent uitlijnt zonder lege ruimte aan de zijkanten.