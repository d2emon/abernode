'use strict'
/**
 * B functions and utilities
 */
module.exports = {
  // lowercase -> srt.toLowerCase()
  // uppercase -> srt.toUpperCase()
  // trim -> srt.trim()

  // function any(ch,str)
  // function gepass(str)
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
