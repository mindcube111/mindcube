import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const PROJECT_NAME = 'psychological-assessment-platform';

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问用户输入
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 打印带颜色的输出
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  log(`\n${step}/${total}: ${message}`, 'yellow');
}

console.log('');
log('╔══════════════════════════════════════════════════════════╗', 'cyan');
log('║     MIND CUBE 心理测评管理平台 - 一键部署脚本          ║', 'cyan');
log('╚══════════════════════════════════════════════════════════╝', 'cyan');
console.log('');

// 步骤 1: 检查 Node.js 版本
logStep('步骤 1', '7', '检查环境...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  log(`   ✓ Node.js 版本: ${nodeVersion}`, 'green');
  
  // 检查 Node.js 版本是否 >= 16
  const versionNumber = parseInt(nodeVersion.replace(/v(\d+)\..*/, '$1'));
  if (versionNumber < 16) {
    log('   ⚠️  警告: 推荐使用 Node.js 16 或更高版本', 'yellow');
  }
} catch (error) {
  log('   ❌ 无法检测 Node.js 版本', 'red');
  log('   下载地址: https://nodejs.org/', 'yellow');
  process.exit(1);
}

// 步骤 2: 检查依赖
logStep('步骤 2', '7', '检查依赖...');
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  log('   ⚠️  依赖未安装，正在安装...', 'yellow');
  try {
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    log('   ✓ 依赖安装完成', 'green');
  } catch (error) {
    log('   ❌ 依赖安装失败', 'red');
    process.exit(1);
  }
} else {
  log('   ✓ 依赖已安装', 'green');
}

// 步骤 3: 清理旧的构建
logStep('步骤 3', '7', '清理旧的构建...');
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  log('   ✓ 已清理 dist 目录', 'green');
} else {
  log('   ✓ dist 目录不存在，跳过清理', 'green');
}

// 步骤 4: 构建项目
logStep('步骤 4', '7', '构建项目...');
log('   正在运行: npm run build', 'gray');
try {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  log('   ✓ 构建完成', 'green');
} catch (error) {
  log('   ❌ 构建失败，请检查错误信息', 'red');
  process.exit(1);
}

// 步骤 5: 验证构建产物
logStep('步骤 5', '7', '验证构建产物...');
const requiredFiles = [
  'dist/index.html',
  'dist/functions/_middleware.js',
  'dist/functions/api/[[path]].js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    log(`   ✓ ${file}`, 'green');
  } else {
    log(`   ❌ ${file} 不存在`, 'red');
    allFilesExist = false;
  }
}

// 检查 assets 目录
const assetsPath = path.join(projectRoot, 'dist/assets');
if (fs.existsSync(assetsPath)) {
  const assetFiles = fs.readdirSync(assetsPath).filter(f => 
    fs.statSync(path.join(assetsPath, f)).isFile()
  );
  log(`   ✓ dist/assets/ (${assetFiles.length} 个文件)`, 'green');
} else {
  log('   ⚠️  dist/assets/ 目录不存在', 'yellow');
}

if (!allFilesExist) {
  log('\n❌ 构建产物验证失败，请检查构建过程', 'red');
  process.exit(1);
}

// 步骤 6: 检查 Wrangler
logStep('步骤 6', '7', '检查 Wrangler CLI...');
let wranglerInstalled = false;
try {
  execSync('wrangler --version', { encoding: 'utf-8', stdio: 'pipe' });
  const wranglerVersion = execSync('wrangler --version', { encoding: 'utf-8' }).trim();
  log(`   ✓ Wrangler 已安装: ${wranglerVersion}`, 'green');
  wranglerInstalled = true;
} catch (error) {
  wranglerInstalled = false;
}

if (!wranglerInstalled) {
  log('   ⚠️  Wrangler 未安装', 'yellow');
  const installWrangler = await question('\n   是否现在安装 Wrangler? (Y/N): ');
  if (installWrangler.toLowerCase() === 'y') {
    log('   正在安装 Wrangler...', 'yellow');
    try {
      execSync('npm install -g wrangler', { stdio: 'inherit' });
      log('   ✓ Wrangler 安装完成', 'green');
      wranglerInstalled = true;
    } catch (error) {
      log('   ❌ Wrangler 安装失败', 'red');
    }
  }
}

// 步骤 7: 部署选项
logStep('步骤 7', '7', '部署选项');
console.log('');

if (wranglerInstalled) {
  log('请选择部署方式:', 'cyan');
  log('1. 使用 Wrangler CLI 自动部署（推荐）', 'white');
  log('2. 通过 Cloudflare Dashboard 手动部署', 'white');
  log('3. 仅构建，稍后手动部署', 'white');
  console.log('');
  
  const choice = await question('请输入选项 (1/2/3): ');
  
  switch (choice) {
    case '1':
      console.log('');
      log('🚀 开始部署到 Cloudflare Pages...', 'cyan');
      log(`   项目名称: ${PROJECT_NAME}`, 'gray');
      
      // 检查是否已登录
      try {
        execSync('wrangler whoami', { stdio: 'pipe' });
      } catch (error) {
        log('\n   ⚠️  需要先登录 Cloudflare', 'yellow');
        log('   正在打开登录页面...', 'yellow');
        execSync('wrangler login', { stdio: 'inherit' });
      }
      
      console.log('');
      log('   正在部署...', 'yellow');
      try {
        execSync(`wrangler pages deploy dist --project-name=${PROJECT_NAME}`, {
          cwd: projectRoot,
          stdio: 'inherit'
        });
        
        console.log('');
        log('╔══════════════════════════════════════════════════════════╗', 'green');
        log('║            ✅ 部署成功！                                 ║', 'green');
        log('╚══════════════════════════════════════════════════════════╝', 'green');
        console.log('');
        log(`   网站地址: https://${PROJECT_NAME}.pages.dev`, 'cyan');
        log(`   API 测试: https://${PROJECT_NAME}.pages.dev/api/questionnaires/available`, 'cyan');
      } catch (error) {
        log('\n   ❌ 部署失败，请检查错误信息', 'red');
      }
      break;
      
    case '2':
      console.log('');
      log('📋 手动部署步骤:', 'cyan');
      log('   1. 访问 https://dash.cloudflare.com/', 'white');
      log('   2. 进入 Pages > Create a project', 'white');
      log('   3. 选择 \'Upload assets\'', 'white');
      log('   4. 上传 dist 目录', 'white');
      console.log('');
      log(`   ✓ dist 目录已准备好，位于: ${distPath}`, 'green');
      break;
      
    case '3':
      console.log('');
      log('✓ 构建完成，dist 目录已准备好部署', 'green');
      log(`   dist 目录位置: ${distPath}`, 'gray');
      break;
      
    default:
      console.log('');
      log('⚠️  无效选项，构建完成但未部署', 'yellow');
      log(`   dist 目录位置: ${distPath}`, 'gray');
  }
} else {
  log('⚠️  Wrangler 未安装，无法使用 CLI 部署', 'yellow');
  console.log('');
  log('请选择部署方式:', 'cyan');
  log('1. 通过 Cloudflare Dashboard 手动部署（推荐）', 'white');
  log('2. 安装 Wrangler 后使用 CLI 部署', 'white');
  console.log('');
  log('如果选择方式 1，请:', 'cyan');
  log('   1. 访问 https://dash.cloudflare.com/', 'white');
  log('   2. 进入 Pages > Create a project', 'white');
  log('   3. 选择 \'Upload assets\'', 'white');
  log('   4. 上传 dist 目录', 'white');
  console.log('');
  log('如果选择方式 2，请运行:', 'cyan');
  log('   npm install -g wrangler', 'white');
  log('   wrangler login', 'white');
  log(`   wrangler pages deploy dist --project-name=${PROJECT_NAME}`, 'white');
  console.log('');
  log(`✓ dist 目录已准备好，位于: ${distPath}`, 'green');
}

console.log('');
log('═══════════════════════════════════════════════════════════', 'gray');
console.log('');

rl.close();
