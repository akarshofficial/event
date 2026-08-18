const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Vercel Full-Stack Build Start ===');

try {
  // 1. Build frontend
  console.log('Installing frontend dependencies...');
  execSync('npm --prefix frontend install --legacy-peer-deps --no-audit', { stdio: 'inherit' });

  console.log('Building frontend production bundle...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });

  // 2. Prepare root build directory
  const srcDir = path.join(__dirname, 'frontend', 'build');
  const destDir = path.join(__dirname, 'build');

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Frontend build folder not found at ${srcDir}`);
  }

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.cpSync(srcDir, destDir, { recursive: true });

  console.log(`Copied ${fs.readdirSync(destDir).length} files/dirs to root /build`);
  console.log('=== Vercel Full-Stack Build Succeeded ===');
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
}
