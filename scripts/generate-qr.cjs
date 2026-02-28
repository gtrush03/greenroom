#!/usr/bin/env node
// Generate a colored QR code PNG for an invite URL
// Usage: node generate-qr.cjs --url "https://..." --color purple --output /tmp/qr.png
// Colors: purple (creators), green (funders)

const QRCode = require('/opt/homebrew/lib/node_modules/@xmtp/convos-cli/node_modules/qrcode');

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace('--', '');
  args[key] = process.argv[i + 1];
}

if (!args.url) {
  console.error('--url is required');
  process.exit(1);
}

const colors = {
  purple: { dark: '#6B21A8', light: '#FFFFFF' },
  green: { dark: '#166534', light: '#FFFFFF' },
};

const colorSet = colors[args.color] || colors.purple;
const output = args.output || '/tmp/qr-invite.png';

QRCode.toFile(output, args.url, {
  type: 'png',
  width: 400,
  margin: 2,
  color: colorSet,
  errorCorrectionLevel: 'M',
}, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('QR_CODE: ' + output);
});
