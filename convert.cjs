const fs = require('fs');
const path = require('path');

function convertTsxToJsx(content) {
  let js = content;
  
  // Remove type annotations in useState<>
  js = js.replace(/useState<[^>]+>/g, 'useState');
  
  // Remove type annotations in function parameters
  js = js.replace(/: React\.FormEvent/g, '');
  js = js.replace(/: React\.ChangeEvent<HTMLInputElement>/g, '');
  js = js.replace(/: Record<string, string>/g, '');
  js = js.replace(/: string/g, '');
  js = js.replace(/: boolean/g, '');
  js = js.replace(/: any/g, '');
  js = js.replace(/: number/g, '');
  js = js.replace(/: \[\]/g, '');
  js = js.replace(/: \{\}/g, '');
  js = js.replace(/: \w+/g, '');
  
  // Remove 'as' type assertions
  js = js.replace(/ as \w+/g, '');
  
  // Remove interface declarations
  js = js.replace(/interface \w+ \{[^}]*\}/gs, '');
  
  // Remove type declarations
  js = js.replace(/type \w+ = /g, '');
  
  // Remove React.FC references
  js = js.replace(/React\.FC<[^>]+>/g, '');
  
  return js;
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.tsx')) {
      const jsxFile = file.replace('.tsx', '.jsx');
      const jsxPath = path.join(dir, jsxFile);
      
      console.log('Processing:', filePath);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const converted = convertTsxToJsx(content);
      
      // Update imports
      let updated = converted
        .replace(/from '\.\.\/components\/ui\/(\w+)'/g, "from './components/ui/$1'")
        .replace(/from '\.\.\/(\w+)'/g, "from './$1'")
        .replace(/from '\.\.\/\.\.\/components\/ui\/(\w+)'/g, "from '../../components/ui/$1'")
        .replace(/from '\.\/(\w+)'/g, "from './$1.jsx'")
        .replace(/from "(\.\/[^"]+)"/g, (match, p1) => {
          if (!p1.endsWith('.jsx')) {
            return p1 + '.jsx"';
          }
          return match;
        });
      
      fs.writeFileSync(jsxPath, updated);
      console.log('Created:', jsxPath);
    }
  }
}

// Process src/app directory
processDir('src/app');
console.log('Done!');
