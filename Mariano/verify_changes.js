const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('site.js', 'utf8');
const adminJs = fs.readFileSync('admin.js', 'utf8');

console.log('=== VERIFICAÇÃO DE ALTERAÇÕES ===\n');

console.log('Tamanhos dos arquivos:');
console.log('  index.html:', html.length, 'chars');
console.log('  site.js:', js.length, 'chars');
console.log('  admin.js:', adminJs.length, 'chars');

console.log('\nIDs no index.html:');
['siteQrCode', 'instagram-btn', 'instagram-footer', 'pixQrCode'].forEach(id => {
    console.log('  id="' + id + '":', html.includes('id="' + id + '"') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
});

console.log('\nFunções no site.js:');
['atualizarPreviaQrSite', 'carregarConfiguracoes', 'siteQrCode', 'instagram-footer'].forEach(fn => {
    console.log('  ' + fn + ':', js.includes(fn) ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
});

console.log('\nFunções no admin.js:');
['atualizarPreviaQrSite', 'salvarConfiguracoes', 'preencherConfiguracoes', 'cfg-site-qrcode', 'cfg-instagram-ong'].forEach(fn => {
    console.log('  ' + fn + ':', adminJs.includes(fn) ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
});

console.log('\nTextos no index.html:');
console.log('  "SensOrI AÇÃO":', html.includes('SensOrI AÇÃO') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "sentir, brincar e incluir" (lowercase):', html.includes('sentir, brincar e incluir') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "100% das doações em prol do desenvolvimento":', html.includes('100% das doações em prol do desenvolvimento') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "O que é Autismo?":', html.includes('O que é Autismo?') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "Autismo x Brinquedos Sensoriais":', html.includes('Autismo x Brinquedos Sensoriais') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "Conheça a AUMA":', html.includes('Conheça a AUMA') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "A AUMA se localiza na Rua Leontino Boscariol":', html.includes('A AUMA se localiza na Rua Leontino Boscariol') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "aumapiracicaba.org.br":', html.includes('aumapiracicaba.org.br') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "quero doar" (lowercase):', html.includes('quero doar') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  "Instagram" button:', html.includes('Instagram') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

console.log('\nConfig no supabase_setup_2.sql:');
const sql = fs.readFileSync('supabase_setup_2.sql', 'utf8');
console.log('  site_qrcode:', sql.includes('site_qrcode') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  instagram_ong:', sql.includes('instagram_ong') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
console.log('  instagram URL default:', sql.includes('https://www.instagram.com/aumapiracicaba') ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
