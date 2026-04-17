const fs = require('fs');

function optimize(path, maps) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    maps.forEach(r => {
        content = content.replace(r.from, r.to);
    });
    fs.writeFileSync(path, content);
}

// Sidebar Fixes
optimize('src/components/Sidebar.jsx', [
    { from: /text-\[10px\]/g, to: 'text-xs' },
    { from: /text-\[9px\]/g, to: 'text-[11px]' }
]);

// Login Fixes
optimize('src/pages/Login.jsx', [
    { from: /text-\[10px\]/g, to: 'text-xs' },
    { from: /text-\[9px\]/g, to: 'text-[11px]' },
    { from: /text-\[8px\]/g, to: 'text-[10px]' }
]);

console.log('Typography globally optimized.');
