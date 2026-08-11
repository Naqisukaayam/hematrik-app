import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { resolveImgUrl } from "./helpers";

// Helper untuk konversi URL gambar ke base64
async function urlToBase64(url) {
  if (!url) return null;
  const fullUrl = resolveImgUrl(url);
  if (!fullUrl) return null;
  if (fullUrl.startsWith("data:image")) return fullUrl;

  try {
    const res = await fetch(fullUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) {}

  // Fallback pakai HTML Image + Canvas
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = fullUrl;
  });
}

export async function exportHistoryPdf(dataList = [], summary = {}, filterName = "SEMUA") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Header Dokumen ───────────────────────────────────────
  doc.setFillColor(22, 163, 74); // #16a34a (Green)
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("HEMATRIX - SMART ENERGY MONITORING", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Resmi Pengecekan & Deteksi Energi IoT/AI", 14, 18);

  // Tanggal cetak
  const nowStr = new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  doc.setFontSize(8);
  doc.text(`Dicetak: ${nowStr}`, pageWidth - 14, 18, { align: "right" });

  // ── Informasi Summary ────────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 28, pageWidth - 28, 22, 3, 3, "FD");

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Laporan:", 18, 35);

  // ── Preload Gambar & Batasi Maksimal 100 Data ──────────────
  const targetData = dataList.slice(0, 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const countLabel = dataList.length > 100 ? `${targetData.length} dari ${dataList.length} (100 Terakhir)` : `${dataList.length} Pengecekan`;
  doc.text(`Lokasi: Ruang Dosen (Gedung 4)   |   Filter: ${filterName}   |   Total Data: ${countLabel}`, 18, 41);

  const sumText = `Normal: ${summary.normal || 0}  |  Aman: ${summary.aman || 0}  |  Peringatan: ${summary.peringatan || 0}  |  Pemborosan: ${summary.pemborosan || 0}`;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(sumText, pageWidth - 18, 35, { align: "right" });

  const imageMap = {};

  await Promise.all(
    targetData.map(async (item, idx) => {
      const url = item.gambar_url || (item.gambar ? `/api/captures/${item.gambar}` : null);
      if (url) {
        const b64 = await urlToBase64(url);
        if (b64) imageMap[idx] = b64;
      }
    })
  );

  // ── Tabel Data dengan Foto ──────────────────────────────
  const tableHead = [["No", "Waktu & Jam", "Orang", "Lampu", "AC", "Dispenser", "Kondisi", "Foto Deteksi"]];

  const tableBody = targetData.map((item, idx) => {
    const tgl = item.waktu ? item.waktu.slice(0, 19).replace("T", " ") : "–";
    return [
      idx + 1,
      tgl,
      `${item.orang ?? 0} org`,
      item.lampu || "–",
      item.ac || "–",
      item.dispenser || "–",
      item.kondisi || "–",
      "", // Kolom foto diisi oleh hook didDrawCell
    ];
  });

  autoTable(doc, {
    startY: 54,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      minCellHeight: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
      valign: "middle",
      minCellHeight: 14,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: 32 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 16 },
      4: { halign: "center", cellWidth: 16 },
      5: { halign: "center", cellWidth: 18 },
      6: { halign: "center", cellWidth: 26 },
      7: { halign: "center", cellWidth: 36 }, // Tempat Foto
    },
    didParseCell: (data) => {
      // Styling badge kondisi
      if (data.section === "body" && data.column.index === 6) {
        const val = String(data.cell.raw).toUpperCase();
        if (val === "NORMAL") {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "PEMBOROSAN") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "PERINGATAN") {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "AMAN") {
          data.cell.styles.textColor = [37, 99, 235];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawCell: (data) => {
      // Gambar Foto Deteksi langsung di dalam sel tabel
      if (data.section === "body" && data.column.index === 7) {
        const rowIdx = data.row.index;
        const imgB64 = imageMap[rowIdx];

        if (imgB64) {
          try {
            const cell = data.cell;
            const imgWidth = 28;
            const imgHeight = 11;
            const posX = cell.x + (cell.width - imgWidth) / 2;
            const posY = cell.y + (cell.height - imgHeight) / 2;

            doc.addImage(imgB64, "JPEG", posX, posY, imgWidth, imgHeight);
          } catch (_) {}
        } else {
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text("Tidak Ada Foto", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
        }
      }
    },
  });

  // ── Footer Halaman ───────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text("Dokumen resmi dihasilkan oleh Sistem Monitoring Energi HEMATRIX - Universitas Mandiri", 14, pageHeight - 6);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }

  // Simpan/Download PDF
  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Riwayat_Hematrix_${dateTag}.pdf`);
}
