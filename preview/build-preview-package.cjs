const { createRequire } = require('node:module');
const zeus = createRequire(process.argv[1])('../private-modules/zeppos-app-utils');
const compiler = zeus.modules.buildSupportV3Config;

// Keep the CLI's non-interactive device selection but generate its QR preview format.
zeus.modules = {
  ...zeus.modules,
  buildSupportV3Config(workspace, _mode, options) {
    return compiler(workspace, 'preview', options);
  },
};
