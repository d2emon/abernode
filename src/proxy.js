'use strict'
const fs = require('fs')
const {
  EXE,
  NOLOGIN,
  RESET_N,
  MOTD,
  HOST_MACHINE
} = require('./mud-1/files.js')

function stat (file) { return 'STAT(' + file + ')' }
function fopen (filename, mode) {
  if (filename == 'NOLOGIN') return 0
  console.log('FOPEN(' + filename + ', ' + mode + ')')
  return 1
}
function openlock (filename, mode) {
  console.log('OPENLOCK(' + filename + ', ' + mode + ')')
  return 1
}
function fscanf (file) {
  console.log('FSCANF(' + file + ')')
  return file
}
function fclose (file) { console.log('FCLOSE(' + file +')') }
function fgets (file) { console.log('FGETS(' + file +')') }
function cuserid () { return 'CUSERID' }
function cls () { console.log('CLS') }

function listfl (name) { return new Promise((resolve, reject) => {
    let string = ''
    console.info('\n')
    let unit = openlock(name, 'r+')
    if (!unit) {
      console.info('[Cannot Find -> ' + name + ']\n')
      reject('[Cannot Find -> ' + name + ']\n')
    }
    while (string = fgets(128)) {
      console.info(string)
    }
    fclose(unit)
    console.info('\n')
  })
}

module.exports = {
  gethostname: new Promise((resolve, reject) => {
    let user = HOST_MACHINE
    if (user === HOST_MACHINE) resolve(user)
    else reject('AberMUD is only available on ' + HOST_MACHINE +
      ', not on ' + user + '\n')
  }),
  chknolog: user => new Promise((resolve, reject) => {
    console.log('CHKNOLOG')

    let a = fopen(NOLOGIN, 'r')
    if (!a) resolve(user)

    let b = ''
    while(b = fgets(128, a)) {
      console.info(b)
    }
    fclose(a)
    reject(0)
  }),
  created: new Promise((resolve, reject) => {
    console.log(stat(EXE))
    fs.stat(__dirname, (err, stats) => {
      if (err) reject(err)
      else resolve(stats)
    })
  }),
  reseted: new Promise((resolve, reject) => {
    let a = fopen(RESET_N, 'r')
    if (!a) {
      console.info('AberMUD has yet to ever start!!!\n')
      // goto skip
      reject('AberMUD has yet to ever start!!!\n')
    }
    let r = fscanf(a)
    fclose(a)
    resolve(r)
  }),
  motd: new Promise((resolve, reject) => {
    cls()
    /* list the message of the day */
    listfl(MOTD).then(
      result => {
        let space = fgets(399)
        console.info('\n\n')
        resolve()
      }
    )
  }),
  enter: user => new Promise((resolve, reject) => {
    console.log('Game entry by ' + user + ' : UID ' + cuserid())
    /* Log entry */ // syslog
    resolve(user)
  })
}
