import State from "../state";
import Events, {
    PLAYER_MESSAGE,
} from '../tk/events';
import {
    createItem,
    getItem,
    getItems,
    getPlayer,
    getTitle,
    holdItem,
    Player,
    putItem,
    setItem,
    setPlayer
} from "../support";
import {
    CREDITS,
    logger,
    ROOMS,
} from "../files";
import {
    isCarriedBy,
    findAvailableItem,
    findCarriedItem,
    findItem,
    dropItems,
    dropMyItems,
    findVisiblePlayer,
    findPlayer,
    isContainedIn,
} from "../objsys";
import {
    actorName,
    createVisiblePlayerMessage,
    sendBaseMessage,
    sendTextMessage,
} from "../bprintf";
import {showMessages} from "../bprintf/output";
import {roll} from "../magic";
import {
    getAvailableItem,
    isWornBy,
    sendBotDamage,
} from "../new1";
import {sendWizards} from "../new1/events";
import {savePerson} from "../newuaf";
import {
    getLevel,
    getScore,
    getSex,
    getStrength,
    isAdmin,
    isGod,
    isWizard,
} from "../newuaf/reducer";
import {
    loadWorld,
    saveWorld,
} from "../opensys";
import {
    changeDebugMode,
    getCurrentChar,
    nextStop,
    switchBriefMode,
} from "./reducer";
import {executeCommand} from "./parser";
import Action from "../action";
import {
    getLocationId,
    getName,
    isHere,
    resetEvents,
    setConversationOn,
    setConversationShell,
} from "../tk/reducer";
import {
    fadePlayer,
    looseGame,
    processEvents,
    setLocationId,
} from "../tk";
import {Event} from "../services/world";
import {canCarry} from "../objsys/actions";
import {calibrate} from "./index";
import Battle from "../blood/battle";

const debug2 = (state: State): Promise<void> => Promise.resolve(bprintf(state, 'No debugger available\n'));

const onFlee = (state: State, actor: Player): Promise<void> => getItems(state)
    .then(items => items.forEach((item) => isCarriedBy(item, actor, !isWizard(state)) && !isWornBy(state, item, actor) && putItem(state, item.itemId, item.locationId)))
    .then(() => undefined);

const split = (state: State, event: Event, user: string): boolean => {
    const {
        receiver,
    } = event;
    if (receiver.toLowerCase().substr(0, 4) === 'the ') {
        if (receiver.toLowerCase().substr(4) === user) {
            return true;
        }
    }
    return (receiver.toLowerCase() === user);
};
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
        21: () => savePerson(state, actor),
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
        */
        /*
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
        */
        /*
       case 50:
          laughcom();
          break;
        */
        /*
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
        */
        /*
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
        */
        /*
       case 100:
          wearcom();
          break;
        */
        /*
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
            169: () => sendTextMessage(state, CREDITS),
            170: () => Promise.resolve(switchBriefMode(state)),
        /*
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
            174: (actor: Player) => new Promise((resolve) => (!Battle.isBattle(state))
                ? dogocom(state)
                : getItem(state, 32)
                    .then((runeSword) => {
                        if (isCarriedBy(runeSword, actor, !isWizard(state))) {
                            bprintf(state, 'The sword won\'t let you!!!!\n');
                            return resolve();
                        }
                        Promise.all([
                            Events.sendMyMessage(
                                state,
                                `${actorName(state)} drops everything in a frantic attempt to escape\n`
                            ),
                            Events.sendEndFight(state, getName(state)),
                        ])
                            .then(() => calibrate(state, actor, -(getScore(state) / 33))) /* loose 3% */
                            .then(() => {
                                Battle.stopFight(state);
                                return onFlee(state, actor);
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
         180: (actor: Player) => Promise.resolve(actor.canUseDebugMode && changeDebugMode(state)),
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

const getreinput = (state: State): string => {
    while (getCurrentChar(state) === ' ') {
        nextStop(state);
    }
    let blob = '';
    while (getCurrentChar(state)) {
        blob += getCurrentChar(state);
        nextStop(state);
    }
    return blob;
};

const scorecom = (state: State): Promise<void> => {
    if (getLevel(state) === 1) {
        bprintf(state, `Your strength is ${getStrength(state)}\n`);
        return Promise.resolve();
    }
    bprintf(state, `Your strength is ${getStrength(state)}(from ${50 + 8 * getLevel(state)}),Your score is ${getScore(state)}\n`);
    bprintf(state, `This ranks you as ${getName(state)} ${getTitle(getLevel(state), getSex(state), state.hasfarted)}\n`);
};

const exorcom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'No chance....\n');
        return Promise.resolve();
    }
    return Action.nextWord(state, 'Exorcise who ?\n')
        .then(word => findVisiblePlayer(state, word))
        .then((player) => {
            if (!player) {
                return bprintf(state, 'They aren\'t playing\n');
            }
            if (!player.canBeExorcised) {
                return bprintf(state, 'You can\'t exorcise them, they dont want to be exorcised\n');
            }
            return logger
                .write(`${getName(state)} exorcised ${player.name}`)
                .catch(error => looseGame(state, actor, error))
                .then(() => dropItems(state, player))
                .then(() => Promise.all([
                    sendKick(state, player),
                    setPlayer(state, player.playerId, { exists: false }),
                ]));
        })
};

const givecom = (state: State, actor: Player): Promise<void> => {
    const obfrst = (player: Player, name: string) => {
        if (!player) {
            return bprintf(state, `Who is ${name}\n`);
        }
        return Action.nextWord(state, 'Give them what ?\n')
            .then(word => findAvailableItem(state, word, actor))
            .then((item) => {
                if (item.itemId === -1) {
                    return bprintf(state, 'You are not carrying that\n');
                }
                return dogive(state, item.itemId, player.playerId, actor);
            })
    };

    return Action.nextWord(state, 'Give what to who ?')
        .then(word => findVisiblePlayer(state, word))
        .then((player) => {
            if (player) {
                return obfrst(player, word);
            }
            return findAvailableItem(state, word, actor)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'You aren\'t carrying that\n');
                    }
                    /* a = item giving */
                    return Promise.all([
                        Promise.resolve(item),
                        Action.nextWord(state, 'But to who ?'),
                    ]);
                })
                .then(([
                    item,
                    whom,
                ]) => {
                    if (whom === 'to') {
                        return Promise.all([
                            Promise.resolve(item),
                            Action.nextWord(state, 'But to who ?'),
                        ]);
                    }
                    return [
                        item,
                        whom,
                    ];
                })
                .then(([
                    item,
                    whom,
                ]) => Promise.all([
                    Promise.resolve(item),
                    findVisiblePlayer(state, whom),
                    Promise.resolve(whom),
                ]))
                .then(([
                    item,
                    player,
                    whom,
                ]) => {
                    if (!player) {
                        return bprintf(state, `I don't know who ${whom} is\n`);
                    }
                    return dogive(state, item.itemId, player.playerId);
                });
        });
};

const dogive = (state: State, itemId: number, playerId: number, actor: Player): Promise<void> => Promise.all([
    getItem(state, itemId),
    getPlayer(state, playerId),
])
    .then(([
        item,
        player,
    ]) => {
        if (!isWizard(state) && !isHere(state, player.locationId)) {
            return bprintf(state, 'They are not here\n');
        }
        if (!isCarriedBy(item, actor, !isWizard(state))) {
            return bprintf(state, 'You are not carrying that\n');
        }
        return canCarry(state, player)
            .then(result => {
                if (!result) {
                    return bprintf(state, 'They can\'t carry that\n');
                }
                if (!isWizard(state) && (item.itemId === 32)) {
                    return bprintf(state, 'It doesn\'t wish to be given away.....\n');
                }
                return holdItem(state, item.itemId, player.playerId)
                    .then(() => sendPrivate(state, player, `${actorName(state)} gives you the ${item.name}\n`));
            });
    });

const stealcom = (state: State, actor: Player): Promise<void> => {
    return Action.nextWord(state, 'Steal what from who ?')
        .then(x => Promise.all([
            Promise.resolve(x),
            Action.nextWord(state, 'From who ?')
        ]))
        .then(([x, word]) => {
            if (word === 'from') {
                return Promise.all([
                    Promise.resolve(x),
                    Action.nextWord(state, 'From who ?')
                ]);
            }
            return [
                x,
                word,
            ];
        })
        .then(([x, word]) => Promise.all([
            Promise.resolve(x),
            findVisiblePlayer(state, word),
        ]))
        .then(([x, player]) => {
            if (!player) {
                return bprintf(state, 'Who is that ?\n');
            }
            return findCarriedItem(state, x, player)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'They are not carrying that\n');
                    }
                    if (!isWizard(state) && !isHere(state, player.locationId)) {
                        return bprintf(state, 'But they aren\'t here\n');
                    }
                    if (item.wearingBy !== undefined) {
                        return bprintf(state, 'They are wearing that\n');
                    }
                    if (player.weaponId === item.itemId) {
                        return bprintf(state, 'They have that firmly to hand .. for KILLING people with\n');
                    }
                    return canCarry(state, actor)
                        .then((result) => {
                            if (!result) {
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
                                                sendPrivate(state, player, `${actorName(state)} steals the ${item.name} from you !\n`),
                                                sendBotDamage(state, actor, player, 0),
                                            ]);
                                        }
                                        return holdItem(state, item.itemId, actor.playerId);
                                    } else {
                                        return bprintf(state, 'Your attempt fails\n');
                                    }
                                });
                        })
                });

        })
};

const dosumm = (state: State, locationId: number): Promise<void> => dropMyItems(state, actor)
    .then(() => Events.sendSocialEvent(
        state,
        '[author] vanishes in a puff of smoke\n',
        PLAYER_MESSAGE,
    ))
    .then(() => setLocationId(state, locationId, actor))
    .then(() => Events.sendSocialEvent(
        state,
        '[author] appears in a puff of smoke\n',
        PLAYER_MESSAGE,
    ))
    .then(() => null);

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

const rmedit = (state: State, actor: Player): Promise<void> => {
    if (!actor.isEditor) {
        return bprintf(state, 'Dum de dum.....\n');
    }
    return sendWizards(state, createVisiblePlayerMessage(getName(state), '[author] fades out of reality\n'))
        .then(() => fadePlayer(state, actor)) /* CODE NUMBER */
        .then(() => showMessages(state))
        .then(() => saveWorld(state))
        .then(() => {
            if (chdir(state, ROOMS) === -1) {
                bprintf(state, 'Warning: Can\'t CHDIR\n');
            }
            const ms2 = '/cs_d/aberstudent/yr2/hy8/.sunbin/emacs';
            system(state, ms2);
            resetEvents(state);
        })
        .then(() => loadWorld(state))
        .then(world => findPlayer(state, getName(state)))
        .then((me) => {
            if (!me) {
                return looseGame(state, actor, 'You have been kicked off');
            }
            return sendWizards(state, createVisiblePlayerMessage(getName(state), '[author] re-enters the normal universe\n'));
        })
        .then(() => processEvents(state, actor));
};

const u_system = (state: State, actor: Player): Promise<void> => {
    if (!isWizard(state)) {
        return bprintf(state, 'You\'ll have to leave the game first!\n');
    }
    return fadePlayer(state, actor) /* CODE NUMBER */
        .then(() => sendWizards(state, createVisiblePlayerMessage(getName(state), '[author] has dropped into BB\n')))
        .then(() => saveWorld(state))
        .then(() => system(state, '/cs_d/aberstudent/yr2/iy7/bt'))
        .then(() => loadWorld(state))
        .then((world) => {
            resetEvents(state);
            return findPlayer(state, getName(state));
        })
        .then((me) => {
            if (!me) {
                return looseGame(state, actor, 'You have been kicked off');
            }
            return processEvents(state, actor);
        })
        .then(() => loadWorld(state))
        .then(world => sendWizards(state, createVisiblePlayerMessage(getName(state), '[author] has returned to AberMud\n')));
};

const inumcom = (state: State, actor: Player): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'Huh ?\n');
        return;
    }
    return Action.nextWord(state, 'What...')
        .then(word => findItem(state, word, actor))
        .then(item => bprintf(state, `Item Number is ${item.itemId}\n`));
};

const updcom = (state: State, actor: Player): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'Hmmm... you can\'t do that one\n');
        return Promise.resolve();
    }
    return sendWizards(state, `[ ${getName(state)} has updated ]\n`)
        .then(() => looseGame(state, actor, undefined))
        .then(() => execl(EXE, '   --{----- ABERMUD -----}--   ', `-n${getName(state)}`)) /* GOTOSS eek! */
        .catch(() => bprintf(state, 'Eeek! someones pinched the executable!\n'));
};

const becom = (state: State, actor: Player): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'Become what ?\n');
        return Promise.resolve();
    }
    const x2 = getreinput(state);
    if (!x2) {
        bprintf(state, 'To become what ?, inebriated ?\n');
        return Promise.resolve();
    }
    return sendWizards(state, `${getName(state)} has quit, via BECOME\n`)
        .then(() => looseGame(state, actor, undefined))
        .then(() => execl(state, '   --}----- ABERMUD ------   ', `-n${x2}`))
        .catch(() => bprintf(state, 'Eek! someone\'s just run off with mud!!!!\n'));
};

const systat = (state: State): Promise<void> => {
    if (getLevel(state) < 10000000) {
        bprintf(state, 'What do you think this is a DEC 10 ?\n');
    }
    return Promise.resolve();
};

const convcom = (state: State): Promise<void> => {
    setConversationOn(state);
    return sendBaseMessage(state, 'Type \'**\' on a line of its own to exit converse mode\n');
};

const shellcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'There is nothing here you can shell\n');
        return Promise.resolve();
    }
    setConversationShell(state);
    return sendBaseMessage(state, 'Type ** on its own on a new line to exit shell\n');
};

const rawcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    const x = getreinput(state);
    if (isAdmin(state) && (x[0] === '!')) {
        return Events.broadcast(state, x.substr(1));
    } else {
        return Events.broadcast(state, `** SYSTEM : ${x}\n`);
    }
};

const rollcom = (state: State, actor: Player): Promise<void> => getAvailableItem(state, actor)
    .then((item) => {
        if ((item.itemId === 122) || (item.itemId === 123)) {
            return executeCommand(state, 'push pillar', actor);
        } else {
            return bprintf(state, 'You can\'t roll that\n');
        }
    })

const debugcom = (state: State): Promise<void> => {
    if (!isGod(state)) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    return debug2(state);
};

const bugcom = (state: State, actor: Player): Promise<void> => {
    const x = getreinput(state);
    return logger
        .write(`Bug by ${getName(state)} : ${x}`)
        .catch(error => looseGame(state, actor, error));
};

const typocom = (state: State, actor: Player): Promise<void> => {
    const y = `${getName(state)} in ${getLocationId(state)}`;
    const x = getreinput(state);
    return logger
        .write(`Typo by ${y} : ${x}`)
        .catch(error => looseGame(state, actor, error));
};

const set_ms = (state: State): string => {
    if (!isWizard(state) && (getName(state) !== 'Lorry')) {
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
        if (isHere(state, slab.locationId) && slab.isDestroyed) {
            bprintf(state, 'You uncover a stone slab!\n');
            return createItem(state, slab.itemId).then(() => undefined);
        }
        if (!isHere(state, -172) && !isHere(state, -192)) {
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

const emptycom = (state: State, actor: Player): Promise<void> => {
    return  getAvailableItem(state, actor)
        .then((container) => {
            return getItems(state)
                .then(items => items.filter((item) => isContainedIn(item, container, !isWizard(state))))
                .then(items => items.forEach((item) => {
                    return holdItem(state, item.itemId, actor.playerId)
                        .then(() => {
                            bprintf(state, `You empty the ${item.name} from the ${container.name}\n`);
                            return executeCommand(state, `drop ${item.name}`, actor);
                        })
                        .then(() => showMessages(state))
                        .then(() => loadWorld(state));
                }));
        });
};
