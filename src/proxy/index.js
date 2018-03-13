'use strict'
const {
  EXE,
  NOLOGIN,
  BAN_FILE,
  RESET_N,
  MOTD,
  HOST_MACHINE
} = require('../mud-1/files.js')
const file = require('./file')

function cuserid () { return 'CUSERID' }
function cls () { console.log('CLS') }
function getkbd () { return ' user USERuserUSERuserUSERuserUSERuserUSERuserUSER' }
function any (ch, str) { return false }
function scan (input, start, skips, stop) { return input }
function validname (name) { return true }
function logscan (uid, block) { return false }

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

var chkbnid = (user, name) => new Promise((resolve, reject) => {
  /* Check to see if UID in banned list */
  let b = ''
  let c = user.toLowerCase()
  let a = file.openlock(BAN_FILE, 'r+')
  if (!a) resolve(name)
  while (b = file.gets(79,a)) {
    if (strchr(b,'\n')) strchr(b, '\n') = 0
    b = b.toLowerCase()
    if (b == user) {
      reject('I\'m sorry- that userid has been banned from the Game\n')
    }
  }
  file.close(a)
  resolve(name)
})

function chkname(user) {
  user = user.toLowerCase()
  /*
  let a = 0
  while (user[a]) {
    if (user[a] > 'z') {
      user[a] = 0
      return false
    }
    if (user[a] < 'a') {
      user[a] = 0
      return false
    }
    a++
  }
  user[0] -= 32
  */
  return true
}

/* Main login code */
function logpass(uid) {
  let block = ''
  let a = logscan(uid, block)
  let pwd = uid // save for new user
  if (a) {
    uid = scan(block, 0, '', '.')
    let pwd = scan(block, uid + 1, '', '.')
    let tries = 0
    // pastry:
    console.info('\nThis persona already exists, what is the password ?\n*')
    file.flush('stdout')
    gepass(block)
    console.info('\n')
    if (block != pwd) {
      if (tries < 2) {
        tries++
        // goto pastry
      } else throw Error('\nNo!\n\n')
    }
  } else {
    /* this bit registers the new user */
    console.info('Creating new persona...\n')
    console.info('Give me a password for this persona\n')
    // repass:
    console.info('*')
    file.flush('stdout')
    gepass(block)
    console.info('\n')
    if (any('.', block)) {
      console.info('Illegal character in password\n')
      // goto repass
    }
    // if (!block) goto repass
    uid = pwd
    pwd = block
    block = uid + '.' + pwd + '....'
    let fl = file.openlock(PFL, 'a')
    if (!fl) {
      throw Error('No persona file....\n')
    }
	  qcrypt(block, lump, block.length())
    block = lump
    file.printf(fl, block + '\n')
    file.close(fl)
  }
  cls()
}

var getusername = (name) => new Promise((resolve, reject) => {
  name = name.slice(0, 15)
  /**
   * Check for legality of names
   */
  if (!name) reject()
  if (any('.', name)) reject('Illegal characters in user name')
  name = name.trim()
  console.log(name)

  name = scan(name, 0, ' ', '')
  console.log(name)

  if (!name) reject()
  if (!chkname(name)) reject()
  let dat = name // Gets name tidied up
  let usrnam = name
  if (!validname(usrnam)) reject('Bye Bye')
  resolve(name)
})

var reaskusername = (name) => new Promise((resolve, reject) => {
  let dat = ''
  if (!logscan(dat, 'a')) {
    /* If he/she doesnt exist */
    reject('\nDid I get the name right ' + name + ' ?')
    // let a = 'file.gets(79)'.toLowerCase()
    // if (a[0] == 'n')  {
    //   console.info('\n')
    //   reject()
    //   /* Check name */
    // }
  }
  resolve(name)
})


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
    console.log('So what?')
    resolve(1)
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
  login: name => new Promise((resolve, reject) => {
    /* The whole login system is called from this */

    console.log('LOGIN')
    console.log(name)
    /**
     * Check if banned first
     */
    chkbnid(cuserid(), name).then(response => {
      /**
       * Get the user name
       */
      console.log('NOT BANNED')
      console.log(name)
      if (!name.result) reject('By what name shall I call you ?\n*')
      return getusername(name.result)
    }).then(response => {
      console.log(response)
      return reaskusername(response)
    }).then(response => {
      console.log(name)
      console.log(response)
      logpass(response) // Password checking
      resolve(response)
    }).catch(error => {
      reject(error)
      // user = getkbd().slice(0, 15)
    })
  }),
  setusername: username => getusername(username).then(response => {
    console.log(username)
    console.log(response)
    logpass(response) // Password checking
    resolve(response)
  }),
  reaskusername: username => {
    console.log(response)
    return reaskusername(response)
  },
  enter: user => new Promise((resolve, reject) => {
    console.log('Game entry by ' + user + ' : UID ' + cuserid())
    /* Log entry */ // syslog
    resolve(user)
  })
}
