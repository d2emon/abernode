'use strict'

// char lump[256];
// int namegiv=0;
// char namegt[80];
// int qnmrq=0;

// Server
function server_chkname(user) {
  user.toLowerCase().forEach(a => {
    if (a > 'z') return false
    if (a < 'a') return false
  })
  return true
}

/* The whole login system is called from this */
function server_login (user) {
  /**
   * Check if banned first
   */
  server_chkbnid(cuserid())

  if (!user) return { isNew: false, username: '' }
  if (user.indexOf('.') >= 0) throw Error("\nIllegal characters in user name\n")
  user = user.trim()
  user = scan(user, 0, " ", "")
  if (!user) return { isNew: false, username: '' }
  if (!server_chkname(user)) return { isNew: false, username: '' }
  /* Gets name tidied up */
  let usrnam = user
  if (!validname(usrnam)) throw Error("Bye Bye")
  let isNew = !server_logscan(user)
  return { isNew: isNew, username: user, password: null }
}

/* Check to see if UID in banned list */
function server_chkbnid(user) {
  let c = user.toLowerCase()
  let a = openlock(BAN_FILE, "r+")
  if (!a) return true
  a.forEach(b => {
    if (b.toLowerCase() == user) {
      throw Error("I'm sorry- that userid has been banned from the Game")
    }
  })
  a.fclose()
}

/* Return block data for user or -1 if not exist */
function server_logscan(uid) {
  let unit = openlock(PFL, "r")
  if (!unit) throw Error("No persona file\n")
  unit.forEach(block => {
    let wkng = scan(dcrypt(block), 0, "", ".")
    if (wkng.output.toLowerCase() == uid.toLowerCase()) {
      return {
        username: wkng.output,
        password: scan(block, wkng.id + 1, "", ".").output
      }
    }
  })
  unit.fclose()
  return false
}

function server_logpass(user) {
  if (!user.password.length) return { error: true }
  if (user.password.indexOf('.') >= 0) {
    return { error: "Illegal character in password" }
  }

  let block = [
    user.username,
    user.password
    null,
    null,
    null,
    null
  ]

  let fl = openlock(PFL, "a")
  if (!fl) throw Error("No persona file....\n")
  fl.fprintf(qcrypt(block))
  fl.fclose()
  return { user: block }
}

function server_listfl (name) {
  let unit = openlock(name, "r+")
  if (!unit) return "[Cannot Find -> " + name + "]"
  let text = ""
  unit.forEach(string => {
    text += string
  })
  unit.fclose()
  return text
}

function server_chknolog() {
  let a = fopen(NOLOGIN, "r")
  if(!a) return
  let text = ''
  a.forEach(b => {
    text += b
  })
  a.fclose()
  throw Error(text)
}



// Client
/* The initial routine */
function main(arg) {
  FILE *a;
  long ct;

  /**
   * Check we are running on the correct host
   * see the notes about the use of flock();
   * and the affects of lockf();
   */
  let user = gethostname(33)
  if (user != HOST_MACHINE) {
    throw Error('AberMUD is only available on ' + HOST_MACHINE + ', not on ' + user)
  }
  let b = [0, 0, 0]
  /**
   * Check if there is a no logins file active
   */
  console.log("\n\n\n\n")
  server_chknolog()
  if ((arg.length == 2) && (arg[1][0] == '-')) {
    let a = arg[1].toUpperCase()
    /**
     * Now check the option entries
     *
     * -n(name)
     */
    if a[1] == 'N' {
       qnmrq = 1
       ttyt = 0
       namegt = a + 2
    } else getty()
  } else getty()
  let num = 0
  /**
   * Check for all the created at stuff
   *	We use stats for this which is a UN*X system call
   */
  if (!namegt) {
    let statbuf = stat(EXE)
    let space = ''
    if (!statbuf) space = "<unknown>"
    else space = ctime(statbuf.st_mtime)
    cls()
    console.log("\
                       A B E R  M U D")
    console.log("\
                By Alan Cox, Richard Acott Jim Finnis\n")
    console.log("This AberMUD was created:" + space)
    let a = fopen(RESET_N, "r")
    if (!a) {
      console.log("AberMUD has yet to ever start!!!")
      // goto skip;
    }
    let r = a.fscanf()
    a.fclose()
    let ct = time()
    r = ct -r
    /**
     * Elapsed time and similar goodies
     */
    login(user)
    /* Does all the login stuff */
    if (!qnmrq) {
      cls()
      server_listfl(MOTD)
      /* list the message of the day */
      space = stdin.fgets(399)
      console.log("\n\n")
    }
    space =
    syslog("Game entry by " + user + " : UID " + cuserid())
    /* Log entry */
    talker(user)
    /* Run system */
    console.log("Bye Bye");
    /* Exit */
}

// char usrnam[44];

/**
 *	Check for legality of names
 */
function login(user) {
  /**
   * Get the user name
   */
  if (!namegiv) {
    console.log("By what name shall I call you ?\n*")
    user = getkbd().slice(0, 15)
  } else {
    user = namegt
  }

  let response = server_login(user)
  if (!response.username) return rena(false)
  if (response.isNew){
    /* If he/she doesnt exist */
    console.log("Did I get the name right " + user + "?")
    let a = stdin.gets(79).toLowerCase()
    if (a[0] == 'n')  return rena(false)
    /* Check name */
  }

  return logpass(response)
  /* Password checking */
}

/* Main login code */
function logpass(uid) {
  function pastry(tries, user) {
    console.log("\nThis persona already exists, what is the password ?\n*")
    stdout.fflush()
    if (gepass() != user.password) {
      if (tries < 2) {
        tries++
        return pastry(tries, user)
      } else throw Error("\nNo!\n\n")
    }
    return true
  }
  function repass(user) {
    console.log("*")
    stdout.fflush()
    user.password = gepass()
    let response = server_logpass(user)
    if (response.error) {
      console.log(response.error)
      return repass(user)
    }
    return true
  }

  let block = server_logscan(uid)
  if (block) {
    pastry(0, {
      username: block.output,
      password: block.output
    })
  } else {
    /* this bit registers the new user */
    console.log("Creating new persona...\n")
    console.log("Give me a password for this persona\n")
    repass({
      username: uid,
      password: ''
    })
  }
  cls()
}

function listfl (name) {
  console.log("\n" + server_listfl(name) + "\n")
}

/**
 * This is just a trap for debugging it should never get
 * called.
 */
function bprintf() {
  throw Error('EEK - A function has trapped via the bprintf call')
}






function logscan(uid, block){
  /* Return block data for user or -1 if not exist */
  /*
      FILE *unit;
      long f;
      extern char lump[];
      char wkng[128],wk2[128];
      strcpy(wk2,uid);
      unit=openlock(PFL,"r");f=0;
      if(unit==NULL) crapup("No persona file\n");
      while((f==0)&&(fgets(block,255,unit)!=0))
         {
         dcrypt(block,lump,strlen(block));
         strcpy(block,lump);
         scan(wkng,block,0,"",".");
         if (strcmp(lowercase(wkng),lowercase(wk2))==0)f=1;
         }
      fclose(unit);
      if (f==0) return(-1);
      return(1);
  */
}
