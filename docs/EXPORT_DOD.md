# Export Monthly (PDF/PPT) — Definition of Done

## Functional
- [ ] PDF export returns a valid PDF file that opens in standard readers.
- [ ] PPT export returns a valid PPTX file that opens in PowerPoint/Keynote/Google Slides.
- [ ] Both exports include charts (activity, action status, project progress).
- [ ] Export content matches Monthly Review sections (executive, KPIs, charts, decisions, focus).

## Reliability / Safety
- [ ] Endpoints never return HTML (no Next error page).
- [ ] Errors are returned as JSON with stable codes:
  - `EXPORT_PDF_FAILED`, `EXPORT_PPT_FAILED`, `MISSING_MONTH`, `INVALID_LOCALE`, `UNAUTHORIZED`
- [ ] Binary outputs are validated server-side:
  - PDF signature `%PDF-`
  - PPTX signature `PK` (zip)
- [ ] Client-side download refuses `text/html`.

## Performance
- [ ] Typical export completes < 3s on dev dataset.
- [ ] No excessive DB selects (select minimal fields).

## Architecture constraints
- [ ] No React/shadcn/recharts dependencies in export code.
- [ ] No dynamic imports in export code (Turbopack-safe).
- [ ] Charts are generated server-side as PNG via Chart.js.

## Observability
- [ ] Server logs `EXPORT_OK` / `EXPORT_FAIL` with ms + bytes.

## Testing
- [ ] Manual smoke tests pass:
  - `/api/export/monthly/pdf?month=2025-12&locale=fr`
  - `/api/export/monthly/pdf?month=2025-11&locale=en`
  - `/api/export/monthly/ppt?month=2025-12&locale=fr`
  - `/api/export/monthly/ppt?month=2025-10&locale=fr&projectId=...`
- [ ] Files download correctly.
- [ ] Files open without warnings.
- [ ] Charts are visible.
- [ ] Sections are correct.
- [ ] No HTML is ever downloaded.

## Code Quality
- [ ] No dynamic imports in `lib/export/**` (verified by `npm run export:check`).
- [ ] All imports are static string literals.
- [ ] Code is readable and maintainable.

