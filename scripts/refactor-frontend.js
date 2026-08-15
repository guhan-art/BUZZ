const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

const dirs = [
  'src/core/api',
  'src/core/theme',
  'src/core/ui',
  'src/core/auth',
  'src/features/admin/components',
  'src/features/bus-tracking/components',
];

dirs.forEach(d => fs.mkdirSync(path.join(root, d), { recursive: true }));

const moves = [
  // UI Components
  { from: 'components/ui', to: 'src/core/ui/components' },
  { from: 'components/admin', to: 'src/features/admin/components/ui' },
  { from: 'components/hello-wave.tsx', to: 'src/core/ui/hello-wave.tsx' },
  { from: 'components/parallax-scroll-view.tsx', to: 'src/core/ui/parallax-scroll-view.tsx' },
  { from: 'components/external-link.tsx', to: 'src/core/ui/external-link.tsx' },
  { from: 'components/haptic-tab.tsx', to: 'src/core/ui/haptic-tab.tsx' },
  { from: 'components/pwa-install-banner.tsx', to: 'src/core/ui/pwa-install-banner.tsx' },
  { from: 'components/themed-text.tsx', to: 'src/core/ui/themed-text.tsx' },
  { from: 'components/themed-view.tsx', to: 'src/core/ui/themed-view.tsx' },
  
  // Map Components
  { from: 'components/map-view.native.tsx', to: 'src/features/bus-tracking/components/map-view.native.tsx' },
  { from: 'components/map-view.web.tsx', to: 'src/features/bus-tracking/components/map-view.web.tsx' },
  { from: 'components/map-view.tsx', to: 'src/features/bus-tracking/components/map-view.tsx' }, 

  // Constants
  { from: 'constants/api.ts', to: 'src/core/api/api.ts' },
  { from: 'constants/api-cache.ts', to: 'src/core/api/api-cache.ts' },
  { from: 'constants/theme.ts', to: 'src/core/theme/theme.ts' },
  { from: 'constants/auth.ts', to: 'src/core/auth/auth.ts' },
];

moves.forEach(m => {
  const fromPath = path.join(root, m.from);
  const toPath = path.join(root, m.to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Moved ${m.from} to ${m.to}`);
  } else {
    console.log(`Skipped ${m.from} (not found)`);
  }
});

// Clean up old directories if empty
try { fs.rmdirSync(path.join(root, 'components')); } catch (e) {}
try { fs.rmdirSync(path.join(root, 'constants')); } catch (e) {}

// Now we need to update imports in all .ts, .tsx files in app/ and src/
function replaceInFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Update imports with a robust replace
      content = content.replace(/['"](\.\.\/)*components\/ui(.*?)['"]/g, "'@/src/core/ui/components$2'");
      content = content.replace(/['"](\.\.\/)*components\/admin(.*?)['"]/g, "'@/src/features/admin/components/ui$2'");
      content = content.replace(/['"](\.\.\/)*components\/map-view(.*?)['"]/g, "'@/src/features/bus-tracking/components/map-view$2'");
      
      content = content.replace(/['"](\.\.\/)*constants\/api(.*?)['"]/g, "'@/src/core/api/api$2'");
      content = content.replace(/['"](\.\.\/)*constants\/api-cache(.*?)['"]/g, "'@/src/core/api/api-cache$2'");
      content = content.replace(/['"](\.\.\/)*constants\/theme(.*?)['"]/g, "'@/src/core/theme/theme$2'");
      content = content.replace(/['"](\.\.\/)*constants\/auth(.*?)['"]/g, "'@/src/core/auth/auth$2'");

      const uiComponents = ['hello-wave', 'parallax-scroll-view', 'external-link', 'haptic-tab', 'pwa-install-banner', 'themed-text', 'themed-view'];
      uiComponents.forEach(comp => {
        const regex = new RegExp(`['"](\\.\\.\\/)*components\\/${comp}['"]`, 'g');
        content = content.replace(regex, `'@/src/core/ui/${comp}'`);
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

replaceInFiles(path.join(root, 'app'));
replaceInFiles(src);
