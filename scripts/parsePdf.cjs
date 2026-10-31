const fs = require('fs');
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("No file path provided");
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(filePath);
  const pagesData = [];
  let currentPage = 1;
  
  const renderPage = function(pageData) {
    let render_options = { normalizeWhitespace: false, disableCombineTextItems: false };
    return pageData.getTextContent(render_options).then(function(textContent) {
      let text = '';
      let lastY;
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
            text += item.str;
        } else {
            text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }
      pagesData.push({ pageNumber: currentPage, text: text.trim() });
      currentPage++;
      return text;
    });
  }

  await pdfParse(buffer, { pagerender: renderPage });
  console.log(JSON.stringify(pagesData));
}

main().catch(e => { 
  console.error(e); 
  process.exit(1); 
});
