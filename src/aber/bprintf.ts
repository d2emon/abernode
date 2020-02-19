import State from './state';
import {logger} from './files';
import {getPlayer} from "./support";
import {brkword} from "./__dummies";
import {findPlayer, findVisiblePlayer} from "./objsys";

// long pr_due=0;

const quprnt = (state: State, message: string): Promise<void> => {
    if ((message.length + state.sysbuf.length) > 4095) {
        loseme(state);
        return logger.write(`Buffer overflow on user ${state.globme}`)
            .then(() => crapup(state, 'PANIC - Buffer overflow'))
    }
    state.sysbuf += message;
    return Promise.resolve();
};

const bprintf = (state: State, message: string): Promise<void> => {
    /* Max 240 chars/msg */
    if (message.length > 235) {
        return logger.write('Bprintf Short Buffer overflow')
            .then(() => crapup(state, 'Internal Error in BPRINTF'));
    }
    /* Now we have a string of chars expanded */
    return quprnt(state, message);
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
*/

const pcansee = (state: State, text: string, offset: number, file: any): Promise<number> => tocontinue(state, text, offset, '', 23)
    .then(([offset, name]) => Promise.all([
        findPlayer(state, name),
        tocontinue(state, text, offset, '', 256),
    ]))
    .then(([player, [offset, z]]) => {
        if (!seeplayer(state, player.playerId)) {
            return offset;
        }
        return fprintf(file, z)
            .then(() => offset);
    });

const prname = (state: State, text: string, offset: number, file: any): Promise<number> => tocontinue(state, text, offset, '', 24)
    .then(([offset, name]) => Promise.all([
        findPlayer(state, name),
        Promise.resolve(offset),
        Promise.resolve(name),
    ]))
    .then(([player, offset, name]) => fprintf(file, seeplayer(state, player.playerId) ? name : 'Someone')
        .then(() => offset));

/*
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

const tocontinue = (state: State, text: string, offset: number, output: string, maxLength: number): Promise<any[]> => {
    while(!text.substr(offset).startsWith('[\\')) {
        output += text[offset];
        offset += 1;
    }
    if (output.length >= maxLength) {
        return logger.write('IO_TOcontinue overrun')
            .then(() => crapup(state, 'Buffer OverRun in IO_TOcontinue'))
            .then(() => [0]);
    }
    return Promise.resolve([offset + 1, output]);
};

const seeplayer = (state: State, playerId: number): Promise<boolean> => Promise.all([
    getPlayer(state, state.mynum),
    getPlayer(state, playerId),
])
    .then(([
        me,
        player,
    ]) => {
        if (player.playerId === -1) {
            return true;
        }
        if (player.playerId === me.playerId) {
            /* me */
            return true;
        }
        if (me.level < player.visibility) {
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

const ppndeaf = (state: State, text: string, offset: number, file: any): Promise<number> => tocontinue(state, text, offset, '', 24)
    .then(([offset, name]) => {
        if (state.ail_deaf) {
            return offset;
        }
        return findPlayer(state, name)
            .then(player => fprintf(file, seeplayer(state, player.playerId) ? name : 'Someone'))
            .then(() => offset);

    });

const ppnblind = (state: State, text: string, offset: number, file: any): Promise<number> => tocontinue(state, text, offset, '', 24)
    .then(([offset, name]) => {
        if (state.ail_blind) {
            return offset;
        }
        return findPlayer(state, name)
            .then(player => fprintf(file, seeplayer(state, player.playerId) ? name : 'Someone'))
            .then(() => offset);

    });

/*
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
*/

const pbfr = (state: State): Promise<void> => {
    /*
    FILE *fln;
    long mu;
    */
    block_alrm(state);
    closeworld(state);
    if (state.sysbuf) {
        state.pr_due = true;
    }
    if (state.sysbuf && state.pr_qcr) {
        console.log('\n');
    }
    state.pr_qcr = false;
    if (state.log_fl !== null) {
        state.iskb = false;
        dcprnt(state, state.sysbuf, state.log_fl);
    }
    return getPlayer(state, state.snoopd)
        .then((snooper) => {
            if (snooper.playerId === -1) {
                return;
            }
            return opensnoop(snooper.name, 'a')
                .then((fln) => {
                    state.iskb = false;
                    dcprnt(state, state.sysbuf, fln);
                    return fcloselock(fln);
                })
                .catch(() => null);
        })
        .then(() => {
            state.iskb = true;
            dcprnt(state, state.sysbuf);
            state.sysbuf = '';
            /* clear buffer */
            if (state.snoopt !== -1) {
                viewsnoop(state);
            }
            unblock_alarm(state);
        });
};

/*
long iskb=1;
*/

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
*/

const snoopcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Ho hum, the weather is nice isn\'t it\n');
        return Promise.resolve();
    }
    if (state.snoopt !== -1) {
        bprintf(state, `Stopped snooping on ${state.sntn}\n`);
        state.snoopt = -1;
        sendsys(state, state.sntn, state.globme, -400, 0, null);
        return Promise.resolve();
    }
    if (brkword() === -1) {
        return Promise.resolve();
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((snooped) => {
            if (!snooped) {
                return bprintf(state, 'Who is that ?\n');
            }
            if (((state.my_lev < 10000) && snooped.isWizard) || !snooped.canBeSnooped) {
                bprintf(state, 'Your magical vision is obscured\n');
                state.snoopt = -1;
                return;
            }
            state.sntn = snooped.name;
            state.snoopt = snooped.playerId;
            bprintf(state, `Started to snoop on ${snooped.name}\n`);
            sendsys(state, state.sntn, state.globme, -401, 0, null);
            return opensnoop(state.globme, 'w')
                .then((fx) => fprint(fx, '').then(() => fcloselock(fx)));
        });
};

/*
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
*/

const setname = (state: State, playerId: number): Promise<void> => Promise.all([
    getPlayer(state, playerId),
    findPlayer(state, 'riatha'),
    findPlayer(state, 'shazareth'),
])
    .then(([
        player,
        riatha,
        shazareth,
    ]) => {
        /* Assign Him her etc according to who it is */
        if ((player.playerId > 15) && (player.playerId !== riatha.playerId) && (player.playerId !== shazareth.playerId)) {
            state.wd_it = player.name;
            return;
        }
        if (player.sex) {
            state.wd_her = player.name;
        } else {
            state.wd_him = player.name;
        }
        state.wd_them = player.name;
    });
