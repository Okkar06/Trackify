import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Totals = {
  totalShifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type MonthlyRow = {
  date: string;
  shifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type YearlyRow = {
  month: string;
  shifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  return String(value);
};

const addHeader = ({ doc, title, subtitle }: { doc: jsPDF; title: string; subtitle: string }) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 14, 25);
};

const addTotals = ({ doc, totals }: { doc: jsPDF; totals: Totals }) => {
  const rows = [
    ["Total shifts", formatNumber(totals.totalShifts)],
    ["Total hours", formatNumber(totals.totalHours)],
    ["Total payable hours", formatNumber(totals.totalPayableHours)],
    ["Total pay", formatNumber(totals.totalPay)],
  ];

  autoTable(doc, {
    startY: 32,
    head: [["Summary", "Value"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: [10, 10, 10],
      lineColor: [42, 42, 42],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [10, 10, 10],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });
};

export const exportMonthlyPayPdf = ({
  year,
  month,
  totals,
  rows,
  filename,
}: {
  year: number;
  month: number;
  totals: Totals;
  rows: MonthlyRow[];
  filename: string;
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addHeader({ doc, title: "Trackify Pay Report", subtitle: `Monthly • ${year}-${String(month).padStart(2, "0")}` });
  addTotals({ doc, totals });

  const startY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 60;

  autoTable(doc, {
    startY,
    head: [["Date", "Total shifts", "Total hours", "Total payable hours", "Total pay"]],
    body: rows.map((r) => [r.date, r.shifts, r.totalHours, r.totalPayableHours, r.totalPay]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [10, 10, 10],
      lineColor: [42, 42, 42],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [10, 10, 10],
      fontStyle: "bold",
    },
  });

  doc.save(filename);
};

export const exportYearlyPayPdf = ({
  year,
  totals,
  rows,
  filename,
}: {
  year: number;
  totals: Totals;
  rows: YearlyRow[];
  filename: string;
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addHeader({ doc, title: "Trackify Pay Report", subtitle: `Yearly • ${year}` });
  addTotals({ doc, totals });

  const startY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 60;

  autoTable(doc, {
    startY,
    head: [["Month", "Total shifts", "Total hours", "Total payable hours", "Total pay"]],
    body: rows.map((r) => [r.month, r.shifts, r.totalHours, r.totalPayableHours, r.totalPay]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [10, 10, 10],
      lineColor: [42, 42, 42],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [10, 10, 10],
      fontStyle: "bold",
    },
  });

  doc.save(filename);
};

