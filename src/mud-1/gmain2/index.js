'use strict'
/**
 * Program starts Here!
 *
 * This forms the main loop of the code, as well as calling
 * all the initialising pieces
 */

const moment = require('moment')
const proxy = require('../../proxy')

const testName = ' user USERuserUSERuserUSERuserUSERuserUSERuserUSER'

// let lump = ''
var namegt = ''
var qnmrq = 0

// var namegiv = 0
// let usrnam = ''
// var ttyt = 0

function getty () { console.log('GETTY') }
function cls () { console.log('CLS') }
var talker = user => new Promise((resolve, reject) => {
  console.log('TALKER(' + user +')')
})

/**
 * Now check the option entries
 * -n(name)
 */
function processArgs(args) {
  if (args.length != 2) return false
  if (args[1][0] != '-') return false
  let r = args[1].toUpperCase()
  if (r[1] != 'N') return false
  qnmrq = 1
  // ttyt = 0
  return args[1].slice(2)
}

var login = userdata => new Promise((resolve, reject) => {
  console.log('LOGGIN IN')
  console.log(userdata)
  proxy.login(userdata).then(response => {
    resolve(response)
  }).catch(error => {
    console.log('LOGIN PROXY RETURNED ERROR')
    console.log(error)
    proxy.setusername(testName).then(response => {
      return proxy.reaskusername(response)
    }).then(response => {
      resolve(response)
    }).catch(error => {
      console.log('SECOND LOGIN ERROR')
      console.log(error)
      reject(error)
    })
  })
})

module.exports = function (args, userdata) {
  /* The initial routine */
  console.log('GMAIN2')
  console.log(args)
  console.log(userdata)

  Promise.all([
    proxy.gethostname(userdata),
    proxy.chknolog(userdata)
  ]).then(response => {
    console.info('\n\n\n\n')
    console.log('ARGS')
    console.log(args)
    console.log(userdata)
    console.log(response)
    let r = processArgs(args)
    if (!r) getty()
    console.log(r)
    /**
     * Check for all the created at stuff
     * We use stats for this which is a UN*X system call
     */
    if (r) return r
    return Promise.all([
      new Promise((resolve, reject) => {
        proxy.created.then(
          result => { resolve(result) },
          error => { resolve('<unknown>') },
        )
      }),
      proxy.reseted
    ]).then(response => {
      console.log([args, userdata])
      cls()
      console.info('\n' +
        '                         A B E R  M U D\n')
      console.info('\n' +
        '                  By Alan Cox, Richard Acott Jim Finnis\n\n')
      console.info('This AberMUD was created:' + response[0])
      console.info('Game time elapsed: ' + moment(response[1]).fromNow())
      return r
    })
  }).then(response => {
    return login({
      namegt: namegt,
      result: response
    })
  }).then(
    response => {
      console.log([args, userdata])
      console.log('MESSAGE OF THE DAY', qnmrq)
      if (qnmrq) return 1
      console.log('MOTD')
      console.log(proxy.motd)
      return 'Username'
      // return proxy.motd
    },
    error => {
      console.log('LOGIN ERROR')
      console.log(error)
      throw Error(error)
    }
  ).then(response => {
    console.log(response)
    return Promise.all([
      proxy.enter(response),
      talker(response) // Run system
    ])
  }).then(
    response => {
      console.info('Bye Bye') // Exit
    }
  ).catch(
    error => { console.log('ERROR:\t' + error) }
  )
}
