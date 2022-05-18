const fs = require('fs');
const readline = require('readline');

const comment = /^\/\/.*$/;
const popCommand =
  /^pop\s+(?<segment>argument|local|this|that|temp|static)\s+(?<index>\d+)(\s+\/\/.*)?$/;
const pushCommand =
  /^push\s+(?<segment>constant|argument|local|this|that|temp|static)\s+(?<index>\d+)(\s+\/\/.*)?$/;
const arithmeticCommand = /^(?<op>add|sub|neg|eq|or|not|and|lt)(\s+\/\/.*)?$/;

const COMMANDS = {
  ARITHMETIC: 'ARITHMETIC',
  COMMENT: 'COMMENT',
  POP: 'POP',
  PUSH: 'PUSH',
};

module.exports = class Translator {
  symbols = new Map([
    ['constant', '@SP'],
    ['argument', '@ARG'],
    ['this', '@THIS'],
    ['that', '@THAT'],
    ['local', '@LCL'],
    ['static', 16],
    ['temp', 5],
    ['add', '+'],
    ['sub', '-'],
    ['neg', '!'],
  ]);

  #parse(line, lineNum) {
    const token = {};

    if (line.match(arithmeticCommand)) {
      const match = line.match(arithmeticCommand);
      const { op } = match.groups;
      const symbol = this.symbols.get(op);
      if (['neg'].includes(op)) {
        token.value = { args: 1, symbol };
      } else {
        token.value = { args: 2, symbol };
      }
      token.type = COMMANDS.ARITHMETIC;
    } else if (line.match(pushCommand)) {
      const match = line.match(pushCommand);
      const { segment, index } = match.groups;
      token.type = COMMANDS.PUSH;
      token.value = { index, segment };
    } else if (line.match(popCommand)) {
      const match = line.match(popCommand);
      const { segment, index } = match.groups;
      token.type = COMMANDS.POP;
      token.value = { index, segment };
    } else if (line.match(comment)) {
      token.type = COMMANDS.COMMENT;
    } else {
      throw new SyntaxError(`Invalid expression "${line}" at line ${lineNum}`);
    }
    return token;
  }

  #generateCode(token) {
    switch (token.type) {
      case COMMANDS.PUSH: {
        let code = '';
        const { index, segment } = token.value;
        const symbol = this.symbols.get(segment);
        if (segment === 'constant') {
          code = `@${index}\nD=A\n${symbol}\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (['local', 'argument', 'this', 'that'].includes(segment)) {
          code = `${symbol}\nD=M\n@${index}\nA=D+A\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else {
          const addr = String(symbol + Number(index));

          code = `@${addr}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        }
        return code;
      }

      case COMMANDS.POP: {
        let code = '';
        const { index, segment } = token.value;
        const symbol = this.symbols.get(segment);
        if (['local', 'argument', 'this', 'that'].includes(segment)) {
          code = `${symbol}\nD=M\n@${index}\nD=D+A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
        } else {
          const addr = String(symbol + Number(index));
          code = `@${addr}\nD=A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
        }
        return code;
      }

      case COMMANDS.ARITHMETIC: {
        let code = '';
        const { symbol, args } = token.value;
        if (args === 1) {
          code = `@SP\nA=M-1\nM=${symbol}M\n\n`;
        } else {
          code = `@SP\nM=M-1\nA=M\nD=M\nA=A-1\nD=M${symbol}D\nM=D\n\n`
        }
        return code
      }

      default: {
        throw new TypeError(`Invalid token type: ${token.type}`);
      }
    }
  }

  translate(srcFile) {
    const outFile = srcFile.replace('.vm', '.asm')
    const writeStream = fs.createWriteStream(outFile, { flags: 'w' });
    const reader = readline.createInterface({
      input: fs.createReadStream(srcFile),
    });

    return new Promise((resolve, reject) => {
      let lineNum = 1;
      reader.on('line', (data) => {
        const line = data.trim();
        if (line) {
          const token = this.#parse(line, lineNum);
          if (token.type !== COMMANDS.COMMENT) {
            const code = this.#generateCode(token);
            writeStream.write(code, (err) => {
              if (err) reject(err);
            });
          }
        }
        lineNum++;
      });

      writeStream.on('finish', () => resolve());
      reader.on('close', () => {
        writeStream.end();
      });
    });
  }
};
