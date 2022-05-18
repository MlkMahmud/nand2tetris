const Translator = require('./translator');


(async function main() {
  try {
    const args = process.argv;
    const src = args[2];
    if (args.length !== 3 || !src.endsWith('.vm')) {
      console.log('Usage: node . [ src.vm ]');
      process.exit(1);
    }
    const translator = new Translator();
    await translator.translate(src);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
