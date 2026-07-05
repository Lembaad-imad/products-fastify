// show-name.js
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log(pkg.name || 'No "name" field found in package.json');
} catch (err) {
  console.error('Could not read package.json:', err.message);
}