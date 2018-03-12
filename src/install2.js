'use strict'

console.log('Compiling world maker')
// gcc -w makeworld.c blib.c -o makeworld.util -lcrypt
// ./makeworld.util
console.log('Game universe intialised')
console.log('Compiling reset data compiler')
// gcc -w ogen.c blib.o -o ogenerate -lcrypt
// ./ogenerate
// cp ob.out reset_data
console.log('Reset data generated')
console.log('Compiling uaf generator')
// gcc -w makeuaf.c -o makeuaf
// ./makeuaf >uaf.rand
console.log('Ok')
console.log('Now set up a password for arthur the archwizard')
