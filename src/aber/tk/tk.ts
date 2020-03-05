import State from "../state";
import {logger} from "../files";
import {getPlayer, getPlayers, setPlayer} from "../support";
import {dropItems, dropMyItems, findPlayer, findVisiblePlayer, listPeople, showItems} from "../objsys";
import {resetMessages, sendKeyboard, sendMessage, sendVisiblePlayer} from "../bprintf/bprintf";
import {showMessages} from "../bprintf/output";
import {checkSnoop} from "../bprintf/snoop";
import {endGame} from "../gamego/endGame";
import {asyncUnsetAlarm, setProgramName, withAlarm} from "../gamego/reducer";
import {keyInput} from "../key";
import {roll} from "../magic";
import {onLook} from "../mobile";
import {cureBlind, getBlind} from "../new1/reducer";
import {sendWizards} from "../new1/events";
import {getLevel, getSex, getStrength, isGod, isWizard} from "../newuaf/reducer";
import {initPerson, savePerson} from "../newuaf";
import {loadWorld, saveWorld} from "../opensys";
import {getDebugMode} from "../parse/reducer";
import {sendLocalMessage} from "../parse/events";
import {executeCommand} from "../parse/parser";
import {
    disableCalibrate,
    enableCalibrate,
    getEventId,
    getEventUnset, getGameMode, getLocationId, getName, isConversationOff, isConversationOn, isConversationShell,
    isHere,
    resetEvents,
    setChannelId, setConversationOff,
    setEventId, setGameOn, setLocationId
} from "./reducer";

/**
 * AberMUD II   C
 *
 * This game systems, its code scenario and design
 * are (C) 1987/88  Alan Cox,Jim Finnis,Richard Acott
 *
 * This file holds the basic communications routines
 */

/**
 * Data format for mud packets
 *
 * Sector 0
 * [64 words]
 * 0   Current first message pointer
 * 1   Control Word
 * Sectors 1-n  in pairs ie [128 words]
 *
 * [channel][controlword][text data]
 *
 * [controlword]
 * 0 = Text
 * - 1 = general request
 */

const send2 = (state: State, block: {}): Promise<void> => loadWorld(state)
    .then(() => {
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
    })
    .catch(() => {
        loseme(state);
        return endGame(state, 'AberMUD: FILE_ACCESS : Access failed');
    });

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

const rte = (state: State, name: string): Promise<void> => loadWorld(state)
    .then(() => {
        let eventId = getEventUnset(state) ? findend(state, unit) : getEventId(state);
        const too = findend(state, unit);
        setEventId(state, eventId);
        for (eventId = getEventId(state); eventId < too; eventId += 1) {
            const block = readmsg(state, unit, eventId);
            processEvent(state, block, name.toLowerCase());
        }
        setEventId(state, eventId);
        update(state, name);
        eorte(state);
        state.rdes = 0;
        state.tdes = 0;
        state.vdes = 0;
    })
    .catch(() => endGame(state, 'AberMUD: FILE_ACCESS : Access failed'));

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

/*
long rd_qd=0;
*/

const cleanup = (state: State, inpbk: number[]): Promise<void> => loadWorld(state)
    .then((unit) => {
        for(let i = 1; i < 100; i += 20) {
            const bk = sec_read(state, unit, 100 + i, 1280);
            sec_write(state, unit, bk, i, 1280);
        }
        inpbk[0] = inpbk[0] + 100;
        sec_write(unit, inpbk, 0, 64);
        return revise(state, inpbk[0]);
    });

const special = (state: State, word: string, name: string): Promise<boolean> => {
    const bk = word.toLowerCase();
    if (bk[0] !== '.') {
        return Promise.resolve(false);
    }
    if (bk[1] === 'g') {
        return getPlayer(state, state.mynum)
            .then((player) => {
                initPerson(state)
                    .then(() => loadWorld(state))
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
                        setGameOn(state);
                        rte(state, name);
                        if (locationRoll > 50) {
                            setLocationId(state, -5);
                        } else {
                            setLocationId(state, -183);
                        }
                        return sendLocalMessage(state, getLocationId(state), name, sendVisiblePlayer(name, `${name}  has entered the game\n`));
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
*/

const broad = (state: State, message: string): Promise<void> => {
    state.rd_qd = true;
    return send2(state, {
        v0: null,
        code: -1,
        payload: message,
    });
};

/*
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
*/

const split = (state: State, block: { payload: string }, name1: string, name2: string, work: string, user: string): boolean => {
    const { payload } = block;
    const a = scan(name1, payload, 0, '', '.');
    scan(name2, payload, a + 1, '', '.');
    if (name1.toLowerCase().substr(0, 4) === 'the ') {
        if (name1.toLowerCase().substr(4) === user.toLowerCase()) {
            return true;
        }
    }
    return name1.toLowerCase() === user.toLowerCase();
};

const trapch = (state: State, locationId: number): Promise<void> => loadWorld(state)
    .then(() => setPlayer(state, state.mynum, { locationId }))
    .then(() => lookin(state, locationId));

/*
long mynum=0;
*/

const putmeon = (state: State, name: string): Promise<void> => {
    state.iamon = false;
    return loadWorld(state)
        .then(() => findVisiblePlayer(state, name))
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
                        locationId: getLocationId(state),
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
                disableCalibrate(state);
                return loadWorld(state);
            })
            .then(() => {
                const promises = [
                    dropMyItems(state),
                    setPlayer(state, player.playerId, { exists: false }),
                ];
                if (player.visibility < 10000) {
                    promises.push(sendWizards(state, `${getName(state)} has departed from AberMUDII\n`));
                }
                return Promise.all(promises)
            })
            .then(() => saveWorld(state))
            .then(() => savePerson(state))
            .then(() => checkSnoop(state));
    });

/*
long lasup=0;
*/

const update = (state: State, name: string): Promise<void> => {
    const eventId = getEventId(state);
    const xp = Math.abs(eventId - state.lasup);
    if (xp < 10) {
        return Promise.resolve();
    }
    return loadWorld(state)
        .then(() => {
            state.lasup = eventId;
            return setPlayer(state, state.mynum, { eventId });
        });
};

const revise = (state: State, cutoff: number): Promise<void> => loadWorld(state)
    .then(() => getPlayers(state, state.maxu))
    .then(players => players.forEach((player) => {
        if (!player.exists && (player.eventId < (cutoff / 2)) && !player.isAbsent) {
            broad(state, `${player.name} has been timed out\n`);
            return dropItems(state, player)
                .then(() => setPlayer(state, player.playerId, { name: '' }));
        }
    }));

const lookin = (state: State, roomId: number): Promise<void> => loadWorld(state)
    .then(() => saveWorld(state))
    .then(() => {
        /* Lords ???? */
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
                                return loadWorld(state);
                            })
                            .then(() => onLook(state));
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
                                        loseme(state, getName(state));
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
            .then(() => loadWorld(state))
            .then(() => {
                if (getBlind(state)) {
                    return;
                }
                return showItems(state)
                    .then(
                        () => getGameMode(state) && listPeople(state)
                            .then(messages => messages.forEach(message => bprintf(state, message)))
                    )
            })
            .then(() => {
                bprintf(state, '\n');
                return onLook(state);
            });
    });

const loodrv = (state: State) => lookin(state, getLocationId(state));

/*
long iamon=0;
*/

const userwrap = (state: State): Promise<void> => findPlayer(state, getName(state))
    .then((player) => {
        if (!player) {
            return;
        }
        loseme(state);
        return logger.write(`System Wrapup exorcised ${getName(state)}`);
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