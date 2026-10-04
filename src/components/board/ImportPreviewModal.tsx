'use client';

import { useRef } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { fmtMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'importStatus'
  | 'importSourceChoices'
  | 'selectImportFile'
  | 'importPreviewRows'
  | 'importParseError'
  | 'importParseErrorDetail'
  | 'passwordIsRetry'
  | 'importError'
  | 'submitPassword'
  | 'cancelImport'
  | 'toggleRowIncluded'
  | 'editRowDescription'
  | 'editRowCategory'
  | 'confirmImport'
  | 'categoryChoices'
>;

export const ImportPreviewModal = ({
  t,
  importStatus,
  importSourceChoices,
  selectImportFile,
  importPreviewRows,
  importParseError,
  importParseErrorDetail,
  passwordIsRetry,
  importError,
  submitPassword,
  cancelImport,
  toggleRowIncluded,
  editRowDescription,
  editRowCategory,
  confirmImport,
  categoryChoices,
}: Props) => {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);

  const includedCount = importPreviewRows.filter((row) => row.included).length;

  const stepTitle = {
    idle: t.importPreviewTitle,
    source: t.importSourceStepTitle,
    parsing: t.importPreviewTitle,
    password: t.importPasswordTitle,
    preview: t.importPreviewTitle,
  }[importStatus];

  return (
    <Dialog
      open={importStatus !== 'idle'}
      onOpenChange={(open) => {
        if (!open) cancelImport();
      }}
    >
      <DialogContent closeLabel={t.importCancelBtn} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{stepTitle}</DialogTitle>
        </DialogHeader>

        {importStatus === 'source' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {importSourceChoices.map((choice) => (
                <Button
                  key={choice.id}
                  variant={choice.selected ? 'default' : 'outline'}
                  aria-pressed={choice.selected}
                  onClick={choice.onSelect}
                >
                  {choice.name}
                </Button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => sourceFileInputRef.current?.click()}
            >
              {t.importChooseFileBtn}
            </Button>
            <input
              ref={sourceFileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) selectImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {importStatus === 'parsing' && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t.importParsing}
          </div>
        )}

        {importStatus === 'password' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-pdf-password">
                {t.importPasswordLabel}
              </Label>
              <Input
                id="import-pdf-password"
                ref={passwordInputRef}
                type="password"
              />
            </div>
            {passwordIsRetry && (
              <Alert variant="destructive">{t.importPasswordError}</Alert>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelImport}
              >
                {t.importPasswordCancel}
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  submitPassword(passwordInputRef.current?.value ?? '')
                }
              >
                {t.importPasswordSubmit}
              </Button>
            </div>
          </div>
        )}

        {importStatus === 'preview' && (
          <>
            {importParseError && (
              <Alert variant="destructive">
                {importParseError}
                {importParseErrorDetail && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium">
                      {t.importParseErrorDetailLabel}
                    </summary>
                    <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs leading-snug">
                      {importParseErrorDetail}
                    </pre>
                  </details>
                )}
              </Alert>
            )}

            {importPreviewRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {t.importPreviewEmpty}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {importPreviewRows.map((row) => (
                  <div
                    key={row.key}
                    className={`rounded-lg bg-muted p-3 ${
                      row.included ? '' : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={() => toggleRowIncluded(row.key)}
                        aria-label={row.description}
                        className="mt-1 size-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            editRowDescription(row.key, e.target.value)
                          }
                          className="w-full rounded bg-transparent text-sm font-medium outline-none focus-visible:ring focus-visible:ring-ring/50"
                        />
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {row.date}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold tabular-nums">
                        {fmtMoney(row.amount)}
                      </div>
                    </div>

                    {row.possibleDuplicate && (
                      <div className="mt-1.5 pl-6 text-xs font-medium text-destructive">
                        {t.importDuplicateWarning}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
                      {categoryChoices.map((choice) => {
                        const selected = row.category === choice.id;
                        return (
                          <Button
                            key={choice.id}
                            variant="outline"
                            size="xs"
                            aria-pressed={selected}
                            onClick={() => editRowCategory(row.key, choice.id)}
                            className="border-2"
                            style={
                              selected
                                ? {
                                    background: choice.color,
                                    borderColor: choice.color,
                                    color: choice.dark,
                                  }
                                : undefined
                            }
                          >
                            {choice.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {importError && <Alert variant="destructive">{importError}</Alert>}

            {importPreviewRows.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={cancelImport}
                >
                  {t.importCancelBtn}
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={confirmImport}
                  disabled={includedCount === 0}
                >
                  {t.importConfirmBtn}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
