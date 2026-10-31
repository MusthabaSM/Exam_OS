const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('loading.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the wrapper
  content = content.replace(/<div className="relative w-full h-\[.*?\] overflow-hidden rounded-xl">/g, '<div className="w-full">');
  
  // Replace the absolute positioned loader with fixed
  content = content.replace(/<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none.*?>/g, '<div className="fixed top-0 left-0 md:left-64 right-0 bottom-0 z-[100] flex items-center justify-center pointer-events-none">');
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
