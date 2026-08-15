const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'backend');
const src = path.join(root, 'src');

const dirs = [
  'src/config',
  'src/middleware',
  'src/services',
  'src/domains/admin',
  'src/domains/driver',
  'src/domains/traveller',
  'src/domains/bus',
];

dirs.forEach(d => fs.mkdirSync(path.join(root, d), { recursive: true }));

// Move files
const moves = [
  { from: 'server.js', to: 'src/server.js' },
  { from: 'middleware/auth.js', to: 'src/middleware/auth.middleware.js' }
];

moves.forEach(m => {
  const fromPath = path.join(root, m.from);
  const toPath = path.join(root, m.to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Moved ${m.from} to ${m.to}`);
  }
});

// Clean up old directories if empty
try { fs.rmdirSync(path.join(root, 'middleware')); } catch (e) {}

// Update package.json scripts
const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.scripts && pkg.scripts.start) {
    pkg.scripts.start = pkg.scripts.start.replace('node server.js', 'node src/server.js');
    pkg.scripts.dev = pkg.scripts.dev ? pkg.scripts.dev.replace('nodemon server.js', 'nodemon src/server.js') : 'nodemon src/server.js';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('Updated package.json');
  }
}

// Update imports in server.js
const serverJsPath = path.join(root, 'src/server.js');
if (fs.existsSync(serverJsPath)) {
  let content = fs.readFileSync(serverJsPath, 'utf8');
  content = content.replace(/['"]\.\/middleware\/auth(\.js)?['"]/g, "'./middleware/auth.middleware.js'");
  fs.writeFileSync(serverJsPath, content, 'utf8');
  console.log('Updated imports in server.js');
}
