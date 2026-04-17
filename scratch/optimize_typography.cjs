const fs = require('fs');
const path = 'src/pages/CreatorStudio.jsx';
let content = fs.readFileSync(path, 'utf8');

// Optimization Mapping
const replacements = [
    { from: /font-size:\s*15px;/g, to: 'font-size: 18px;' },
    { from: /font-size:\s*9px;/g, to: 'font-size: 11px;' },
    { from: /font-size:\s*clamp\(11px,\s*2\.5vw,\s*13px\);/g, to: 'font-size: clamp(12px, 3vw, 15px);' },
    { from: /font-size:\s*clamp\(10px,\s*2\.2vw,\s*11px\);/g, to: 'font-size: 12px;' },
    { from: /font-size:\s*clamp\(13px,\s*3\.5vw,\s*15px\);/g, to: 'font-size: clamp(15px, 4vw, 18px);' },
    { from: /font-size:\s*clamp\(16px,\s*4vw,\s*22px\);/g, to: 'font-size: clamp(20px, 5vw, 26px);' },
    { from: /font-size:\s*14px;/g, to: 'font-size: 16px;' },
    { from: /font-size:\s*clamp\(20px,\s*5vw,\s*30px\);/g, to: 'font-size: clamp(24px, 6vw, 36px);' },
    { from: /font-size:\s*clamp\(13px,\s*3\.5vw,\s*16px\);/g, to: 'font-size: clamp(15px, 4vw, 18px);' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

// Specific fix for .cs-label to ensure it doesn't break other small texts if they were already 9px
content = content.replace(/\.cs-label\s*{[^}]*font-size:\s*11px;/g, (match) => match.replace('11px', '12px'));

fs.writeFileSync(path, content);
console.log('CreatorStudio.jsx typography optimized successfully.');
