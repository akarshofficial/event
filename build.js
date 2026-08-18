const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting full-stack build ---');

// 1. Install & Build frontend
console.log('Building React frontend...');
execSync('npm --prefix frontend install && npm --prefix frontend run build', { stdio: 'inherit' });

// 2. Copy frontend/build to root /build
const srcDir = path.join(__dirname, 'frontend', 'build');
const destDir = path.join(__dirname, 'build');

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.cpSync(srcDir, destDir, { recursive: true });

console.log('Build output ready in ./build');
