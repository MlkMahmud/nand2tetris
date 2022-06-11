const fs = require('fs');
const readLine = require('readline');
const { toBinary } = require('./utils');
const {
  compTable,
  destTable,
  jmpTable,
  symbolTable,
} = require('./tables');

const AInstruction = /^@\s*(?<value>\w+([.$]\w+)*)(\s+\/\/([\w\W])*)?$/;
const Comment = /^\/\/([\w\W])*$/;
const DInstructionWithDest = /^(?<dest>A(D|M|DM|MD)?|M(A|D|AD|DA)?|D(A|M|AM|MA)?)\s*=\s*((?<comp>(0|-?[1ADM])|(!?[ADM]))|(?<leftOp>[AMD])\s*(?<op>[\-+|&])\s*(?<rightOp>[1AMD]))?(\s*;\s*(?<jmp>J(LT|EQ|NE|GT|LE|GE|MP)))?(\s+\/\/([\w\W])*)?$/;
const DInstructionNoDest = /^((?<comp>(0|-?[1ADM])|(!?[ADM]))|((?<leftOp>A|D|M)\s*(?<op>[\-+|&])\s*(?<rightOp>[1AMD])))(\s*;\s*(?<jmp>J(LT|EQ|NE|GT|LE|GE|MP)))(\s+\/\/([\w\W])*)?$/;
const LabelDeclaration = /^\(\s*(?<label>\w+([.$]\w+)*)\s*\)(\s+\/\/([\w\W])*)?$/;

const TOKEN_TYPES = {
  A_INSTRUCTION: 'A_INSTRUCTION',
  COMMENT: 'COMMENT',
  ERROR: 'ERROR',
  D_INSTRUCTION: 'D_INSTRUCTION',
  LABEL: 'LABEL',
};



module.exports = class Assembler {
  constructor(src) {
    this.src = src;
    this.symbols = new Map(symbolTable.entries());
  }

  #generateToken(line) {
    const token = {};

    if (line.match(Comment)) {
      token.type = 'COMMENT';
    } else if (line.match(LabelDeclaration)) {
      const match = line.match(LabelDeclaration);
      token.type = TOKEN_TYPES.LABEL;
      token.value = match.groups.label.trim();
    } else if (line.match(AInstruction)) {
      const match = line.match(AInstruction);
      token.type =  TOKEN_TYPES.A_INSTRUCTION;
      token.value = match.groups.value.trim();
    } else if (line.match(DInstructionWithDest)) {
      const match = line.match(DInstructionWithDest);
      const { comp, dest, leftOp, op = '', rightOp = '', jmp = 'NONE' } = match.groups;
      token.type = TOKEN_TYPES.D_INSTRUCTION;
      token.value = { comp: comp || `${leftOp}${op}${rightOp}`, dest, jmp };
    } else if (line.match(DInstructionNoDest)) {
      const match = line.match(DInstructionNoDest);
      const { comp, jmp, leftOp, op, rightOp, } = match.groups;
      token.type = TOKEN_TYPES.D_INSTRUCTION;
      token.value = { comp: comp || `${leftOp}${op}${rightOp}`, dest: 'NONE', jmp };
    } else {
      token.type = TOKEN_TYPES.ERROR;
    }
    return token;
  }

  #populateSymbols() {
    let lineNum = 0;
    const reader = readLine.createInterface({
      input: fs.createReadStream(this.src),
    });

    return new Promise((resolve, reject) => {
      reader.on('line', (input) => {
        const line = input.trim();

        if (line) {
          const token = this.#generateToken(line);
          switch(token.type) {
            case TOKEN_TYPES.A_INSTRUCTION:
            case TOKEN_TYPES.D_INSTRUCTION:
              lineNum++;
              break;
            case TOKEN_TYPES.COMMENT:
              break;
            case TOKEN_TYPES.LABEL: {
              const { value } = token;
              this.symbols.set(value, toBinary(lineNum));
              break;
            }
            default:
              reject(new SyntaxError(`Invalid expression "${line}" at line ${lineNum}`));
          }
        }
      });

      reader.on('close', () => resolve());
    });
  }

  #decodeToken(token, memory) {
    switch (token.type) {
      case TOKEN_TYPES.A_INSTRUCTION: {
        if (/^\d+$/.test(token.value)) {
          const address = toBinary(token.value);
          return `0${address}`;
        } 
        
        if (!this.symbols.has(token.value)) {
          const address = toBinary(memory.nextAvailableRegister);
          this.symbols.set(token.value, address);
          memory.nextAvailableRegister++;
        }
        return `0${this.symbols.get(token.value)}`;
      }

      case TOKEN_TYPES.D_INSTRUCTION: {
        const comp = compTable.get(token.value.comp);
        const dest = destTable.get(token.value.dest);
        const jmp = jmpTable.get(token.value.jmp);
        return `111${comp}${dest}${jmp}`;
      }
    }
  }

  async parse(memory) {
    await this.#populateSymbols();
    const outFile = `${this.src.slice(0, -4)}.hack`;
    const writeStream =  fs.createWriteStream(outFile, { flags: 'w' });
    const reader = readLine.createInterface({
      input: fs.createReadStream(this.src),
    });

    return new Promise((resolve, reject) => {
      reader.on('line', (input) => {
        const line = input.trim();
        if (line) {
          const token = this.#generateToken(line);
          if (token.type === TOKEN_TYPES.A_INSTRUCTION || token.type === TOKEN_TYPES.D_INSTRUCTION) {
            const instruction = this.#decodeToken(token, memory);
            writeStream.write(`${instruction}\n`, (err) => {
              if (err) reject(err);
            });
          }
        }
      });
      writeStream.on('finish', () => resolve());
      reader.on('close', () => writeStream.end());
    });
  }
}