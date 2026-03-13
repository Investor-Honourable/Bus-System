const fs = require('fs');
const path = require('path');

function convertToJS(content) {
  let js = content;
  
  // Remove type-only imports and imports with 'type' keyword
  // Handle: import type { ... } from "..."
  js = js.replace(/import\s+type\s+{[^}]+}\s+from\s+["'][^"']+["'];?\n?/g, '');
  
  // Handle: import { ..., type X } from "..."
  js = js.replace(/import\s+\{\s*([^}]+),\s*type\s+(\w+)\s*\}\s+from/g, 'import { $1 } from');
  
  // Handle: import { type X, ... } from "..."
  js = js.replace(/import\s+\{\s*type\s+\w+\s*,?\s*([^}]*)\}\s+from/g, (match, rest) => {
    const cleaned = rest.split(',').filter(s => s.trim()).join(', ');
    return cleaned ? `import { ${cleaned} } from` : 'import { } from';
  });
  
  // Handle: import A, { type B } from "..."
  js = js.replace(/import\s+(\w+),\s*\{[^}]*type[^}]*\}\s+from/g, 'import $1 from');
  
  // Remove generic type parameters from React hooks
  js = js.replace(/useState<[^>]+>/g, 'useState');
  js = js.replace(/useEffect<[^>]+>/g, 'useEffect');
  js = js.replace(/useCallback<[^>]+>/g, 'useCallback');
  js = js.replace(/useMemo<[^>]+>/g, 'useMemo');
  js = js.replace(/useRef<[^>]+>/g, 'useRef');
  js = js.replace(/useContext<[^>]+>/g, 'useContext');
  js = js.replace(/useReducer<[^>]+>/g, 'useReducer');
  
  // Remove type annotations from function parameters
  // These patterns need to be handled carefully to avoid breaking code
  const typePatterns = [
    [/:\s*string\b/g, ''],
    [/:\s*number\b/g, ''],
    [/:\s*boolean\b/g, ''],
    [/:\s*any\b/g, ''],
    [/:\s*void\b/g, ''],
    [/:\s*null\b/g, ''],
    [/:\s*undefined\b/g, ''],
    [/:\s*never\b/g, ''],
    [/:\s*unknown\b/g, ''],
    [/:\s*React\.FormEvent\b/g, ''],
    [/:\s*React\.MouseEvent\b/g, ''],
    [/:\s*React\.KeyboardEvent\b/g, ''],
    [/:\s*React\.FocusEvent\b/g, ''],
    [/:\s*React\.ChangeEvent<[^>]+>/g, ''],
    [/:\s*React\.ComponentProps<[^>]+>/g, ''],
    [/:\s*React\.FC<[^>]+>/g, ''],
    [/:\s*React\.ElementType<[^>]+>/g, ''],
    [/:\s*Record<string,\s*string>/g, ''],
    [/:\s*Record<[^>]+>/g, ''],
    [/:\s*\(\)=>.*$/gm, ''],
    [/:\s*\w+\[\]/g, ''],
    [/:\s*\{[^}]*\}/g, ''],
    [/:\s*Promise<[^>]+>/g, ''],
  ];
  
  for (const [pattern, replacement] of typePatterns) {
    js = js.replace(pattern, replacement);
  }
  
  // Fix broken type annotations that might leave behind just >
  js = js.replace(/useState\s*>\s*\(/g, 'useState(');
  js = js.replace(/useState>\s*\(/g, 'useState(');
  
  // Remove return type annotations
  js = js.replace(/\):\s*void\s*\{/g, ') {');
  js = js.replace(/\):\s*\w+\s*\{/g, ') {');
  js = js.replace(/\):\s*\w+\s*$/gm, '');
  
  // Remove type assertions (non-null assertion)
  js = js.replace(/!\./g, '.');
  
  // Remove 'as' type assertions more carefully
  js = js.replace(/\s+as\s+\w+(\[\])?/g, '');
  
  // Remove generic type parameters from function calls that might have slipped through
  js = js.replace(/<string>/g, '');
  js = js.replace(/<number>/g, '');
  js = js.replace(/<boolean>/g, '');
  js = js.replace(/<any>/g, '');
  js = js.replace(/<never>/g, '');
  js = js.replace(/<void>/g, '');
  js = js.replace(/<[^>]+>\(/g, '(');
  
  // Remove interface declarations
  js = js.replace(/interface\s+\w+\s*(<[^>]+>)?\s*\{[^}]*\}/gs, '');
  js = js.replace(/interface\s+\w+\s*extends\s+[^\{]+\{/gs, '');
  
  // Remove type declarations
  js = js.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
  js = js.replace(/type\s+\w+\s*=\s*\{[^}]*\};?/gs, '');
  
  // Remove React.FC and similar
  js = js.replace(/React\.FC<[^>]+>/g, '');
  js = js.replace(/React\.Component<[^>]+>/g, '');
  
  // Remove optional properties in destructuring (e.g., asChild?)
  js = js.replace(/(\w+)\?:\s*[^,}\n]+/g, '$1');
  
  // Remove any leftover type annotations with colon that might be in variable declarations
  js = js.replace(/const\s+\w+:\s*[^=]+=/g, 'const ');
  js = js.replace(/let\s+\w+:\s*[^=]+=/g, 'let ');
  js = js.replace(/var\s+\w+:\s*[^=]+=/g, 'var ');
  
  // Fix any double semicolons or weird punctuation
  js = js.replace(/;;/g, ';');
  
  // Clean up empty lines from removed code
  js = js.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return js;
}

function fixImports(content, filePath) {
  let js = content;
  
  // Fix relative imports to use proper extensions
  // For ./components/ui/ imports
  js = js.replace(/from\s+['"](\.\.?\/components\/ui\/[^'"]+)['"]/g, 'from "$1.jsx"');
  
  // For ./pages/ imports  
  js = js.replace(/from\s+['"](\.\.?\/pages\/[^'"]+)['"]/g, 'from "$1.jsx"');
  
  // For ./components/ imports
  js = js.replace(/from\s+['"](\.\.?\/components\/[^'"]+)['"]/g, 'from "$1.jsx"');
  
  // For any relative TSX imports that were missed
  js = js.replace(/from\s+['"](\.\.?\/[^'"]+)\.tsx['"]/g, 'from "$1.jsx"');
  js = js.replace(/from\s+['"](\.\.?\/[^'"]+)\.ts['"]/g, 'from "$1.js"');
  
  // Handle case where it might already have .jsx and we added another
  js = js.replace(/\.jsx\.jsx/g, '.jsx');
  js = js.replace(/\.js\.js/g, '.js');
  
  return js;
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, and other non-source directories
      if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
        processDir(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Determine new extension
      const newExt = file.endsWith('.tsx') ? '.jsx' : '.js';
      const newFileName = file.replace(/\.tsx?$/, newExt);
      const newFilePath = path.join(dir, newFileName);
      
      // Skip main.tsx and certain config files
      if (file === 'main.tsx' || file === 'vite.config.ts') {
        console.log('Skipping:', filePath);
        continue;
      }
      
      console.log('Processing:', filePath);
      
      const content = fs.readFileSync(filePath, 'utf8');
      let converted = convertToJS(content);
      converted = fixImports(converted, newFilePath);
      
      fs.writeFileSync(newFilePath, converted);
      console.log('Created:', newFilePath);
    }
  }
}

// Start conversion from src directory
console.log('Starting conversion...');
processDir('src');
console.log('Done!');
