const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

// 1. Move utils to src/core/utils
const oldUtils = path.join(root, 'utils');
const newUtils = path.join(root, 'src', 'core', 'utils');

if (fs.existsSync(oldUtils)) {
  fs.mkdirSync(newUtils, { recursive: true });
  const files = fs.readdirSync(oldUtils);
  files.forEach(f => {
    fs.renameSync(path.join(oldUtils, f), path.join(newUtils, f));
  });
  fs.rmdirSync(oldUtils);
  console.log('Moved utils to src/core/utils');
}

// 2. Scan all files for broken imports and fix them
function fixImports(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === 'android' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Fix imports to components/
      content = content.replace(/['"](\.\.\/)*components\/([^'"]+)['"]/g, (match, up, rest) => {
        return `'@/src/core/ui/${rest}'`; // simplistic, might need adjustment but mostly ui
      });
      content = content.replace(/['"]@\/components\/([^'"]+)['"]/g, `'@/src/core/ui/$1'`);

      // Fix imports to constants/
      content = content.replace(/['"](\.\.\/)*constants\/api['"]/g, `'@/src/core/api/api'`);
      content = content.replace(/['"](\.\.\/)*constants\/api-cache['"]/g, `'@/src/core/api/api-cache'`);
      content = content.replace(/['"](\.\.\/)*constants\/theme['"]/g, `'@/src/core/theme/theme'`);
      content = content.replace(/['"](\.\.\/)*constants\/auth['"]/g, `'@/src/core/auth/auth'`);
      content = content.replace(/['"]@\/constants\/([^'"]+)['"]/g, `'@/src/core/api/$1'`);

      // Fix imports to hooks/
      content = content.replace(/['"](\.\.\/)*hooks\/([^'"]+)['"]/g, `'@/src/core/hooks/$2'`);
      content = content.replace(/['"]@\/hooks\/([^'"]+)['"]/g, `'@/src/core/hooks/$1'`);

      // Fix imports to utils/
      content = content.replace(/['"](\.\.\/)*utils\/([^'"]+)['"]/g, `'@/src/core/utils/$2'`);
      content = content.replace(/['"]@\/utils\/([^'"]+)['"]/g, `'@/src/core/utils/$1'`);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImports(path.join(root, 'app'));
fixImports(src);

// The problem reported: "Unable to resolve "../constants/api" from "utils\background-location.ts""
// Now it's in src/core/utils/background-location.ts. Let's fix that specifically in case the regex missed it.
const bgLocPath = path.join(newUtils, 'background-location.ts');
if (fs.existsSync(bgLocPath)) {
    let content = fs.readFileSync(bgLocPath, 'utf8');
    content = content.replace(/['"]\.\.\/constants\/api['"]/g, "'@/src/core/api/api'");
    fs.writeFileSync(bgLocPath, content, 'utf8');
    console.log(`Double checked background-location.ts`);
}

// Also check that all imports in `src/` use `@/src/` or correct relative paths. The easiest robust way in Expo is using the `@/` alias.
