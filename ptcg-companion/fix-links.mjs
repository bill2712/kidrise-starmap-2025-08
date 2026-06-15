import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.astro')) filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync('src');
let changedCount = 0;

files.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  let original = text;
  
  text = text.replace(/href=\{`\/\$\{lang\}/g, "href={`\${import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL}/\${lang}");
  
  if (text !== original) {
    fs.writeFileSync(file, text);
    console.log('Fixed', file);
    changedCount++;
  }
});

console.log(`Finished, fixed ${changedCount} files.`);
