import State from "./state";
import {logger} from "./files";
import {getPlayer, getPlayers, setPlayer} from "./support";
import {bprintf} from "./__dummies";
import {dropItems, dropMyItems, findPlayer, findVisiblePlayer, listPeople, showItems} from "./objsys";

/*
 *
 *		AberMUD II   C
 *
 *
 *	This game systems, its code scenario and design
 *	are (C) 1987/88  Alan Cox,Jim Finnis,Richard Acott
 *
 *
 *	This file holds the basic communications routines
 *
 */

/*
#include "files.h"
#include "flock.h"

long i_setup=0;
long oddcat=0;
long  talkfl=0;

#include <stdio.h>
#include <sys/errno.h>
#include <sys/file.h>

extern FILE * openlock();
extern char globme[];
extern long cms;
extern long curch;
extern long my_str;
extern long my_sex;
extern long my_lev;
extern FILE * openroom();
extern FILE * openworld();
extern char key_buff[];
long cms= -1;
long curch=0;

char globme[40];
long  curmode=0;
long  meall=0;
*/ /*

 Data format for mud packets

 Sector 0
 [64 words]
 0   Current first message pointer
 1   Control Word
 Sectors 1-n  in pairs ie [128 words]

 [channel][controlword][text data]

 [controlword]
 0 = Text
 - 1 = general request

 */
 /*
vcpy(dest,offd,source,offs,len)
long *dest,*source;
long offd,offs,len;
    {
    long c;
    c=0;
    while(c<len)
       {
       dest[c+offd]=source[c+offs];
       c++;
       }
    }

 mstoout(block,name)
 long *block;char *name;
    {
    extern long debug_mode;
    char luser[40];
    char *x;
    x=(char *)block;
    *//* Print appropriate stuff from data block *//*
    strcpy(luser,name);lowercase(luser);
if(debug_mode)    bprintf("\n<%d>",block[1]);
    if (block[1]<-3) sysctrl(block,luser);
    else
       bprintf("%s", (x+2*sizeof(long)));
    }

long gurum=0;
long convflg=0;
*/

const sendmsg = (state: State, name: string): Promise<boolean> => getPlayer(state, state.mynum)
    .then((me) => {
        pbfr(state);
        if (state.tty === 4) {
            btmscr(state);
        }

        let prmpt = '\r';
        if (me.visibility) {
            prmpt += '(';
        }
        if (state.debug_mode) {
            prmpt += '#';
        }
        if (state.my_lev > 9) {
            prmpt += '----';
        }
        if (state.convflg === 0) {
            prmpt += '>';
        } else if (state.convflg === 1) {
            prmpt += '"';
        } else if (state.convflg === 2) {
            prmpt += '*';
        } else {
            prmpt += '?';
        }
        if (me.visibility) {
            prmpt += ')';
        }

        pbfr(state);

        if (me.visibility > 9999) {
            set_progname(state, '-csh');
        } else if (me.visibility === 0) {
            set_progname(state, `   --}----- ABERMUD -----{--     Playing as ${name}`);
        }

        sig_alon(state);
        key_input(state, prmpt, 80);
        sig_aloff(state);

        let work = state.key_buff;

        if (state.tty === 4) {
            topscr(state);
        }
        state.sysbuf += `[l]${work}\n[/l]`;

        openworld(state);
        rte(state, name);
        closeworld(state);

        if (state.convflg && (work === '**')) {
            state.convflg = 0;
            return sendmsg(state, name);
        }

        if (work) {
            if ((work !== '*') && (work[0] === '*')) {
                work = work.substr(1);
            } else if (state.convflg === 1) {
                work = `say ${work}`;
            } else if (state.convflg) {
                work = `tss ${work}`;
            }
        }

        if (state.curmode === 1) {
            gamecom(state, work)
        } else if ((work !== '.Q') && (work !== '.q') && work) {
            special(state, work, name);
        }

        let p = Promise.resolve();
        if (state.fighting > -1) {
            p = getPlayer(state, state.fighting)
                .then((enemy) => {
                    if (!enemy.exists) {
                        state.in_fight = 0;
                        state.fighting = -1
                    }
                    if (enemy.locationId !== state.curch) {
                        state.in_fight = 0;
                        state.fighting = -1
                    }
                })
        }
        return p
            .then(() => {
                if (state.in_fight) {
                    state.in_fight -= 1;
                }
                return ((work === '.Q') || (work === '.q'))
            });
    });

/*
 send2(block)
 long *block;
    {
    FILE * unit;
    long number;
    long inpbk[128];
    extern char globme[];
    extern char *echoback;
    	unit=openworld();
    if (unit<0) {loseme();crapup("\nAberMUD: FILE_ACCESS : Access failed\n");}
    sec_read(unit,inpbk,0,64);
    number=2*inpbk[1]-inpbk[0];inpbk[1]++;
    sec_write(unit,block,number,128);
    sec_write(unit,inpbk,0,64);
    if (number>=199) cleanup(inpbk);
    if(number>=199) longwthr();
    }

 readmsg(channel,block,num)
 long channel;
 long *block;
 int num;
    {
    long buff[64],actnum;
    sec_read(channel,buff,0,64);
    actnum=num*2-buff[0];
    sec_read(channel,block,actnum,128);
    }

FILE *fl_com;
extern long findstart();
extern long findend();

 rte(name)
 char *name;
    {
    extern long cms;
    extern long vdes,tdes,rdes;
    extern FILE *fl_com;
    extern long debug_mode;
    FILE *unit;
    long too,ct,block[128];
    unit=openworld();
    fl_com=unit;
    if (unit==NULL) crapup("AberMUD: FILE_ACCESS : Access failed\n");
    if (cms== -1) cms=findend(unit);
    too=findend(unit);
    ct=cms;
    while(ct<too)
       {
       readmsg(unit,block,ct);
       mstoout(block,name);
       ct++;
       }
    cms=ct;
    update(name);
    eorte();
    rdes=0;tdes=0;vdes=0;
    }

FILE *openlock(file,perm)
char *file;
char *perm;
    {
    FILE *unit;
    long ct;
    extern int errno;
    extern char globme[];
    ct=0;
   unit=fopen(file,perm);
   if(unit==NULL) return(unit);
   *//* NOTE: Always open with R or r+ or w *//*
intr:if(flock(fileno(unit),LOCK_EX)== -1)
		if(errno==EINTR) goto intr; *//* INTERRUPTED SYSTEM CALL CATCH *//*
    switch(errno)
    {
    	case ENOSPC:crapup("PANIC exit device full\n");
*//*    	case ESTALE:;*//*
    	case EHOSTDOWN:;
    	case EHOSTUNREACH:crapup("PANIC exit access failure, NFS gone for a snooze");
    }
    return(unit);
    }

long findstart(unit)
 FILE *unit;
    {
    long bk[2];
    sec_read(unit,bk,0,1);
    return(bk[0]);
    }

long findend(unit)
 FILE *unit;
    {
    long bk[3];
    sec_read(unit,bk,0,2);
    return(bk[1]);
    }


 talker(name)
 char *name;
    {
    extern long curch,cms;
    extern long mynum;
    extern long maxu;
    extern long rd_qd;
    FILE *fl;
    char string[128];
    extern char globme[];
    makebfr();
    	cms= -1;putmeon(name);
    if(openworld()==NULL) crapup("Sorry AberMUD is currently unavailable");
    if (mynum>=maxu) {printf("\nSorry AberMUD is full at the moment\n");return(0);}
    strcpy(globme,name);
    rte(name);
    	closeworld();
    cms= -1;
    special(".g",name);
    i_setup=1;
    while(1)
       {
       pbfr();
       sendmsg(name);
       if(rd_qd) rte(name);
       rd_qd=0;
       closeworld();
       pbfr();
       }
    }

long rd_qd=0;

 cleanup(inpbk)
 long *inpbk;
    {
    FILE * unit;
    long buff[128],ct,work,*bk;
    unit=openworld();
    bk=(long *)malloc(1280*sizeof(long));
    sec_read(unit,bk,101,1280);sec_write(unit,bk,1,1280);
    sec_read(unit,bk,121,1280);sec_write(unit,bk,21,1280);
    sec_read(unit,bk,141,1280);sec_write(unit,bk,41,1280);
    sec_read(unit,bk,161,1280);sec_write(unit,bk,61,1280);
    sec_read(unit,bk,181,1280);sec_write(unit,bk,81,1280);
    free(bk);
    inpbk[0]=inpbk[0]+100;
    sec_write(unit,inpbk,0,64);
    revise(inpbk[0]);
    }
*/

const special = (state: State, word: string, name: string): Promise<boolean> => {
    /*
    extern long curmode;
    char ch,bk[128];
    extern long curch,moni;
    extern long mynum;
    extern long my_str,my_lev,my_sco,my_sex;
    FILE * ufl;
    char xx[128];
    char xy[128];
    char us[32];
    */
    const bk = word.toLowerCase();
    if (bk[0] !== '.') {
        return Promise.resolve(false);
    }
    if (bk[1] === 'g') {
        return getPlayer(state, state.mynum)
            .then((player) => {
                state.curmode = 1;
                state.curch = -5;
                initme(state);
                openworld(state);
                return setPlayer(state, player.playerId, {
                    strength: state.my_str,
                    level: state.my_lev,
                    visibility: (state.my_lev < 10000) ? 0 : 10000,
                    flags: { sex: state.my_sex },
                    weaponId: -1,
                    helping: -1,
                })
                    .then(() => {
                        const xy = `[s name="${name}"]${name}  has entered the game\n[/s]`;
                        const xx = `[s name="${name}"][ ${name}  has entered the game ]\n[/s]`;
                        sendsys(state, name, name, -10113, state.curch, xx);
                        rte(state, name);
                        if (randperc(state) > 50) {
                            trapch(state, state.curch);
                        } else {
                            state.curch = -183;
                            trapch(state, state.curch);
                        }
                        sendsys(state, name, name, -10000, state.curch, xy);
                    })
            })
            .then(() => true);
    }
    console.log('Unknown . option');
    return Promise.resolve(true);
};

/*
long dsdb=0;


long moni=0;

 broad(mesg)
 char *mesg;
    {
extern long rd_qd;
char bk2[256];
long block[128];
rd_qd=1;
block[1]= -1;
strcpy(bk2,mesg);
vcpy(block,2,(long *)bk2,0,126);
send2(block);
}

tbroad(message)
char *message;
    {
    broad(message);
    }

 sysctrl(block,luser)
 long *block;
 char *luser;
    {
    gamrcv(block);
    }
long  bound=0;
long  tmpimu=0;
char  *echoback="*e";
char  *tmpwiz=".";*//* Illegal name so natural immunes are ungettable! *//*

 split(block,nam1,nam2,work,luser)
 long *block;
 char *nam1;
 char *nam2;
 char *work;
 char *luser;
    {
    long wkblock[128],a;
    vcpy(wkblock,0,block,2,126);
    vcpy((long *)work,0,block,64,64);
    a=scan(nam1,(char *)wkblock,0,"",".");
    scan(nam2,(char *)wkblock,a+1,"",".");
if((strncmp(nam1,"The ",4)==0)||(strncmp(nam1,"the ",4)==0))
{
if(!strcmp(lowercase(nam1+4),lowercase(luser))) return(1);
}
    return(!strcmp(lowercase(nam1),lowercase(luser)));
    }
    */

const trapch = (state: State, locationId: number): Promise<void> => {
    openworld(state);
    return setPlayer(state, state.mynum, { locationId })
        .then(() => lookin(state, locationId))
};

/*
long mynum=0;
*/

const putmeon = (state: State, name: string): Promise<void> => {
    /*
    extern long mynum,curch;
    extern long maxu;
    long ct,f;
    FILE *unit;
    extern long iamon;
    */
    state.iamon = false;
    openworld(state);
    return findVisiblePlayer(state, name)
        .then((player) => {
            if (player) {
                return crapup(state, 'You are already on the system - you may only be on once at a time');
            }
            return getPlayers(state, state.maxu)
                .then((players) => {
                    let f = null;
                    players.forEach((player) => {
                        if (f !== null) {
                            return;
                        }
                        if (!player.exists) {
                            f = player.playerId;
                        }
                    });
                    if (f === null) {
                        state.mynum = state.maxu;
                        return;
                    }
                    return setPlayer(state, f, {
                        name,
                        locationId: state.curch,
                        level: 1,
                        strength: -1,
                        visibility: 0,
                        sex: 0,
                        eventId: -1,
                        weaponId: -1,
                    })
                        .then(() => {
                            state.mynum = f;
                            state.iamon = true;
                        });
                });

        })
};

const loseme = (state: State, name: string): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        sig_aloff(state);
        /* No interruptions while you are busy dying */
        /* ABOUT 2 MINUTES OR SO */
        state.i_setup = false;
        openworld(state);
        return dropMyItems(state)
            .then(() => {
                if (player.visibility < 10000) {
                    const bk = `${state.globme} has departed from AberMUDII\n`;
                    sendsys(state, state.globme, state.globme, -10113, 0, bk);
                }
                return setPlayer(state, player.playerId, { exists: false })
            })
            .then(() => {
                closeworld(state);
                if (!state.zapped) {
                    saveme(state);
                }
                chksnp(state);
            });
    });

/*
long lasup=0;
*/

const update = (state: State, name: string): Promise<void> => {
    const xp = Math.abs(state.cms - state.lasup);
    if (xp < 10) {
        return Promise.resolve();
    }
    openworld(state);
    return setPlayer(state, state.mynum, { eventId: state.cms })
        .then(() => { state.lasup = state.cms; });
};

const revise = (state: State, cutoff: number): Promise<void> => {
    openworld(state);
    return getPlayers(state, state.maxu)
        .then(players => players.forEach((player) => {
            if (!player.exists && (player.eventId < (cutoff / 2)) && !player.isAbsent) {
                broad(state, `${player.name} has been timed out\n`);
                return dropItems(state, player)
                    .then(() => setPlayer(state, player.playerId, { name: '' }));
            }
        }));
};

const lookin = (state: State, roomId: number): Promise<void> => {
    /* Lords ???? */
    closeworld(state);
    if (state.ail_blind) {
        bprintf(state, 'You are blind... you can\'t see a thing!\n');
    }
    if (state.my_lev > 9) {
        showname(state, roomId);
    }
    return openroom(roomId, 'r')
        .then((un1) => {
            const xx1 = () => {
                let xxx = false;
                lodex(state, un1);
                if (isdark(state)) {
                    return fclose(un1)
                        .then(() => {
                            bprintf(state, 'It is dark\n');
                            openworld(state);
                            onlook(state);
                        })
                }
                return getstr(un1)
                    .then((content) => {
                        content.forEach((s) => {
                            if (s === '#DIE') {
                                if (state.ail_blind) {
                                    return rewind(state, un1)
                                        .then(() => {
                                            state.ail_blind = false;
                                            return xx1();
                                        });
                                }
                                if (state.my_lev > 9) {
                                    return bprintf(state, '<DEATH ROOM>\n');
                                } else {
                                    loseme(state, state.globme);
                                    return crapup(state, 'bye bye.....');
                                }
                            } else if (s === '#NOBR') {
                                state.brmode = false;
                            } else {
                                if (!state.ail_blind && !xxx) {
                                    bprintf(state, `${s}\n`);
                                }
                                xxx = state.brmode
                            }
                        });
                        return fclose(state, un1);
                    });
            };
            return xx1();
        })
        .catch(() => {
            bprintf(state, `\nYou are on channel ${roomId}\n`);
        })
        .then(() => {
            openworld(state);
            if (state.ail_blind) {
                return;
            }
            return showItems(state)
                .then(() => {
                    if (state.curmode === 1) {
                        return listPeople(state)
                            .then(messages => messages.forEach(message => bprintf(state, message)));
                    }
                })
        })
        .then(() => {
            bprintf(state, '\n');
            onlook(state);
        });
};

/*
 loodrv()
    {
    extern long curch;
    lookin(curch);
    }


long iamon=0;
*/

const userwrap = (state: State): Promise<void> => findPlayer(state, state.globme)
    .then((player) => {
        if (!player) {
            return;
        }
        loseme(state);
        return logger.write(`System Wrapup exorcised ${state.globme}`);
    });

/*
fcloselock(file)
FILE *file;
{
	fflush(file);
	flock(fileno(file),LOCK_UN);
	fclose(file);
}


 */