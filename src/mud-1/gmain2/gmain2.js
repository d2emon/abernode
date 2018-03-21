'use strict'

// char lump[256];
// int namegiv=0;
// char namegt[80];
// int qnmrq=0;

function main(argc, argv) {}
/* The initial routine */
/*
int argc;
char *argv[];
    {
    long r;
    FILE *a;
    char user[80],b[40],space[400];
    int num;
    struct stat statbuf;
    long ct;
 */
/*
 *	Check we are running on the correct host
 *	see the notes about the use of flock();
 *	and the affects of lockf();
 */
/*
    gethostname(user,33);
    if(strcmp(user,HOST_MACHINE))
    {
    	fprintf(stderr,"AberMUD is only available on %s, not on %s\n",
    			HOST_MACHINE,user);
    	exit(1);
    }
    b[0]=0;b[1]=0;b[2]=0;
 */
/*
 *
 *		Check if there is a no logins file active
 *
 *
 */
/*
    printf("\n\n\n\n");
    chknolog();
    if ((argc==2)&&(argv[1][0]=='-'))
       {
       uppercase(argv[1]);
 */
/*
 *	Now check the option entries
 *
 *		-n(name)
 */
/*
       r=argv[1][1];
       switch(r)
          {
          case 'N':
             qnmrq=1;ttyt=0;strcpy(namegt,argv[1]+2);namegiv=1;break;
          default:
             getty();
             }
       }
    else
       getty();
    num=0;
 */
/*
 *	Check for all the created at stuff
 *
 *	We use stats for this which is a UN*X system call
 *
 */
/*
    if(!namegiv){
       if(stat(EXE,&statbuf)== -1)strcpy(space,"<unknown>\n");
       else
       {
       		strcpy(space,ctime(&(statbuf.st_mtime)));
       }
       cls();
       printf("\
                         A B E R  M U D\n");printf("\
                  By Alan Cox, Richard Acott Jim Finnis\n\n");
       printf("This AberMUD was created:%s",space);
       a=fopen(RESET_N,"r");
       if(a==NULL)
       {
       	   printf("AberMUD has yet to ever start!!!\n");
       	   goto skip;
       	}
       fscanf(a,"%ld",&r);
       fclose(a);
       time(&ct);
       r=ct-r;
 */
/*
 *
 *	Elapsed time and similar goodies
 *
 */
/*

       if(r>24*60*60)
	{
		printf("Game time elapsed: Over a day!!!\n");
		goto skip;
        }
       printf("Game time elapsed: ");
       if(r<61) goto ski2;
       if(r==60) {printf("1 minute\n");goto skip;};
       if(r<120){printf("1 minute and ");goto ski2;}
       if(r/60==60){printf("1 hour\n");goto skip;}
       if(r<3600) {printf("%d minutes and ",r/60);goto ski2;}
       if(r<7200) printf("1 hour and ");
       else
          printf("%d hours and ",r/3600);
       if((r/60)%60!=1) printf("%d minutes.\n",(r/60)%60);
       else
          printf("1 minute\n");
       goto skip;
       ski2:if(r%60==1) printf("1 second\n");
       else
          printf("%d seconds.\n",r%60);
       }
    skip:login(user);
 */
/* Does all the login stuff */
/*
    if(!qnmrq)
       {
	       cls();
	       listfl(MOTD);
 */
/* list the message of the day */
/*
	       fgets(space,399,stdin);
	       printf("\n\n");
       }
	cuserid(space);
	syslog("Game entry by %s : UID %s",user,space);
 */
/* Log entry */
/*
	talker(user);
 */
/* Run system */
/*
	crapup("Bye Bye");
 */
/* Exit */
/*
}
 */

// char usrnam[44];

/* The whole login system is called from this */
function login(user) {
  /*
   *	Check if banned first
   */
  chkbnid(cuserid())
  /*
   *	Get the user name
   */
  function rena() {
    console.log("By what name shall I call you ?\n*")
    return rena2(getkbd(15))
  }
  /*
   *	Check for legality of names
   */
  function rena2(user) {
    if (!user) return rena()
    if (user.indexOf('.') >= 0) throw Error("\nIllegal characters in user name\n")
    user = user.trim()
    user = scan(user, 0, " ", "")
    if (!user) return rena()
    user = chkname(user)
    if (!user) return rena()
    let data = user /* Gets name tidied up */
    let usrnam = user
    if (!validname(usrnam)) throw Error("Bye Bye")
    if (!logscan(dat, a)){
      /* If he/she doesnt exist */
      console.log("\nDid I get the name right %s?", user)
      let a = stdin.gets(79).toLowerCase()
      let c = a[0]
      if (c == 'n')  return rena()
      /* Check name */
    }
    return user
  }
  if (!namegiv) {
    user = rena()
  } else {
    user = rena2(namegt)
  }
  logpass(user)
  /* Password checking */
}

/* Check to see if UID in banned list */
function chkbnid(user) {
  let c = user.toLowerCase()
  let a = openlock(BAN_FILE, "r+")
  if (!a) return true
  while (let b = a.fgets(79) != 0) {
    if (b.indexOf('\n') >= 0) b[b.indexOf('\n')] = 0
    let b = b.toLowerCase(b)
    if (b == user) {
      throw Error("I'm sorry- that userid has been banned from the Game\n")
    }
  }
  a.fclose()
}

/* Return block data for user or -1 if not exist */
function logscan(uid, block) {
  let wk2 = uid
  let unit = openlock(PFL, "r")
  let f = 0
  if (!unit) throw Error("No persona file\n")
  while (block = unit.fgets(255) != 0) {
    let lump = dcrypt(block)
    block = lump
    let wkng = scan(block, 0, "", ".")
    if (wkng.toLowerCase() == wk2.toLowerCase()) return true
  }
  unit.fclose()
  return false
}

/* Main login code */
function logpass(uid) {
  function pastry(tries) {
    console.log("\nThis persona already exists, what is the password ?\n*")
    stdout.fflush()
    block = gepass()
    if (block != pwd) {
      if (tries < 2) {
        tries++
        return pastry(tries)
      } else throw Error("\nNo!\n\n")
    }
    return true
  }
  function repass(uid) {
    console.log("*")
    stdout.fflush()
    let block = gepass()
    console.log("\n")
    if (block.indexOf('.') >= 0) {
      console.log("Illegal character in password\n")
      return repass()
    }
    if (block.length) return repass()
    let pwd = block
    block = uid + "." + pwd + "...."
    let fl = openlock(PFL, "a")
    if (!fl) {
      throw Error("No persona file....\n")
    }
    lump = qcrypt(block)
    block = lump
    fl.fprintf("%s\n", block)
    fl.fclose()
    return true
  }
  let block = ''
  let a = logscan(uid, block)
  let pwd = uid /* save for new user */
  if (a) {
    a = scan(block, 0, "", ".")
    uid = a.output
    a = scan(block, a+1, "", ".")
    pwd = a.output
    pastry(0)
  } else {
    /* this bit registers the new user */
    console.log("Creating new persona...\n")
    console.log("Give me a password for this persona\n")
    repass()
  }
  cls()
}

function getunm() {
  console.log("\nUser Name:")
  return stdin.fgets(79)
}

function showuser() {
  cls()
  let name = getunm()
  shu(name, block)
  console.log("\nHit Return...\n")
  while (getchar() != '\n') {}
}

function shu(name, block) {
  /* for show user and edit user */
  let a = logscan(name, block)
  if (!a) console.log("\nNo user registered in that name\n\n\n")
  else {
    console.log("\n\nUser Data For %s\n\n", name)
    let nm = scan(block, 0, "", ".")
    let pw = scan(block, nm.id + 1, "", ".")
    console.log("Name:%s\nPassword:%s\n", nm.output, pw.output)
  }
  return a
}

function deluser() {
  let name = getunm()
  let a = logscan(name, block)
  if (!a) console.log("\nCannot delete non-existant user\n")
  else {
    delu2(name)
  }
}

function edituser() {
  cls()
  let name = getunm()
  let a = shu(name, block)
  if (!a) block = name + ".default.E.."
  let nam2 = scan(block, 0, "", ".")
  let pas2 = scan(block, nam2.id + 1, "", ".")
  console.log("\nEditing : %s\n\n", name)
  ed_fld("Name:", nam2)
  ed_fld("Password:", pas2)
  let bk2 = nam2 + "." + pas2 + ".....")
  delu2(name)
  let fl = openlock(PFL, "a")
  if (!fl) return
  bk2 = qcrypt(bk2)
  fl.fprintf("%s\n",bk2)
  fl.fclose()
}

function ed_fld(name, string) {
    char bk[128];
  bafld:
  console.log("%s(Currently %s ):", name, string)
  bk = stdin.fgets(128)
  if (bk[0] == '.') bk = ""
  if (bk.indexOf('.') >= 0) {
    printf("\nInvalid Data Field\n")
    return ed_fld(name, string)
  }
  if (bk) string = bk
}

/* For delete and edit */
function delu2(name) {
  let a = openlock(PFL, "r+")
  let b = openlock(PFT, "w")
  if (!a) return
  if (!b) return
  while (buff = a.fgets(128) != 0) {
    let lump = dcrypt(buff)
    let b2 = scan(lump, 0, "", ".")
    let b3 = name.toLowerCase()
    if (b3 == b2.toLowerCase()) b.fprintf("%s",buff)
  }
  a.fclose()
  b.fclose()

  a = openlock(PFL,"w");
  b = openlock(PFT,"r+");
  if (!a) return
  if (!b) return
  while (buff = a.fgets(128) != 0) {
    a.fprintf("%s", buff)
  }
  a.fclose()
  b.fclose()
}

function chpwd(user) {
  /* Change your password */
    char block[128]
    long a;
    FILE *fl;
  function chptagn () {
    console.log("*")
    stdout.fflush()
    let pwd = gepass()
    if (!pwd) return chptagn()
    if (pwd == ',') {
      console.log("Illegal Character in password\n")
      return chptagn()
    }
    console.log("\nVerify Password\n*")
    let pv = gepass()
    console.log("\n")
    if (pv != pwd) {
      console.log("\nNO!\n")
      return chptagn()
    }
    return pwd
  }
  let data = user
  logscan(user, block)
  user = data
  data = scan(block, 0, "", ".")
  pwd = scan(block, data.id + 1, "", ".")
  console.log("\nOld Password\n*")
  stdout.fflush()
  data = gepass()
  if (data != pwd) console.log("\nIncorrect Password\n")
  else {
    console.log("\nNew Password\n")
    pwd = chptagn()
    block = user + "." + pwd + "....."
    delu2(user)  /* delete me and tack me on end! */
    let fl = openlock(PFL, "a")
    if (!fl) return
    block = qcrypt(block)
    fl.fprintf("%s\n",block)
    fl.fclose(fl)
    console.log("Changed\n")
   }
}


char *getkbd(s,l)   /* Getstr() with length limit and filter ctrl */
 char *s;
 int l;
    {
    char c,f,n;
    f=0;c=0;
    while(c<l)
       {
       regec:n=getchar();
       if ((n<' ')&&(n!='\n')) goto regec;
       if (n=='\n') {s[c]=0;f=1;c=l-1;}
       else
          s[c]=n;
       c++;
       }
    if (f==0) {s[c]=0;while(getchar()!='\n');}
    return(s);
    }



void listfl(name)
 char *name;
    {
    FILE * unit;
    char string[82];
    printf("\n");
    unit=openlock(name,"r+");
    if (unit==NULL)
    {
    	printf("[Cannot Find -> %s]\n",name);
        return;
    }
    while(fgets(string,128,unit)!=0)
       {
       printf("%s",string);
       }
    fclose(unit);
    printf("\n");
    }

void crapup(ptr)
 char *ptr;
    {
    char a[64];
    printf("\n%s\n\nHit Return to Continue...\n",ptr);
    fgets(a,63,stdin);
    exit(1);
    }

/*
 *		This is just a trap for debugging it should never get
 *		called.
 */

void bprintf()
{
	printf("EEK - A function has trapped via the bprintf call\n");
	exit(0);
}

int chkname(user)
char *user;
{
long a;
a=0;
lowercase(user);
while(user[a])
{
if(user[a]>'z') {user[a]=0;return(-1); }
if(user[a]<'a') {user[a]=0;return(-1);}
a++;
}
user[0]-=32;
return(0);
}
void chknolog()
{
FILE *a;
char b[128];
a=fopen(NOLOGIN,"r");
if(a==NULL) return;
while(fgets(b,128,a))
{
printf("%s",b);
}
fclose(a);
exit(0);
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

/*
void getunm(name)
 char *name;
    {
    printf("\nUser Name:");
    fgets(name,79,stdin);
    }

void showuser()
    {
    long a;
    char name[80],block[256];
    cls();
    getunm(name);
    shu(name,block);
    printf("\nHit Return...\n");
    while(getchar()!='\n');
    }
 */
// long shu(name,block)  /* for show user and edit user */
/*
 * char *name,*block;
    {
    long a;
    long x;
    char nm[128],pw[128],pr[128],pv[128];
    a=logscan(name,block);
    if (a== -1) printf("\nNo user registered in that name\n\n\n");
    else
       {
       printf("\n\nUser Data For %s\n\n",name);
       x=scan(nm,block,0,"",".");
       x=scan(pw,block,x+1,"",".");
       printf("Name:%s\nPassword:%s\n",nm,pw);
       }
    return(a);
    }

void deluser()
{
    long a;
    char name[80],block[256];
    getunm(name);
    a=logscan(name,block);
    if (a== -1) printf("\nCannot delete non-existant user\n");
    else
    {
	delu2(name);
    }
}

void edituser()
    {
    long a;
    FILE *fl;
    char name[80],block[256],bk2[256];
    char nam2[128],pas2[128],per2[128],pr2[128];
    cls();
    getunm(name);
    a=shu(name,block);
    if (a== -1) sprintf(block,"%s%s",name,".default.E..");
    a=scan(nam2,block,0,"",".");
    a=scan(pas2,block,a+1,"",".");
    printf("\nEditing : %s\n\n",name);
    ed_fld("Name:",nam2);
    ed_fld("Password:",pas2);
    sprintf(bk2,"%s%s%s%s%s%s%s%s",nam2,".",pas2,".",".",".",".",".");
    delu2(name);
    fl=openlock(PFL,"a");
    if(fl==NULL) return;
    qcrypt(bk2,lump,strlen(bk2));
    strcpy(bk2,lump);
    fprintf(fl,"%s\n",bk2);
    fclose(fl);
    }

void ed_fld(name,string)
 char *name,*string;
    {
    char bk[128];
    bafld:printf("%s(Currently %s ):",name,string);
    fgets(bk,128,stdin);
    if(bk[0]=='.') strcpy(bk,"");
    if(strchr(bk,'.')){printf("\nInvalid Data Field\n");goto bafld;}
    if (strlen(bk)) strcpy(string,bk);
    }
*/
// void delu2(name)   /* For delete and edit */
/*
 * char *name;
    {
    char b2[128],buff[128];
    FILE *a;
    FILE *b;
    char b3[128];
    a=openlock(PFL,"r+");
    b=openlock(PFT,"w");
    if(a==NULL) return;
    if(b==NULL) return;
    while(fgets(buff,128,a)!=0)
       {
       dcrypt(buff,lump,strlen(buff)-1);
       scan(b2,lump,0,"",".");
       strcpy(b3,name);lowercase(b3);
       if (strcmp(b3,lowercase(b2))) fprintf(b,"%s",buff);
       }
    fclose(a);
    fclose(b);
    a=openlock(PFL,"w");
    b=openlock(PFT,"r+");
    if(a==NULL) return;
    if(b==NULL) return;
    while(fgets(buff,128,b)!=0)
       {
       fprintf(a,"%s",buff);
       }
    fclose(a);
    fclose(b);
    }

*/
// void chpwd(user)   /* Change your password */
/*
 * char *user;
    {
    char block[128],data[128],pwd[80],pv[80];
    long a;
    FILE *fl;
    strcpy(data,user);
    logscan(user,block);
    strcpy(user,data);
    a=scan(data,block,0,"",".");
    a=scan(pwd,block,a+1,"",".");
    printf("\nOld Password\n*");
    fflush(stdout);
    gepass(data);
    if(strcmp(data,pwd)) printf("\nIncorrect Password\n");
    else
       {
       printf("\nNew Password\n");
       chptagn:printf("*");
       fflush(stdout);
       gepass(pwd);
       printf("\n");
       if (!strlen(pwd)) goto chptagn;
       if (strchr(pwd,','))
	{
		printf("Illegal Character in password\n");
		goto chptagn;
	}
       printf("\nVerify Password\n*");
       gepass(pv);
       printf("\n");
       if (strcmp(pv,pwd))
       {
		printf("\nNO!\n");
		goto chptagn;
	}
       sprintf(block,"%s%s%s%s%s%s%s%s",user,".",pwd,".",".",".",".",".");
  */
// delu2(user);  /* delete me and tack me on end! */
/*
 * fl=openlock(PFL,"a");
       if(fl==NULL) return;
       qcrypt(block,lump,strlen(block));
       strcpy(block,lump);
       fprintf(fl,"%s\n",block);
       fclose(fl);
       printf("Changed\n");
   }
}

*/

/*
 *		This is just a trap for debugging it should never get
 *		called.
 */
/*
void bprintf()
{
	printf("EEK - A function has trapped via the bprintf call\n");
	exit(0);
}
*/
