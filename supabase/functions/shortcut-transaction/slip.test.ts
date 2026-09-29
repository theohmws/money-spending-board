import {
  detectBank,
  extractDate,
  isOwnTransfer,
  isSlipBody,
  normalizeName,
  parseSlipText,
} from './slip';

// Shaped like iOS "Extract Text from Image" output for a K PLUS transfer
// slip: labels and values on separate lines, as OCR usually splits them.
const THAI_SLIP = `โอนเงินสำเร็จ
28 ก.ย. 69 14:05 น.
นาย สมชาย ใจดี
ธ.กสิกรไทย
xxx-x-x1234-x
น.ส. สมหญิง รักดี
ธ.ไทยพาณิชย์
xxx-x-x5678-x
เลขที่รายการ:
016271140512BPM04321
จำนวน:
1,250.00 บาท
ค่าธรรมเนียม:
0.00 บาท
บันทึกช่วยจำ: ค่าอาหาร
สแกนตรวจสอบสลิป`;

const ENGLISH_SLIP = `Transfer Completed
28 Sep 26 09:41
MR. SOMCHAI JAIDEE
KBank
xxx-x-x1234-x
7-ELEVEN BRANCH 1234
Transaction ID: 016271094100APM01234
Amount: 85.00 Baht
Fee: 0.00 Baht`;

// Bangkok Bank (Bualuang mBanking) transfer slip: "ไปที่" labels the
// recipient, and the slip carries two references — the short
// "หมายเลขอ้างอิง" and the long, unique "เลขที่อ้างอิง" used as the slip ID.
const BBL_SLIP = `Bangkok Bank
รายการสำเร็จ
28 ก.ย. 69, 21:57
จำนวนเงิน
3,000.00 THB
จาก
นาย อภิสิทธิ์
980-4-xxx022
ธนาคารกรุงเทพ
ไปที่
TUSSANEE WONGSON
309-9-xxxxx3-04
ธนาคารอาคารสงเคราะห์
ค่าธรรมเนียม 0.00 THB
บันทึก บ้าน
หมายเลขอ้างอิง
483776
เลขที่อ้างอิง
2026092821573023002929008
สแกนเพื่อตรวจสอบ`;

describe('parseSlipText', () => {
  it('parses a Bangkok Bank transfer slip', () => {
    expect(parseSlipText(BBL_SLIP)).toEqual({
      amount: 3000,
      date: '2026-09-28',
      reference: '2026092821573023002929008',
      memo: 'บ้าน',
      recipient: 'TUSSANEE WONGSON',
      sender: 'นาย อภิสิทธิ์',
      bank: 'BBL',
    });
  });

  it('still finds the Bangkok Bank slip ID when OCR groups labels before values', () => {
    const grouped = BBL_SLIP.replace(
      'หมายเลขอ้างอิง\n483776\nเลขที่อ้างอิง\n2026092821573023002929008',
      'หมายเลขอ้างอิง\nเลขที่อ้างอิง\n483776\n2026092821573023002929008'
    );
    expect(parseSlipText(grouped)?.reference).toBe('2026092821573023002929008');
  });

  it('does not mistake a "Total" line for a "To" label', () => {
    expect(
      parseSlipText('Total 3,000.00\nนาย ก\nนาย ข\nAmount 3,000.00')?.recipient
    ).toBe('นาย ข');
  });

  it('reads a same-line "ไปที่" recipient', () => {
    const sameLine = BBL_SLIP.replace(
      'ไปที่\nTUSSANEE WONGSON',
      'ไปที่ TUSSANEE WONGSON'
    );
    expect(parseSlipText(sameLine)?.recipient).toBe('TUSSANEE WONGSON');
  });

  it('parses a Thai K PLUS transfer slip', () => {
    expect(parseSlipText(THAI_SLIP)).toEqual({
      amount: 1250,
      date: '2026-09-28',
      reference: '016271140512BPM04321',
      memo: 'ค่าอาหาร',
      recipient: 'น.ส. สมหญิง รักดี',
      sender: 'นาย สมชาย ใจดี',
      bank: 'KBank',
    });
  });

  it('parses an English slip with same-line labels', () => {
    expect(parseSlipText(ENGLISH_SLIP)).toEqual({
      amount: 85,
      date: '2026-09-28',
      reference: '016271094100APM01234',
      memo: null,
      recipient: null,
      sender: 'MR. SOMCHAI JAIDEE',
      bank: 'KBank',
    });
  });

  it('falls back to the largest non-fee figure when the amount label is lost', () => {
    const text = THAI_SLIP.replace('จำนวน:', '');
    expect(parseSlipText(text)?.amount).toBe(1250);
  });

  it('ignores a fee even if it is the only labelled figure', () => {
    expect(parseSlipText('ค่าธรรมเนียม: 15.00 บาท\n320.50')?.amount).toBe(
      320.5
    );
  });

  it('normalizes the slip ID so the same slip always gets the same key', () => {
    const lower = THAI_SLIP.replace(
      '016271140512BPM04321',
      '016271140512bpm04321'
    );
    const split = THAI_SLIP.replace(
      '016271140512BPM04321',
      '0162711405 12BPM04321'
    );
    expect(parseSlipText(lower)?.reference).toBe('016271140512BPM04321');
    expect(parseSlipText(split)?.reference).toBe('016271140512BPM04321');
  });

  it('reports no slip ID when none can be read', () => {
    expect(parseSlipText('จำนวน: 120.00 บาท')?.reference).toBeNull();
  });

  it('returns null when there is no amount at all', () => {
    expect(parseSlipText('Some random photo text\nno numbers')).toBeNull();
  });
});

describe('detectBank', () => {
  it("picks the slip's own (sender's) bank, the first one mentioned", () => {
    // Bangkok Bank slip paying into a GHB account, and a KBank slip paying
    // into SCB: the recipient's bank must not win.
    expect(detectBank(BBL_SLIP.split('\n'))).toBe('BBL');
    expect(detectBank(THAI_SLIP.split('\n'))).toBe('KBank');
  });

  it('does not mistake a place name for a bank', () => {
    expect(detectBank(['SHOPEETH BANGKOK TH', 'กรุงเทพมหานคร'])).toBeNull();
  });
});

describe('extractDate', () => {
  it('tolerates OCR dropping dots/spaces and 4-digit BE years', () => {
    expect(extractDate(['1 มค 2570 08:00'])).toBe('2027-01-01');
    expect(extractDate(['15 มี.ค.69'])).toBe('2026-03-15');
    expect(extractDate(['3 Mar 2026'])).toBe('2026-03-03');
  });

  it('rejects impossible dates', () => {
    expect(extractDate(['31 ก.พ. 69'])).toBeNull();
  });
});

describe('isSlipBody', () => {
  it('matches the Upload Bank Slip shortcut body', () => {
    expect(
      isSlipBody({
        ts: '2026-09-28T14:05:00+07:00',
        text: 'x',
        album: 'K PLUS',
      })
    ).toBe(true);
    expect(isSlipBody({ text: 'x', amount: 10 })).toBe(false);
    expect(isSlipBody({ amount: 10 })).toBe(false);
  });
});

describe('isOwnTransfer', () => {
  const slip = (sender: string | null, recipient: string | null) =>
    ({ sender, recipient } as Parameters<typeof isOwnTransfer>[0]);

  it('normalizes honorifics, case and punctuation', () => {
    expect(normalizeName('MR. Somchai  Jaidee')).toBe('somchaijaidee');
    expect(normalizeName('นาย สมชาย ใจดี')).toBe('สมชายใจดี');
  });

  it('matches sender and recipient, including a truncated surname', () => {
    expect(isOwnTransfer(slip('นาย สมชาย ใจดี', 'นาย สมชาย ใ'), [])).toBe(true);
    expect(isOwnTransfer(slip('MR. A BEE', 'Mr. A Bee'), [])).toBe(true);
  });

  it('matches a configured name in another language', () => {
    expect(
      isOwnTransfer(slip('MR. SOMCHAI JAIDEE', 'นาย สมชาย ใ'), ['สมชาย ใจดี'])
    ).toBe(true);
  });

  it('does not match different people or a missing recipient', () => {
    expect(isOwnTransfer(slip('นาย สมชาย ใจดี', 'น.ส. สมหญิง รักดี'), [])).toBe(
      false
    );
    expect(isOwnTransfer(slip('นาย สมชาย ใจดี', null), ['สมชาย'])).toBe(false);
  });
});
