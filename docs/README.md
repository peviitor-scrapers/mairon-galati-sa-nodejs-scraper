# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile MAIRON GALATI SA (CIF 6581999).

Extrage anunțurile de pe pagina publică de companie de pe [eJobs.ro](https://www.ejobs.ro/company/mairon-galati-s-a/19073) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul Peviitor.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Sursa job-urilor

Sursa principală este pagina publică de companie de pe [eJobs.ro](https://www.ejobs.ro/company/mairon-galati-s-a/19073).

Site-ul propriu de cariere [cariere.mairon.ro](https://cariere.mairon.ro) returnează HTTP 403, iar [https://www.mairon.ro/companie/cariere/](https://www.mairon.ro/companie/cariere/) nu conține listări de job-uri — de aceea eJobs.ro este sursa.

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro), fallback [cuiscan.ro](https://cuiscan.ro)) după CIF-ul MAIRON GALATI SA (6581999) și verifică:
   - Denumirea oficială: MAIRON GALATI SA
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri de pe pagina publică de companie eJobs.ro
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în Peviitor** — upsert prin API-ul Peviitor (job-uri și date companie)
6. **Generează jobs.md** — fișier markdown cu informații companie + toate job-urile curente

## Company

- Denumire oficială: MAIRON GALATI SA
- CIF: 6581999
- Pagină cariere: https://www.mairon.ro/companie/cariere/
- Website: https://www.mairon.ro

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| eJobs (pagină companie) | `https://www.ejobs.ro/company/mairon-galati-s-a/19073` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| CUIScan (fallback) | `https://cuiscan.ro/api.php?...` | Public |
| ANOFM (fallback) | `https://www.anofm.ro/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |

## Robots.txt

Scraper-ul accesează pagina publică de companie eJobs.ro cu rate limiting (1s delay între pagini) și un singur User-Agent identificabil. Paginile individuale de job sunt doar verificate (HEAD request), nu parse-uite.

Pentru analiza completă, vezi [ai/ROBOTS.md](../ai/ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, Peviitor API conditional)
npm run test:integration

# Doar E2E (site-ul real + ANAF + Peviitor)
npm run test:e2e
```

Testele Peviitor API folosesc `itIfApi` — se auto-skip dacă API-ul Peviitor nu e disponibil.
