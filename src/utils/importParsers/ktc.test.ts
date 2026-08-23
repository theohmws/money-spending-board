import { parseKtcStatement } from './ktc';

// Fixture lines shaped exactly like pdfjs-dist's extracted text for a real
// KTC PLATINUM MASTERCARD statement (Sept 2025 cycle) — see design.md in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement for the full
// context. No card number, name, or address appears in the transaction
// table itself.
describe('parseKtcStatement', () => {
  it('parses a normal purchase row', () => {
    const text = '20/08/25 20/08/25 SHOPEETH BANGKOK TH 207.00';
    expect(parseKtcStatement(text)).toEqual([
      { date: '2025-08-20', description: 'SHOPEETH BANGKOK TH', amount: 207 },
    ]);
  });

  it('normalizes irregular column whitespace in the description', () => {
    const text =
      '25/08/25 26/08/25 Netfix.com              Los Gatos  SGP               169.00';
    expect(parseKtcStatement(text)).toEqual([
      {
        date: '2025-08-25',
        description: 'Netfix.com Los Gatos SGP',
        amount: 169,
      },
    ]);
  });

  it('parses a foreign-currency row and drops its continuation line', () => {
    const text = [
      '03/09/25 04/09/25 GITHUB, INC.       SAN FRANCISCO USA        0.32',
      'USD 0.01',
    ].join('\n');
    expect(parseKtcStatement(text)).toEqual([
      {
        date: '2025-09-03',
        description: 'GITHUB, INC. SAN FRANCISCO USA',
        amount: 0.32,
      },
    ]);
  });

  it('keeps an installment counter embedded in the description verbatim', () => {
    const text = '10/09/25 10/09/25 03/10 LAZADA BANGKOK 1,590.00';
    expect(parseKtcStatement(text)).toEqual([
      {
        date: '2025-09-10',
        description: '03/10 LAZADA BANGKOK',
        amount: 1590,
      },
    ]);
  });

  it('drops a negative-amount row (money paid into the card), regardless of description', () => {
    const text = '02/09/25 02/09/25 Payment-KTB Internet - 8,544.15';
    expect(parseKtcStatement(text)).toEqual([]);
  });

  it('drops a negative-amount row under a different payment channel too', () => {
    const text = '05/09/25 05/09/25 Payment-SCB Easy - 1,000.00';
    expect(parseKtcStatement(text)).toEqual([]);
  });

  it('ignores non-transaction lines with no leading date pair', () => {
    const text = [
      'ยอดเรียกเก็บรอบที่แล้ว 8,544.15',
      'วันที่ใช้บัตร วันที่บันทึกรายการ รายการ จำนวนเงิน (บาท)',
      'P.353446 1/2 หน้าที่ 1/2',
    ].join('\n');
    expect(parseKtcStatement(text)).toEqual([]);
  });

  it('parses a full multi-line statement excerpt end to end', () => {
    const text = [
      'ยอดเรียกเก็บรอบที่แล้ว 8,544.15',
      '02/09/25 02/09/25 Payment-KTB Internet - 8,544.15',
      '20/08/25 20/08/25 SHOPEETH BANGKOK TH 207.00',
      '03/09/25 04/09/25 GITHUB, INC. SAN FRANCISCO USA 0.32',
      'USD 0.01',
      '10/09/25 10/09/25 03/10 LAZADA BANGKOK 1,590.00',
    ].join('\n');

    expect(parseKtcStatement(text)).toEqual([
      { date: '2025-08-20', description: 'SHOPEETH BANGKOK TH', amount: 207 },
      {
        date: '2025-09-03',
        description: 'GITHUB, INC. SAN FRANCISCO USA',
        amount: 0.32,
      },
      {
        date: '2025-09-10',
        description: '03/10 LAZADA BANGKOK',
        amount: 1590,
      },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseKtcStatement('')).toEqual([]);
  });
});
