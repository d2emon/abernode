'use strict'
const fs = require('fs')
const chalk = require('chalk')
const {
  NOLOGIN,
  RESET_N
} = require('../mud-1/files')


var stat = () => new Promise((resolve, reject) => {
  fs.stat(__dirname, (err, stats) => {
    if (err) reject(err)
    else resolve(stats)
  })
})

module.exports = {
  stat: stat,
  requestOpenRead: (filename, lock) => new Promise((resolve, reject) => {
    console.log(chalk.magenta('OPEN(' + filename + ', "r")'))
    if (filename === NOLOGIN) { reject('File not found') }
    resolve({
      filename: filename,
      permissions: 'r',
      lock: lock,
      position: 0,
      length: 10
    })
  }),
  requestOpenAppend: (filename, lock) => new Promise((resolve, reject) => {
    console.log(chalk.magenta('OPEN(' + filename + ', "a")'))
    if (filename === NOLOGIN) { reject('File not found') }
    resolve({
      filename: filename,
      permissions: 'a',
      lock: lock,
      position: 0,
      length: 10
    })
  }),
  requestReadLine: file => new Promise((resolve, reject) => {
    console.log(chalk.magenta('READLINE(' + JSON.stringify(file) + ')'))
    file.position++

    if (file.filename === RESET_N) {
      reject('404')
      /*
      stat().then(
        response => { resolve(response.atime) },
        error => { reject(error) }
      )
      */
    } else {
      resolve('nextline\n')
    }
  }),
  requestReadLines: file => new Promise((resolve, reject) => {
    console.log(chalk.magenta('READLINES(' + JSON.stringify(file) + ')'))
    let answer = ''
    while (file.position < file.length) {
      file.position++
      answer += 'nextline\n'
    }
    console.log(chalk.magenta('CLOSE(' + JSON.stringify(file) + ')'))
    resolve(answer)
  }),
  requestReadArray: file => new Promise((resolve, reject) => {
    console.log(chalk.magenta('READARRAY(' + JSON.stringify(file) + ')'))
    let answer = []
    while (file.position < file.length) {
      file.position++
      answer.push('nextline')
    }
    console.log(chalk.magenta('CLOSE(' + JSON.stringify(file) + ')'))
    resolve(answer)
  }),
  requestPrint: (file, string) => new Promise((resolve, reject) => {
    console.log(chalk.magenta('PRINT(' + JSON.stringify(file) + ')'))
    console.log(chalk.magenta(JSON.stringify(string)))
    file.position++
    resolve(file)
  }),
  requestClose: file => new Promise((resolve, reject) => {
    console.log(chalk.magenta('CLOSE(' + JSON.stringify(file) + ')'))
    resolve(file)
  })

}
