const fs = require('fs');
const readline = require('readline');

const comment = /^\/\/.*$/;
const popCommand =
  /^pop\s+((?<segment>argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/;
const pushCommand =
  /^push\s+((?<segment>constant|argument|local|this|that|temp|static)\s+(?<index>\d+)|pointer\s+(?<pointer>[01]))(\s+\/\/.*)?$/;
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
      token.value = { symbol };
      token.type = COMMANDS.ARITHMETIC;
    } else if (line.match(pushCommand)) {
      const match = line.match(pushCommand);
      const { segment, index, pointer } = match.groups;
      token.type = COMMANDS.PUSH;
      token.value = { index, pointer, segment };
    } else if (line.match(popCommand)) {
      const match = line.match(popCommand);
      const { segment, index, pointer } = match.groups;
      token.type = COMMANDS.POP;
      token.value = { index, segment, pointer };
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
        const { index = 0, segment, pointer } = token.value;
        let symbol = this.symbols.get(segment);

        if(pointer) {
          symbol = pointer === '0' ? '@R3' : '@R4';
          code = `${symbol}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (segment === 'constant') {
          code = `@${index}\nD=A\n${symbol}\nM=M+1\nA=M-1\nM=D\n\n`;
        } else if (['static', 'temp'].includes(segment)) {
          const addr = String(symbol + Number(index));
          code = `@${addr}\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        } else {
          code = `${symbol}\nD=M\n@${index}\nA=D+A\nD=M\n@SP\nM=M+1\nA=M-1\nM=D\n\n`;
        }
        return code;
      }

      case COMMANDS.POP: {
        let code = '';
        const { index = 0, segment, pointer } = token.value;
        let symbol = this.symbols.get(segment);

        if(pointer) {
          symbol = pointer === '0' ? '@R3' : '@R4';
          code = `@SP\nM=M-1\nA=M\nD=M\n${symbol}\nM=D\n\n`;
        } else if (['static', 'temp'].includes(segment)) {
          const addr = String(symbol + Number(index));
          code = `@${addr}\nD=A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`; 
        } else {
          code = `${symbol}\nD=M\n@${index}\nD=D+A\n@R13\nM=D\n@SP\nM=M-1\nA=M\nD=M\n@R13\nA=M\nM=D\n\n`;
        }
        return code;
      }

      case COMMANDS.ARITHMETIC: {
        let code = '';
        const { symbol } = token.value;
        // single operand operators
        if (['!'].includes(symbol)) { 
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
