import State from "./state";
import {logger} from "./files";
import {getPlayer, getPlayers, setPlayer} from "./support";
import {bprintf} from "./__dummies";
import {dropItems, dropMyItems, findPlayer, findVisiblePlayer, listPeople, showItems} from "./objsys";
import {resetMessages, sendKeyboard, sendMessage, sendVisiblePlayer} from "./bprintf/bprintf";
import {showMessages} from "./bprintf/output";
import {checkSnoop} from "./bprintf/snoop";
import {endGame} from "./gamego/endGame";
import {setAlarm, asyncUnsetAlarm, setProgramName, withAlarm} from "./gamego/reducer";
import {keyInput} from "./key";
import {roll} from "./magic";
import {onLook} from "./mobile";
import {cureBlind, getBlind} from "./new1/reducer";
import {sendWizards} from "./new1/events";
import {getLevel, getSex, getStrength, isGod, isWizard} from "./newuaf/reducer";
import {initPerson, savePerson} from "./newuaf";

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

const sendmsg = (state: State, name: string): Promise<boolean> => Promise.all([
    getPlayer(state, state.mynum),
    showMessages(state),
])
    .then(([me]) => {
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
        if (isWizard(state)) {
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

        return showMessages(state)
            .then(() => {
                if (me.visibility > 9999) {
                    setProgramName(state, '-csh');
                } else if (me.visibility === 0) {
                    setProgramName(state, `   --}----- ABERMUD -----{--     Playing as ${name}`);
                }

                return sendMessage(state, prmpt)
                    .then(() => showMessages(state))
                    .then(() => withAlarm(state)(() => keyInput(prmpt, 80)))
                    .then((work) => {
                        if (state.tty === 4) {
                            topscr(state);
                        }
                        state.sysbuf += sendKeyboard(`${work}\n`);

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

                    })
            })
    });

const send2 = (state: State, block: {}): Promise<void> => {
    const unit = openworld(state)
    if (!unit) {
        loseme(state);
        return endGame(state, 'AberMUD: FILE_ACCESS : Access failed');
    }
    const inpbk = sec_read(state, unit, 0, 64);
    const number = 2 * inpbk[1] - inpbk[0];
    inpbk[1] += 1;
    sec_write(state, unit, block, number, 128);
    sec_write(state, unit, inpbk, 0, 64);
    if (number >= 199) {
        cleanup(state, inpbk);
    }
    if (number >= 199) {
        longwthr(state);
    }
};

/*
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
*/

const rte = (state: State, name: string): Promise<void> => {
    const unit = openworld(state);
    state.fl_com = unit;
    if (!unit) {
        return endGame(state, 'AberMUD: FILE_ACCESS : Access failed');
    }
    if (state.cms === -1) {
        state.cms = findend(state, unit);
    }
    const too = findend(state, unit);
    let ct = state.cms;
    for (ct = state.cms; ct < too; ct += 1) {
        const block = readmsg(state, unit, ct);
        mstoout(state, block, name);
    }
    state.cms = ct;
    update(state, name);
    eorte(state);
    state.rdes = 0;
    state.tdes = 0;
    state.vdes = 0;
};

/*
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
*/

const talker = (state: State, name: string) => {
    resetMessages(state);
    state.cms = -1;
    putmeon(state, name);
    try {
        openworld(state);
    } catch (e) {
        return () => endGame(state, 'Sorry AberMUD is currently unavailable')
            .then(() => false);
    }
    if (state.mynum >= state.maxu) {
        console.log('Sorry AberMUD is full at the moment');
        return () => false;
    }
    state.globme = name;
    rte(state, name);
    closeworld(state);
    state.cms = -1;
    special(state, '.g', name);
    state.i_setup = 1;
    return () => showMessages(state)
        .then(() => {
            sendmsg(state, name);
            if (state.rd_qd) {
                rte(state, name);
            }
            rd_qd = 0;
            closeworld(state);
            return showMessages(state);
        });
};

/*
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
    const bk = word.toLowerCase();
    if (bk[0] !== '.') {
        return Promise.resolve(false);
    }
    if (bk[1] === 'g') {
        return getPlayer(state, state.mynum)
            .then((player) => {
                initPerson(state)
                    .then(() => openworld(state))
                    .then(() => setPlayer(state, player.playerId, {
                        strength: getStrength(state),
                        level: getLevel(state),
                        visibility: isGod(state) ? 0 : 10000,
                        flags: { sex: getSex(state) },
                        weaponId: -1,
                        helping: -1,
                    }))
                    .then(() => sendWizards(state, sendVisiblePlayer(name, `[ ${name}  has entered the game ]\n`)))
                    .then(roll)
                    .then((locationRoll) => {
                        state.curmode = 1;
                        state.curch = -5;
                        const xy = sendVisiblePlayer(name, `${name}  has entered the game\n`);
                        rte(state, name);
                        if (locationRoll > 50) {
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
                return endGame(state, 'You are already on the system - you may only be on once at a time');
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
        return asyncUnsetAlarm(state)
            .then(() => {
                /* No interruptions while you are busy dying */
                /* ABOUT 2 MINUTES OR SO */
                state.i_setup = false;
                openworld(state);
                const promises = [
                    dropMyItems(state),
                    setPlayer(state, player.playerId, { exists: false }),
                ];
                if (player.visibility < 10000) {
                    promises.push(sendWizards(state, `${state.globme} has departed from AberMUDII\n`));
                }
                return Promise.all(promises)
            })
            .then(() => {
                closeworld(state);
                return savePerson(state);
            })
            .then(() => checkSnoop(state));
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
    if (getBlind(state)) {
        bprintf(state, 'You are blind... you can\'t see a thing!\n');
    }
    if (isWizard(state)) {
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
                            return onLook(state);
                        })
                }
                return getstr(un1)
                    .then((content) => {
                        content.forEach((s) => {
                            if (s === '#DIE') {
                                if (getBlind(state)) {
                                    return rewind(state, un1)
                                        .then(() => {
                                            cureBlind(state);
                                            return xx1();
                                        });
                                }
                                if (isWizard(state)) {
                                    return bprintf(state, '<DEATH ROOM>\n');
                                } else {
                                    loseme(state, state.globme);
                                    return endGame(state, 'bye bye.....');
                                }
                            } else if (s === '#NOBR') {
                                state.brmode = false;
                            } else {
                                if (!getBlind(state) && !xxx) {
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
            if (getBlind(state)) {
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
            return onLook(state);
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