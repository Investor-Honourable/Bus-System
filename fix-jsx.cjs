const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix import * from to import * as React from
  if (content.includes('import * from "react"')) {
    content = content.replace(/import \* from "react"/g, 'import * as React from "react"');
    modified = true;
  }
  
  // Fix import * from packages to import * as Name from
  // Handle: import * from "@radix-ui/react-xxx"
  content = content.replace(/import \* from "@radix-ui\/react-(\w+)"/g, (match, name) => {
    // Convert to PascalCase for the import name
    const parts = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1));
    const importName = parts.join('') + 'Primitive';
    return `import * as ${importName} from "@radix-ui/react-${name}"`;
  });
  if (content.includes('import * from "@radix-ui')) modified = true;
  
  // Fix utils imports to add .js extension
  content = content.replace(/from "\.\/utils"/g, 'from "./utils.js"');
  content = content.replace(/from "\.\.\/utils"/g, 'from "../utils.js"');
  modified = modified || content.includes('from "./utils.js"');
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.jsx')) {
      fixFile(filePath);
    }
  }
}

processDir(path.join(__dirname, 'src', 'app', 'components', 'ui'));
console.log('Done fixing UI components!');
