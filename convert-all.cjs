const fs = require('fs');
const path = require('path');

function convertToJS(content) {
  let js = content;
  
  // Remove type-only imports
  js = js.replace(/import type\s+{[^}]+}\s+from\s+["'][^"']+["'];?\n?/g, '');
  
  // Remove 'type' keyword from imports
  js = js.replace(/import\s+\{\s*([^}]+),\s*type\s+(\w+)\s*\}\s+from/g, 'import { $1, $2 } from');
  js = js.replace(/import\s+\{[^}]+,\s*type\s+\w+\s*\}/g, (match) => {
    return match.replace(/,\s*type\s+\w+/g, '');
  });
  
  // Remove generic type parameters from useState, useEffect, etc.
  js = js.replace(/useState<[^>]+>/g, 'useState');
  js = js.replace(/useEffect<[^>]+>/g, 'useEffect');
  js = js.replace(/useCallback<[^>]+>/g, 'useCallback');
  js = js.replace(/useMemo<[^>]+>/g, 'useMemo');
  js = js.replace(/useRef<[^>]+>/g, 'useRef');
  js = js.replace(/useContext<[^>]+>/g, 'useContext');
  
  // Remove type annotations from function parameters
  js = js.replace(/: string/g, '');
  js = js.replace(/: number/g, '');
  js = js.replace(/: boolean/g, '');
  js = js.replace(/: any/g, '');
  js = js.replace(/: void/g, '');
  js = js.replace(/: null/g, '');
  js = js.replace(/: undefined/g, '');
  js = js.replace(/: \[\]/g, '');
  js = js.replace(/: \{\}/g, '');
  js = js.replace(/: React\.FormEvent/g, '');
  js = js.replace(/: React\.ChangeEvent<[^>]+>/g, '');
  js = js.replace(/: React\.ComponentProps<[^>]+>/g, '');
  js = js.replace(/: React\.FC<[^>]+>/g, '');
  js = js.replace(/: \(\)=>.*$/gm, '');
  js = js.replace(/: \w+\[\]/g, '');
  
  // Remove return type annotations
  js = js.replace(/\): void /g, ') ');
  js = js.replace(/\): \w+ /g, ') ');
  
  // Remove type assertions (non-null assertion)
  js = js.replace(/!\./g, '.');
  
  // Remove 'as' type assertions
  js = js.replace(/\s+as\s+\w+/g, '');
  
  // Remove generic type parameters from function calls
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
  
  // Remove React.FC and similar
  js = js.replace(/React\.FC<[^>]+>/g, '');
  js = js.replace(/React\.Component<[^>]+>/g, '');
  
  // Clean up empty lines from removed code
  js = js.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return js;
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git') {
        processDir(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Determine new extension
      const newExt = file.endsWith('.tsx') ? '.jsx' : '.js';
      const newFileName = file.replace(/\.tsx?$/, newExt);
      const newFilePath = path.join(dir, newFileName);
      
      console.log('Processing:', filePath);
      
      const content = fs.readFileSync(filePath, 'utf8');
      let converted = convertToJS(content);
      
      // Update imports to use .jsx/.js extensions
      // Handle different import patterns
      
      // Relative imports with ./ or ../
      converted = converted.replace(/from\s+['"](\.\.?\/[^'"]+)\.tsx['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\.?\/[^'"]+)\.ts['"]/g, 'from "$1.js"');
      converted = converted.replace(/from\s+['"](\.\.?\/[^'"]+)\.ts\.x['"]/g, 'from "$1"');
      
      // Make sure .tsx imports become .jsx
      converted = converted.replace(/from\s+['"](\.\/[^'"]+)\.tsx['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\.\/[^'"]+)\.tsx['"]/g, 'from "$1.jsx"');
      
      // Make sure .ts imports become .js
      converted = converted.replace(/from\s+['"](\.\/[^'"]+)\.ts['"]/g, 'from "$1.js"');
      converted = converted.replace(/from\s+['"](\.\.\/[^'"]+)\.ts['"]/g, 'from "$1.js"');
      
      // Also handle imports without extension that might need .jsx
      // For component imports (starting with uppercase or in components/ui/)
      converted = converted.replace(/from\s+['"](\.\/components\/ui\/[^'"]+)['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\/pages\/[^'"]+)['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\/components\/[^'"]+)['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\.\/components\/ui\/[^'"]+)['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\.\/pages\/[^'"]+)['"]/g, 'from "$1.jsx"');
      converted = converted.replace(/from\s+['"](\.\.\/components\/[^'"]+)['"]/g, 'from "$1.jsx"');
      
      fs.writeFileSync(newFilePath, converted);
      console.log('Created:', newFilePath);
    }
  }
}

// Start conversion from src directory
processDir('src');
console.log('Done!');
