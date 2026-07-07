const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const STORAGE_DIR = path.join(__dirname, '../../storage/checklists');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

async function generateChecklistPdf(checklistId, html) {
  ensureStorageDir();

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    const fileName = `${checklistId}-pm-checklist.pdf`;
    const filePath = path.join(STORAGE_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return {
      absolutePath: filePath,
      publicPath: `/files/checklists/${fileName}`,
    };
  } finally {
    await browser.close();
  }
}

module.exports = { generateChecklistPdf };