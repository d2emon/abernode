'use strict'
const {
  EXE,
  NOLOGIN,
  RESET_N,
  MOTD,
  HOST_MACHINE
} = require('../mud-1/files.js')
const file = require('./file')

function cuserid () { return 'CUSERID' }
function cls () { console.log('CLS') }

function listfl (name) { return new Promise((resolve, reject) => {
    let string = ''
    console.info('\n')
    let unit = file.openlock(name, 'r+')
    if (!unit) {
      reject('[Cannot Find -> ' + name + ']\n')
    }
    while (string = file.gets(128)) {
      console.info(string)
    }
    file.close(unit)
    console.info('\n')
  })
}

module.exports = {
  /**
   * Check we are running on the correct host
   * see the notes about the use of flock();
   * and the affects of lockf();
   */
  gethostname: request => new Promise((resolve, reject) => {
    if (request.host === HOST_MACHINE) resolve(true)
    else reject('AberMUD is only available on ' + HOST_MACHINE + ', not on ' +
      request.host + '\n')
  }),
  /**
   * Check if there is a no logins file active
   */
  chknolog: request => new Promise((resolve, reject) => {
    console.log('CHKNOLOG')

    // let a = file.open(NOLOGIN, 'r')
    let a = (request.tty > 2)
    if (!a) resolve(true)

    let b = ''
    while(b = file.gets(128, a)) {
      console.info(b)
    }
    file.close(a)
    reject('NOLOGIN')
  }),
  created: new Promise((resolve, reject) => {
    file.stat(EXE).then(
      response => { resolve(response.atime) },
      error => { reject(error) }
    )
  }),
  reseted: new Promise((resolve, reject) => {
    let a = file.open(RESET_N, 'r')
    if (!a) {
      reject('AberMUD has yet to ever start!!!\n')
      // goto skip
    }
    let r = file.scanf(a)
    file.close(a)
    // resolve(r)
    file.stat(RESET_N).then(
      response => { resolve(response.atime) },
      error => { reject(error) }
    )
  }),
  motd: new Promise((resolve, reject) => {
    cls()
    /* list the message of the day */
    listfl(MOTD).then(
      result => {
        let space = file.gets(399)
        console.info('\n\n')
        resolve()
      }
    )
  }),
   /* Does all the login stuff */
  login: user => new Promise((resolve, reject) => {
    let namegiv = 0
    
    console.log('LOGIN')
    console.log(user)
    /* The whole login system is called from this */
    let un1 = 0

    let usermc = ''
    let tim = ''
    /**
     * Check if banned first
     */
    //    chkbnid(cuserid(NULL));
    /**
     * Get the user name
     */
    if (!namegiv) {
      // rena:
      console.log('By what name shall I call you ?\n*')
      // getkbd(user,15)
    } else {
      user = namegt
    }
    /**
     * Check for legality of names
     */
    namegiv = 0
    // if (!strlen(user)) goto rena;
    // if (any('.',user)>-1) crapup("\nIllegal characters in user name\n");
    // trim(user);
    // scan(user,user,0," ","");
    // if (!strlen(user)) goto rena;
    // chkname(user);
    // if(!strlen(user)) goto rena;
    // let dat = user /* Gets name tidied up */
    // usrnam = user
    // if (!validname(usrnam)) crapup("Bye Bye");
    // if (logscan(dat,a)== -1)       /* If he/she doesnt exist */
    // {
    //   printf("\nDid I get the name right %s ?",user);
    //   let a = ''
    //   fgets(a,79,stdin);
    //   lowercase(a);
    //   let c=a[0];
    //   if (c=='n')  {
    //     printf("\n");
    //     goto rena;  /* Check name */
    //   }
    // }
    // logpass(user);        /* Password checking */
    resolve(user)
  }),
  enter: user => new Promise((resolve, reject) => {
    console.log('Game entry by ' + user + ' : UID ' + cuserid())
    /* Log entry */ // syslog
    resolve(user)
  })
}
