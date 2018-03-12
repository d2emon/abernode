'use strict'
/**
 * Program starts Here!
 *
 * This forms the main loop of the code, as well as calling
 * all the initialising pieces
 */

const proxy = require('../proxy')
/*
char lump[256];
int namegiv=0;
char namegt[80];
int qnmrq=0;
*/

// char usrnam[44];

// Once
function login (user) {
/* The whole login system is called from this */
/*
    long un1;
    char usermc[80],a[80],tim[80],dat[80],c;
*/
/*
 *
 *	Check if banned first
 *
 */    
//    chkbnid(cuserid(NULL));
 /*
  *	Get the user name
  *
  */
/*
 * if(!namegiv)
       {
       rena:printf("By what name shall I call you ?\n*");
       getkbd(user,15);
       }
    else
       strcpy(user,namegt);
*/
/*
 *	Check for legality of names
 *
 */
/*
    namegiv=0;
    if (!strlen(user)) goto rena;
    if (any('.',user)>-1) crapup("\nIllegal characters in user name\n");
    trim(user);
    scan(user,user,0," ","");
    if (!strlen(user)) goto rena;
    chkname(user);
    if(!strlen(user)) goto rena;
*/
// strcpy(dat,user);             /* Gets name tidied up */
//    strcpy(usrnam,user);
//    if(!validname(usrnam)) crapup("Bye Bye");
//    if (logscan(dat,a)== -1)       /* If he/she doesnt exist */
//       {
//       printf("\nDid I get the name right %s ?",user);
//       fgets(a,79,stdin);lowercase(a);c=a[0];
//       if (c=='n')  {printf("\n");goto rena;}  /* Check name */
//       }
//    logpass(user);        /* Password checking */
}

// int chkbnid(user)   /* Check to see if UID in banned list */
/*
 * char *user;
    {
    FILE *a;
    char b[80],c[40];
    extern char *strchr();
    strcpy(c,user);
    lowercase(c);
    a=openlock(BAN_FILE,"r+");
    if(a==NULL) return(0);
    while (fgets(b,79,a)!=0)
       {
       if(strchr(b,'\n')) *strchr(b,'\n')=0;
       lowercase(b);
       if (strcmp(b,user)==0)
          {
          crapup("I'm sorry- that userid has been banned from the Game\n");
          }
       }
    fclose(a);
    }
*/
 
//long  logscan(uid,block)     /* Return block data for user or -1 if not exist */
/*
 char *uid;
 char *block;
    {
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
}
*/ 
//void logpass(uid)  /* Main login code */
/*
 * char *uid;
 {
    long a,tries,b;
    char pwd[32],sigf[128],pvs[32],block[128];
    FILE *fl;
    a=logscan(uid,block);
*/
// strcpy(pwd,uid); /* save for new user */
/*
 * if (a==1)
       {
       a=scan(uid,block,0,"",".");
       a=scan(pwd,block,a+1,"",".");
       tries=0;
       pastry:printf("\nThis persona already exists, what is the password ?\n*");
       fflush(stdout);
       gepass(block);
       printf("\n");
       if (strcmp(block,pwd))
          {
          if (tries<2) {tries++;goto pastry;}
          else
             crapup("\nNo!\n\n");
          }
       }
    else
*/
/* this bit registers the new user */
/*
{
		printf("Creating new persona...\n");
		printf("Give me a password for this persona\n");
		repass:printf("*");fflush(stdout);
	        gepass(block);
	        printf("\n");
	        if (any('.',block)!= -1)
                {
                	printf("Illegal character in password\n");
                	goto repass;
                }
	        if (!strlen(block)) goto repass;
	        strcpy(uid,pwd);
	        strcpy(pwd,block);
	        sprintf(block,"%s%s%s%s",uid,".",pwd,"....");
  	        fl=openlock(PFL,"a");
	        if(fl==NULL) 
 	        {
			crapup("No persona file....\n");
		        return;
	       	}
	       qcrypt(block,lump,strlen(block));
	       strcpy(block,lump);
	       fprintf(fl,"%s\n",block);
	       fclose(fl);
       }
    cls();
    }
 

 
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
// char *getkbd(s,l)   /* Getstr() with length limit and filter ctrl */
/*
 * char *s;
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
*/

// listfl -> proxy
// chknolog -> proxy

function getty () { console.log('GETTY') }
function cls () { console.log('CLS') }
function ctime (t) { return 'CTIME(' + t + ')' }
function time () { return 100 }
function talker (user) { console.log('TALKER(' + user +')') }
var qnmrq = 0
// var ttyt = 0
var namegt = ''
var namegiv = 0

module.exports = function (args) {
  /* The initial routine */
  console.log('GMAIN2')
  console.log(args)

  /**
   * Check we are running on the correct host
   * see the notes about the use of flock();
   * and the affects of lockf();
   */
  proxy.gethostname.then(
    result => {
      let b = [0, 0, 0]
      /**
       * Check if there is a no logins file active
       */
      console.info('\n\n\n\n')
      return proxy.chknolog(result)
    },
    error => {
      console.log(error)
      throw Error(error)
    }
  ).then(resonse => {
    if ((args.length == 2) && (args[1][0] == '-')) {
      /**
       * Now check the option entries
       *
       * -n(name)
       */
      let r = args[1].toUpperCase()
      if (r[1] == 'N') {
        qnmrq = 1
        // ttyt = 0
        namegt = args[1].slice(1)
        namegiv = 1
      } else {
        getty()
      }
    } else {
      getty()
    }
    let num = 0
    /**
     * Check for all the created at stuff
     * 
     * We use stats for this which is a UN*X system call
     */
    if (!namegiv) {
      proxy.created.then(
        result => {
          console.log('RESOLVED')
          // console.log(result)
          return ctime(result.atime)
        },
        error => {
          console.error(error)
          return '<unknown>'
        }
      ).then(space => {
        cls()
        console.info('\n' +
          '                         A B E R  M U D\n')
        console.info('\n' +
          '                  By Alan Cox, Richard Acott Jim Finnis\n\n')
        console.info('This AberMUD was created:' + space)
        return proxy.reseted
      }).then(
        result => {
          let ct = time()
          return ct - result
        },
        error => {
          return false
        },
      ).then(r => {
        if (!r) return
        /**
         * Elapsed time and similar goodies
         */
        if (r > 24 * 60 * 60) {
          console.info('Game time elapsed: Over a day!!!\n') /* Add a Day ! */
          // goto skip;
        }		
        console.info('Game time elapsed: ')
        // if(r<61) goto ski2;
        // if(r==60) {printf("1 minute\n");goto skip;};
        // if(r<120){printf("1 minute and ");goto ski2;}
        // if(r/60==60){printf("1 hour\n");goto skip;}
        // if(r<3600) {printf("%d minutes and ",r/60);goto ski2;}
        // if(r<7200) printf("1 hour and ");
        // else
        //   printf("%d hours and ",r/3600);
        // if((r/60)%60!=1) printf("%d minutes.\n",(r/60)%60);
        // else
        //   printf("1 minute\n");
        // goto skip;
        // ski2:
        // if(r%60==1) printf("1 second\n");
        // else printf("%d seconds.\n",r%60);
      })
    } 
    // skip:
    login(response) /* Does all the login stuff */
    if (!qnmrq) {
      proxy.motd.then(
        result => {}
      )
    }
    return proxy.enter(response)
  }).then(
    result => {
      talker(result) /* Run system */
      console.info('Bye Bye') /* Exit */
    },
    error => { throw Error(error) }
  )
}
