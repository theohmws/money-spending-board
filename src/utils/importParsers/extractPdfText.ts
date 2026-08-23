// Client-side PDF text extraction via pdfjs-dist — this app is a static
// export (no server route to hand a PDF to), so parsing has to happen in
// the browser. See design.md Decision 1 in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement.

// Type-only: erased at compile time, so this alone doesn't pull pdfjs-dist's
// actual (ESM-only) module code into anything that imports this file.
import type { PDFPageProxy } from 'pdfjs-dist';

let workerConfigured = false;

export type ExtractPdfTextOptions = {
  // Only called if the PDF is actually password-protected — pdfjs-dist
  // itself decides that, we just react to it (design.md Decision 9).
  // `isRetry` is true once a previously-submitted password was wrong. Call
  // `submit` with the password to try, or with `null` to cancel.
  onPassword?: (
    submit: (password: string | null) => void,
    isRetry: boolean
  ) => void;
};

// getTextContent() returns text runs in content-stream order with no
// inherent line breaks — reconstruct rows by grouping runs whose baseline Y
// position is close together, then ordering each row left to right.
const Y_TOLERANCE = 2;

const extractPageText = async (page: PDFPageProxy): Promise<string> => {
  const content = await page.getTextContent();
  const rows: { y: number; parts: { x: number; str: string }[] }[] = [];

  content.items.forEach((item) => {
    if (!('str' in item) || !item.str.trim()) return;
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    const row = rows.find((r) => Math.abs(r.y - y) <= Y_TOLERANCE);
    if (row) {
      row.parts.push({ x, str: item.str });
    } else {
      rows.push({ y, parts: [{ x, str: item.str }] });
    }
  });

  return rows
    .sort((a, b) => b.y - a.y) // PDF y-axis increases upward
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.str)
        .join(' ')
    )
    .join('\n');
};

export const extractPdfText = async (
  file: File,
  { onPassword }: ExtractPdfTextOptions = {}
): Promise<string> => {
  // Loaded dynamically, not at module top-level: pdfjs-dist is ESM-only and
  // ~1MB, and this is the only place in the app that needs it — deferring
  // to here keeps it out of the main bundle until a user actually opens the
  // import flow, and keeps this module importable (e.g. by
  // useSpendingBoard, and by Jest, which can't statically parse pdfjs-dist's
  // own `import.meta`-using bundle) without ever loading pdfjs-dist itself.
  const pdfjsLib = await import('pdfjs-dist');

  if (!workerConfigured) {
    // The standard bundler-friendly way to point pdfjs-dist at its worker
    // asset: Next's build (and dev server) resolves this the same way it
    // resolves any other `new URL(..., import.meta.url)` static asset.
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    workerConfigured = true;
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });

  if (onPassword) {
    loadingTask.onPassword = (
      updatePassword: (password: string) => void,
      reason: number
    ) => {
      onPassword((password) => {
        if (password === null) {
          loadingTask.destroy();
          return;
        }
        updatePassword(password);
      }, reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD);
    };
  }

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    // Pages must be read in order to reconstruct a coherent statement, so a
    // sequential await here (rather than Promise.all) is intentional.
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(pageNumber);
    // eslint-disable-next-line no-await-in-loop
    pageTexts.push(await extractPageText(page));
  }
  return pageTexts.join('\n');
};
