'use strict'
/**
 * Program starts Here!
 *
 * This forms the main loop of the code, as well as calling
 * all the initialising pieces
 */

const moment = require('moment')
const chalk = require('chalk')
const proxy = require('../../proxy')

const testName = ' user USERuserUSERuserUSERuserUSERuserUSERuserUSER'
const testPassword = 'passwordPASSWORD'

// let lump = ''
var namegt = ''
var qnmrq = 0

// var namegiv = 0
// let usrnam = ''
// var ttyt = 0

// Dummy vars
var MOTD = 'MOTD'
var HOST_MACHINE = 'HOST_MACHINE'

// Functions
function getty () {
  console.log(chalk.yellow('GETTY'))
  return ''
}
function cls () {
  console.log(chalk.blue('CLS'))
  console.log(chalk.blue('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'))
}
function listfl (filename) { console.log('LISTFL(' + filename + ')') }
function fgets (num, filename) { console.log('FGETS(' + num + ', ' + filename + ')') }
function cuserid () { return 'CUSERID()' }
function syslog (filename) { console.log('SYSLOG(' + filename + ')') }
function fflush__stdout () { console.log('FFLUSH(STDOUT)') }
function gepass () {
  console.log('GEPASS()')
  console.log(chalk.cyan(testPassword))
  return testPassword
}

function analyseArgs(args){
  if (args.length != 2) throw Error('Must recieve only 2 args')
  if (args[1][0] != '-') throw Error('Second arg must begin with -')
  let r = args[1].toUpperCase()
  if (r[1] != 'N') throw Error('Arg must be N')
  qnmrq = 1
  // ttyt = 0
  return args[1].slice(2)
}

// Promises
/**
 * Now check the option entries
 * -n(name)
 */
var parseArgs = args => new Promise((resolve, reject) => {
  return new Promise((resolve, reject) => {
    resolve(analyseArgs(args))
  }).then(response => {
    resolve(response)
  }).catch(error => {
    console.log(chalk.yellow(error))
    resolve(getty())
  })
})
var showSplash = username => new Promise((resolve, reject) => {
  if (username) resolve(username)

  /**
   * Check for all the created at stuff
   * We use stats for this which is a UN*X system call
   */
  Promise.all([
    proxy.request('created', {}),
    proxy.request('reseted', {})
  ]).then(response => {
    let started = response[1] ? moment(response[1]).fromNow() : 'AberMUD ' +
      'has yet to ever start!!!'

    console.log(chalk.magenta('RESPONSE'))
    console.log(chalk.yellow(JSON.stringify(response)))
    cls()
    console.info(chalk.white('\n' +
      '                         A B E R  M U D\n'))
    console.info(chalk.white('\n' +
      '                  By Alan Cox, Richard Acott Jim Finnis\n\n'))
    console.info(chalk.white('This AberMUD was created: ' + response[0]))
    console.info(chalk.white('Game time elapsed: ' + started))
    resolve('')
  }).catch(error => {
    console.error(chalk.red(error))
    resolve('')
  })
})
var newUser = username => new Promise((resolve, reject) => {
  /* this bit registers the new user */
  console.info(chalk.white('Creating new persona...'))
  console.info(chalk.white('Give me a password for this persona'))
  console.info(chalk.red(username))
  // repass:
  console.info(chalk.white('*'))
  fflush__stdout()
  let block = gepass()
  console.info('\n')
  proxy.request('newuser', {
    username: username,
    password: block
  }).then(response => {
    resolve(response)
  }).catch(error => {
    reject(error)
  })
})
var login = userdata => new Promise((resolve, reject) => {
  console.log(chalk.magenta('Logging in as ') + chalk.yellow(userdata))
  proxy.request('login', { username: userdata }).then(response => {
    resolve(response)
  }).catch(error => {
    console.log(chalk.white(error))
    console.log(chalk.cyan(testName))
    // proxy.setusername(testName).then(response => {
    proxy.request('username', { username: testName }).then(response => {
      return proxy.reaskusername(response)
    }).then(response => {
      resolve(response)
    }).catch(error => {
      console.log(chalk.red('SECOND LOGIN ERROR'))
      console.log(error)
      console.log(chalk.red(error.id))
      if (error.id == 10) {
        newUser(error.username).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      } else reject(error)
    })
  })
})
var showMotd = () => new Promise((resolve, reject) => {
  if (qnmrq) resolve(1)
  cls()
  listfl(MOTD) /* list the message of the day */
  let space = fgets(399, null)
  console.log('\n\n')
  resolve(1)

  /*
  console.log([args, userdata])
  console.log('MESSAGE OF THE DAY', qnmrq)
  if (qnmrq) return 1
  console.log('MOTD')
  console.log(proxy.motd)
  return 'Username'
  // return proxy.motd
  */
})
var logEnter = user => new Promise((resolve, reject) => {
  let space = cuserid()
  syslog("Game entry by %s : UID %s", user, space) /* Log entry */
})
var talker = user => new Promise((resolve, reject) => {
  console.log('TALKER(' + user +')')
  resolve(1)

  /*
  console.log(response)
  return Promise.all([
    proxy.enter(response),
    talker(response) // Run system
  ])
  */
})

module.exports = function (args, userdata) {
  /* The initial routine */
  console.log('GMAIN2')
  console.log(chalk.magenta('ARGS'))
  console.log(chalk.yellow(JSON.stringify(args)))
  console.log(chalk.magenta('USERDATA'))
  console.log(chalk.yellow(JSON.stringify(userdata)))
  console.log(chalk.magenta('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-='))

  console.log('\n\n\n\n')
  Promise.all([
    parseArgs(args),
    proxy.request('testhost', { host: userdata.host }),
    proxy.request('chknolog', {})
  ]).then(response => {
    console.log(chalk.magenta('RESPONSE'))
    console.log(chalk.yellow(JSON.stringify(response)))
    console.log(chalk.magenta('USERNAME'))
    console.log(chalk.yellow(response[0]))
    return showSplash(response[0])
  }).then(response => {
    console.log(chalk.magenta('RESPONSE'))
    console.log(chalk.yellow(JSON.stringify(response)))
    return login(response)
    // return login({
    //   namegt: namegt,
    //   result: response
    // })
  }).then(response => {
    return showMotd()
  }).then(response => {
    return logEnter()
  }).then(response => {
    return talker(response) // Run system
  }).then(response => {
    console.info('Bye Bye') // Exit
  }).catch(error => {
    console.error(chalk.red('ERROR:\t' + error))
    console.trace(error)
  })
}
