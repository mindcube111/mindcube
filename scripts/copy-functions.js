import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'functions');
const destDir = path.join(__dirname, '..', 'dist', 'functions');

// 确保源目录存在
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Source directory does not exist:', sourceDir);
  process.exit(1);
}

// 确保目标目录存在
if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
  console.error('❌ dist directory does not exist. Please run build first.');
  process.exit(1);
}

// 创建目标目录
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制文件
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${path.relative(path.join(__dirname, '..'), dest)}`);
  }
}

console.log('📦 Copying functions directory to dist...');
copyRecursiveSync(sourceDir, destDir);
console.log('✅ Functions directory copied to dist successfully!');

