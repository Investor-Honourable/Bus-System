const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix broken function parameter patterns with TypeScript intersection types
  // Pattern 1: } & { inset?; variant } 
  content = content.replace(/\}\s*&\s*\{[^}]*\}/g, (match) => {
    // This is TypeScript type annotation, remove it entirely
    return '}';
  });
  
  // Fix broken imports with import * from packages (multi-word radix components)
  // import * from "@radix-ui/react-slot"
  content = content.replace(/import \* from "@radix-ui\/react-slot"/g, 'import { Slot } from "@radix-ui/react-slot"');
  
  // import * from "@radix-ui/react-label"
  content = content.replace(/import \* from "@radix-ui\/react-label"/g, 'import * as LabelPrimitive from "@radix-ui/react-label"');
  
  // import * from "@radix-ui/react-checkbox"
  content = content.replace(/import \* from "@radix-ui\/react-checkbox"/g, 'import * as CheckboxPrimitive from "@radix-ui/react-checkbox"');
  
  // import * from "@radix-ui/react-dropdown-menu"
  content = content.replace(/import \* from "@radix-ui\/react-dropdown-menu"/g, 'import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"');
  
  // import * from other radix packages (generic fix)
  // This should be handled by the earlier fix script but let's be thorough
  const radixPackages = [
    'accordion', 'alert-dialog', 'alert', 'aspect-ratio', 'avatar', 'badge', 'breadcrumb',
    'calendar', 'card', 'carousel', 'chart', 'collapsible', 'command', 'context-menu',
    'dialog', 'drawer', 'form', 'hover-card', 'input-otp', 'menubar', 'navigation-menu',
    'pagination', 'popover', 'progress', 'radio-group', 'resizable', 'scroll-area',
    'select', 'separator', 'sheet', 'sidebar', 'skeleton', 'slider', 'sonner', 'switch',
    'table', 'tabs', 'textarea', 'toggle-group', 'toggle', 'tooltip'
  ];
  
  // Add .jsx extension to any remaining imports without extension from ui folder
  content = content.replace(/from "\.\/ui\/([^".]+)"/g, 'from "./ui/$1.jsx"');
  content = content.replace(/from "\.\.\/ui\/([^".]+)"/g, 'from "../ui/$1.jsx"');
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    modified = true;
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
console.log('Done fixing TS patterns!');
