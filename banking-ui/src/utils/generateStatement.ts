import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, Account } from '../types';

const PKR = (amount: number) =>
  'PKR ' +
  new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

export const generateStatement = (
  account: Account,
  holderName: string,
  transactions: Transaction[],
  periodLabel: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BANK STATEMENT', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Secure · Reliable · Trusted', margin, 21);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, W - margin, 14, { align: 'right' });
  doc.text(`Generated: ${fmtDate(new Date().toISOString())}`, W - margin, 21, { align: 'right' });

  // ── Account info block ────────────────────────────────────────────────────
  let y = 36;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, W - margin * 2, 30, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ACCOUNT HOLDER', margin + 5, y + 7);
  doc.text('ACCOUNT NUMBER', margin + 75, y + 7);
  doc.text('ACCOUNT TYPE', margin + 140, y + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(holderName, margin + 5, y + 16);
  doc.text(account.accountNumber, margin + 75, y + 16);
  doc.text(account.accountType, margin + 140, y + 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Statement Period:', margin + 5, y + 25);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(periodLabel, margin + 40, y + 25);

  // ── Compute totals ────────────────────────────────────────────────────────
  let totalCredits = 0;
  let totalDebits = 0;

  transactions.forEach((t) => {
    if (t.status !== 'Failed') {
      if (t.transactionType === 'Deposit') totalCredits += t.amount;
      else totalDebits += t.amount;
    }
  });

  const closingBalance = account.balance;
  const openingBalance = closingBalance - totalCredits + totalDebits;

  // ── Summary boxes ─────────────────────────────────────────────────────────
  y += 38;
  const boxW = (W - margin * 2 - 9) / 4;

  const boxes: { label: string; value: string; bg: [number, number, number]; fg: [number, number, number] }[] = [
    { label: 'Opening Balance', value: PKR(openingBalance), bg: [226, 232, 240], fg: [15, 23, 42] },
    { label: 'Total Credits',   value: PKR(totalCredits),   bg: [220, 252, 231], fg: [22, 101, 52] },
    { label: 'Total Debits',    value: PKR(totalDebits),    bg: [254, 226, 226], fg: [153, 27, 27] },
    { label: 'Closing Balance', value: PKR(closingBalance), bg: [219, 234, 254], fg: [30, 64, 175] },
  ];

  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 3);
    doc.setFillColor(...box.bg);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(box.label.toUpperCase(), x + boxW / 2, y + 6, { align: 'center' });
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...box.fg);
    doc.text(box.value, x + boxW / 2, y + 14, { align: 'center' });
  });

  // ── Section heading ───────────────────────────────────────────────────────
  y += 26;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Transaction Details', margin, y);
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + 52, y + 2);
  y += 6;

  // ── Build rows with running balance ───────────────────────────────────────
  let runningBalance = openingBalance;
  const rows = transactions.map((t) => {
    const isCredit = t.transactionType === 'Deposit';
    if (t.status !== 'Failed') {
      runningBalance += isCredit ? t.amount : -t.amount;
    }
    return [
      fmtDate(t.createdAt),
      t.description || '—',
      t.transactionType,
      isCredit ? '' : PKR(t.amount),
      isCredit ? PKR(t.amount) : '',
      PKR(runningBalance),
      t.status ?? 'Completed',
    ];
  });

  // ── Table ─────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Type', 'Debit', 'Credit', 'Balance', 'Status']],
    body: rows,
    foot: [[
      { content: 'TOTALS', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } },
      { content: PKR(totalDebits),    styles: { fontStyle: 'bold', halign: 'right', textColor: [153, 27, 27] as [number, number, number], fillColor: [241, 245, 249] as [number, number, number] } },
      { content: PKR(totalCredits),   styles: { fontStyle: 'bold', halign: 'right', textColor: [22, 101, 52] as [number, number, number],  fillColor: [241, 245, 249] as [number, number, number] } },
      { content: PKR(closingBalance), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] as [number, number, number] } },
      { content: `${rows.length} txns`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] as [number, number, number] } },
    ]],
    showFoot: 'lastPage',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59] as [number, number, number],
      lineColor: [226, 232, 240] as [number, number, number],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 64, 175] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 28, halign: 'right', textColor: [153, 27, 27] as [number, number, number] },
      4: { cellWidth: 28, halign: 'right', textColor: [22, 101, 52] as [number, number, number] },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const val = String(data.cell.raw);
        if (val === 'Completed' || val === 'Success') data.cell.styles.textColor = [22, 101, 52];
        else if (val === 'Pending') data.cell.styles.textColor = [161, 98, 7];
        else if (val === 'Failed')  data.cell.styles.textColor = [153, 27, 27];
      }
    },
  });

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 14, W - margin, pageH - 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential. For account holder use only.', margin, pageH - 9);
    doc.text(`Generated: ${fmtDateTime(new Date().toISOString())}`, W / 2, pageH - 9, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, W - margin, pageH - 9, { align: 'right' });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `Bank_Statement_${account.accountNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
