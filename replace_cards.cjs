const fs = require('fs');
const path = require('path');

const targetFile = process.argv[2];
if (!targetFile) {
    console.error("Please provide a file path");
    process.exit(1);
}

const filePath = path.resolve(targetFile);
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard <Card> without class
content = content.replace(/<Card>/g, '<div className="p-6 mb-6 rounded-sm border border-border/40 bg-card/30">');

// Replace <Card className="..."> keeping the classes but adding our base
content = content.replace(/<Card className="([^"]*)">/g, (match, classes) => {
    // Let's ensure we merge classes nicely. Remove shadows and big rounded corners
    let newClasses = classes
        .replace(/shadow-\w+/g, '')
        .replace(/rounded-\w+/g, '')
        .replace(/bg-gradient\S+/g, '')
        .trim();
    return `<div className="p-6 mb-6 rounded-sm border border-border/40 bg-card/30 ${newClasses}">`;
});

content = content.replace(/<\/Card>/g, '</div>');

content = content.replace(/<CardHeader(?: className="([^"]*)")?>/g, (match, classes) => {
    return `<div className="mb-4 ${classes || ''}">`;
});
content = content.replace(/<\/CardHeader>/g, '</div>');

content = content.replace(/<CardContent(?: className="([^"]*)")?>/g, (match, classes) => {
    return `<div className="${classes || ''}">`;
});
content = content.replace(/<\/CardContent>/g, '</div>');

content = content.replace(/<CardTitle(?: className="([^"]*)")?>/g, (match, classes) => {
    let newClasses = classes ? classes.replace(/text-\w+/g, '').replace(/font-\w+/g, '') : '';
    return `<h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 ${newClasses}">`;
});
content = content.replace(/<\/CardTitle>/g, '</h3>');

content = content.replace(/<CardDescription(?: className="([^"]*)")?>/g, (match, classes) => {
    return `<p className="text-xs text-muted-foreground opacity-80 mt-1 ${classes || ''}">`;
});
content = content.replace(/<\/CardDescription>/g, '</p>');

// Remove imports
content = content.replace(/import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@\/components\/ui\/card';\n/, '');

// Remove imports and ui/card from imports
content = content.replace(/import\s+{\s*([^}]+)\s*}\s+from\s+'@\/components\/ui\/card';\n/g, '');

// Fix some specific rounded inputs and buttons to rounded-sm
content = content.replace(/rounded-xl/g, 'rounded-sm');
content = content.replace(/rounded-2xl/g, 'rounded-sm');
content = content.replace(/rounded-3xl/g, 'rounded-sm');
// Remove custom bracket radiuses
content = content.replace(/rounded-\[.*?\]/g, 'rounded-sm');

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Transform complete.');
