/* Ekspor mengikuti template DAFTAR NILAI UTS (Kelas X: 12 mapel, Kelas XI: 11 mapel) */
const MAPEL = {
  X: ["PENDIDIKAN AGAMA DAN BUDI PEKERTI","PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN","BAHASA INDONESIA","BAHASA INGGRIS","MATEMATIKA","PENDIDIKAN JASMANI, OLAHRAGA DAN KESEHATAN","SEJARAH INDONESIA","ILMU PENGETAHUAN ALAM DAN SOSIAL","INFORMATIKA","SENI BUDAYA","KODING DAN KECERDASAN ARTIFISIAL","DASAR - DASAR PROGRAM KEAHLIAN"],
  XI: ["PENDIDIKAN AGAMA DAN BUDI PEKERTI","PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN","BAHASA INDONESIA","BAHASA INGGRIS","MATEMATIKA","PENDIDIKAN JASMANI, OLAHRAGA DAN KESEHATAN","KREATIFITAS, INOVASI DAN KEWIRAUSAHAAN","SEJARAH INDONESIA","MUATAN LOKAL","PROGRAM KEAHLIAN","MATA PELAJARAN PILIHAN"]
};
const TITLE = "DAFTAR NILAI UJIAN TENGAH SEMESTER";
const toNum = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? null : n; };
const fmt = n => String(+n.toFixed(2)).replace(".", ",");
function totalOf(s) { return s.nilai.reduce((a, v) => a + (toNum(v) || 0), 0); }
const ketMapel = (n, k) => { n = toNum(n); k = toNum(k); return n === null || k === null ? "" : (n >= k ? "TUNTAS" : "TIDAK TUNTAS"); };
function view(s, S) {
  const m = MAPEL[s.t];
  return {
    m,
    rows: m.map((n, i) => [i + 1, n, S.kktp[s.t][i] ?? "", s.nilai[i] ?? "", ketMapel(s.nilai[i], S.kktp[s.t][i])]),
    total: totalOf(s),
    kepala: "Kepala " + S.set.sekolah,
    nipK: "NIP. " + S.set.nipKepsek,
    nipW: "NIP." + (S.set.nipWali ? " " + S.set.nipWali : "")
  };
}

async function makeXlsx(list, S) {
  const wb = new ExcelJS.Workbook();
  const used = new Set();
  const F = { name: "Arial", size: 12 };
  const B = { style: "thin" };
  const box = { top: B, left: B, bottom: B, right: B };
  list.forEach((s, k) => {
    const v = view(s, S);
    let nm = ((k + 1) + ". " + (s.nama || "Siswa")).replace(/[\\\/\?\*\[\]:]/g, " ").slice(0, 31);
    while (used.has(nm.toLowerCase())) nm = nm.slice(0, 28) + "~" + Math.floor(Math.random() * 90 + 10);
    used.add(nm.toLowerCase());
    const ws = wb.addWorksheet(nm, { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: .7, right: .7, top: .75, bottom: .75, header: .3, footer: .3 } } });
    [8.54, 52, 7.63, 11, 17].forEach((w, i) => ws.getColumn(i + 1).width = w);
    const put = (addr, val, o = {}) => { const c = ws.getCell(addr); c.value = val; c.font = { ...F, bold: !!o.bold }; if (o.al) c.alignment = o.al; if (o.border) c.border = box; return c; };
    ws.mergeCells("A1:E1"); put("A1", TITLE, { bold: true, al: { horizontal: "center" } });
    put("A3", "NAMA"); put("B3", ": " + s.nama); put("C3", "SEMESTER : " + S.set.semester);
    put("A4", "KELAS"); put("B4", ": " + s.kelas); put("C4", "TP : " + S.set.tp);
    ["No.", "MATA PELAJARAN", "KKTP", "NILAI UTS", "Ket"].forEach((h, i) => put("ABCDE"[i] + 6, h, { border: 1, al: { horizontal: "center", vertical: "middle" } }));
    v.rows.forEach((r, i) => {
      const n = 7 + i;
      put("A" + n, r[0], { border: 1, al: { horizontal: "center", vertical: "middle" } });
      put("B" + n, r[1], { border: 1, al: { vertical: "middle" } });
      [2, 3, 4].forEach(j => put("ABCDE"[j] + n, r[j] === "" ? null : (toNum(r[j]) ?? r[j]), { border: 1, al: { horizontal: "center", vertical: "middle" } }));
    });
    const t = 7 + v.rows.length;
    ws.mergeCells(`A${t}:C${t}`);
    put("A" + t, "JUMLAH NILAI", { border: 1, al: { horizontal: "center", vertical: "middle" } });
    ["B", "C"].forEach(c => ws.getCell(c + t).border = box);
    put("D" + t, { formula: `SUM(D7:D${t - 1})`, result: v.total }, { border: 1, al: { horizontal: "center", vertical: "middle" } });
    put("E" + t, null, { border: 1 });
    for (let r = 6; r <= t; r++) ws.getRow(r).height = 25;
    put("C" + (t + 5), S.set.tempat);
    put("A" + (t + 6), "Mengetahui,");
    put("A" + (t + 7), v.kepala); put("C" + (t + 7), "Wali Kelas");
    put("A" + (t + 11), S.set.kepsek); put("C" + (t + 11), S.set.wali);
    put("A" + (t + 12), v.nipK); put("C" + (t + 12), v.nipW);
  });
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function makeDocx(list, S) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, TabStopType } = docx;
  const run = (text, o = {}) => new TextRun({ text: String(text), font: "Arial", size: 24, ...o });
  const para = (text, o = {}) => new Paragraph({ spacing: { after: 0, before: 0 }, alignment: o.al, tabStops: o.tabs, children: [run(text, { bold: o.bold, ...(o.size ? { size: o.size } : {}) })] });
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const W = [600, 5400, 880, 1380, 1486];
  const cell = (text, i, o = {}) => new TableCell({
    width: { size: o.w ?? W[i], type: WidthType.DXA }, columnSpan: o.span, verticalAlign: VerticalAlign.CENTER,
    margins: { left: 90, right: 90 },
    children: [para(text, { al: o.c ? AlignmentType.CENTER : AlignmentType.LEFT, size: o.size })]
  });
  const row = cells => new TableRow({ height: { value: 500, rule: HeightRule.ATLEAST }, children: cells });
  const sections = list.map(s => {
    const v = view(s, S);
    const info = [
      para(`NAMA\t: ${s.nama}\tSEMESTER : ${S.set.semester}`, { tabs: [{ type: TabStopType.LEFT, position: 1100 }, { type: TabStopType.LEFT, position: 6700 }] }),
      para(`KELAS\t: ${s.kelas}\tTP : ${S.set.tp}`, { tabs: [{ type: TabStopType.LEFT, position: 1100 }, { type: TabStopType.LEFT, position: 6700 }] })
    ];
    const rows = [row(["No.", "MATA PELAJARAN", "KKTP", "NILAI UTS", "Ket"].map((h, i) => cell(h, i, { c: 1 })))];
    v.rows.forEach(r => rows.push(row(r.map((x, i) => cell(x, i, { c: i !== 1, size: i === 1 ? 20 : i === 4 ? 16 : undefined })))));
    rows.push(row([cell("JUMLAH NILAI", 0, { c: 1, span: 3, w: W[0] + W[1] + W[2] }), cell(v.total ? fmt(v.total) : "", 3, { c: 1 }), cell("", 4)]));
    const table = new Table({
      width: { size: 9746, type: WidthType.DXA }, columnWidths: W, rows,
      borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line }
    });
    const L = ["", "Mengetahui,", v.kepala, "", "", "", S.set.kepsek, v.nipK];
    const R = [S.set.tempat, "", "Wali Kelas", "", "", "", S.set.wali, v.nipW];
    const nb = { top: none, bottom: none, left: none, right: none };
    const sign = new Table({
      width: { size: 9746, type: WidthType.DXA }, columnWidths: [6200, 3546],
      borders: { ...nb, insideHorizontal: none, insideVertical: none },
      rows: [new TableRow({ children: [L, R].map((col, k) => new TableCell({ width: { size: k ? 3546 : 6200, type: WidthType.DXA }, borders: nb, children: col.map(t => para(t)) })) })]
    });
    return {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: [para(TITLE, { bold: true, al: AlignmentType.CENTER }), para(""), ...info, para(""), table, para(""), para(""), para(""), para(""), para(""), sign]
    };
  });
  return Packer.toBlob(new Document({ creator: "Aplikasi Daftar Nilai UTS", sections }));
}

function makePdf(list, S) {
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a4" });
  const X = 18, cw = [12, 98, 14, 24, 26];
  list.forEach((s, k) => {
    if (k) doc.addPage();
    const v = view(s, S);
    doc.setFont("helvetica", "bold").setFontSize(12).text(TITLE, 105, 22, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(11);
    doc.text("NAMA", X, 33); doc.text(": " + s.nama, X + 20, 33); doc.text("SEMESTER : " + S.set.semester, 140, 33);
    doc.text("KELAS", X, 39); doc.text(": " + s.kelas, X + 20, 39); doc.text("TP : " + S.set.tp, 140, 39);
    const body = v.rows.map(r => r.map(x => String(x)));
    body.push([{ content: "JUMLAH NILAI", colSpan: 3, styles: { halign: "center" } }, v.total ? fmt(v.total) : "", ""]);
    doc.autoTable({
      startY: 46, margin: { left: X, right: X }, theme: "grid",
      head: [["No.", "MATA PELAJARAN", "KKTP", "NILAI UTS", "Ket"]], body,
      styles: { font: "helvetica", fontSize: 10, textColor: 0, lineColor: 0, lineWidth: .2, minCellHeight: 8.8, valign: "middle", cellPadding: { left: 2, right: 2, top: 1, bottom: 1 } },
      headStyles: { fillColor: 255, textColor: 0, fontStyle: "normal", halign: "center" },
      columnStyles: { 0: { cellWidth: cw[0], halign: "center" }, 1: { cellWidth: cw[1] }, 2: { cellWidth: cw[2], halign: "center" }, 3: { cellWidth: cw[3], halign: "center" }, 4: { cellWidth: cw[4], halign: "center", fontSize: 7.5 } }
    });
    const y = doc.lastAutoTable.finalY + 12, xr = 140, dots = t => t.replace(/…/g, ".");
    doc.setFontSize(11);
    doc.text(dots(S.set.tempat), xr, y);
    doc.text("Mengetahui,", X, y + 6);
    doc.text(v.kepala, X, y + 12); doc.text("Wali Kelas", xr, y + 12);
    doc.text(S.set.kepsek, X, y + 36); doc.text(dots(S.set.wali), xr, y + 36);
    doc.text(v.nipK, X, y + 42); doc.text(v.nipW, xr, y + 42);
  });
  return doc.output("blob");
}
/* ===== TEMPLATE BARU: REKAP KELAS (terpisah dari lembar siswa) ===== */
function ketOf(s, S) {
  let below = 0, kosong = 0;
  MAPEL[s.t].forEach((_, i) => {
    const n = toNum(s.nilai[i]); if (n === null) { kosong++; return; }
    const k = toNum(S.kktp[s.t][i]); if (k !== null && n < k) below++;
  });
  if (kosong) return `Belum lengkap (${kosong} kosong)`;
  return below ? `Belum tuntas (${below} mapel)` : "Tuntas";
}
function rekapData(list, S, t, ket) {
  const m = MAPEL[t];
  const rows = list.map((s, i) => {
    const vals = m.map((_, j) => toNum(s.nilai[j]));
    const flags = m.map((_, j) => { const k = toNum(S.kktp[t][j]); return vals[j] !== null && k !== null && vals[j] < k; });
    const f = vals.filter(v => v !== null), sum = f.reduce((a, b) => a + b, 0);
    return { no: i + 1, nama: s.nama, vals, flags, jumlah: f.length ? sum : null, rata: f.length ? sum / f.length : null, ket: ket ? ketOf(s, S) : "" };
  });
  return { m, kktp: m.map((_, j) => toNum(S.kktp[t][j])), rows };
}
const cv = v => v === null || v === undefined ? "" : fmt(v);
const REKAP_TITLE = "REKAP NILAI UJIAN TENGAH SEMESTER";

async function makeRekapXlsx(list, S, t, ket, label) {
  const R = rekapData(list, S, t, ket), n = R.m.length, nc = 2 + n + 2 + (ket ? 1 : 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Kelas " + t, { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  const F = { name: "Arial", size: 10 }, B = { style: "thin" }, box = { top: B, left: B, bottom: B, right: B };
  ws.getColumn(1).width = 5; ws.getColumn(2).width = 34;
  for (let i = 0; i < n; i++) ws.getColumn(3 + i).width = 7;
  ws.getColumn(3 + n).width = 9; ws.getColumn(4 + n).width = 11; if (ket) ws.getColumn(5 + n).width = 26;
  const put = (r, c, v, o = {}) => { const x = ws.getCell(r, c); x.value = v; x.font = { ...F, bold: !!o.bold, size: o.size || 10, color: o.red ? { argb: "FFC0392B" } : undefined }; if (o.box) x.border = box; x.alignment = { horizontal: o.al || "center", vertical: "middle" }; if (o.nf) x.numFmt = o.nf; return x; };
  ws.mergeCells(1, 1, 1, nc); put(1, 1, REKAP_TITLE, { bold: true, size: 12 });
  put(3, 1, "KELAS : " + label, { al: "left" }); put(4, 1, `SEMESTER : ${S.set.semester}      TP : ${S.set.tp}`, { al: "left" });
  const head = ["No", "NAMA SISWA", ...R.m.map((_, i) => i + 1), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])];
  head.forEach((h, i) => put(6, i + 1, h, { box: 1, bold: true }));
  ws.mergeCells(7, 1, 7, 2); put(7, 1, "KKTP", { box: 1 }); ws.getCell(7, 2).border = box;
  for (let c = 3; c <= nc; c++) put(7, c, c < 3 + n ? R.kktp[c - 3] : null, { box: 1 });
  R.rows.forEach((r, k) => {
    const row = 8 + k, a = ws.getCell(row, 3).address, z = ws.getCell(row, 2 + n).address;
    put(row, 1, r.no, { box: 1 }); put(row, 2, r.nama, { box: 1, al: "left" });
    r.vals.forEach((v, j) => put(row, 3 + j, v, { box: 1, red: r.flags[j], bold: r.flags[j] }));
    put(row, 3 + n, { formula: `SUM(${a}:${z})`, result: r.jumlah ?? 0 }, { box: 1 });
    put(row, 4 + n, { formula: `IF(COUNT(${a}:${z})=0,"",AVERAGE(${a}:${z}))`, result: r.rata === null ? "" : +r.rata.toFixed(2) }, { box: 1, nf: "0.00" });
    if (ket) put(row, 5 + n, r.ket, { box: 1, al: "left" });
    ws.getRow(row).height = 20;
  });
  let y = 8 + R.rows.length + 1;
  put(y, 1, "Keterangan mata pelajaran:", { bold: true, al: "left" });
  R.m.forEach((nm, i) => put(y + 1 + i, 1, `${i + 1}. ${nm}`, { al: "left" }));
  y += n + 3; const rc = Math.max(3, nc - 3);
  put(y, rc, S.set.tempat, { al: "left" }); put(y + 1, 2, "Mengetahui,", { al: "left" });
  put(y + 2, 2, "Kepala " + S.set.sekolah, { al: "left" }); put(y + 2, rc, "Wali Kelas", { al: "left" });
  put(y + 6, 2, S.set.kepsek, { al: "left" }); put(y + 6, rc, S.set.wali, { al: "left" });
  put(y + 7, 2, "NIP. " + S.set.nipKepsek, { al: "left" }); put(y + 7, rc, "NIP." + (S.set.nipWali ? " " + S.set.nipWali : ""), { al: "left" });
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function makeRekapDocx(list, S, t, ket, label) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, PageOrientation } = docx;
  const R = rekapData(list, S, t, ket), n = R.m.length;
  const rp = (text, o = {}) => new Paragraph({ spacing: { after: 0, before: 0 }, alignment: o.c ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: String(text), font: "Arial", size: o.size || 18, bold: !!o.bold, color: o.red ? "C0392B" : undefined })] });
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" }, none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const TOT = 15398, ketW = ket ? 2300 : 0, wm = Math.floor((TOT - 500 - 1100 - 1250 - ketW - 3000) / n);
  const W = [500, TOT - 500 - 1100 - 1250 - ketW - wm * n, ...Array(n).fill(wm), 1100, 1250, ...(ket ? [ketW] : [])];
  const cell = (text, i, o = {}) => new TableCell({ width: { size: o.w ?? W[i], type: WidthType.DXA }, columnSpan: o.span, verticalAlign: VerticalAlign.CENTER, margins: { left: 60, right: 60 }, children: [rp(text, o)] });
  const row = c => new TableRow({ height: { value: 340, rule: HeightRule.ATLEAST }, children: c });
  const head = ["No", "NAMA SISWA", ...R.m.map((_, i) => i + 1), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])];
  const rows = [row(head.map((h, i) => cell(h, i, { c: 1, bold: 1 })))];
  rows.push(row([cell("KKTP", 0, { c: 1, span: 2, w: W[0] + W[1] }), ...R.kktp.map((k, j) => cell(cv(k), 2 + j, { c: 1 })), cell("", 2 + n), cell("", 3 + n), ...(ket ? [cell("", 4 + n)] : [])]));
  R.rows.forEach(r => rows.push(row([cell(r.no, 0, { c: 1 }), cell(r.nama, 1), ...r.vals.map((v, j) => cell(cv(v), 2 + j, { c: 1, red: r.flags[j], bold: r.flags[j] })), cell(cv(r.jumlah), 2 + n, { c: 1 }), cell(r.rata === null ? "" : fmt(r.rata), 3 + n, { c: 1 }), ...(ket ? [cell(r.ket, 4 + n)] : [])])));
  const table = new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: W, rows, borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line } });
  const nb = { top: none, bottom: none, left: none, right: none };
  const L = ["", "Mengetahui,", "Kepala " + S.set.sekolah, "", "", "", S.set.kepsek, "NIP. " + S.set.nipKepsek];
  const Rr = [S.set.tempat, "", "Wali Kelas", "", "", "", S.set.wali, "NIP." + (S.set.nipWali ? " " + S.set.nipWali : "")];
  const sign = new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: [10400, 4998], borders: { ...nb, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ cantSplit: true, children: [L, Rr].map((col, k) => new TableCell({ width: { size: k ? 4998 : 10400, type: WidthType.DXA }, borders: nb, children: col.map(x => rp(x, { size: 20 })) })) })] });
  const kids = [rp(REKAP_TITLE, { bold: 1, c: 1, size: 24 }), rp(""), rp("KELAS : " + label, { size: 20 }), rp(`SEMESTER : ${S.set.semester}      TP : ${S.set.tp}`, { size: 20 }), rp(""), table, rp(""), rp("Keterangan mata pelajaran:", { bold: 1, size: 16 }), ...R.m.map((nm, i) => rp(`${i + 1}. ${nm}`, { size: 16 })), rp(""), rp(""), sign];
  return Packer.toBlob(new Document({ creator: "Aplikasi Daftar Nilai UTS", sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: kids }] }));
}

function makeRekapPdf(list, S, t, ket, label) {
  const R = rekapData(list, S, t, ket), n = R.m.length, M = 12, PW = 273;
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  doc.setFont("helvetica", "bold").setFontSize(12).text(REKAP_TITLE, 148.5, 14, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(10).text("KELAS : " + label, M, 22).text(`SEMESTER : ${S.set.semester}      TP : ${S.set.tp}`, M, 27);
  const ketW = ket ? 42 : 0, wm = Math.floor((PW - 9 - 17 - 19 - ketW - 50) / n * 10) / 10, wn = PW - 9 - 17 - 19 - ketW - wm * n;
  const head = [["No", "NAMA SISWA", ...R.m.map((_, i) => String(i + 1)), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])]];
  const body = [[{ content: "KKTP", colSpan: 2, styles: { halign: "center" } }, ...R.kktp.map(cv), "", "", ...(ket ? [""] : [])]];
  R.rows.forEach(r => body.push([String(r.no), r.nama, ...r.vals.map(cv), cv(r.jumlah), r.rata === null ? "" : fmt(r.rata), ...(ket ? [r.ket] : [])]));
  const cs = { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: wn } };
  for (let i = 0; i < n; i++) cs[2 + i] = { cellWidth: wm, halign: "center" };
  cs[2 + n] = { cellWidth: 17, halign: "center" }; cs[3 + n] = { cellWidth: 19, halign: "center" }; if (ket) cs[4 + n] = { cellWidth: ketW };
  doc.autoTable({ startY: 31, margin: { left: M, right: M }, theme: "grid", head, body, columnStyles: cs,
    styles: { font: "helvetica", fontSize: 8, textColor: 0, lineColor: 0, lineWidth: .2, minCellHeight: 6.5, valign: "middle", cellPadding: { left: 1.5, right: 1.5, top: .8, bottom: .8 } },
    headStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", halign: "center" },
    didParseCell: d => { if (d.section === "body" && d.row.index > 0) { const j = d.column.index - 2; if (j >= 0 && j < n && R.rows[d.row.index - 1].flags[j]) { d.cell.styles.textColor = [192, 57, 43]; d.cell.styles.fontStyle = "bold"; } } } });
  let y = doc.lastAutoTable.finalY + 7; const half = Math.ceil(n / 2);
  if (y + half * 4 + 8 > 200) { doc.addPage(); y = 15; }
  doc.setFontSize(8).setFont("helvetica", "bold").text("Keterangan mata pelajaran:", M, y); doc.setFont("helvetica", "normal");
  R.m.forEach((nm, i) => doc.text(`${i + 1}. ${nm}`, i < half ? M : 150, y + 4 + (i % half) * 4));
  y += half * 4 + 10;
  if (y + 44 > 205) { doc.addPage(); y = 15; }
  const xr = 200, dots = x => x.replace(/…/g, ".");
  doc.setFontSize(10);
  doc.text(dots(S.set.tempat), xr, y); doc.text("Mengetahui,", M, y + 6);
  doc.text("Kepala " + S.set.sekolah, M, y + 12); doc.text("Wali Kelas", xr, y + 12);
  doc.text(S.set.kepsek, M, y + 33); doc.text(dots(S.set.wali), xr, y + 33);
  doc.text("NIP. " + S.set.nipKepsek, M, y + 39); doc.text("NIP." + (S.set.nipWali ? " " + S.set.nipWali : ""), xr, y + 39);
  return doc.output("blob");
}
globalThis.DNU = { ketMapel, MAPEL, makeXlsx, makeDocx, makePdf, totalOf, fmt, toNum, ketOf, rekapData, makeRekapXlsx, makeRekapDocx, makeRekapPdf };
