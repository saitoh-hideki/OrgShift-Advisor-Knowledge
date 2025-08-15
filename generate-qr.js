const qrcode = require('qrcode-terminal');

// QRコードに表示するテキスト（例：URLやテキスト）
const text = 'https://github.com/saitoh-hideki/OrgShift-Advisor-Knowledge';

console.log('QRコードを生成中...');
console.log('テキスト:', text);
console.log('');

// ターミナルにQRコードを表示
qrcode.generate(text, { small: true }, function (qrcode) {
  console.log('');
  console.log('QRコードが生成されました！');
});
