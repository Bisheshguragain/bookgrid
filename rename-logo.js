const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'public', 'BookGrid logo.2.jpg');
const destPath = path.join(__dirname, 'public', 'bookgrid-logo.png');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('✅ Logo successfully copied to bookgrid-logo.png');
  console.log(`   Source: ${sourcePath}`);
  console.log(`   Destination: ${destPath}`);
} catch (error) {
  console.error('❌ Error copying logo:', error.message);
}
