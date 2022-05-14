const fs = require('fs');
const path = require('path');
const Parser = require('../06/parser');


describe('Parser', () => {
  it('should convert Add.asm to it\'s binary equivalent', async () => {
    const src = path.join(__dirname, './files', 'Add.asm');
    const snapshot = path.join(__dirname, './snapshots', 'Add.hack');
    const dist = `${src.slice(0, -4)}.hack`;
    const parser = new Parser(src);
    await parser.parse({ nextAvailableRegister: 16 });
    expect(fs.readFileSync(dist)).toEqual(fs.readFileSync(snapshot));
  });

  it('should convert Rect.asm to it\'s binary equivalent', async () => {
    const src = path.join(__dirname, './files', 'Rect.asm');
    const snapshot = path.join(__dirname, './snapshots', 'Rect.hack');
    const dist = `${src.slice(0, -4)}.hack`;
    const parser = new Parser(src);
    await parser.parse({ nextAvailableRegister: 16 });
    expect(fs.readFileSync(dist)).toEqual(fs.readFileSync(snapshot));
  });

  it('should convert Pong.asm to it\'s binary equivalent', async () => {
    const src = path.join(__dirname, './files', 'Pong.asm');
    const snapshot = path.join(__dirname, './snapshots', 'Pong.hack');
    const dist = `${src.slice(0, -4)}.hack`;
    const parser = new Parser(src);
    await parser.parse({ nextAvailableRegister: 16 });
    expect(fs.readFileSync(dist)).toEqual(fs.readFileSync(snapshot));
  });

  it('should convert Max.asm to it\'s binary equivalent', async () => {
    const src = path.join(__dirname, './files', 'Max.asm');
    const snapshot = path.join(__dirname, './snapshots', 'Max.hack');
    const dist = `${src.slice(0, -4)}.hack`;
    const parser = new Parser(src);
    await parser.parse({ nextAvailableRegister: 16 });
    expect(fs.readFileSync(dist)).toEqual(fs.readFileSync(snapshot));
  });
});