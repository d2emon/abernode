'use strict'
/**
 * B functions and utilities
 */
function getpass () { return 'GETPASS' }
function crypt (str, key) { return key + str + key }

module.exports = {
  // lowercase -> srt.toLowerCase()
  // uppercase -> srt.toUpperCase()
  // trim -> srt.trim()

  // function any(ch,str)
  gepass: function (str) {
    let key = getpass()
    return crypt(key, 'XX')
    return pw
  },
  // function scan(out,in,start,skips,stops)
  // function getstr(file,st)
  // function addchar(str,ch)
  // function numarg(str)
  // function sbar()
  // function f_listfl(name,file)
  // function sec_read(unit,block,pos,len)
  // function sec_write(unit,block,pos,len)
  cuserid: function () {
    /*
    	extern char *strchr();
    	getpw(getuid(),ary);
    	*strchr(ary,':')=0;
    */
    return 'getpwuid(getuid()).pw_name'
  }
}
