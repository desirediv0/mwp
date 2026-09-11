import fs from 'fs';
import path from 'path';

const sourceFile = 'C:\\Users\\welcome\\.gemini\\antigravity-ide\\brain\\c3ee5a86-2dbe-4ecf-bb10-d7de659debeb\\login_bg_1783410565826.png';
const destFile = 'd:\\Ritesh\\mwp\\front\\src\\assets\\login.png';

try {
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`Successfully copied new login background to ${destFile}`);
  } else {
    console.error(`Source file not found: ${sourceFile}`);
  }
  // Self cleanup
  fs.unlinkSync(new URL(import.meta.url));
  console.log('Cleaned up copy script.');
} catch (err) {
  console.error('Error copying files:', err);
  process.exit(1);
}
