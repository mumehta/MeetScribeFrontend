import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, '../src/assets/fonts/Inter');

// Create directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download Inter variable font from Google Fonts CDN
const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2';
const fontPath = path.join(fontsDir, 'Inter-VariableFont_slnt,wght.woff2');

console.log('Downloading Inter font...');
const file = fs.createWriteStream(fontPath);

const request = https.get(fontUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download font: ${response.statusCode}`);
    process.exit(1);
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Successfully downloaded Inter font');
  });
});

request.on('error', (err) => {
  fs.unlink(fontPath, () => {});
  console.error('Error downloading font:', err);
  process.exit(1);
});
