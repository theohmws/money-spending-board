// Client-side PDF text extraction via pdfjs-dist — this app is a static
// export (no server route to hand a PDF to), so parsing has to happen in
// the browser. See design.md Decision 1 in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement.

// Type-only: erased at compile time, so this alone doesn't pull pdfjs-dist's
// actual (ESM-only) module code into anything that imports this file.
import type { PDFPageProxy } from 'pdfjs-dist';

// TextItem/TextMarkedContent aren't re-exported from the package's top-level
// types entrypoint (only from its internal display/api module), so derive
// the item type from the public getTextContent() signature instead.
type TextContentItem = Awaited<
  ReturnType<PDFPageProxy['getTextContent']>
>['items'][number];

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

// page.getTextContent() itself just drains page.streamTextContent() with
// `for await (const value of readableStream)` — but ReadableStream async
// iteration (Symbol.asyncIterator) isn't supported on every Safari/iOS build
// in the wild: confirmed via an on-device stack trace ("undefined is not a
// function") thrown from inside pdfjs-dist's getTextContent on iOS 18.7 /
// Safari 26.6, while the same statement PDF parsed fine on desktop. Reading
// via reader.read() instead only needs the base ReadableStream API (widely
// supported since Safari 10.1) and yields the identical item chunks.
const getTextContentItems = async (
  page: PDFPageProxy
): Promise<TextContentItem[]> => {
  const reader = page.streamTextContent().getReader();
  const items: TextContentItem[] = [];
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();
    if (done) break;
    items.push(...(value as { items: TextContentItem[] }).items);
  }
  return items;
};

const extractPageText = async (page: PDFPageProxy): Promise<string> => {
  const items = await getTextContentItems(page);
  const rows: { y: number; parts: { x: number; str: string }[] }[] = [];

  items.forEach((item) => {
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
  //
  // The `legacy/` build, not the default `build/` one: the default build
  // targets a newer JS runtime baseline (e.g. `Promise.withResolvers`, only
  // in Safari 17.4+/iOS 17.4+) than this board otherwise needs to assume,
  // and broke with a generic "undefined is not a function" on an iPhone on
  // an older iOS during real-world testing of the import flow. `legacy/`
  // is pdfjs-dist's own documented answer to that gap — same API surface
  // (its .d.ts is a bare `export * from "pdfjs-dist"`), more conservatively
  // transpiled.
  // pdfjs-dist ships no package.json "exports" map, so this deep import
  // needs its real file extension to resolve at all.
  // eslint-disable-next-line import/extensions
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  if (!workerConfigured) {
    // The standard bundler-friendly way to point pdfjs-dist at its worker
    // asset: Next's build (and dev server) resolves this the same way it
    // resolves any other `new URL(..., import.meta.url)` static asset.
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
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
