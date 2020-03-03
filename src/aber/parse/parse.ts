import State from "../state";
import {createItem, getItem, getItems, getPlayer, getTitle, holdItem, putItem, setItem, setPlayer} from "../support";
import {CREDITS, GWIZ, logger, RESET_DATA, ROOMS} from "../files";
import {CONTAINED_IN, IS_DESTROYED} from "../object";
import {
    isCarriedBy,
    isAvailable,
    findAvailableItem,
    findCarriedItem,
    findItem,
    dropItems,
    dropMyItems,
    findVisiblePlayer,
    findPlayer,
    isContainedIn,
} from "../objsys";
import {hitPlayer} from "../blood";
import {receiveDamage} from '../blood/events';
import {
    sendName,
    sendPlayerForVisible,
    sendSound,
    sendSoundPlayer,
    sendVisibleName,
    sendVisiblePlayer,
    showFile
} from "../bprintf";
import {showMessages} from "../bprintf/output";
import {endGame} from "../gamego/endGame";
import {checkRoll, roll} from "../magic";
import {getAvailableItem, isWornBy, sendBotDamage, teleport} from "../new1";
import {checkDumb, clearForce, getDumb, getForce} from "../new1/reducer";
import {newReceive, sendShout, sendWizards} from "../new1/events";
import {resetPlayers} from "../new1/bots";
import {removePerson, savePerson} from "../newuaf";
import {
    getLevel,
    getScore,
    getSex,
    getStrength, isAdmin, isGod,
    isWizard, setLevel,
    setScore,
    setStrength,
    updateScore,
    updateStrength
} from "../newuaf/reducer";
import {loadWorld, saveWorld} from "../opensys";
import {
    changeDebugMode,
    getCurrentChar,
    nextStop,
} from "./reducer";
import {
    sendEndFight,
    sendExorcise,
    sendKick,
    sendLocalMessage,
    sendPrivate,
    sendSay,
    sendSimpleShout,
    sendTell
} from "./events";
import {executeCommand} from "./parser";

const debug2 = (state: State): Promise<void> => Promise.resolve(bprintf(state, 'No debugger available\n'));

const checkForce = (state: State): Promise<void> => Promise.resolve(getForce(state))
    .then((force) => {
        state.isforce = true;
        return force ? executeCommand(state, force) : Promise.resolve();
    })
    .then(() => {
        state.isforce = false;
        clearForce(state);
    });

const onFlee = (state: State): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItems(state),
])
    .then(([
        player,
        items,
    ]) => items.forEach((item) => isCarriedBy(item, player, !isWizard(state)) && !isWornBy(state, item, player) && putItem(state, item.itemId, item.locationId)))
    .then(() => undefined);

// -------------------------------------------------

/**
 * Objects held in format
 *
 * [Short Text]
 * [4 Long texts]
 * [Max State]
 */

/**
 * Objects in text file in form
 *
 * Stam:state:loc:flag
 */


const doaction = (state: State, actionId: number): Promise<void> => {
    const actions = {
        /*
       case 9:
          getobj();
          break;
       case 137:
          crashcom();
          break;
       case 10:
          dropitem();
          break;
       case 11:
          look_cmd();
          break;
       case 12:
          inventory();
          break;
       case 13:
          whocom();
          break;
       case 14:
          rescom();
          break;
       case 15:
          lightning();
          break;
       case 16:
          eatcom();
          break;
       case 17:
          playcom();
          break;
       case 18:
          shoutcom();
          break;
       case 19:
          saycom();
          break;
       case 20:
          tellcom();
          break;
          */
        21: () => savePerson(state),
        /*
       case 22:
          scorecom();
          break;
       case 23:
          exorcom();
          break;
       case 24:
          givecom();
          break;
       case 25:
          stealcom();
          break;
       case 26:
          levcom();
          break;
       case 27:
          helpcom();
          break;
       case 28:
          valuecom();
          break;
       case 29:
          stacom();
          break;
       case 30:
          examcom();
          break;
       case 31:
          delcom();
          break;
       case 32:
          passcom();
          break;
       case 33:
          sumcom();
          break;
       case 34:
          weapcom();
          break;
       case 35:
          killcom();
          break;
       case 50:
          laughcom();
          break;
       case 51:
          crycom();
          break;
       case 52:
          burpcom();
          break;
       case 53:
          fartcom();
          break;
       case 54:
          hiccupcom();
          break;
       case 55:
          grincom();
          break;
       case 56:
          smilecom();
          break;
       case 57:
          winkcom();
          break;
       case 58:
          sniggercom();
          break;
       case 59:
          posecom();
          break;
       case 60:
          setcom();
          break;
       case 61:
          praycom();
          break;
       case 62:
          stormcom();
          break;
       case 63:
          raincom();
          break;
       case 64:
          suncom();
          break;
       case 65:
          snowcom();
          break;
       case 66:
          goloccom();
          break;
       case 100:
          wearcom();
          break;
       case 101:
          removecom();
          break;
       case 102:
          putcom();
          break;
       case 103:
          wavecom();
          break;
       case 104:
          blizzardcom();
          break;
       case 105:
          opencom();
          break;
       case 106:
          closecom();
          break;
       case 107:
          lockcom();
          break;
       case 108:
          unlockcom();
          break;
       case 109:
          forcecom();
          break;
       case 110:
          lightcom();
          break;
       case 111:
          extinguishcom();
          break;
       case 118:
          cripplecom();
          break;
       case 119:
          curecom();
          break;
       case 120:
          dumbcom();
          break;
       case 121:
          changecom();
          break;
       case 122:
          missilecom();
          break;
       case 123:
          shockcom();
          break;
       case 124:
          fireballcom();
          break;
       case 126:
          blowcom();
          break;
       case 127:
          sighcom();
          break;
       case 128:
          kisscom();
          break;
       case 129:
          hugcom();
          break;
       case 130:
          slapcom();
          break;
       case 131:
          ticklecom();
          break;
       case 132:
          screamcom();
          break;
       case 133:
          bouncecom();
          break;
       case 134:
          wizcom();
          break;
       case 135:
          starecom();
          break;
       case 136:
          exits();
          break;
       case 138:
          singcom();
          break;
       case 140:
          spraycom();
          break;
       case 141:
          groancom();
          break;
       case 142:
          moancom();
          break;
       case 143:
          dircom();
          break;
       case 144:
          yawncom();
          break;
       case 117:;
       case 113:
          pushcom();
          break;
       case 145:
          wizlist();
          break;
       case 146:
          incom();
          break;
       case 147:
          lightcom();
          break;
       case 114:
          inviscom();
          break;
       case 115:
          viscom();
          break;
       case 148:
          deafcom();
          break;
       case 149:
          ressurcom();
          break;
       case 150:
          logcom();
          break;
       case 151:
          tsscom();
          break;
       case 152:
          rmeditcom();
          break;
       case 154:
          squeezecom();
          break;
       case 153:
          loccom();
          break;
       case 155:
          usercom();
          break;
       case 156:
          u_system();
          break;
       case 157:
          inumcom();
          break;
       case 158:
          updcom();
          break;
       case 159:
          becom();
          break;
       case 160:
          systat();
          break;
       case 161:
          convcom();
          break;
       case 162:
          snoopcom();
          break;
       case 163:
          shellcom();
          break;
       case 164:
          rawcom();
          break;
       case 165:
          purrcom();
          break;
       case 166:
          cuddlecom();
          break;
       case 167:
          sulkcom();
          break;
       case 168:
          rollcom();
          break;
       */
            169: () => new Promise((resolve) => {
                bprintf(state, showFile(CREDITS));
                resolve();
            }),
        /*
       case 170:
          brmode=!brmode;
          break;
       case 171:
          debugcom();
          break;
       case 172:
          jumpcom();
          break;
       case 112:
          wherecom();
          break;
       case 173:
          bprintf("Your adventurers automatic monster detecting radar, and long range\n");
          bprintf("mapping kit, is, sadly, out of order.\n");break;
       */
            174: () => new Promise((resolve) => {
                if (!state.in_fight) {
                    return dogocom(state);
                }
                return Promise.all([
                    getPlayer(state, state.mynum),
                    getItem(state, 32),
                ])
                    .then(([
                        player,
                        runeSword,
                    ]) => {
                        if (isCarriedBy(runeSword, player, !isWizard(state))) {
                            bprintf(state, 'The sword won\'t let you!!!!\n');
                            return resolve();
                        }
                        Promise.all([
                            sendLocalMessage(state, state.curch, state.globme, `${sendVisibleName(state.globme)} drops everything in a frantic attempt to escape\n`),
                            sendEndFight(state, state.globme),
                        ])
                            .then(() => {
                                updateScore(state, getScore(state) / 33);
                                /* loose 3% */
                                calibme(state);
                                state.in_fight = 0;
                                return onFlee(state);
                            })
                            .then(() => dogocom(state));
                    });
            }),
        /*
       case 175:
          bugcom();
          break;
       case 176:
          typocom();
          break;
       case 177:
          pncom();
          break;
       case 178:
          blindcom();
          break;
       case 179:
          edit_world();
          break;
          */
         180: () => getPlayer(state, state.mynum)
             .then((player) => player.canUseDebugMode && changeDebugMode(state)),
        /*
       case 181:
          setpflags();
          break;
       case 182:
          frobnicate();
          break;
       case 183:
          setincom();
          break;
       case 184:
          setoutcom();
          break;
       case 185:
          setmincom();
          break;
       case 186:
          setmoutcom();
          break;
       case 187:
          emotecom();
          break;
       case 188:
          digcom();
          break;
       case 189:
          emptycom();
          break;
         */
    };
    const defaultAction = () => new Promise((resolve) => {
        if (isGod(state)) {
            bprintf(state, `Sorry not written yet[COMREF ${actionId}]\n`);
        } else {
            bprintf(state, 'I don\'t know that verb.\n');
        }
        return resolve();
    });
    if ((actionId > 1) && (actionId < 8)) {
        return dodirn(state, actionId);
    }
    const action = actions[actionId] || defaultAction;
    return action();
};



/*
char in_ms[81]="has arrived.";
char out_ms[81]="";
char mout_ms[81]="vanishes in a puff of smoke.";
char min_ms[81]="appears with an ear-splitting bang.";
char here_ms[81]="is here";
    */

/*
long tdes=0;
long vdes=0;
long rdes=0;
long ades=0;
long zapped;
*/

const gamrcv = (state: State, block: { locationId: number, code: number }): Promise<void> => {
    const actions = {
        '-9900': () => setPlayer(state, i[0], { visibility: i[1] }),
        '-666': () => {
            bprintf(state, 'Something Very Evil Has Just Happened...\n');
            loseme(state);
            return endGame(state, 'Bye Bye Cruel World....');
        },
        '-599': (text: number[]) => {
            if (isme) {
                setLevel(state, text[0]);
                setScore(state, text[1]);
                setStrength(state, text[2]);
                calibme(state);
            }
        },
        '-750': () => {
            if (!isme) {
                return Promise.resolve();
            }
            return findPlayer(state, name2)
                .then((player2) => {
                    if (!player2) {
                        return loseme(state);
                    }
                    return saveWorld(state)
                        .then(() => {
                            console.log('***HALT');
                            return exit(0);
                        });
                });
        },
        '-400': () => {
            if (isme) {
                state.snoopd = -1;
            }
            return Promise.resolve();
        },
        '-401': () => {
            if (!isme) {
                return Promise.resolve();
            }
            return findPlayer(state, name2)
                .then((player2) => {
                    state.snoopd = player2 ? player2.playerId : -1;
                });
        },
        /*
       case -10000:
          if((isme!=1)&&(blok[0]==curch))
             {
             bprintf("%s",text);
             }
          break;
       case -10030:
          wthrrcv(blok[0]);break;
       */
        '-10021': (payload) => {
            if (!isme) {
                return Promise.resolve();
            }
            if (state.curch !== block.locationId) {
                return Promise.resolve();
            }
            state.rdes = 1;
            state.vdes = payload.characterId;
            return receiveDamage(state, payload, isme);
        },
        '-10020': (payload) => {
            if (!isme) {
                return Promise.resolve();
            }
            const ades = block.locationId;
            if (!isWizard(state)) {
                bprintf(state, `You drop everything you have as you are summoned by ${sendName(name2)}`);
            } else {
                bprintf(state, `${sendName(name2)} tried to summon you`);
                return Promise.resolve();
            }
            state.tdes = 1;
            return Promise.resolve();
        },
        '-10001': () => {
            if (isme) {
                if (isWizard(state)) {
                    bprintf(state, `${sendName(name2)} cast a lightning bolt at you\n`);
                    return Promise.resolve();
                }
                /* You are in the .... */
                bprintf(state, 'A massive lightning bolt arcs down out of the sky to strike');
                return sendWizards(state, `[ ${sendName(state.globme)} has just been zapped by ${sendName(name2)} and terminated ]\n`)
                    .then(() => Promise.all([
                        removePerson(state, state.globme),
                        sendLocalMessage(state, state.curch, state.globme, sendVisiblePlayer(state.globme, `${state.globme} has just died.\n\n`)),
                        new Promise((resolve) => {
                            state.zapped = true;
                            loseme(state);
                            bprintf(state, `You have been utterly destroyed by ${name2}\n`);
                            return resolve();
                        }),
                        endGame(state, 'Bye Bye.... Slain By Lightning'),
                    ]));
            } else if (block.locationId === state.curch) {
                bprintf(state, `${sendVisibleName('A massive lightning bolt strikes ')}${sendPlayerForVisible(name2)}${sendVisibleName('\n')}`);
                return Promise.resolve();
            }
        },
        '-10002': () => {
            if (isme) {
                return Promise.resolve();
            }
            if ((block.locationId === state.curch) || (isWizard(state))) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` shouts '${text}'\n`)}`);
                return Promise.resolve();
            } else {
                bprintf(state, sendSound(`A voice shouts '${text}'\n`));
                return Promise.resolve();
            }
        },
        '-10003': () => {
            if (isme) {
                return Promise.resolve();
            }
            if (block.locationId === state.curch) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` says '${text}'\n`)}`);
                return Promise.resolve();
            }
        },
        '-10004': () => {
            if (isme) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` tells you '${text}'\n`)}`);
            }
            return Promise.resolve();
        },
        '-10010': () => {
            if (isme) {
                loseme(state);
                return endGame(state, 'You have been kicked off');
            } else {
                bprintf(state, `${name1} has been kicked off\\n`);
                return Promise.resolve();
            }
        }
        /*
       case -10011:
          if(isme==1)
             {
             bprintf("%s",text);
             }
          break;
         */
    };
    const nameme = state.globme.toLowerCase();
    const [isme, name1, name2, text] = split(state, block, nameme);
    const i = text;
    return findPlayer(state, name1)
        .then((player1) => {
            if ((block.code === -20000) && (player1.playerId === state.fighting) {
                state.in_fight = 0;
                state.fighting = -1;
                return;
            } else if (block.code < -10099) {
                return newReceive(state, isme, block.locationId, name1, name2, block.code, text);
            } else {
                const action = actions[block.code] || (() => undefined);
                return action(text);
            }
        });
};

/*
ong me_ivct=0;
long last_io_interrupt=0;
*/

const eorte = (state: State): Promise<void> => {
    const ctm = time();
    if (ctm - state.last_io_interrupt > 2) {
        state.interrupt = true;
    }
    if (state.interrupt) {
        state.last_io_interrupt = ctm;
    }
    if (state.me_ivct) {
        state.me_ivct -= 1;
    }
    if (state.me_cal) {
        state.me_cal = false;
        calibme(state);
    }
    if (state.tdes) {
        dosumm(state.ades);
    }
    let p = Promise.resolve();
    if (state.in_fight) {
        p = getPlayer(state, state.fighting)
            .then((enemy) => {
                if (enemy.playerId !== state.curch) {
                    state.fighting = -1;
                    state.in_fight = 0;
                    return;
                }
                if (!enemy.exists) {
                    state.fighting = -1;
                    state.in_fight = 0;
                    return;
                }
                if (state.in_fight) {
                    if (state.interrupt) {
                        state.in_fight = 0;
                        return Promise.all([
                            getPlayer(state, state.fighting),
                            getItem(state, state.wpnheld),
                        ])
                            .then(([enemy, weapon]) => hitPlayer(state, enemy, weapon));
                    }
                }
            });
    }
    return p
        .then(() => Promise.all([
            checkRoll(r => r < 10),
            getPlayer(state, state.mynum),
            getItem(state, 18),
        ])
        .then(([
            xpRoll,
            player,
            item,
        ]) => {
            if (xpRoll || isWornBy(state, item, player)) {
                updateStrength(state, 1);
                if (state.i_setup) {
                    calibme(state);
                }
            }
            checkForce(state);
            if (state.me_drunk > 0) {
                state.me_drunk -= 1;
                if (!getDumb(state)) {
                    executeCommand(state, 'hiccup');
                }
            }
            state.interrupt = false;
        });
};

/*
long me_drunk=0;

FILE *openroom(n,mod)
    {
    long  blob[64];
    FILE *x;
    sprintf(blob,"%s%d",ROOMS,-n);
    x=fopen(blob,mod);
    return(x);
    }

long me_cal=0;
*/

const rescom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'What ?\\n');
        return Promise.resolve();
    }
    broad(state, 'Reset in progress....\\nReset Completed....\\n');
    return openlock(RESET_DATA, 'r')
        .then((b) => {
            return Promise.all(sec_read(state, b, 0, 4 * state.numobs))
                .then(items => items.map((data, itemId) => setItem(state, itemId, data)))
                .then(() => fcloselock(b));
        })
        .then(() => fopen(RESET_T, 'w'))
        .then((s) => fprintf(state, s, `Last Reset At ${ctime(time())}\n`).then(() => fclose(a)))
        .then(() => fopen(RESET_N, 'w'))
        .then((s) => fprintf(state, s, time()).then(() => fclose(a)))
        .then(() => resetPlayers(state));
}

const lightning = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'Your spell fails.....\n');
        return Promise.resolve();
    }
    const word = brkword(state);
    if (!word) {
        bprintf(state, 'But who do you wish to blast into pieces....\n');
        return Promise.resolve();
    }
    return findVisiblePlayer(state, word)
        .then((player) => {
            if (player.playerId === -1) {
                return bprintf(state, 'There is no one on with that name\n');
            }
            return sendExorcise(state, state.globme, player, player.locationId)
                .then(() => logger.write(`${state.globme} zapped ${player.name}`))
                .then(() => sendBotDamage(state, player, 10000))
                .then(() => broad(state, sendSound('You hear an ominous clap of thunder in the distance\n')));
        });
};

const eatcom = (state: State): Promise<void> => {
    const word = brkword(state);
    if (!word) {
        bprintf(state, 'What\n');
        return Promise.resolve();
    }
    return Promise.resolve(word)
        .then((word) => {
            if ((state.curch === -609) && (word === 'water')) {
                return 'spring';
            }
            if (word === 'from') {
                return brkword(state);
            }
            return word;
        })
        .then(word => findAvailableItem(state, word))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'There isn\'t one of those here\n');
            } else if (item.itemId === 11) {
                bprintf(state, 'You feel funny, and then pass out\n');
                bprintf(state, 'You wake up elsewhere....\n');
                return teleport(state, -1076);
            } else if (item.itemId === 75) {
                return bprintf(state, 'very refreshing\n');
            } else if (item.itemId === 175) {
                if (getLevel(state) < 3) {
                    updateScore(state, 40);
                    calibme(state);
                    bprintf(state, 'You feel a wave of energy sweeping through you.\n');
                } else {
                    bprintf(state, 'Faintly magical by the taste.\n');
                    if (getStrength(state) < 40) {
                        updateStrength(state, 2);
                    }
                    calibme(state);
                }
                return;
            } else if (item.isFood) {
                return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true }})
                    .then(() => {
                        bprintf(state, 'Ok....\n');
                        updateStrength(state, 12);
                        calibme(state);
                    });
            } else {
                return bprintf(state, 'Thats sure not the latest in health food....\n');
            }
        });
};

const calibme = (state: State): Promise<void> => {
    /* Routine to correct me in user file */
    if (!state.i_setup) {
        return;
    }
    const level = levelof(state, getScore(state));
    if (level !== getLevel(state)) {
        setLevel(state, level);
        bprintf(state, `You are now ${state.globme} `);
        logger.write(`${state.globme} to level ${level}`)
            .then(() => {
                bprintf(state, `${getTitle(level, getSex(state), state.hasfarted)}\n`);
                return getPlayer(state, state.mynum);
            })
            .then((player) => {
                return sendWizards(state, `${sendName(state.globme)} is now level ${level}\n`)
                    .then(() => {
                        if (level === 10) {
                            bprintf(state, showFile(GWIZ));
                        }
                    });
            });
    }
    return setPlayer(state, state.mynum, {
        level: getLevel(state),
        strength: getStrength(state),
        sex: getSex(state),
        weaponId: state.wpnheld,
    })
        .then(() => {
            if (getStrength(state) > (30 + 10 * getLevel(state))) {
                setStrength(state, 30 + 10 * getLevel(state));
            }
        });
};

const levelof = (state: State, score: number): number => {
    const realScore = score / 2; /* Scaling factor */
    const level = getLevel(state);
    if (level > 10) {
        return level;
    } else if (realScore < 500) {
        return 1;
    } else if (realScore < 1000) {
        return 2;
    } else if (realScore < 3000) {
        return 3;
    } else if (realScore < 6000) {
        return 4;
    } else if (realScore < 10000) {
        return 5;
    } else if (realScore < 20000) {
        return 6;
    } else if (realScore < 32000) {
        return 7;
    } else if (realScore < 44000) {
        return 8;
    } else if (realScore < 70000) {
        return 9;
    } else {
        return 10;
    }
};

const playcom = (state: State): Promise<void> => {
    const word = brkword(state);
    if (!word) {
        bprintf(state, 'Play what ?\n');
        return Promise.resolve();
    }
    return Promise.all([
        getPlayer(state, state.mynum),
        findAvailableItem(state, word),
    ])
        .then(([
            player,
            item,
        ]) => {
            if ((item.itemId === -1) || !isAvailable(item, player, state.curch, !isWizard(state))) {
                return bprintf(state, 'That isn\'t here\n');
            }
        })
};

const getreinput = (state: State): string => {
    let blob = '';
    while (getCurrentChar(state) === ' ') {
        nextStop(state);
    }
    while (getCurrentChar(state)) {
        blob += getCurrentChar(state);
        nextStop(state);
    }
    return blob;
};

const shoutcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        const blob = getreinput(state);
        if (isWizard(state)) {
            return sendShout(state, blob);
        } else {
            return sendSimpleShout(state, blob);
        }
    })
    .then(() => bprintf(state, 'Ok\n'));

const saycom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        const blob = getreinput(state);
        return sendSay(state, blob)
            .then(() => bprintf(state, `You say '${blob}'\n`));
    });

const tellcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        const word = brkword(state);
        if (!word) {
            bprintf(state, 'Tell who ?\n');
            return Promise.resolve();
        }
        return findVisiblePlayer(state, word)
            .then((player) => {
                if (player.playerId === -1) {
                    return bprintf(state, 'No one with that name is playing\n');
                }
                const blob = getreinput();
                return sendTell(state, player, blob);
            });
    });

const scorecom = (state: State): Promise<void> => {
    if (getLevel(state) === 1) {
        bprintf(state, `Your strength is ${getStrength(state)}\n`);
        return Promise.resolve();
    }
    bprintf(state, `Your strength is ${getStrength(state)}(from ${50 + 8 * getLevel(state)}),Your score is ${getScore(state)}\n`);
    bprintf(state, `This ranks you as ${state.globme} ${getTitle(getLevel(state), getSex(state), state.hasfarted)}\n`);
};

const exorcom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'No chance....\n');
        return Promise.resolve();
    }
    const word = brkword(state);
    if (!word) {
        bprintf(state, 'Exorcise who ?\n');
        return Promise.resolve();
    }
    return findVisiblePlayer(state, word)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'They aren\'t playing\n');
            }
            if (!player.canBeExorcised) {
                return bprintf(state, 'You can\'t exorcise them, they dont want to be exorcised\n');
            }
            return logger.write(`${state.globme} exorcised ${player.name}`)
                .then(() => dropItems(state, player))
                .then(() => Promise.all([
                    sendKick(state, player),
                    setPlayer(state, player.playerId, { exists: false }),
                ]));
        })
};

const givecom = (state: State): Promise<void> => {
    const obfrst = (player: Player, name: string) => {
        if (!player) {
            return bprintf(state, `Who is ${name}\n`);
        }
        const word = brkword(state);
        if (!word) {
            return bprintf(state, 'Give them what ?\n');
        }
        return findAvailableItem(state, word)
            .then((item) => {
                if (item.itemId === -1) {
                    return bprintf(state, 'You are not carrying that\n');
                }
                return dogive(state, item.itemId, player.playerId);
            })
    };

    const word = brkword(state);
    if (!word) {
        bprintf(state, 'Give what to who ?\n');
        return Promise.resolve();
    }
    findVisiblePlayer(state, word)
        .then((player) => {
            if (player) {
                return obfrst(player, word);
            }
            return findAvailableItem(state, word)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'You aren\'t carrying that\n');
                    }
                    /* a = item giving */
                    let whom = brkword(state);
                    if (!whom) {
                        return bprintf(state, 'But to who ?\n');
                    }
                    if (whom === 'to') {
                        whom = brkword(state);
                        if (!whom) {
                            return bprintf(state, 'But to who ?\n');
                        }
                    }
                    return findVisiblePlayer(state, whom)
                        .then((player) => {
                            if (!player) {
                                return bprintf(state, `I don't know who ${whom} is\n`);
                            }
                            return dogive(state, item.itemId, player.playerId);
                        });
                });
        })
};

const dogive = (state: State, itemId: number, playerId: number): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItem(state, itemId),
    getPlayer(state, playerId),
])
    .then(([
        me,
        item,
        player,
    ]) => {
        if (!isWizard(state) && (player.locationId !== state.curch)) {
            return bprintf(state, 'They are not here\n');
        }
        if (!isCarriedBy(item, me, !isWizard(state))) {
            return bprintf(state, 'You are not carrying that\n');
        }
        if (!cancarry(state, player.playerId)) {
            return bprintf(state, 'They can\'t carry that\n');
        }
        if (!isWizard(state) && (item.itemId === 32)) {
            return bprintf(state, 'It doesn\'t wish to be given away.....\n');
        }
        return holdItem(state, item.itemId, player.playerId)
            .then(() => sendPrivate(state, player, `${sendName(state.globme)} gives you the ${item.name}\n`));
    });

const stealcom = (state: State): Promise<void> => {
    const x = brkword(state);
    if (!x) {
        bprintf(state, 'Steal what from who ?\n');
        return Promise.resolve();
    }
    let word = brkword(state);
    if (!word) {
        bprintf(state, 'From who ?\n');
        return Promise.resolve();
    }
    if (word === 'from') {
        word = brkword(state);
        if (!word) {
            bprintf(state, 'From who ?\n');
            return Promise.resolve();
        }
    }
    return findVisiblePlayer(state, word)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'Who is that ?\n');
            }
            return findCarriedItem(state, x, player)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'They are not carrying that\n');
                    }
                    if (!isWizard(state) && (player.locationId !== state.curch)) {
                        return bprintf(state, 'But they aren\'t here\n');
                    }
                    if (item.wearingBy !== undefined) {
                        return bprintf(state, 'They are wearing that\n');
                    }
                    if (player.weaponId === item.itemId) {
                        return bprintf(state, 'They have that firmly to hand .. for KILLING people with\n');
                    }
                    if (!cancarry(state, state.mynum)) {
                        return bprintf(state, 'You can\'t carry any more\n');
                    }

                    const t = time(state);
                    srand(state, t);
                    let e = 10 + getLevel(state) - player.level;
                    e *= 5;
                    return roll()
                        .then((f) => {
                            if (f < e) {
                                if (f & 1) {
                                    return Promise.all([
                                        sendPrivate(state, player, `${sendName(state.globme)} steals the ${item.name} from you !\n`),
                                        sendBotDamage(state, player, 0),
                                    ]);
                                }
                                return holdItem(state, item.itemId, state.mynum);
                            } else {
                                return bprintf(state, 'Your attempt fails\n');
                            }
                        });
                });

        })
};

const dosumm = (state: State, locationId: number): Promise<void> => {
    const oldLocationId = state.curch;
    state.curch = locationId;
    trapch(state, state.curch);
    return Promise.all([
        sendLocalMessage(state, oldLocationId, state.globme, sendVisiblePlayer(state.globme, `${state.globme} vanishes in a puff of smoke\n`)),
        sendLocalMessage(state, locationId, state.globme, sendVisiblePlayer(state.globme, `${state.globme} appears in a puff of smoke\n`)),
        dropMyItems(state),
    ])
        .then(() => {});
};

const tsscom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    const s = getreinpout(state);
    return saveWorld(state)
        .then(() => {
            if (getuid(state) === geteuid(state)) {
                system(state, s);
                return Promise.resolve();
            } else {
                bprintf(state, 'Not permitted on this ID\n');
                return Promise.resolve();
            }
        });
};

const rmedit = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (!editor.isEditor) {
            return bprintf(state, 'Dum de dum.....\n');
        }
        return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} fades out of reality\n`))
            .then(() => {
                /* Info */
                state.cms = -2; /* CODE NUMBER */
                update(state, state.globme);
                return showMessages(state);
            })
            .then(() => saveWorld(state))
            .then(() => {
                if (chdir(state, ROOMS) === -1) {
                    bprintf(state, 'Warning: Can\'t CHDIR\n');
                }
                const ms2 = '/cs_d/aberstudent/yr2/hy8/.sunbin/emacs';
                system(state, ms2);
                state.cms = -1;
            })
            .then(() => loadWorld(state))
            .then(() => findPlayer(state, state.globme))
            .then((me) => {
                if (!me) {
                   loseme(state);
                    return endGame(state, 'You have been kicked off');
                }
                return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} re-enters the normal universe\n`));
            })
            .then(() => rte(state));
    });

const u_system = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (!isWizard(state)) {
            return bprintf(state, 'You\'ll have to leave the game first!\n');
        }

        state.cms = -2; /* CODE NUMBER */
        update(state, state.globme);
        return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} has dropped into BB\n`))
            .then(() => saveWorld(state))
            .then(() => system(state, '/cs_d/aberstudent/yr2/iy7/bt'))
            .then(() => loadWorld(state))
            .then(() => {
                state.cms = -1;
                return findPlayer(state, state.globme);
            })
            .then((me) => {
                if (!me) {
                    loseme(state);
                    return endGame(state, 'You have been kicked off');
                }
                rte(state);
            })
            .then(() => loadWorld(state))
            .then(() => sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} has returned to AberMud\n`)));
    });

const inumcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'Huh ?\n');
        return;
    }
    const word = brkword(state);
    if (!word) {
        bprintf(state, 'What...\n');
        return;
    }
    return findItem(state, word)
        .then(item => bprintf(state, `Item Number is ${item.itemId}\n`));
};

const updcom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'Hmmm... you can\'t do that one\n');
        return Promise.resolve();
    }
    loseme();
    return sendWizards(state, `[ ${state.globme} has updated ]\n`)
        .then(() => saveWorld(state))
        .then(() => execl(EXE, '   --{----- ABERMUD -----}--   ', `-n${state.globme}`)) /* GOTOSS eek! */
        .catch(() => bprintf(state, 'Eeek! someones pinched the executable!\n'));
};

const becom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'Become what ?\n');
        return Promise.resolve();
    }
    const x2 = getreinput(state);
    if (!x2) {
        bprintf(state, 'To become what ?, inebriated ?\n');
        return Promise.resolve();
    }
    return sendWizards(state, `${state.globme} has quit, via BECOME\n`)
        .then(() => loseme(state))
        .then(() => saveWorld(state))
        .then(() => execl(state, '   --}----- ABERMUD ------   ', `-n${x2}`))
        .catch(() => bprintf(state, 'Eek! someone\'s just run off with mud!!!!\n'));
};

const systat = (state: State): Promise<void> => {
    if (getLevel(state) < 10000000) {
        bprintf(state, 'What do you think this is a DEC 10 ?\n');
    }
    return Promise.resolve();
};

/*
 convcom()
    {
    extern long convflg;
    convflg=1;
    bprintf("Type '**' on a line of its own to exit converse mode\n");
    }
*/

const shellcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'There is nothing here you can shell\n');
        return Promise.resolve();
    }
    state.convflg = 2;
    bprintf(state, 'Type ** on its own on a new line to exit shell\n');
    return Promise.resolve();
};

const rawcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    const x = getreinput(state);
    if (isAdmin(state) && (x[0] === '!')) {
        broad(state, x.substr(1));
        return Promise.resolve();
    }
    broad(state, `** SYSTEM : ${x}\n`);
    return Promise.resolve();
};

const rollcom = (state: State): Promise<void> => getAvailableItem(state)
    .then((item) => {
        if ((item.itemId === 122) || (item.itemId === 123)) {
            return executeCommand(state, 'push pillar');
        } else {
            return bprintf(state, 'You can\'t roll that\n');
        }
    })

/*
long brmode=0;
*/

const debugcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    return debug2(state);
};

const bugcom = (state: State): Promise<void> => {
    const x = getreinput(state);
    return logger.write(`Bug by ${state.globme} : ${x}`);
};

const typocom = (state: State): Promise<void> => {
    const y = `${state.globme} in ${state.curch}`;
    const x = getreinput(state);
    return logger.write(`Typo by ${y} : ${x}`);
};

const look_cmd = (state: State): Promise<void> => {
    let word = brkword(state);
    if (!word) {
        const brhold = state.brmode;
        state.brmode = false;
        lookin(state, state.curch);
        state.brmode = brhold;
        return Promise.resolve();
    }

    if (word === 'at') {
        examcom(state);
        return Promise.resolve();
    }
    if ((word !== 'in') && (word !== 'into')) {
        return Promise.resolve();
    }
    word = brkword(state);
    if (!word) {
        bprintf(state, 'In what ?\n');
        return Promise.resolve();
    }
    return findAvailableItem(state, word)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'What ?\n');
            }
            if (!item.isContainer) {
                return bprintf(state, 'That isn\'t a container\n');
            }
            if (item.canBeOpened && (item.state !== 0)) {
                return bprintf(state, 'It\'s closed!\n');
            }
            bprintf(state, `The ${item.name} contains:\n`);
            return itemsAt(state, item.itemId, CONTAINED_IN)
                .then((result) => bprintf(state, result));
        });
};

const set_ms = (state: State): string => {
    if (!isWizard(state) && (state.globme !== 'Lorry')) {
        bprintf(state, 'No way !\n');
        return '';
    } else {
        return getreinput(state);
    }
}

/*

setmincom()
{
	extern char min_ms[];
	set_ms(min_ms);
}
setincom()
{
	extern char min_ms[];
	set_ms(in_ms);
}
setoutcom()
{
	extern char out_ms[];
	set_ms(out_ms);
}
setmoutcom()
{
	extern char mout_ms[];
	set_ms(mout_ms);
}

setherecom()
{
	extern char here_ms[];
	set_ms(here_ms);
}
*/

const digcom = (state: State): Promise<void> => getItem(state, 186)
    .then((slab) => {
        if ((slab.locationId === state.curch) && slab.isDestroyed) {
            bprintf(state, 'You uncover a stone slab!\n');
            return createItem(state, slab.itemId).then(() => undefined);
        }
        if ((state.curch !== -172) && (state.curch !== -192)) {
            return bprintf(state, 'You find nothing.\n');
        }
        return getItem(state, 176)
            .then((item176) => {
                if (item176.state === 0) {
                    return bprintf(state, 'You widen the hole, but with little effect.\n');
                }
                bprintf(state, 'You rapidly dig through to another passage.\n');
                return setItem(state, item176.itemId, { state: 0 })
            });
    });

const emptycom = (state: State): Promise<void> => {
    return  getAvailableItem(state)
        .then((container) => {
            return getItems(state)
                .then(items => items.filter((item) => isContainedIn(item, container, !isWizard(state))))
                .then(items => items.forEach((item) => {
                    return holdItem(state, item.itemId, state.mynum)
                        .then(() => {
                            bprintf(state, `You empty the ${item.name} from the ${container.name}\n`);
                            return executeCommand(state, `drop ${item.name}`)
                                .then(() => showMessages(state));
                        })
                        .then(() => loadWorld(state));
                }));
        });
};
