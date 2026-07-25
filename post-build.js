import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const sourceFile = path.join(distPath, 'inscricoes.html');

if (fs.existsSync(sourceFile)) {
  const content = fs.readFileSync(sourceFile, 'utf8');

  // Adjust relative paths for files placed in sub-folders (one level deeper)
  const adjustedContent = content
    .replace(/(href|src)="\.\/assets\//g, '$1="../assets/')
    .replace(/(href|src)="assets\//g, '$1="../assets/')
    .replace(/(href|src)="\.\/favicon\.png"/g, '$1="../favicon.png"');

  const targets = [
    path.join(distPath, 'inscricoes', 'index.html'),
    path.join(distPath, 'Inscricoes', 'index.html'),
    path.join(distPath, 'Inscrições', 'index.html'),
  ];

  targets.forEach((target) => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, adjustedContent);
    console.log(`Copied and adjusted inscricoes.html to ${target}`);
  });
} else {
  console.warn('Warning: dist/inscricoes.html not found, skipping replication.');
}

// Replicate main index.html for route sub-folders (artes, comunidade, missoes)
const mainIndexFile = path.join(distPath, 'index.html');
if (fs.existsSync(mainIndexFile)) {
  const mainContent = fs.readFileSync(mainIndexFile, 'utf8');
  const adjustedMain = mainContent
    .replace(/(href|src)="\.\/assets\//g, '$1="../assets/')
    .replace(/(href|src)="assets\//g, '$1="../assets/')
    .replace(/(href|src)="\.\/favicon\.png"/g, '$1="../favicon.png"');

  const mainTargets = [
    path.join(distPath, 'artes', 'index.html'),
    path.join(distPath, 'Artes', 'index.html'),
    path.join(distPath, 'comunidade', 'index.html'),
    path.join(distPath, 'missoes', 'index.html'),
  ];

  mainTargets.forEach((target) => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, adjustedMain);
    console.log(`Copied and adjusted index.html to ${target}`);
  });
}

