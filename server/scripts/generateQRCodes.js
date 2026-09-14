import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

/**
 * Generates print-ready QR codes for the permanent MWP URLs.
 *
 * These URLs must never change once printed on packaging. Pages may show
 * "Coming Soon" first and be completed later.
 *
 * Formats per target:  .svg  .eps  .pdf  .png (2000px)  -padded.png (2400px)
 * Output:  server/qr-codes/   AND a browser-downloadable copy in client/public/qr/
 * Also writes URLS.txt with the finalized URL list.
 *
 * Run:  npm run qr
 */

const BASE = process.env.QR_BASE_URL || "https://mwpsupplements.com";

const TARGETS = [
  { name: "home", url: `${BASE}/` },
  { name: "products", url: `${BASE}/products` },
  { name: "compare", url: `${BASE}/compare` },
  { name: "ingredients", url: `${BASE}/ingredients` },
  { name: "why-us", url: `${BASE}/why-us` },
  { name: "contact", url: `${BASE}/contact` },
  { name: "faqs", url: `${BASE}/faqs` },
  { name: "product-ultra-pro", url: `${BASE}/products/ultra-pro-testosterone-matrix` },
  { name: "product-power-max", url: `${BASE}/products/power-max-pre-workout` },
  { name: "product-rapid-boost", url: `${BASE}/products/rapid-boost-circulation-support` },
  { name: "product-her-power", url: `${BASE}/products/her-power-hormone-balance` },
  { name: "product-her-energy", url: `${BASE}/products/her-energy-clean-focus` },
  { name: "product-daily-boost", url: `${BASE}/products/daily-boost-32-in-1-multivitamin` },
];

const OUT = path.resolve("qr-codes");
const CLIENT_PUBLIC = path.resolve("..", "client", "public", "qr");
const DESTS = [OUT, CLIENT_PUBLIC];
DESTS.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const qrOpts = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#0A0A0A", light: "#FFFFFF" },
};

// Minimal SVG path -> EPS. QR svg from `qrcode` is <rect>-based, so we
// re-render the QR as an EPS made of black squares over a white page.
function qrMatrixToEps(qr, sizePt = 300) {
  const n = qr.modules.size;
  const data = qr.modules.data;
  const cell = sizePt / n;
  let body = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) {
        const x = (c * cell).toFixed(2);
        const y = (sizePt - (r + 1) * cell).toFixed(2);
        body += `${x} ${y} ${cell.toFixed(2)} ${cell.toFixed(2)} rectfill\n`;
      }
    }
  }
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${sizePt} ${sizePt}
%%Title: MWP QR
%%EndComments
/rectfill { 4 dict begin
  /h exch def /w exch def /y exch def /x exch def
  newpath x y moveto w 0 rlineto 0 h rlineto w neg 0 rlineto closepath fill
end } def
1 setgray 0 0 ${sizePt} ${sizePt} rectfill
0 setgray
${body}%%EOF
`;
}

async function run() {
  const lines = [`MWP SUPPLEMENTS — permanent QR target URLs`, `Base: ${BASE}`, ""];

  for (const t of TARGETS) {
    const write = (ext, buf) => {
      DESTS.forEach((d) => fs.writeFileSync(path.join(d, `${t.name}.${ext}`), buf));
    };

    // SVG (vector)
    const svg = await QRCode.toString(t.url, { ...qrOpts, type: "svg", width: 1024 });
    write("svg", svg);

    // Matrix for EPS + PDF
    const qr = QRCode.create(t.url, { errorCorrectionLevel: "H" });

    // EPS (vector)
    write("eps", qrMatrixToEps(qr, 300));

    // PDF (vector — embeds the SVG)
    const pdfBuf = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [320, 320], margin: 10 });
      const chunks = [];
      doc.on("data", (d) => chunks.push(d));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      SVGtoPDF(doc, svg, 10, 10, { width: 300, height: 300 });
      doc.end();
    });
    write("pdf", pdfBuf);

    // High-res PNG (2000px)
    const pngBuf = await QRCode.toBuffer(t.url, { ...qrOpts, type: "png", width: 2000 });
    write("png", pngBuf);

    // Softly-padded 2400px PNG for large print
    const padded = await sharp(pngBuf)
      .extend({ top: 200, bottom: 200, left: 200, right: 200, background: "#FFFFFF" })
      .png()
      .toBuffer();
    write("padded.png", padded);

    lines.push(`${t.name.padEnd(24)} ${t.url}`);
    console.log(`+ ${t.name}  ->  ${t.url}`);
  }

  DESTS.forEach((d) => fs.writeFileSync(path.join(d, "URLS.txt"), lines.join("\n") + "\n"));
  // Machine-readable manifest for the admin QR page
  const manifest = TARGETS.map((t) => ({ name: t.name, url: t.url }));
  DESTS.forEach((d) => fs.writeFileSync(path.join(d, "manifest.json"), JSON.stringify(manifest, null, 2)));
  console.log(`\nWrote ${TARGETS.length} QR codes (svg / eps / pdf / png / padded.png)`);
  DESTS.forEach((d) => console.log(`  → ${d}`));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
