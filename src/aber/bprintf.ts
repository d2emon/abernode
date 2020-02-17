import State from './state';
import {logger} from './files';
import {getPlayer} from "./support";

/*
#include "files.h"

long pr_due=0;
*/

const bprintf = (state: State, message: string): Promise<void> => {
    /* Max 240 chars/msg */
    if (message.length > 235) {
        return logger.write('Bprintf Short Buffer overflow')
            .then(() => crapup(state, 'Internal Error in BPRINTF'));
    }
    /* Now we have a string of chars expanded */
    quprnt(state, message);
};

/* The main loop */

/*

void dcprnt(str,file)
 char *str;
 FILE *file;
    {
    long ct;
    ct=0;
    while(str[ct])
       {
       if(str[ct]!='\001'){fputc(str[ct++],file);continue;}
       ct++;
       switch(str[ct++])
          {
          case 'f':
             ct=pfile(str,ct,file);continue;
          case 'd':
             ct=pndeaf(str,ct,file);continue;
          case 's':
             ct=pcansee(str,ct,file);continue;
          case 'p':
             ct=prname(str,ct,file);continue;
          case 'c':
             ct=pndark(str,ct,file);continue;
          case 'P':
             ct=ppndeaf(str,ct,file);continue;
          case 'D':
             ct=ppnblind(str,ct,file);continue;
          case 'l':
             ct=pnotkb(str,ct,file);continue;
          default:
             strcpy(str,"");
             loseme();crapup("Internal $ control sequence error\n");
             }
       }
    }

int pfile(str,ct,file)
 char *str;
 FILE *file;
    {
    extern long debug_mode;
    char x[128];
    ct=tocontinue(str,ct,x,128);
    if(debug_mode) fprintf(file,"[FILE %s ]\n",str);
    f_listfl(x,file);
    return(ct);
    }

int pndeaf(str,ct,file)
 char *str;
 FILE *file;
    {
    char x[256];
    extern long ail_deaf;
    ct=tocontinue(str,ct,x,256);
    if(!ail_deaf)fprintf(file,"%s",x);
    return(ct);
    }

 pcansee(str,ct,file)
 char *str;
 FILE *file;
    {
    char x[25];
    char z[257];
    long a;
    ct=tocontinue(str,ct,x,23);
    a=fpbns(x);
    if(!seeplayer(a))
       {
       ct=tocontinue(str,ct,z,256);
       return(ct);
       }
    ct=tocontinue(str,ct,z,256);
    fprintf(file,"%s",z);
    return(ct);
    }

 prname(str,ct,file)
 char *str;
 FILE *file;
    {
    char x[24];
    ct=tocontinue(str,ct,x,24);
    if(!seeplayer(fpbns(x)))
    fprintf(file,"Someone");
    else
      fprintf(file,"%s",x);
    return(ct);
    }


int pndark(str,ct,file)
 char *str;
 FILE *file;
    {
    char x[257];
    extern long ail_blind;
    ct=tocontinue(str,ct,x,256);
    if((!isdark())&&(ail_blind==0))
    fprintf(file,"%s",x);
    return(ct);
    }
*/

const tocontinue = (state: State, text: string, offset: number, output: string, maxLength: number): Promise<number> => {
    while(!text.substr(offset).startsWith('[\\')) {
        output += text[offset];
        offset += 1;
    }
    if (output.length >= maxLength) {
        return logger.write('IO_TOcontinue overrun')
            .then(() => crapup(state, 'Buffer OverRun in IO_TOcontinue'))
            .then(() => 0);
    }
    return Promise.resolve(offset + 1);
};

const seeplayer = (state: State, playerId: number): Promise<boolean> => getPlayer(state, playerId)
    .then((player) => {
        if (player.playerId === -1) {
            return true;
        }
        if (player.playerId === state.mynum) {
            /* me */
            return true;
        }
        if (plev(state, state.mynum) < pvis(state, player.playerId)) {
            return false;
        }
        if (state.ail_blind) {
            /* Cant see */
            return false;
        }
        if ((state.curch === player.locationId) && (isdark(state, state.curch))) {
            return false;
        }
        setname(state, player.playerId);
        return true;
    });

/*
int ppndeaf(str,ct,file)
 char *str;
 FILE *file;
    {
    char x[24];
    extern long ail_deaf;
    long a;
    ct=tocontinue(str,ct,x,24);
    if(ail_deaf) return(ct);
    a=fpbns(x);
    if(seeplayer(a)) fprintf(file,"%s",x);
    else
      fprintf(file,"Someone");
    return(ct);
    }

int  ppnblind(str,ct,file)
char *str;
FILE *file;
    {
    extern long ail_blind;
    char x[24];
    long a;
    ct=tocontinue(str,ct,x,24);
    if(ail_blind) return(ct);
    a=fpbns(x);
    if(seeplayer(a)) fprintf(file,"%s",x);
    else
       fprintf(file,"Someone");
    return(ct);
    }

char *sysbuf=NULL;

void makebfr()
    {
    extern char *sysbuf;
    extern char *malloc();
    sysbuf=malloc(4096); *//* 4K of chars should be enough for worst case *//*
    if(sysbuf==NULL) crapup("Out Of Memory");
    sysbuf[0]=0;
    }

FILE * log_fl= 0; *//* 0 = not logging *//*

void logcom()
    {
    extern FILE * log_fl;
    extern char globme[];
    if(getuid()!=geteuid()) {bprintf("\nNot allowed from this ID\n");return;}
    if(log_fl!=0)
       {
       fprintf(log_fl,"\nEnd of log....\n\n");
       fclose(log_fl);
       log_fl=0;
       bprintf("End of log\n");
       return;
       }
    bprintf("Commencing Logging Of Session\n");
    log_fl=fopen("mud_log","a");
    if(log_fl==0) log_fl=fopen("mud_log","w");
    if(log_fl==0)
       {
       bprintf("Cannot open log file mud_log\n");
       return;
       }
    bprintf("The log will be written to the file 'mud_log'\n");
    }

long pr_qcr;

void pbfr()
    {
    FILE *fln;
    long mu;
    block_alarm();
    closeworld();
    if(strlen(sysbuf)) pr_due=1;
    if((strlen(sysbuf))&&(pr_qcr)) putchar('\n');
    pr_qcr=0;
    if(log_fl!=NULL)
       {
       iskb=0;
       dcprnt(sysbuf,log_fl);
       }
    if(snoopd!=-1)
       {
       fln=opensnoop(pname(snoopd),"a");
       if(fln>0)
          {
iskb=0;
          dcprnt(sysbuf,fln);
          fcloselock(fln);
          }
       }
    iskb=1;
    dcprnt(sysbuf,stdout);
    sysbuf[0]=0; *//* clear buffer *//*
    if(snoopt!=-1) viewsnoop();
    unblock_alarm();
    }

long iskb=1;
*/

const quprnt = (state: State, message: string): Promise<void> => {
    if ((message.length + state.sysbuf.length) > 4095) {
        loseme(state);
        return logger.write(`Buffer overflow on user ${state.globme}`)
            .then(() => crapup(state, 'PANIC - Buffer overflow'))
    }
    state.sysbuf += message;
    return Promise.resolve();
};

/*
int pnotkb(str,ct,file)
 char *str;
 FILE *file;
    {
    extern long iskb;
    char x[128];
    ct=tocontinue(str,ct,x,127);
    if(iskb) return(ct);
    fprintf(file,"%s",x);
    return(ct);
    }

long snoopd= -1;

FILE *opensnoop(user,per)
char *per;
char *user;
    {
    FILE *x;
    extern FILE *openlock();
    char z[256];
    sprintf(z,"%s%s",SNOOP,user);
    x=openlock(z,per);
    return(x);
    }

long snoopt= -1;

char sntn[32];

void snoopcom()
    {
    FILE *fx;
    long x;
    if(my_lev<10)
       {
       bprintf("Ho hum, the weather is nice isn't it\n");
       return;
       }
    if(snoopt!=-1)
       {
       bprintf("Stopped snooping on %s\n",sntn);
       snoopt= -1;
       sendsys(sntn,globme,-400,0,"");
       }
    if(brkword()== -1)
       {
       return;
       }
    x=fpbn(wordbuf);
    if(x==-1)
       {
       bprintf("Who is that ?\n");
       return;
       }
    if(((my_lev<10000)&&(plev(x)>=10))||(ptstbit(x,6)))
       {
       bprintf("Your magical vision is obscured\n");
       snoopt= -1;
       return;
       }
    strcpy(sntn,pname(x));
    snoopt=x;
    bprintf("Started to snoop on %s\n",pname(x));
    sendsys(sntn,globme,-401,0,"");
    fx=opensnoop(globme,"w");
    fprintf(fx," ");
    fcloselock(fx);
    }

void viewsnoop()
    {
    long x;
    char z[128];
    FILE *fx;
    fx=opensnoop(globme,"r+");
    if(snoopt==-1) return;
    if(fx==0)return;
    while((!feof(fx))&&(fgets(z,127,fx)))
           printf("|%s",z);
    ftruncate(fileno(fx),0);
    fcloselock(fx);
    x=snoopt;
    snoopt= -1;
    *//*
    pbfr();
    *//*
    snoopt=x;
    }
void chksnp()
{
if(snoopt==-1) return;
sendsys(sntn,globme,-400,0,"");
}

void setname(x)  *//* Assign Him her etc according to who it is *//*
long x;
{
	if((x>15)&&(x!=fpbns("riatha"))&&(x!=fpbns("shazareth")))
	{
		strcpy(wd_it,pname(x));
		return;
	}
	if(psex(x)) strcpy(wd_her,pname(x));
	else strcpy(wd_him,pname(x));
	strcpy(wd_them,pname(x));
}

 */
