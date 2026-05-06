const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

function refactorFile(filePath) {
  if (filePath.includes('next.config.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove declarations
  content = content.replace(/const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ["']http:\/\/localhost:8000["'];\n?/g, '');
  content = content.replace(/const apiUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| ["']http:\/\/localhost:8000["'];\n?/g, '');
  content = content.replace(/\/\/ const apiUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| ["']http:\/\/localhost:8000["'];\n?/g, '');
  
  // Clean up double blank lines that might have been left
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Replace usages: `${API_URL}/api...` -> `/api...`
  content = content.replace(/\$\{API_URL\}\/api/g, '/api');
  content = content.replace(/\$\{apiUrl\}\/api/g, '/api');
  content = content.replace(/API_URL \+ ['"]\/api/g, "'/api");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${filePath}`);
  }
}

walk(path.join(__dirname, 'app'), refactorFile);
walk(path.join(__dirname, 'components'), refactorFile);
walk(path.join(__dirname, 'lib'), refactorFile);

console.log('Done');
