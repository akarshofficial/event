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

  const srcDir = path.join(__dirname, 'frontend', 'build');

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Frontend build folder not found at ${srcDir}`);
  }

  // 2. Mirror build directory to standard output directories
  const targetDirs = [
    path.join(__dirname, 'build'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'public'),
  ];

  for (const target of targetDirs) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    fs.cpSync(srcDir, target, { recursive: true });
    console.log(`Copied build files to ${target}`);
  }

  console.log('=== Vercel Full-Stack Build Succeeded ===');
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
}
