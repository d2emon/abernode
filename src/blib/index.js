'use strict'
/**
 * B functions and utilities
 */
function getpass () { return 'GETPASS' }
function crypt (str, key) { return key + str + key }

module.exports = {
  // lowercase -> str.toLowerCase()
  // uppercase -> str.toUpperCase()
  // trim -> str.trim()
  // any -> str.indexOf() >= 0

  gepass: function (str) {
    let key = getpass()
    return crypt(key, 'XX')
    return pw
  },
  // function scan(out,in,start,skips,stops)
  // function getstr(file, st) -> unused
  // function addchar(str, ch) -> str += ch
  // function numarg(str) -> parseInt()
  // function sbar() -> unused
  // function f_listfl(name,file) -> unused
  // function sec_read(unit,block,pos,len) -> unused
  // function sec_write(unit,block,pos,len) -> unused
  cuserid: function () {
    /*
    	extern char *strchr();
    	getpw(getuid(),ary);
    	*strchr(ary,':')=0;
    */
    return 'getpwuid(getuid()).pw_name'
  }
}
