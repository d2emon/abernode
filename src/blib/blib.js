/*
#include <stdio.h>
#include <pwd.h>
#include <ctype.h>
#include "System.h"
*/

function scan(output, input, start, skips, stops) {
  let in_base = input
  /*
  let sy_ot = output
	printf("Scan(%s ->%d %d %s %s", input, output, start, skips, stops)
  */
	if (input.length < start) {
    return { id: null, output: '' }
  }
  let inId = start
  while ((inId < input.length) && (skips.indexOf(input[inId] < 0))) {
    inId++
  }

	if (inId == input.length) {
    return { id: null, output: '' }
  }
	while ((inId < input.length) && (stops.indexOf(input[inId]) < 0)) {
    output += input[inId]
		inId++
	}
  /*
  printf(" : Outputting %s\n", sy_ot)
  */
  return { id: inId, output: output }
}

function getstr(file, st) {
  st = file.gets(st, 255)
  if (!st) return 0
  if (st.indexOf('\n') >= 0) st.indexOf('\n') = 0
  return st
}

function sbar() {
	return null // Unknown code needed here
}

function f_listfl(name, file) {
  let x = ''
  let a = fopen(name, "r")
  if (!a) console.error("[Cannot find file ->%s ]\n", name)
  else {
    while (a.fgets(x, 127))
      file.fprintf("%s", x)
  }
}

function sec_read(unit, block, pos, len) {
  unit.fseek(pos * 64 * sizeof(long), 0)
  block = unit.fread(len * sizeof(long), 1)
}

function sec_write(unit, block, pos, len) {
  unit.fseek(pos * 64 * sizeof(long), 0)
  unit.fwrite(block, len * sizeof(long), 1)
}
