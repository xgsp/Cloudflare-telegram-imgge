// 构建脚本 - 将 index.html 复制到 public/ 目录
const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, 'index.html');
const publicDir = path.join(__dirname, '..', 'public');
const destHtml = path.join(publicDir, 'index.html');

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(srcHtml, destHtml);

console.log('✅ 构建完成: public/index.html');
