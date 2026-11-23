const { writeFileSync } = require('node:fs');
const { createRequire } = require('node:module');

const qr = createRequire(process.argv[1])('qrcode-terminal');
qr.generate = payload => {
  if (typeof payload !== 'string' || !/^(zpkd1|watchface):\/\/[^\s]+$/.test(payload)) {
    throw new Error('Zeus did not return a preview QR');
  }
  writeFileSync(process.env.WATCHMAKER_QR_PATH, payload, { mode: 0o600 });
};
