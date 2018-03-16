'use strict'
console.log('blib.js')
const main = require('./gmain2')
console.log('gmainstubs.js')
console.log('gmlnk.js')
console.log('obdat.js')
console.log('flock.js')

const readline = require('readline')
const {
  HOST_MACHINE
} = require('../files')

function crapup () {
  console.info('\nHit Return to Continue...')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Hit Return to Continue...'
  })

  rl.prompt()

  rl.on('line', (line) => {
    console.log(line)
    console.log('----')
    process.exit(0)
  }).on('close', () => {
    console.log('exit')
    process.exit(0)
  })
  // let a = fgets(63)
  // exit(1);
}

var inc = [
  'object',
  'files',
  'System'
]

console.log(inc)

/*
var commandlines = [
  ['mud.1'],
  ['mud.1', 'username1'],
  ['mud.1', '-username2'],
  ['mud.1', '-Nusername3']
]

commandlines.forEach(cmd => {
  for (let i = 0; i < 4; i++) {
    let host = (i % 2) ? 'HOSTNAME' : HOST_MACHINE
    let username = (i == 3) ? 'USERNAME' : ''
    main(cmd, {
      uid: i,
      username: username,
      host: host
    })
  }
})
*/

main(['mud.1'], {
  uid: 1,
  username: 'username',
  host: HOST_MACHINE
})

// crapup()
