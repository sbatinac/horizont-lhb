# Iz index.html (HR) slaže en.html (EN). Pokretanje: python3 tools/build_en.py
# Nakon svake promjene teksta na hrvatskoj stranici: dodaj prijevod u T i pokreni ponovno.
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'index.html').read_text(encoding='utf-8')

# Tekstovi na stranici (točan hrvatski tekst -> engleski)
T = {
 'O nama': 'About', 'Djelatnosti': 'Activities', 'Vlasnik': 'Owner', 'Galerija': 'Gallery', 'Lokacija': 'Location', 'Kontakt': 'Contact',
 '🔊 Uključi zvuk': '🔊 Sound on', '↻ Ponovi': '↻ Replay',
 'Servis · Video produkcija · Web': 'IT service · Video production · Web',
 'društvo s ograničenom odgovornošću': 'limited liability company',
 'Popravljamo računala i konzole, snimamo i montiramo video, izrađujemo web stranice. Jedna firma, jedan kontakt, sve na jednom mjestu.':
   'We repair computers and consoles, shoot and edit video, and build websites. One company, one contact, everything in one place.',
 'Kontaktirajte nas →': 'Contact us →', 'Gdje se nalazimo': 'Where to find us',
 'Podaci o firmi': 'Company details', 'Naziv': 'Name', 'Sjedište': 'Registered office', 'OIB': 'VAT ID', '· OIB': '· VAT ID', 'MBS': 'Reg. no. (MBS)',
 '· Trgovački sud u Osijeku': '· Commercial Court in Osijek', 'Matični br.': 'Company no.', 'Osnovana': 'Founded', 'Direktor': 'Director',
 'Djelatnost': 'Activity', 'IT i servis, web, video, trgovina i posredovanje ·': 'IT & service, web, video, trade & brokerage ·',
 '22 djelatnosti ↓': '22 activities ↓', 'PDV': 'VAT', 'Nije u sustavu PDV-a': 'Not registered for VAT', 'Aktivno poslujemo': 'Active company',
 'Jedna tvrtka.': 'One company.', 'Beskrajne mogućnosti.': 'Endless possibilities.',
 'Ne vjerujemo u granice. Vjerujemo u prilike.': 'We don’t believe in limits. We believe in opportunities.',
 'Vođeni ambicijom, inovacijama i neprestanom željom za napretkom, kontinuirano istražujemo nova tržišta, nove tehnologije i nove poslovne mogućnosti.':
   'Driven by ambition, innovation and a constant desire to move forward, we keep exploring new markets, new technologies and new business opportunities.',
 'Od računalnih tehnologija, web dizajna i digitalne produkcije do trgovine, prodaje i razvoja poslovnih partnerstava, naše znanje i iskustvo povezuju različite djelatnosti u jednu snažnu poslovnu cjelinu.':
   'From computer technology, web design and digital production to trade, sales and building business partnerships, our knowledge and experience connect different activities into one strong business.',
 'Svaki novi izazov zahtijeva drugačiji pristup, ali naša načela uvijek ostaju ista:': 'Every new challenge calls for a different approach, but our principles always stay the same:',
 'profesionalnost, preciznost, kreativnost i izvrsnost.': 'professionalism, precision, creativity and excellence.',
 'Ne čekamo prilike. Stvaramo ih.': 'We don’t wait for opportunities. We create them.',
 'Ne ograničavamo se na jednu djelatnost, nego stalno širimo svoje poslovne horizonte.': 'We don’t limit ourselves to one line of business. We keep widening our horizons.',
 'Jer za nas raznolikost nije prepreka.': 'Because for us, diversity is not an obstacle.', 'Ona je naša snaga.': 'It is our strength.',
 'Mnogo djelatnosti. Jedna vizija.': 'Many activities. One vision.', 'Neograničena ambicija.': 'Unlimited ambition.',
 'Jer za nas rast nije samo cilj.': 'Because for us, growth is not just a goal.', 'Rast je dio našeg identiteta.': 'Growth is part of who we are.',
 'registrirane djelatnosti': 'registered activities', '1 kontakt': '1 contact', 'od upita do isporuke': 'from enquiry to delivery',
 'Od 2023.': 'Since 2023', 'u poslovanju': 'in business', 'sjedište i radionica': 'office and workshop',
 'Čime se bavimo': 'What we do', 'Svaka djelatnost ima svoju stranicu. Kliknite i pogledajte uživo.': 'Each activity has its own website. Click to see it live.',
 '● uživo': '● live', 'Djelatnost 01': 'Activity 01', 'Djelatnost 02': 'Activity 02', 'Djelatnost 03': 'Activity 03',
 'Servis računala i konzola': 'Computer & console repair',
 'Laptopi, stolna računala i igraće konzole. Dijagnostika, čišćenje, zamjena dijelova, nadogradnja i spašavanje podataka. Nalog i provjera statusa online.':
   'Laptops, desktops and game consoles. Diagnostics, cleaning, part replacement, upgrades and data recovery. Online service orders and status tracking.',
 'Laptopi': 'Laptops', 'Rabljeni dijelovi': 'Used parts', 'Otvori servis ↗': 'Open IT service ↗',
 'Video produkcija': 'Video production',
 'Promotivni videi, Reels i TikTok, animacija logotipa, vizualni identitet i AI vizuali. Za firme, obrte, udruge i privatne osobe.':
   'Promo videos, Reels and TikTok, logo animation, visual identity and AI visuals. For companies, sole traders, associations and individuals.',
 'Animacija logotipa': 'Logo animation', 'Montaža': 'Editing', 'Otvori video produkciju ↗': 'Open video production ↗',
 'horizont distribucija': 'horizont distribution', 'Uskoro online': 'Online soon', 'Horizont distribucija': 'Horizont distribution',
 'Trgovina i posredovanje na domaćem i inozemnom tržištu, zastupanje inozemnih tvrtki i prodaja raznovrsnih proizvoda.':
   'Trade and brokerage on domestic and foreign markets, representation of foreign companies and sale of a wide range of products.',
 'Veleprodaja': 'Wholesale', 'Posredovanje': 'Brokerage', 'Zastupanje': 'Representation', 'Otvori distribuciju ↗': 'Open distribution ↗',
 'Web stranice ključ u ruke': 'Turnkey websites', 'Dizajn, izrada, galerije, obrasci i administracija. Postavljeno i spremno od prvog dana.':
   'Design, build, galleries, forms and admin. Online and ready from day one.',
 'Web trgovine': 'Online shops', 'Proizvodi, košarica, narudžbe i plaćanje, s fotografijama i videom koji prodaju.': 'Products, cart, orders and payments, with photos and video that sell.',
 'Tisak i PDF': 'Print & PDF', 'Letci, katalozi, ponude i prezentacije u stilu Vaše firme.': 'Flyers, catalogues, quotes and presentations in your company’s style.',
 'Sudski registar': 'Court register', 'Sve registrirane djelatnosti': 'All registered activities',
 'Pretežna djelatnost: NKD 46.19 Posredovanje u nespecijaliziranoj trgovini na veliko. Upisano u sudski registar Trgovačkog suda u Osijeku, MBS 030271774.':
   'Main activity: NACE 46.19 Agents involved in the sale of a variety of goods. Entered in the court register of the Commercial Court in Osijek, reg. no. (MBS) 030271774.',
 'IT i računala': 'IT & computers', 'Popravak računala i periferne opreme': 'Repair of computers and peripheral equipment',
 'Upravljanje računalnom opremom i sustavom': 'Computer facilities and systems management', 'Savjetovanje u vezi s računalima': 'Computer consultancy',
 'Računalno programiranje': 'Computer programming', 'Obrada podataka, usluge poslužitelja i djelatnosti povezane s njima': 'Data processing, hosting and related activities',
 'Ostale uslužne djelatnosti u vezi s informacijskom tehnologijom i računalima': 'Other information technology and computer service activities',
 'Usluge informacijskog društva': 'Information society services', 'Internetski portali': 'Web portals', 'Ostale informacijske uslužne djelatnosti': 'Other information service activities',
 'Web, dizajn i mediji': 'Web, design & media', 'Web dizajn': 'Web design', 'Specijalizirane dizajnerske djelatnosti': 'Specialised design activities',
 'Proizvodnja filmova, videofilmova i televizijskog programa': 'Motion picture, video and television programme production',
 'Promidžba (reklama i propaganda)': 'Advertising and promotion', 'Oglašavanje preko medija': 'Media advertising',
 'Trgovina i posredovanje': 'Trade & brokerage', 'Kupnja i prodaja robe': 'Purchase and sale of goods', 'Pružanje usluga u trgovini': 'Trade services',
 'Obavljanje trgovačkog posredovanja na domaćem i inozemnom tržištu': 'Trade brokerage on domestic and foreign markets',
 'Zastupanje inozemnih tvrtki': 'Representation of foreign companies', 'Posredovanje u trgovini raznovrsnim proizvodima': 'Agents in the sale of a variety of goods',
 'Poslovne usluge': 'Business services', 'Savjetovanje u vezi s poslovanjem i ostalim upravljanjem': 'Business and other management consultancy',
 'Organizacija sastanaka i poslovnih sajmova': 'Organisation of meetings and trade fairs', 'Prijevoz osoba i tereta za vlastite potrebe': 'Transport of persons and goods for own needs',
 'Vlasnik i direktor': 'Owner & director', 'Osnivač · poduzetnik · tehnologija i kreativa': 'Founder · entrepreneur · technology & creativity',
 'Jedna vizija. Mnogo putova.': 'One vision. Many paths.', 'Bez granica.': 'No limits.',
 'Iza svakog poslovnog uspjeha stoji ideja. Iza svake ideje stoji čovjek koji se usudio pokušati.': 'Behind every business success there is an idea. Behind every idea there is a person who dared to try.',
 'Nikada nisam vjerovao da čovjeka treba definirati samo jedno zanimanje, jedna djelatnost ili jedan poslovni put.': 'I have never believed that a person should be defined by a single job, a single activity or a single career path.',
 'Za mene je poduzetništvo mnogo više od poslovanja. Ono je neprestano istraživanje mogućnosti, prepoznavanje prilika i hrabrost da se zakorači u nešto novo.':
   'To me, entrepreneurship is much more than doing business. It is a constant search for possibilities, the ability to spot opportunities and the courage to step into something new.',
 'Moje poslovno iskustvo obuhvaća prodaju, trgovinu, razvoj poslovnih odnosa, pregovore i povezivanje partnera na različitim tržištima. Istodobno, moja strast prema tehnologiji i kreativnosti vodi me kroz računalne sustave, web dizajn, digitalnu produkciju, umjetnu inteligenciju te obradu videa i zvuka.':
   'My business experience covers sales, trade, building business relationships, negotiation and connecting partners across different markets. At the same time, my passion for technology and creativity takes me through computer systems, web design, digital production, artificial intelligence, and video and audio editing.',
 'Naizgled različiti svjetovi. Za mene, dijelovi iste priče.': 'Seemingly different worlds. To me, parts of the same story.',
 'Priče o stvaranju, povezivanju i neprestanom napretku.': 'A story of creating, connecting and constantly moving forward.',
 'Ne tvrdim da znam sve. Ali znam učiti, istraživati, pronaći rješenje i okupiti prave ljude oko dobre ideje.': 'I don’t claim to know everything. But I know how to learn, explore, find a solution and bring the right people together around a good idea.',
 'Kada se pojavi problem, ne tražim razlog za odustajanje. Tražim način da ga riješim.': 'When a problem comes up, I don’t look for a reason to give up. I look for a way to solve it.',
 'Kada prepoznam poslovnu priliku, ne promatram je samo izdaleka. Pokušavam je pretvoriti u stvaran projekt.': 'When I spot a business opportunity, I don’t just watch it from afar. I try to turn it into a real project.',
 'A kada započnem nešto novo, pristupam tome s istom ozbiljnošću, odgovornošću i željom da rezultat bude što bolji.': 'And when I start something new, I approach it with the same seriousness, responsibility and drive to make the result as good as it can be.',
 'Tijekom godina naučio sam da uspjeh ne dolazi uvijek najkraćim putem. Ponekad zahtijeva promjenu smjera, nove početke, teške odluke i spremnost da se krene ispočetka.':
   'Over the years I have learned that success doesn’t always take the shortest road. Sometimes it takes a change of direction, new beginnings, hard decisions and the willingness to start again.',
 'Ali upravo u tome pronalazim snagu.': 'But that is exactly where I find my strength.',
 'Ne želim biti ograničen onime što radim danas. Želim otkrivati što sve mogu ostvariti sutra.': 'I don’t want to be limited by what I do today. I want to discover everything I can achieve tomorrow.',
 'Vjerujem u znanje, profesionalnost, kreativnost i pošten poslovni odnos. Vjerujem da prava prilika nastaje onda kada se iskustvo susretne s idejom, a ideja s odlučnošću.':
   'I believe in knowledge, professionalism, creativity and fair business. I believe real opportunity is born when experience meets an idea, and the idea meets determination.',
 'I zato ne gradim svoju budućnost oko jedne djelatnosti.': 'That is why I don’t build my future around one line of business.', 'Gradim je oko mogućnosti.': 'I build it around possibilities.',
 'Jer moj najveći projekt nikada nije bio samo jedan proizvod, jedna usluga ili jedna tvrtka.': 'Because my biggest project has never been just one product, one service or one company.',
 'Moj najveći projekt je stvaranje budućnosti u kojoj ideje postaju stvarnost.': 'My biggest project is creating a future in which ideas become reality.',
 'Pročitaj cijelu priču ↓': 'Read the full story ↓',
 'Prodaja i trgovina': 'Sales & trade', 'Pregovori i partnerstva': 'Negotiation & partnerships', 'Računalni sustavi': 'Computer systems', 'Video i zvuk': 'Video & audio', 'Umjetna inteligencija': 'Artificial intelligence',
 'Citat': 'Quote', 'Galerija i materijali': 'Gallery & materials', 'Slike, video i dokumenti': 'Photos, videos & documents', 'Odaberite karticu i otvorite sadržaj.': 'Pick a card to open it.',
 'Slike': 'Photos', 'Radionica, oprema i radovi': 'Workshop, equipment and work', 'Video materijali': 'Videos', 'Predstavljanje i projekti': 'Company and projects',
 'PDF dokumenti': 'PDF documents', 'Prezentacije, cjenici, katalozi': 'Presentations, price lists, catalogues', 'Zatvori ✕': 'Close ✕',
 'Radionica, oprema, projekti i radovi. Kliknite sliku za veći prikaz.': 'Workshop, equipment, projects and work. Click a photo to enlarge it.',
 'Prikaži još': 'Show more', 'Predstavljanje firme, projekti i kratke forme. Kliknite na video i pogledajte.': 'Company presentation, projects and short formats. Click a video to watch it.',
 'Prikaži još videa': 'Show more videos', 'Dokumenti': 'Documents', 'PDF materijali': 'PDF materials',
 'Prezentacije, cjenici, katalozi i dokumenti firme za pregled i preuzimanje.': 'Presentations, price lists, catalogues and company documents to view and download.',
 'Dolazak uz prethodni dogovor. Nazovite ili pošaljite poruku prije nego krenete.': 'Visits by appointment. Please call or message before you come.',
 'Adresa': 'Address', 'Mjesto': 'City', ', Hrvatska': ', Croatia', 'Radno vrijeme': 'Opening hours', 'Telefon': 'Phone', 'Mobitel': 'Mobile',
 'Upute za dolazak ↗': 'Get directions ↗', 'Kopiraj adresu': 'Copy address', 'Kontakt ↓': 'Contact ↓', '· Otvori u Google kartama ↗': '· Open in Google Maps ↗',
 'Javite se.': 'Get in touch.', 'Odgovaramo brzo.': 'We reply fast.', 'Za servis, video ili web stranicu, svejedno. Recite što trebate, dogovorimo ostalo.': 'IT service, video or a website, it doesn’t matter. Tell us what you need and we’ll sort out the rest.',
 '📞 Nazovi': '📞 Call', 'E-pošta': 'E-mail', 'Podijelite': 'Share', 'Podijeli': 'Share', 'Kopiraj link': 'Copy link',
 'Od ideje do': 'From idea to', 'poslovne prilike.': 'business opportunity.',
 'Servis': 'IT service', 'Nismo u sustavu PDV-a. Osobne podatke koristimo samo za kontakt (GDPR).': 'Not registered for VAT. Personal data is used for contact only (GDPR).',
 '⬇ Preuzmi': '⬇ Download',
 'Djelatnost 05': 'Activity 05', '● web trgovina': '● online shop', 'Web trgovina': 'Online shop', 'Otvori trgovinu ↗': 'Open shop ↗',
 'Naša nova web trgovina: HSC proizvodi, Teslass naočale, Syn(c)Energy narukvice i dodaci, s dostavom na kućnu adresu.':
   'Our new online shop: HSC products, Teslass glasses, Syn(c)Energy bracelets and accessories, delivered to your door.',
 'Djelatnost 04': 'Activity 04', 'Distribucija': 'Distribution', 'Alati i oprema': 'Tools & equipment', 'Otvori Beorol ↗': 'Open Beorol ↗',
 'Zastupanje i distribucija Beorol proizvoda u Hrvatskoj: molersko-ličilački i ručni alat, zaštitna oprema, tehnička kemija te program za dom i dvorište.':
   'Representation and distribution of Beorol products in Croatia: painting and hand tools, protective equipment, technical chemicals, and home and garden products.',
}
# atributi (aria-label, title, alt)
A = {
 'Izbornik': 'Menu', 'Glazba': 'Music', 'Osnovni podaci o firmi': 'Company details', 'Pregled stranice servisa': 'IT service website preview',
 'Pregled stranice video produkcije': 'Video production website preview', 'Pregled stranice distribucije': 'Distribution website preview',
 'Sljedeći citat': 'Next quote', 'Karta lokacije Horizont LHB d.o.o.': 'Horizont LHB d.o.o. location map', 'Otvori lokaciju u Google kartama': 'Open location in Google Maps',
 'Horizont LHB d.o.o. – od ideje do poslovne prilike': 'Horizont LHB d.o.o. – from idea to business opportunity', 'Slika': 'Photo', 'Zatvori': 'Close',
 'Prethodna': 'Previous', 'Sljedeća': 'Next', 'Prethodni video': 'Previous video', 'Sljedeći video': 'Next video', 'Dokument': 'Document', 'Nazovi': 'Call',
 'Citat': 'Quote', 'Uvodni video Horizont LHB d.o.o.: servis računala, izrada web stranica i poslovanje, na kraju logotip': 'Horizont LHB d.o.o. intro video: IT service, web development and business, ending with the logo',
 'Administracija': 'Admin', 'Pregled stranice Beorol': 'Beorol website preview',
}
# JavaScript i <head>
J = [
 ('<html lang="hr">', '<html lang="en">'),
 ("oib:      '04977480596',", "oib:      'HR04977480596',"),
 ('content="Horizont LHB d.o.o. – servis računala i konzola, video produkcija i izrada web stranica. Tko smo, gdje smo i kako do nas."', 'content="Horizont LHB d.o.o. – computer and console repair, video production, web development and trade. Who we are, where we are and how to reach us."'),
 ('content="Servis računala, video produkcija i web stranice. Jedna firma, jedan kontakt."', 'content="IT service, video production, websites and trade. One company, one contact."'),
 ('<meta property="og:url" content="https://www.horizont-lhb.hr">', '<meta property="og:url" content="https://www.horizont-lhb.hr/en.html">'),
 ("const SITE_URL = 'https://www.horizont-lhb.hr';", "const SITE_URL = 'https://www.horizont-lhb.hr/en.html';"),
 ("radno:    'Po dogovoru',", "radno:    'By appointment',"),
 ("&hl=hr&output=embed", "&hl=en&output=embed"),
 ("a.title = 'Otvori u Google kartama'", "a.title = 'Open in Google Maps'"),
 ("'Stranica uskoro'", "'Website coming soon'"),
 ("name: 'Ostalo'", "name: 'Other'"), ("name: 'Sve'", "name: 'All'"),
 ('<div class="soon">Uskoro</div>', '<div class="soon">Soon</div>'), ('soon ${c}">Uskoro</div>', 'soon ${c}">Soon</div>'),
 ("' slika' : type === 'video' ? ' videa' : ' PDF') : 'uskoro'", "' photos' : type === 'video' ? ' videos' : ' PDF') : 'soon'"),
 ('<div class="msg">Učitavanje…</div>', '<div class="msg">Loading…</div>'),
 ('<div class="msg">Sadržaj se trenutno ne može učitati. Pokušajte osvježiti stranicu.</div>', '<div class="msg">Content can’t be loaded right now. Please refresh the page.</div>'),
 ('aria-label="Pogledaj video: ', 'aria-label="Watch video: '),
 ("'Sakrij ↑' : 'Pročitaj cijelu priču ↓'", "'Hide ↑' : 'Read the full story ↓'"),
 ("'🔊 Uključi zvuk' : '🔇 Isključi zvuk'", "'🔊 Sound on' : '🔇 Sound off'"),
 ("textContent = '🔊 Uključi zvuk'", "textContent = '🔊 Sound on'"),
 ("'Horizont LHB d.o.o. – servis računala, video produkcija i web stranice. '", "'Horizont LHB d.o.o. – IT service, video production, websites and trade. '"),
 ("'Link kopiran'", "'Link copied'"), ("'Kopiraj link'", "'Copy link'"),
 ("b.textContent = 'Kopirano'", "b.textContent = 'Copied'"), ("'Kopiraj adresu'", "'Copy address'"),
 ('class="lang" href="en.html" hreflang="en" title="English">EN</a>', 'class="lang" href="./" hreflang="hr" title="Hrvatski">HR</a>'),
]

head, rest = src.split('<body>', 1)
body, script = rest.split('<script>', 1)
script = '<script>' + script

missing = []
def tx(m):
    pre, txt, post = m.group(1), m.group(2), m.group(3)
    t = txt.strip()
    if t in T:
        return '>' + pre + T[t] + post + '<'
    if re.search('[čćžšđČĆŽŠĐ]', t): missing.append(t)
    return m.group(0)
body = re.sub(r'>(\s*)([^<>]+?)(\s*)<', tx, body)
body = re.sub(r'(aria-label|title|alt)="([^"]+)"', lambda m: f'{m.group(1)}="{A.get(m.group(2), m.group(2))}"', body)
out = head + '<body>' + body + script
for a, b in J:
    if a not in out: missing.append('JS: ' + a[:70])
    out = out.replace(a, b)
out = out.replace('<title>Horizont LHB d.o.o.</title>', '<title>Horizont LHB d.o.o. – IT, video, web & trade</title>')

(ROOT / 'en.html').write_text(out, encoding='utf-8')
print('en.html spremljen.')
if missing:
    print('BEZ PRIJEVODA:'); [print('  ', m) for m in missing]; sys.exit(1)
