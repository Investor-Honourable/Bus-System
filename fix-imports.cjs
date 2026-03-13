const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix import * from radix-ui packages - handle multi-word packages
  content = content.replace(/import \* from "@radix-ui\/react-([a-z]+)"/g, (match, name) => {
    // Convert to PascalCase
    const importName = name.charAt(0).toUpperCase() + name.slice(1) + 'Primitive';
    return `import * as ${importName} from "@radix-ui/react-${name}"`;
  });
  
  // Also handle react-xxx-yyy patterns
  content = content.replace(/import \* from "@radix-ui\/react-([a-z]+)-([a-z]+)"/g, (match, name1, name2) => {
    const importName = name1.charAt(0).toUpperCase() + name1.slice(1) + 
                       name2.charAt(0).toUpperCase() + name2.slice(1) + 'Primitive';
    return `import * as ${importName} from "@radix-ui/react-${name1}-${name2}"`;
  });
  
  if (content.includes('import * from "@radix-ui')) {
    modified = true;
  }
  
  // Add .jsx extension to local imports from ./ui/
  content = content.replace(/from "\.\/ui\/(\w+)"/g, 'from "./ui/$1.jsx"');
  content = content.replace(/from "\.\.\/ui\/(\w+)"/g, 'from "../ui/$1.jsx"');
  
  // Add .jsx extension to local imports from ./components/
  content = content.replace(/from "\.\/components\/(\w+)"/g, 'from "./components/$1.jsx"');
  content = content.replace(/from "\.\.\/components\/(\w+)"/g, 'from "../components/$1.jsx"');
  
  // Add .jsx extension to local imports from ./pages/
  content = content.replace(/from "\.\/pages\/(\w+)"/g, 'from "./pages/$1.jsx"');
  content = content.replace(/from "\.\.\/pages\/(\w+)"/g, 'from "../pages/$1.jsx"');
  
  if (content.includes('.jsx"')) {
    modified = true;
  }
  
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

processDir(path.join(__dirname, 'src', 'app'));
console.log('Done fixing imports!');
