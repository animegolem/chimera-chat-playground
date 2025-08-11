#!/usr/bin/env node

/**
 * Script to migrate console.log statements to the new logger utility
 * Usage: node scripts/migrate-console-logs.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');

// Patterns to replace
const REPLACEMENTS = [
  {
    // console.log(...) -> logger.log(...)
    pattern: /\bconsole\.log\(/g,
    replacement: 'logger.log(',
    importNeeded: true
  },
  {
    // console.error(...) -> logger.error(...)
    pattern: /\bconsole\.error\(/g,
    replacement: 'logger.error(',
    importNeeded: true
  },
  {
    // console.warn(...) -> logger.warn(...)
    pattern: /\bconsole\.warn\(/g,
    replacement: 'logger.warn(',
    importNeeded: true
  },
  {
    // console.info(...) -> logger.info(...)
    pattern: /\bconsole\.info\(/g,
    replacement: 'logger.info(',
    importNeeded: true
  },
  {
    // console.debug(...) -> logger.debug(...)
    pattern: /\bconsole\.debug\(/g,
    replacement: 'logger.debug(',
    importNeeded: true
  }
];

// Files/directories to skip
const SKIP_PATHS = [
  'node_modules',
  'dist',
  '.git',
  'scripts',
  'src/lib/logger.ts', // Don't modify the logger itself
  '.d.ts',
  'mockup.html'
];

// File extensions to process
const PROCESS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function shouldProcessFile(filePath) {
  // Skip if in skip paths
  if (SKIP_PATHS.some(skip => filePath.includes(skip))) {
    return false;
  }
  
  // Only process allowed extensions
  const ext = path.extname(filePath);
  return PROCESS_EXTENSIONS.includes(ext);
}

function getImportPath(fromFile) {
  // Calculate relative import path from file to logger
  const projectRoot = path.resolve(__dirname, '..');
  const loggerPath = path.join(projectRoot, 'src/lib/logger');
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, loggerPath);
  
  // Convert to forward slashes and add @ alias if in src
  if (fromFile.includes('/src/')) {
    return '@/lib/logger';
  }
  
  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath.replace(/\\/g, '/');
}

function addLoggerImport(content, filePath) {
  const importPath = getImportPath(filePath);
  
  // Check if logger is already imported
  if (content.includes('from \'@/lib/logger\'') || 
      content.includes('from "@/lib/logger"') ||
      content.includes('from \'./logger\'') ||
      content.includes('from "./logger"')) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import .* from ['"].*['"];?$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    
    // Insert logger import after the last import
    const newImport = `\nimport { logger } from '${importPath}';`;
    return content.slice(0, insertPosition) + newImport + content.slice(insertPosition);
  } else {
    // No imports found, add at the beginning
    const newImport = `import { logger } from '${importPath}';\n\n`;
    return newImport + content;
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let needsImport = false;
  let changeCount = 0;
  
  // Apply replacements
  for (const { pattern, replacement, importNeeded } of REPLACEMENTS) {
    const matches = modified.match(pattern);
    if (matches) {
      changeCount += matches.length;
      modified = modified.replace(pattern, replacement);
      if (importNeeded) {
        needsImport = true;
      }
    }
  }
  
  // Add import if needed
  if (needsImport) {
    modified = addLoggerImport(modified, filePath);
  }
  
  // Write changes
  if (modified !== content) {
    if (DRY_RUN) {
      console.log(`Would modify ${filePath}: ${changeCount} console statements replaced`);
    } else {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ Modified ${filePath}: ${changeCount} console statements replaced`);
    }
    return changeCount;
  }
  
  return 0;
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !SKIP_PATHS.some(skip => filePath.includes(skip))) {
      walkDirectory(filePath, callback);
    } else if (stat.isFile() && shouldProcessFile(filePath)) {
      callback(filePath);
    }
  }
}

// Main execution
console.log(DRY_RUN ? '🔍 DRY RUN - No files will be modified\n' : '🔄 Migrating console statements to logger...\n');

let totalFiles = 0;
let totalChanges = 0;

const projectRoot = path.resolve(__dirname, '..');
walkDirectory(path.join(projectRoot, 'src'), (filePath) => {
  const changes = processFile(filePath);
  if (changes > 0) {
    totalFiles++;
    totalChanges += changes;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Console statements replaced: ${totalChanges}`);

if (DRY_RUN) {
  console.log('\n💡 Run without --dry-run to apply changes');
}