# Horizont LHB d.o.o.

Predstavljanje firme: o nama, djelatnosti (servis + video produkcija), vlasnik, galerije slika, videa i PDF-ova s Google Drivea, lokacija s kartom i kontakti. Isti stil kao video produkcija.

## Podaci o firmi
Sve se mijenja na jednom mjestu, u `index.html` → `const FIRMA = { … }` (adresa, mjesto, OIB, MBS, godina osnivanja, radno vrijeme, telefon, e-pošta, fotografija vlasnika). Karta i upute za dolazak se slažu same iz adrese.

## Drive
`const FOLDERS` u `index.html`: ID mapa *Slike*, *Video* i *PDF*. Mape moraju biti dijeljene kao „Svatko s linkom može vidjeti”. Podmape postaju tabovi. Prazna mapa prikazuje mjesta „Uskoro”.

## Fotografija vlasnika
Spremi sliku u repo (npr. `vlasnik.webp`, uspravno 4:5) i upiši `foto: 'vlasnik.webp'`.
