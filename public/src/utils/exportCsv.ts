type CsvValue = string | number | boolean | null | undefined;

const escapeCsvValue = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const text = String(value);

  if (/[\r\n",]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const toCsv = (rows: Array<Record<string, CsvValue>>) => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsvValue).join(",")];

  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvValue(row[h])).join(","));
  }

  return lines.join("\r\n");
};

export const downloadCsv = ({ filename, csv }: { filename: string; csv: string }) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const buildCsvWithSummary = ({
  summary,
  rows,
}: {
  summary: Array<{ label: string; value: CsvValue }>;
  rows: Array<Record<string, CsvValue>>;
}) => {
  const summaryLines = summary.map((s) => `${escapeCsvValue(s.label)},${escapeCsvValue(s.value)}`);
  const table = rows.length > 0 ? toCsv(rows) : "";

  if (!table) {
    return [...summaryLines].join("\r\n");
  }

  return [...summaryLines, "", table].join("\r\n");
};

