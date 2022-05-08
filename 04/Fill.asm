// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.

@8192
D=A
@size
M=D

@0
D=A
@counter
M=D

@filled
M=0

(LOOP)
  @KBD
  D=M

  @PAINT_SCREEN_BLACK
  D;JNE

  @PAINT_SCREEN_WHITE
  0;JMP

(PAINT_SCREEN_BLACK)
  @counter
  D=M

  @size
  D=M-D

  @RESET_BLACK
  D;JEQ

  // prevent unnecessary paint
  @filled
  D=M-1

  @LOOP
  D;JEQ

  @counter
  D=M

  @SCREEN
  A=A + D
  M=-1

  @counter
  M=M+1

  @PAINT_SCREEN_BLACK
  0;JMP


(PAINT_SCREEN_WHITE)
  @counter
  D=M

  @size
  D=M-D

  @RESET_WHITE
  D;JEQ

  @filled
  D=M-1

  @LOOP
  D;JNE

  @counter
  D=M

  @SCREEN
  A=A + D
  M=0

  @counter
  M=M+1

  @PAINT_SCREEN_WHITE
  0;JMP


(RESET_BLACK)
  @counter
  M=0

  @filled
  M=1

  @LOOP
  0;JMP


(RESET_WHITE)
  @counter
  M=0

  @filled
  M=0

  @LOOP
  0;JMP
  