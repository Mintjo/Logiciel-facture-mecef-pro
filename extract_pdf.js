const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const path = require('path');

async function extractText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let lastY = null;
    tc.items.forEach(item => {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) fullText += '\n';
      fullText += item.str;
      lastY = item.transform[5];
    });
    fullText += '\n---PAGE BREAK---\n';
  }
  console.log(fullText);
}

const file = path.resolve(__dirname, 'Facture_EM01457329-8_20260330164844.pdf');
extractText(file).catch(e => console.error(e));
