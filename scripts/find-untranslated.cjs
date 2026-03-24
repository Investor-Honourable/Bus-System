/**
 * Script to find hardcoded strings in JSX files that need translation
 * Run with: node scripts/find-untranslated.cjs
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const dirsToScan = [
  'src/app/pages',
  'src/app/components'
];

// Patterns that indicate hardcoded text that needs translation
// Excludes: translation keys (t('xxx')), existing variables, URLs, etc.
const hardcodedPatterns = [
  /<\w+[^>]*>\s*([A-Z][a-zA-Z\s]{4,})/g,  // Text in JSX tags
  /placeholder=\{?"([^"]{3,})"?\}/g, // placeholders
  /title=\{?"([^"]{3,})"?\}/g, // title attributes
  /alt=\{?"([^"]{3,})"?\}/g, // alt attributes
  /aria-label=\{?"([^"]{3,})"?\}/g, // aria-labels
];

// Files to skip
const skipFiles = [
  'node_modules',
  '.json',
  '.css',
  '.png',
  '.jpg',
  '.svg'
];

function scanDirectory(dir, results = {}) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (!skipFiles.includes(file) && !file.includes('node_modules')) {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      // Scan JSX/JS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find all hardcoded strings
      // Look for strings that are NOT using translation function
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip if already using translation
        if (line.includes('t(') || line.includes('useTranslation')) {
          return;
        }
        
        // Find string literals
        const matches = line.match(/>\s*([A-Z][a-zA-Z\s]{3,})\s*</g);
        if (matches) {
          matches.forEach(match => {
            const cleanText = match.replace(/[><]/g, '').trim();
            if (cleanText.length > 3 && !cleanText.includes('$') && !cleanText.includes('{')) {
              if (!results[filePath]) {
                results[filePath] = [];
              }
              results[filePath].push({
                line: index + 1,
                text: cleanText
              });
            }
          });
        }
        
        // Find placeholder, title, alt attributes
        const attrMatches = line.match(/(placeholder|title|alt|aria-label)=\{?"([^"]{3,})"?\}/g);
        if (attrMatches) {
          attrMatches.forEach(match => {
            const textMatch = match.match(/=\{\?"([^"]+)"\}/);
            if (textMatch && textMatch[1] && !results[filePath]) {
              results[filePath] = [];
              results[filePath].push({
                line: index + 1,
                text: textMatch[1],
                type: 'attribute'
              });
            }
          });
        }
      });
    }
  }
  
  return results;
}

console.log('Scanning for hardcoded strings...\n');

const results = {};
dirsToScan.forEach(dir => {
  Object.assign(results, scanDirectory(dir));
});

// Output results
console.log('=== Hardcoded strings found (needs translation) ===\n');

const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
console.log(`Total files with hardcoded text: ${Object.keys(results).length}`);
console.log(`Total hardcoded strings: ${total}\n`);

Object.entries(results).forEach(([file, items]) => {
  if (items.length > 0) {
    console.log(`\n📄 ${file}`);
    items.forEach(item => {
      console.log(`   Line ${item.line}: "${item.text}"`);
    });
  }
});

console.log('\n=== Summary ===');
console.log('To fix these, add translation keys to:');
console.log('  - src/app/i18n/translations/en.json');
console.log('  - src/app/i18n/translations/fr.json');
console.log('  - src/app/i18n/translations/es.json');
console.log('\nThen update components to use:');
console.log('  const { t } = useTranslation();');
console.log('  <Text>{t(\'key.here\')}</Text>');
