'use strict'
const chalk = require('chalk')
const {
  EXE,
  NOLOGIN,
  BAN_FILE,
  RESET_N,
  MOTD,
  PFL,
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
function qcrypt(block, length) {
  console.log('QCRYPT(' + block + ', *"", ' + length + ')')
  return block
}

function listfl (name) { return new Promise((resolve, reject) => {
    let string = ''
    console.info('\n')
    let unit = file.requestOpenRead(name, true)
    if (!unit) {
      reject('[Cannot Find -> ' + name + ']\n')
    }
    /*
    while (string = file.requestReadLine(128)) {
      console.info(string)
    }
    */
    file.requestClose(unit)
    console.info('\n')
  })
}


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

// Requests
/**
 * Check we are running on the correct host
 * see the notes about the use of flock();
 * and the affects of lockf();
 */
function testhost (host) {
  if (host === HOST_MACHINE) return true
  else throw Error('AberMUD is only available on ' + HOST_MACHINE +
    ', not on ' + host + '\n')
}
/**
 * Check if there is a no logins file active
 */
var chknolog = vars => new Promise((resolve, reject) => {
  file.requestOpenRead(NOLOGIN).then(response => {
    return file.requestReadLines(response)
  }).then(response => {
    reject(response)
  }).catch(error => {
    resolve(true)
  })
})
var chkbnid = (user, name) => new Promise((resolve, reject) => {
  /* Check to see if UID in banned list */
  let b = ''
  let c = user.toLowerCase()
  file.requestOpenRead(BAN_FILE, true).then(response => {
    return file.requestReadArray(response)
  }).then(response => {
    response.forEach(item => {
      if (!item) return
      item = item.toLowerCase()
      if (item === user) {
        reject('I\'m sorry- that userid has been banned from the Game\n')
      }
    })
    resolve(name)
  }).catch(error => {
    console.log(chalk.yellow(error))
    resolve(name)
  })
})

var created_at = vars => new Promise((resolve, reject) => {
  file.stat(EXE).then(response => {
    resolve(response.atime)
  }).catch(error => {
    resolve('<unknown>')
  })
})
var reset_at = vars => new Promise((resolve, reject) => {
  let filedata = {}
  file.requestOpenRead(RESET_N).then(response => {
    filedata = response
    return file.requestReadLine(response)
  }).then(response => {
    file.requestClose(filedata)
    resolve(response)
  }).catch(error => {
    resolve(false)
  })
})
/* Does all the login stuff */
var login = vars => new Promise((resolve, reject) => {
  /* The whole login system is called from this */
  console.log(chalk.yellow('LOGGING IN AS ') + JSON.stringify(vars.username))
  /**
   * Check if banned first
   */
  chkbnid(cuserid(), vars.username).then(response => {
    /**
     * Get the user name
     */
    console.log(JSON.stringify(response) + chalk.yellow(' IS NOT BANNED'))
    if (!response) reject('By what name shall I call you ?\n*')
    return username({ username: response })
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
})
var getusername = username => new Promise((resolve, reject) => {
  username = username.slice(0, 15)
  /**
   * Check for legality of names
   */
  if (!username) reject({ id: 1, msg: '' })
  if (any('.', username)) reject({ id: 2, msg: 'Illegal characters in user name' })
  username = username.trim()
  username = scan(username, 0, ' ', '')

  if (!username) reject({ id: 1, msg: '' })
  if (!chkname(username)) reject({ id: 1, msg: '' })
  let dat = username // Gets name tidied up
  let usrnam = username
  if (!validname(usrnam)) reject({ id: 5, msg: 'Bye Bye' })
  resolve(username)
})
var username = vars => new Promise((resolve, reject) => {
  getusername(vars.username).then(response => {
    console.log(chalk.yellow(response))
    return logpass(response) // Password checking
  }).then(response => {
    console.log(chalk.yellow(response))
    resolve(response)
  }).catch(error => {
    console.error(chalk.red(error))
    reject(error)
  })
})
/* Main login code */
var logpass = username => new Promise((resolve, reject) => {
  let block = ''
  let a = logscan(username, block)
  let pwd = username // save for new user
  if (a) {
    username = scan(block, 0, '', '.')
    pwd = scan(block, username + 1, '', '.')
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
    reject({
      id: 10,
      username: username,
      msg: 'Creating new persona...'
    })
  }
  cls()
})
var newuser = vars => new Promise((resolve, reject) => {
  if (any('.', vars.password)) {
    reject('Illegal character in password')
    // goto repass
  }
  if (!vars.password) reject('')
  let uid = vars.username
  let pwd = vars.password
  let block = uid + '.' + pwd + '....'

  console.log(chalk.yellow(JSON.stringify(vars)))
  console.log(chalk.yellow(block))

  file.requestOpenAppend(PFL, true).then(response => {
    let lump = qcrypt(block, block.length)
    block = lump
    return file.requestPrint(response, block + '\n')
  }).then(response => {
    file.requestClose(response)
    resolve(response)
  }).catch(error => {
    console.log(chalk.red(error))
    reject('No persona file....')
  })
})

module.exports = {
  motd: () => new Promise((resolve, reject) => {
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
  reaskusername: username => {
    console.log(response)
    return reaskusername(response)
  },
  enter: user => new Promise((resolve, reject) => {
    console.log('Game entry by ' + user + ' : UID ' + cuserid())
    /* Log entry */ // syslog
    resolve(user)
  }),
  request: (addr, vars) => new Promise((resolve, reject) => {
    console.log(chalk.blue(addr))
    if (addr == 'testhost') resolve(testhost(vars.host))
    if (addr == 'chknolog') resolve(chknolog(vars))
    if (addr == 'created') resolve(created_at(vars))
    if (addr == 'reseted') resolve(reset_at(vars))
    if (addr == 'login') resolve(login(vars))
    if (addr == 'username') resolve(username(vars))
    if (addr == 'newuser') resolve(newuser(vars))
    reject('Unknown addr "' + addr + '"')
  })
}
