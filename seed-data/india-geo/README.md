# India geography seed data

Populates the global (non-tenant-scoped) reference tables: `countries`,
`states`, `districts`, `sub_districts`, `cities`, `postal_codes`.

## Source & provenance

- **`countries.csv`** — ISO 3166-1, all 249 current country/territory
  entries, pulled from
  [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes)
  (public domain).

- **`states.csv` / `districts.csv` / `sub_districts.csv` / `cities.csv` /
  `postal_codes.csv`** — derived from India Post's **"All India Pincode
  Directory"**, originally published on
  [data.gov.in](https://data.gov.in/) under the Government Open Data
  License – India, as mirrored at
  [saravanakumargn/All-India-Pincode-Directory](https://github.com/saravanakumargn/All-India-Pincode-Directory).
  That source file is dated **January 2017** and lists ~154,800 post
  offices with their Taluk/District/State.

  Mapping from the source columns to this schema:
  | Source column | This schema |
  |---|---|
  | `statename` | `states.name` |
  | `Districtname` | `districts.name` |
  | `Taluk` | `sub_districts.name` |
  | `officename` (suffix `S.O`/`H.O`/`B.O` stripped) | `cities.name` |
  | `officename` (unmodified) | `cities.raw_office_name` |
  | `officeType` | `cities.office_type` |
  | `pincode` | `postal_codes.code` |

  A "city" in this schema is really "whatever a post office serves" —
  the source data doesn't distinguish a city from a village, and neither
  does this import. `raw_office_name` and `office_type` are kept
  alongside the cleaned `name` for traceability back to the source row.

## Known staleness — read before relying on this for anything legal/regulatory

This source predates two India-wide administrative reorganizations. Both
were corrected during import:

1. **J&K/Ladakh split (31 Oct 2019).** The source's single "JAMMU &
   KASHMIR" state was split: rows whose `Districtname` was `Leh` or
   `Kargil` were reassigned to a new `Ladakh` state; everything else
   stayed under `Jammu and Kashmir`.
2. **Dadra & Nagar Haveli / Daman & Diu merger (26 Jan 2020).** The
   source's two separate states were merged into a single
   `Dadra and Nagar Haveli and Daman and Diu`.

After these corrections, the seeded data has **36 states/UTs**, which
matches India's current count (28 states + 8 union territories) — a
useful sanity check if you re-run or modify this import.

**What was *not* corrected:** ordinary district-level changes since 2017
(India creates new districts by splitting existing ones fairly often —
the source's 631 districts vs. ~800 that exist today is mostly this,
not an error). Sub-district (Taluk/Tehsil) boundaries and any post
offices opened/closed/renamed since 2017 are also not reconciled. If
your use case needs current-as-of-today administrative boundaries
(anything regulatory, anything tied to government reporting), pull a
fresh extract from the
[Local Government Directory](https://lgdirectory.gov.in/) (the
authoritative government source for state/district/sub-district/village
codes) rather than trusting this district/sub-district data as final —
it's a solid starting point for address entry and lookup, not a
substitute for LGD codes where those are specifically required.

## Re-running / regenerating

The CSVs here are pre-built exports, already cleaned and normalized —
`scripts/seed-india-geo.js` just loads them as-is. If you need to
regenerate them from a fresher source extract, the transformation is:
group by (state, district, taluk) to assign parent ids, strip the
`S.O`/`H.O`/`B.O` suffix from `officename` for the display name, and
watch for the same J&K/Ladakh and DNH+DD corrections if your fresher
source still predates 2019/2020.
