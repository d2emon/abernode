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
} = require('../files.js')
const file = require('./file')

function cuserid () { return 'CUSERID' }
// function any (ch, str) { return false }
// function scan (input, start, skips, stop) { return input }
// function validname (name) { return true }
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

module.exports = {
  request: (addr, vars) => new Promise((resolve, reject) => {
    console.log('\t' + chalk.blue(JSON.stringify(addr)) + '\t' +
      JSON.stringify(vars))

    if (addr == 'motd') resolve(motd(vars))
    if (addr == 'talker') resolve(talker(vars))

    reject('Unknown addr "' + addr + '"')
  })
}
