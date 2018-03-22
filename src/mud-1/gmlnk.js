/*
#include "files.h"
#include <stdio.h>
#include "System.h"
*/

WIZZARD = "wisner"

// Server
// server_logscan

/* For delete and edit */
function server_delu2(name) {
  let a = openlock(PFL, "r+")
  let b = openlock(PFT, "w")
  if (!a) return
  if (!b) return
  while (buff = a.fgets(128) != 0) {
    let b2 = scan(dcrypt(buff), 0, "", ".")
    if (name.toLowerCase() != b2.toLowerCase()) b.fprintf(buff)
  }
  a.fclose()
  b.fclose()

  a = openlock(PFL,"w");
  b = openlock(PFT,"r+");
  if (!a) return
  if (!b) return
  while (buff = a.fgets(128) != 0) {
    a.fprintf(buff)
  }
  a.fclose()
  b.fclose()
}

function addUser(user) {
  let fl = openlock(PFL, "a")
  if (!fl) return
  fl.fprintf(qcrypt(data))
  fl.fclose()
}

function replaceUser(name, user) {
  server_delu2(name),
  addUser(user)
}

// Client

function runExe(args) {
  if (!execl(EXE, args)) {
    throw Error("mud.exe : Not found")
  }
}

function shu(name) {
  /* for show user and edit user */
  let user = server_logscan(name)
  if (!user) console.log("\nNo user registered in that name\n\n\n")
  else {
    console.log("\n\nUser Data For " + name + "\n\n")
    console.log("Name:" + user.username)
    console.log("Password:" + user.password)
  }
  return user
}

function getunm() {
  return input("\nUser Name:")
}

function ed_fld(name, string) {
  let bk = input(name + "(Currently " + string + " ):")
  if (bk.indexOf('.') >= 0) {
    console.log("\nInvalid Data Field")
    return ed_fld(name, string)
  }

  if (bk) return bk
  return string
}

function enterGame(user) {
  cls()
  console.log("The Hallway")
  console.log("You stand in a long dark hallway, which echoes to the tread of your")
  console.log("booted feet. You stride on down the hall, choose your masque and enter the")
  console.log("worlds beyond the known......\n")
  runExe([
    "   --{----- ABERMUD -----}--      Playing as ",
    user.name
  ])
}

/* Change your password */
function chpwd(user) {
  function chptagn (prompt) {
    console.log(prompt)
    let pwd = gepass('*')
    if (!pwd) return chptagn('')
    if (pwd == ',') return chptagn('Illegal Character in password')

    console.log("\nVerify Password")
    if (gepass('*') != pwd) return chptagn('\nNO!')
    return pwd
  }

  let block = server_logscan(user)
  console.log("\nOld Password")
  if (gepass('*') != block.password) console.log("\nIncorrect Password")
  else {
    /* delete me and tack me on end! */
    replaceUser(user, {
      username: user,
      password: chptagn("\nNew Password")
    })
    console.log("Changed")
   }
}

function enterTest(user) {
  cls()
  console.log("Entering Test Version")
}

function showUser() {
  cls()
  shu(getunm())
  wait("\nHit Return...\n")
}

function editUser() {
  cls()
  let name = getunm()
  let user = shu(name)
  if (!user) user = {
    username: name,
    password: default,
    v3: 'E'
    v4: null,
    v5: null
  }
  console.log("\nEditing : " + name + "\n\n")
  replaceUser(name, {
    username: ed_fld("Name:", user.username),
    password: ed_fld("Password:", user.password)
  })
}

function delUser() {
  let name = getunm()
  let block = server_logscan(name)
  if (!block) console.log("\nCannot delete non-existant user")
  else server_delu2(name)
}

function talker(user) {
  while (true) {
    if (user.qnmrq) {
      runExe([
        "   --}----- ABERMUD -----{--    Playing as ",
        user.name
      ])
    }
    cls()
    console.log("Welcome To AberMUD II [Unix]\n")
    console.log("Options\n")
    console.log("1]  Enter The Game")
    console.log("2]  Change Password")
    console.log("\n\n0] Exit AberMUD")
    console.log('\n')
    let isawiz = (user.id == WIZZARD)
    if (isawiz) {
      console.log("4] Run TEST game")
      console.log("A] Show persona")
      console.log("B] Edit persona")
      console.log("C] Delete persona")
    }
    console.log('\n')
    console.log("Select > ")
    // l2:
    let z = getkbd().slice(0, 2).toLowerCase()
    if (z=='1') {
      enterGame(user)
    } else if (z == '2') {
      chpwd(user.name)
    } else if (z == '0') {
      process.exit(0)
    } else if (z == '4') {
      if (isawiz) enterTest()
    } else if (z == 'a') {
      if (isawiz) showUser()
    } else if (z == 'b') {
      if (isawiz) editUser()
    } else if (z == 'c') {
      if (isawiz) delUser()
    } else {
      console.log("Bad Option")
    }
  }
}
