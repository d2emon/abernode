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
// function getkbd () { return ' user USERuserUSERuserUSERuserUSERuserUSERuserUSER' }
function any (ch, str) { return false }
function scan (input, start, skips, stop) { return input }
function validname (name) { return true }
function logscan (uid, block) { return false }
function qcrypt(block, length) {
  console.log('QCRYPT(' + block + ', *"", ' + length + ')')
  return block
}

var listfl = (filename) => new Promise((resolve, reject) => {
  file.requestOpenRead(filename, true).then(response => {
    return file.requestReadLines(response)
  }).then(response => {
    resolve(response)
  }).catch(error => {
    reject('[Cannot Find -> ' + filename + ']')
  })
})

function chkname(user) {
  return /^[a-z]{3,8}$/.test(user.toLowerCase())
}

/**
 * Check we are running on the correct host
 * see the notes about the use of flock();
 * and the affects of lockf();
 */
var correctHost = host => new Promise((resolve, reject) => {
  if (host === HOST_MACHINE) resolve(true)
  else reject('AberMUD is only available on ' + HOST_MACHINE + ', not on ' +
    host + '\n')
})
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

var testUsername = user => new Promise((resolve, reject) => {
  console.log('USER IS ' + JSON.stringify(user.username))
  if (!user.username) reject('By what name shall I call you ?')
  user.username = user.username.slice(0, 15)
  /**
   * Check for legality of names
   */
  if (!user.username) reject('By what name shall I call you ?')
  if (any('.', user.username)) reject('Illegal characters in user name')
  user.username = user.username.trim()
  user.username = scan(user.username, 0, ' ', '')

  if (!user.username) reject('By what name shall I call you ?')
  if (!chkname(user.username)) reject('By what name shall I call you ?')
  let usrnam = user.username
  if (!validname(usrnam)) reject({ id: 5, msg: 'Bye Bye' })

  resolve(true)
  /*
  // Password checking
  logpass(user).then(response => {
    console.log(chalk.magenta('LOGPASS\t') +
      chalk.yellow(response))
    resolve(response)
  }).catch(error => {
    // console.error(chalk.red('Username Error:\t' + JSON.stringify(error)))
    reject(error)
  })
  */
})

var logEnter = user => new Promise((resolve, reject) => {
  /* Log entry */
  console.log(chalk.blue('Game entry by ' + user.username + ' : UID ' + user.uid)) // syslog
  resolve(true)
})
var doTalker = vars => new Promise((resolve, reject) => {
  console.log('TALKER(' + JSON.stringify(vars) + ')')
  resolve(true)
})

// Requests
var testHost = vars => new Promise((resolve, reject) => {
  Promise.all([
    correctHost(vars.host),
    chknolog(vars)
  ]).then(response => {
    resolve(response)
  }).catch(error => {
    reject(error)
  })
})
var stats = vars => new Promise((resolve, reject) => {
  Promise.all([
    created_at(vars),
    reset_at(vars)
  ]).then(response => {
    resolve(response)
  }).catch(error => {
    reject(error)
  })
})
/* Does all the login stuff */
var login = vars => new Promise((resolve, reject) => {
  /* The whole login system is called from this */
  console.log(chalk.yellow('LOGGING IN AS ') + JSON.stringify(vars.username))
  // Check if banned first
  chkbnid(cuserid(), vars.username).then(response => {
    // Get the user name
    console.log(JSON.stringify(response) + chalk.yellow(' IS NOT BANNED'))
    return testUsername({ username: response})
  }).then(response => {
    console.log(response)
    resolve(response)
  }).catch(error => {
    reject({
      username: true,
      password: false,
      error
    })
    // user = getkbd().slice(0, 15)
  })
})
/* list the message of the day */
var motd = vars => new Promise((resolve, reject) => {
  listfl(MOTD).then(response => {
    resolve(response)
  }).catch(error => {
    reject(error)
  })
})
var talker = vars => new Promise((resolve, reject) => {
  Promise.all([
    logEnter(vars.user),
    doTalker(vars.user)
  ]).then(response => {
    resolve(response)
  }).catch(error => {
    reject(error)
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

/* Main login code */
var logpass = username => new Promise((resolve, reject) => {
  let block = ''
  let a = logscan(username, block)
  let pwd = username // save for new user
  if (a) {
    username = scan(block, 0, '', '.')
    pwd = scan(block, username + 1, '', '.')
    let tries = 0
    resolve({
      new: false,
      username:username,
      msg: '\nThis persona already exists, what is the password ?\n*'
    })
    // pastry:
    file.flush('stdout')
    gepass(block)
    console.info('\n')
    if (block != pwd) {
      if (tries < 2) {
        tries++
        // goto pastry
      } else reject('\nNo!\n\n')
    }
  } else {
    resolve({
      new: true,
      username: username,
      msg: 'Creating new persona...'
    })
  }
})
var newuser = vars => new Promise((resolve, reject) => {
  if (any('.', vars.password)) {
    reject('Illegal character in password')
    // goto repass
  }
  if (!vars.password) reject('')
  let uid = vars.username
  let pwd = vars.password
  let block = JSON.stringify(uid) + '.' + pwd + '....'

  console.log(chalk.yellow(JSON.stringify(vars)))
  console.log(chalk.yellow(block))

  file.requestOpenAppend(PFL, true).then(response => {
    let lump = qcrypt(block, block.length)
    block = lump
    return file.requestPrint(response, block + '\n')
  }).then(response => {
    file.requestClose(response)
    resolve({
      username: vars.username,
      password: vars.password,
      block: block,
      pfl: response
    })
  }).catch(error => {
    console.log(chalk.red('New User Error' + JSON.stringify(error)))
    reject('No persona file....')
  })
})

module.exports = {
  request: (addr, vars) => new Promise((resolve, reject) => {
    console.log(chalk.blue(JSON.stringify(addr)))
    if (addr == 'testhost') resolve(testHost(vars))
    if (addr == 'stats') resolve(stats(vars))
    if (addr == 'login') resolve(login(vars))
    if (addr == 'motd') resolve(motd(vars))
    if (addr == 'talker') resolve(talker(vars))

    if (addr == 'username') resolve(testUsername(vars))
    if (addr == 'newuser') resolve(newuser(vars))
    reject('Unknown addr "' + addr + '"')
  })
}
