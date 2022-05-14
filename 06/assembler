#! /usr/bin/env node

const Parser = require('./parser');
const memory = {
  nextAvailableRegister: 16,
};


(async function main() {
  try {
    const args = process.argv;
    const src = args[2];
    if (args.length !== 3 || !src.endsWith('.asm')) {
      console.log('Usage: assembler [ src.asm ]');
      process.exit(1);
    }
    const parser = new Parser(src);
    await parser.parse(memory);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();