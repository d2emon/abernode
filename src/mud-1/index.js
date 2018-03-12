'use strict'
console.log('blib.js')
const main = require('./gmain2')
console.log('gmainstubs.js')
console.log('gmlnk.js')
console.log('obdat.js')
console.log('flock.js')

const readline = require('readline')

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

main(['mud.1'])
main(['mud.1', 'username1'])
main(['mud.1', '-username2'])
main(['mud.1', '-Nusername3'])
// crapup()
