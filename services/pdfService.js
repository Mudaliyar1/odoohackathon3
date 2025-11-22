const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

async function generatePdf(templatePath, data, options = {}) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const html = await ejs.renderFile(templatePath, data);

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        ...options,
    });

    await browser.close();
    return pdfBuffer;
}

module.exports = { generatePdf };