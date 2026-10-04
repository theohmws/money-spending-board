'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showApiTokens'
  | 'closeApiTokens'
  | 'apiTokenRows'
  | 'newTokenName'
  | 'onNewTokenNameChange'
  | 'createApiToken'
  | 'creatingToken'
  | 'revealedToken'
  | 'dismissRevealedToken'
  | 'apiTokenError'
  | 'shortcutEndpoint'
  | 'isOnline'
>;

const EXAMPLE_INSERT = `{
  "amount": 120,
  "note": "Coffee",
  "type": "expense",
  "category": "wants",
  "date": "2026-09-28"
}`;

const EXAMPLE_UPDATE = `{
  "id": "<transaction id>",
  "amount": 150
}`;

const codeClass =
  'overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground';

export const ApiTokensModal = ({
  t,
  showApiTokens,
  closeApiTokens,
  apiTokenRows,
  newTokenName,
  onNewTokenNameChange,
  createApiToken,
  creatingToken,
  revealedToken,
  dismissRevealedToken,
  apiTokenError,
  shortcutEndpoint,
  isOnline,
}: Props) => {
  const [copied, setCopied] = useState<'endpoint' | 'token' | null>(null);

  const copy = (what: 'endpoint' | 'token', value: string) => {
    navigator.clipboard?.writeText(value).then(
      () => setCopied(what),
      () => setCopied(null)
    );
  };

  return (
    <Dialog
      open={showApiTokens}
      onOpenChange={(open) => {
        if (!open) closeApiTokens();
      }}
    >
      <DialogContent closeLabel={t.closeLabel}>
        <DialogHeader>
          <DialogTitle>{t.apiTokensTitle}</DialogTitle>
          <DialogDescription>{t.apiTokensDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium leading-none">
            {t.apiEndpointLabel}
          </div>
          <div className="flex items-start gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              POST {shortcutEndpoint}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy('endpoint', shortcutEndpoint)}
            >
              {copied === 'endpoint'
                ? t.apiTokenCopiedLabel
                : t.apiTokenCopyBtn}
            </Button>
          </div>
        </div>

        {revealedToken && (
          <Alert className="gap-2 border-primary/40 bg-primary/10 p-3">
            <div className="text-sm font-medium">{t.apiTokenRevealTitle}</div>
            <code className="block break-all rounded-lg bg-background p-2.5 font-mono text-xs">
              {revealedToken}
            </code>
            <div className="text-xs leading-relaxed text-muted-foreground">
              {t.apiTokenRevealHint}
            </div>
            <div className="mt-1 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => copy('token', revealedToken)}
              >
                {copied === 'token' ? t.apiTokenCopiedLabel : t.apiTokenCopyBtn}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setCopied(null);
                  dismissRevealedToken();
                }}
              >
                {t.apiTokenDoneBtn}
              </Button>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          {apiTokenRows.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {t.apiTokensEmpty}
            </div>
          )}
          {apiTokenRows.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-lg bg-muted py-1.5 pl-3 pr-1.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {token.name}{' '}
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {token.prefix}…
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {token.lastUsedLabel}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={token.onRevoke}
                disabled={!isOnline}
                aria-label={t.apiTokenRevokeAria}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            value={newTokenName}
            onChange={(e) => onNewTokenNameChange(e.target.value)}
            placeholder={t.apiTokenNamePlaceholder}
            maxLength={60}
            aria-label={t.apiTokenNamePlaceholder}
            className="flex-1"
          />
          <Button
            onClick={() => {
              setCopied(null);
              createApiToken();
            }}
            disabled={!newTokenName.trim() || creatingToken || !isOnline}
          >
            {t.apiTokenCreateBtn}
          </Button>
        </div>

        {apiTokenError && <Alert variant="destructive">{apiTokenError}</Alert>}

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t.apiUsageTitle}</h3>
          <ol className="list-decimal pl-4 text-sm leading-relaxed text-muted-foreground">
            <li>{t.apiUsageStep1}</li>
            <li>{t.apiUsageStep2}</li>
            <li>{t.apiUsageStep3}</li>
          </ol>
          <pre className={codeClass}>{EXAMPLE_INSERT}</pre>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.apiUsageUpdateHint}
          </p>
          <pre className={codeClass}>{EXAMPLE_UPDATE}</pre>
        </section>
      </DialogContent>
    </Dialog>
  );
};
