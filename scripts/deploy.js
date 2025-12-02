import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 开始部署流程...\n');

// 步骤 1: 检查 Node.js 版本
console.log('📦 步骤 1: 检查环境...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✓ Node.js 版本: ${nodeVersion}`);
} catch (error) {
  console.error('   ❌ 无法检测 Node.js 版本');
  process.exit(1);
}

// 步骤 2: 检查依赖
console.log('\n📦 步骤 2: 检查依赖...');
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('   ⚠️  依赖未安装，正在安装...');
  try {
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('   ✓ 依赖安装完成');
  } catch (error) {
    console.error('   ❌ 依赖安装失败');
    process.exit(1);
  }
} else {
  console.log('   ✓ 依赖已安装');
}

// 步骤 3: 清理旧的构建
console.log('\n🧹 步骤 3: 清理旧的构建...');
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('   ✓ 已清理 dist 目录');
} else {
  console.log('   ✓ dist 目录不存在，跳过清理');
}

// 步骤 4: 构建项目
console.log('\n🔨 步骤 4: 构建项目...');
try {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  console.log('   ✓ 构建完成');
} catch (error) {
  console.error('   ❌ 构建失败');
  process.exit(1);
}

// 步骤 5: 验证构建产物
console.log('\n✅ 步骤 5: 验证构建产物...');
const requiredFiles = [
  'dist/index.html',
  'dist/functions/_middleware.js',
  'dist/functions/api/[[path]].js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.error(`   ❌ ${file} 不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ 构建产物验证失败，请检查构建过程');
  process.exit(1);
}

// 步骤 6: 检查 Wrangler
console.log('\n🔍 步骤 6: 检查 Wrangler CLI...');
try {
  execSync('wrangler --version', { encoding: 'utf-8' });
  console.log('   ✓ Wrangler 已安装');
} catch (error) {
  console.log('   ⚠️  Wrangler 未安装');
  console.log('   正在安装 Wrangler...');
  try {
    execSync('npm install -g wrangler', { stdio: 'inherit' });
    console.log('   ✓ Wrangler 安装完成');
  } catch (error) {
    console.error('   ❌ Wrangler 安装失败');
    console.log('\n💡 提示: 您可以手动安装 Wrangler: npm install -g wrangler');
    console.log('   或者通过 Cloudflare Dashboard 进行部署');
    process.exit(1);
  }
}

// 步骤 7: 提示部署选项
console.log('\n📋 步骤 7: 部署选项');
console.log('\n请选择部署方式:');
console.log('1. 使用 Wrangler CLI 部署（需要项目名称）');
console.log('2. 通过 Cloudflare Dashboard 手动部署');
console.log('\n如果选择方式 1，请运行:');
console.log('   wrangler pages deploy dist --project-name=YOUR_PROJECT_NAME');
console.log('\n如果选择方式 2，请:');
console.log('   1. 访问 https://dash.cloudflare.com/');
console.log('   2. 进入 Pages 项目');
console.log('   3. 上传 dist 目录或连接 Git 仓库');

console.log('\n✨ 构建完成！dist 目录已准备好部署。');

