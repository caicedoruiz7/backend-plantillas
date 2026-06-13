const express = require("express");
const cors = require("cors");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Backend funcionando ✅");
});

app.post("/generar-pdf", async (req, res) => {
  try {
    const planillas = req.body.planillas;

    const pdfPath = path.join(__dirname, "plantilla.pdf");
    const plantillaBytes = fs.readFileSync(pdfPath);

    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

    const formatFecha = (f) => {
      if (!f) return "";
      if (f.includes("/")) return f;
      if (f.includes("-")) {
        const [year, month, day] = f.split("-");
        return `${day}/${month}/${year}`;
      }
      return f;
    };

    for (const data of planillas) {
      const pdfDoc = await PDFDocument.load(plantillaBytes);
      const page = pdfDoc.getPages()[0];

      // ── IDA ──
      page.drawText(formatFecha(data.fecha) || '', { x: 99,  y: 695, size: 10, font });
      page.drawText(data.nombreUsuario     || '', { x: 94,  y: 653, size: 10, font });
      page.drawText(data.nroDoc            || '', { x: 415, y: 640, size: 10, font });
      page.drawText(data.eps               || '', { x: 94,  y: 627, size: 10, font });
      page.drawText(data.docOrigen         || '', { x: 60,  y: 565, size: 10, font });
      page.drawText(data.origenCiudad      || '', { x: 235, y: 565, size: 10, font });
      page.drawText(data.origenHora        || '', { x: 522, y: 560, size: 10, font });
      page.drawText(data.docDestino        || '', { x: 60,  y: 520, size: 10, font });
      page.drawText(data.destinoCiudad     || '', { x: 235, y: 520, size: 10, font });
      page.drawText(data.destinoHora       || '', { x: 522, y: 515, size: 10, font });

      // ── REGRESO ──
      page.drawText(formatFecha(data.fecha) || '', { x: 99,  y: 323, size: 10, font });
      page.drawText(data.nombreUsuario     || '', { x: 94,  y: 281, size: 10, font });
      page.drawText(data.nroDoc            || '', { x: 415, y: 268, size: 10, font });
      page.drawText(data.eps               || '', { x: 94,  y: 255, size: 10, font });
      page.drawText(data.docDestino        || '', { x: 60,  y: 192, size: 10, font });
      page.drawText(data.destinoCiudad     || '', { x: 235, y: 192, size: 10, font });
      page.drawText(data.horaVueltaSalida  || '', { x: 522, y: 188, size: 10, font });
      page.drawText(data.docOrigen         || '', { x: 60,  y: 148, size: 10, font });
      page.drawText(data.origenCiudad      || '', { x: 235, y: 148, size: 10, font });
      page.drawText(data.horaVueltaLlegada || '', { x: 522, y: 143, size: 10, font });

      // ── TIPO DOC IDA ──
      const yDoc = 639;
      if (data.tipoDoc === "CC")   page.drawText("X", { x: 103, y: yDoc,  size: 14, font });
      if (data.tipoDoc === "TI")   page.drawText("X", { x: 141, y: yDoc,  size: 14, font });
      if (data.tipoDoc === "RC")   page.drawText("X", { x: 186, y: yDoc,  size: 14, font });
      if (data.tipoDoc === "OTRO") page.drawText("X", { x: 290, y: yDoc,  size: 14, font });

      // ── TIPO DOC REGRESO ──
      const yDocr = 267;
      if (data.tipoDoc === "CC")   page.drawText("X", { x: 103, y: yDocr, size: 14, font });
      if (data.tipoDoc === "TI")   page.drawText("X", { x: 141, y: yDocr, size: 14, font });
      if (data.tipoDoc === "RC")   page.drawText("X", { x: 186, y: yDocr, size: 14, font });
      if (data.tipoDoc === "OTRO") page.drawText("X", { x: 290, y: yDocr, size: 14, font });

      const pdfBytes = await pdfDoc.save();
      const tempPdf  = await PDFDocument.load(pdfBytes);
      const pages    = await mergedPdf.copyPages(tempPdf, tempPdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const finalPdf = await mergedPdf.save();
    const buffer   = Buffer.from(finalPdf);

    // ✅ attachment → fuerza descarga en móvil y PC
    const fecha = new Date().toLocaleDateString("es-CO").replace(/\//g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="planillas_${fecha}.pdf"`);
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF", detalle: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});