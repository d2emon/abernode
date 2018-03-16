'use strict'
/**
 * Program starts Here!
 *
 * This forms the main loop of the code, as well as calling
 * all the initialising pieces
 */

const axios = require('axios')
const moment = require('moment')
const chalk = require('chalk')
const readline = require('readline')
const proxy = require('../../proxy')
const {
  cls
} = require('../gmainstubs')
const {
  gepass
} = require('../../blib')

const server = 'http://127.0.0.1:3000'

var qnmrq = 0

// let lump = ''
// var namegt = ''
// var namegiv = 0
// let usrnam = ''
// var ttyt = 0

// Functions
// login -> proxy
// listfl -> proxy
// chknolog -> proxy
// chkbnid -> proxy
// chkname -> proxy
// logpass -> proxy
function fflush__stdout () { console.log('FFLUSH(STDOUT)') }

function analyseArgs(args){
  if (args.length != 2) throw Error('Must recieve only 2 args')
  if (args[1][0] != '-') throw Error('Second arg must begin with -')
  let r = args[1].toUpperCase()
  if (r[1] != 'N') throw Error('Arg must be N')
  qnmrq = 1
  // ttyt = 0
  return args[1].slice(2)
}

var askYN = prompt => new Promise((resolve, reject) => {
  input(prompt).then(response => {
    if (!response) reject(false)
    if (response[0].toLowerCase() == 'n') reject(false)
    resolve(true)
  })
})

function retryUser (userdata, resolve) {
  input('*').then(response => {
    userdata.username = response
    return proxy.request('username', { username: userdata.username })
  }).then(response => {
    cls()
    console.log(JSON.stringify(userdata))
    console.info(chalk.white('\nDid I get the name right ' + userdata.username + ' ?'))
    return askYN('')
  }).then(response => {
    /* Check name */
    return proxy.request('username', userdata)
  }).then(response => {
    console.log(JSON.stringify(response))
    console.log(JSON.stringify(userdata))
    return newUser(userdata)
  }).then(response => {
    resolve(response)
  }).catch(error => {
    console.log(chalk.red('SECOND LOGIN ERROR\t' + JSON.stringify(error)))
    console.log(chalk.red('USERNAME ERROR: ' + JSON.stringify(error)))
    console.log(chalk.red(error.id))
    console.log(error)
    setTimeout(() => {
      retryUser(userdata, resolve)
    }, 500)
  })
}

function retryPass (user, resolve) {
  console.info(chalk.white('*'))
  fflush__stdout()
  let block = gepass()
  console.log(chalk.yellow(block))
  input('*').then(response => {
    console.info('\n')
    user.password = response
    return proxy.request('newuser', user)
  }).then(response => {
    resolve(response)
  }).catch(error => {
    console.log(chalk.red('PASSWORD ERROR: ' + JSON.stringify(error)))
    console.log(error)
    setTimeout(() => {
      retryPass(user, resolve)
    }, 500)
  })
}

var input = prompt => new Promise((resolve, reject) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan(prompt)
  })

  rl.prompt()

  rl.on('line', (line) => {
    // console.log(chalk.cyan(line))
    rl.close()
    resolve(line)
  })
})

// Promises
/**
 * Now check the option entries
 * -n(name)
 */
var parseArgs = (args, userdata) => new Promise((resolve, reject) => {
  return new Promise((resolve, reject) => {
    resolve(analyseArgs(args))
  }).then(response => {
    resolve(response)
  }).catch(error => {
    console.log(chalk.red(error))
    resolve(userdata.username)
  })
})
var showSplash = username => new Promise((resolve, reject) => {
  if (username) {
    resolve(username)
    return
  }

  /**
   * Check for all the created at stuff
   * We use stats for this which is a UN*X system call
   */
  axios.get(server + '/stats').then(response => {
    let started = response.data.reset ? moment(response.data.reset).fromNow() :
      'AberMUD has yet to ever start!!!'

    cls()
    console.info(chalk.white('\n' +
      '                         A B E R  M U D\n'))
    console.info(chalk.white('\n' +
      '                  By Alan Cox, Richard Acott Jim Finnis\n\n'))
    console.info(chalk.white('This AberMUD was created: ' + response.data.created))
    console.info(chalk.white('Game time elapsed: ' + started))
    resolve(username)
  }).catch(error => {
    console.error(chalk.red(error))
    console.error(chalk.yellow(error.response.data.error))
    // console.trace(error)
    resolve(username)
  })
})
var login = userdata => new Promise((resolve, reject) => {
  console.log(chalk.magenta('TRYING TO LOG IN AS ') +
    chalk.yellow(JSON.stringify(userdata)))
  axios.post(server + '/login', {
    uid: userdata.uid,
    username: userdata.username
  }).then(response => {
    userdata.response = response
    resolve(userdata)
  }).catch(error => {
    console.log(chalk.red(error))
    console.log(chalk.yellow(error.response.data.error))
    retryUser(userdata, resolve)
  })
})

/* If he/she doesnt exist */
var newUser = user => new Promise((resolve, reject) => {
  cls()
  console.info(chalk.white('Creating new persona...'))
  console.info(chalk.white('Give me a password for this persona'))
  console.info(chalk.red(JSON.stringify(user.username)))
  /* this bit registers the new user */
  retryPass(user, resolve)
})
/* list the message of the day */
var showMotd = () => new Promise((resolve, reject) => {
  if (qnmrq) resolve(1)
  proxy.request('motd', {}).then(response => {
    cls()
    console.log('\n\n')
    console.log(chalk.white(response))
    return input('')
  }).then(response => {
    resolve(true)
  }).catch(error => {
    console.log(chalk.red(error))
    resolve(true)
  })
})
var talker = user => new Promise((resolve, reject) => {
  // Run system
  proxy.request('talker', { user: user }).then(response => {
    console.log(response)
    resolve(response)
  }).catch(error => {
    console.log('ERROR:\t' + JSON.stringify(error))
    reject(error)
  })
})

module.exports = function (args, userdata) {
  /* The initial routine */
  console.log(chalk.magenta('ARGS\t') +
    chalk.yellow(JSON.stringify(args)))
  console.log(chalk.magenta('DATA\t') +
    chalk.yellow(JSON.stringify(userdata)))
  cls()
  console.log('\n\n\n\n')

  var user = ''
  parseArgs(args, userdata).then(response => {
    console.log(chalk.magenta('RESPONSE\tPARSE\t') +
      chalk.yellow(JSON.stringify(response)))
    return showSplash(response)
  }).then(response => {
    console.log(chalk.magenta('RESPONSE\tSPLASH\t') +
      chalk.yellow(JSON.stringify(response)))
    userdata.username = response
    return login(userdata)
  }).then(response => {
    console.log(chalk.magenta('RESPONSE\tLOGIN\t') +
      chalk.yellow(JSON.stringify(response)))
    user = response
    return showMotd()
  }).then(response => {
    console.log(chalk.magenta('RESPONSE\tMOTD\t') +
      chalk.yellow(JSON.stringify(response)))
    console.log(user)
    return talker(user) // Run system
  }).then(response => {
    console.info('Bye Bye') // Exit
  }).catch(error => {
    console.error(chalk.red('ERROR:\t' + JSON.stringify(error)))
    console.trace(error)
  })
}
