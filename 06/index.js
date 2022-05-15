#! /usr/bin/env node

const Assembler = require('./assembler');
const memory = {
  nextAvailableRegister: 16,
};


(async function main() {
  try {
    const args = process.argv;
    const src = args[2];
    if (args.length !== 3 || !src.endsWith('.asm')) {
      console.log('Usage: node . [ src.asm ]');
      process.exit(1);
    }
    const assembler = new Assembler(src);
    await assembler.parse(memory);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();