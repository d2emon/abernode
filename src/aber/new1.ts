import {
    bprintf,
    brkword,
    sendsys,
} from './__dummies';
import State from "./state";
import {
    Item,
    getItem,
    putItem,
    holdItem,
    wearItem,
    putItemIn,
    setItem,
    getItems,
    getPlayer, setPlayer, getPlayers, getHelper
} from "./support";
import {
    IS_DESTROYED,
    CAN_BE_LIT,
    CAN_BE_EXTINGUISHED,
    IS_LIT, IS_KEY,
} from "./object";
import {logger} from "./files";
import {
    isCarriedBy,
    byMask,
    findAvailableItem,
    itemDescription,
    dropItems,
    dropMyItems,
    findVisiblePlayer, findPlayer
} from "./objsys";
import {
    sendName,
    sendPlayerForVisible,
    sendSound,
    sendSoundPlayer,
    sendVisibleName,
    sendVisiblePlayer
} from "./bprintf/bprintf";
import {endGame} from "./gamego/endGame";
import {roll} from "./magic";

/*
struct player_res
{
	char *p_name;
	long p_loc;
	long p_str;
	long p_sex;
	long p_lev;
};

typedef struct player_res PLAYER;

*/
/*
 Extensions section 1
 */
/*

extern FILE * openuaf();
extern FILE * openlock();
extern FILE * openroom();
extern char globme[];
extern char wordbuf[];
*/

const bouncecom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s bounces around\n'));
    bprintf(state, 'B O I N G !!!!\n');
    return Promise.resolve();
};

const sighcom = (state: State): Promise<void> => {
    if (chkdumb(state)) {
        return Promise.resolve();
    }
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sighs loudly\n')}`);
    bprintf(state, 'You sigh\n');
    return Promise.resolve();
};

const screamcom = (state: State): Promise<void> => {
    if (chkdumb(state)) {
        return Promise.resolve();
    }
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' screams loudly\n')}`);
    bprintf(state, 'ARRRGGGGHHHHHHHHHHHH!!!!!!\n');
    return Promise.resolve();
};

/* Door is 6 panel 49 */

const ohereandget = (state: State): Promise<number[]> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Tell me more ?\n');
        return Promise.resolve([-1]);
    }
    openworld(state);
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                bprintf(state, 'There isn\'t one of those here\n');
                return [-1, item.itemId];
            }
            return [1, item.itemId];
        })
};

const opencom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return getItem(state, itemId)
        .then((item) => {
            if (item.itemId === 21) {
                if (item.state == 0) {
                    return bprintf(state, 'It is\n');
                } else {
                    return bprintf(state, 'It seems to be magically closed\n');
                }
            } else if (item.itemId === 1) {
                if (item.state == 1) {
                    return bprintf(state, 'It is\n');
                } else {
                    return setItem(state, item.itemId, { state: 1 })
                        .then(() => bprintf(state, 'The Umbrella Opens\n'));
                }
            } else if (item.itemId === 20) {
                return bprintf(state, 'You can\'t shift the door from this side!!!!\n');
            }

            if (!item.canBeOpened) {
                return bprintf(state, 'You can\'t open that\n');
            }
            if (item.state === 0) {
                return bprintf(state, 'It already is\n');
            }
            if (item.state === 2) {
                return bprintf(state, 'It\'s locked!\n');
            }
            return setItem(state, item.itemId, { state: 0 })
                .then(() => bprintf(state, 'Ok\n'));
        });
};

const closecom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return getItem(state, itemId)
        .then((item) => {
            if (item.itemId === 1) {
                if (item.state === 0) {
                    return bprintf(state, 'It is closed, silly!\n');
                } else {
                    bprintf(state, 'Ok\n');
                    return setItem(state, item.itemId, { state: 0 });
                }
            }

            if (!item.canBeOpened) {
                return bprintf(state, 'You can\'t close that\n');
            }
            if (item.state !== 0) {
                return bprintf(state, 'It is open already\n');
            }
            bprintf(state, 'Ok\n');
            return setItem(state, item.itemId, { state: 1 });
        });
};

const lockcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return byMask(state, { [IS_KEY]: true })
        .then((found) => {
            if (found) {
                return bprintf(state, 'You haven\'t got a key\n');
            }
            return getItem(state, itemId)
                .then((item) => {
                    if (!item.canBeLocked) {
                        return bprintf(state, 'You can\'t lock that!\n');
                    }
                    if (item.state === 2) {
                        return bprintf(state, 'It\'s already locked\n');
                    }
                    bprintf(state, 'Ok\n');
                    return setItem(state, item.itemId, { state: 2 });
                });
        })
};

const unlockcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return byMask(state, { [IS_KEY]: true })
        .then((found) => {
            if (found) {
                return bprintf(state, 'You have no keys\n');
            }
            return getItem(state, itemId)
                .then((item) => {
                    if (!item.canBeLocked) {
                        return bprintf(state, 'You can\'t unlock that\n');
                    }
                    if (item.state !== 2) {
                        return bprintf(state, 'Its not locked!\n');
                    }
                    bprintf(state, 'Ok\n')
                    return setItem(state, item.itemId, { state: 1 });
                });
        })
};

const wavecom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return getItem(state, itemId)
        .then((item) => {
            if (item.itemId == 136) {
                getItem(state, 151)
                    .then((item151) => {
                        if ((item151.state === 1) && item151.locationId === state.curch) {
                            return setItem(state, 150, { state: 0 })
                                .then(() => bprintf(state, 'The drawbridge is lowered!\n'));
                        }
                    });
            } else if (item.itemId == 158) {
                bprintf(state, 'You are teleported!\n');
                teletrap(state, -114);
                return;
            }
            bprintf(state, 'Nothing happens\n');
        });
};


/*

 blowcom()
    {
    extern long my_sco;
    long a,b;
    b=ohereandget(&a);
    if(b== -1) return;
    bprintf("You can't blow that\n");
    }
*/

const putcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'where ?\n');
        return Promise.resolve();
    }
    if ((state.wordbuf === 'on') || (state.wordbuf === 'in')) {
        if (brkword(state) === -1) {
            bprintf(state, 'What ?\n');
            return Promise.resolve();
        }
    }
    return  Promise.all([
        getItem(state, itemId),
        findAvailableItem(state, state.wordbuf),
    ])
        .then(([
            item,
            container,
        ]) => {
            if (container.itemId === -1) {
                return bprintf(state, 'There isn\'t one of those here.\n');
            }
            if (container.itemId === 10) {
                if ((item.itemId < 4) || (item.itemId > 6)) {
                    return bprintf(state, 'You can\'t do that\n');
                }
                if (container.state !== 2) {
                    return bprintf(state, 'There is already a candle in it!\n');
                }
                bprintf(state, 'The candle fixes firmly into the candlestick\n');
                state.my_sco += 50;
                setItem(state, container.itemId, {
                    flags: {
                        [IS_DESTROYED]: true,
                        [CAN_BE_LIT]: true,
                        [CAN_BE_EXTINGUISHED]: true,
                        [IS_LIT]: item.isLit,
                    },
                    payload: {
                        1: item.itemId,
                    },
                    state: item.isLit ? 0 : 1,
                });
            } else if (container.itemId === 137) {
                if (container.state === 0) {
                    return putItem(state, item.itemId, -162)
                        .then(() => bprintf(state, 'ok\n'));
                }
                return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true }})
                    .then(() => {
                        bprintf(state, 'It dissappears with a fizzle into the slime\n');
                        if (item.itemId === 108) {
                            bprintf(state, 'The soap dissolves the slime away!\n');
                            return setItem(state, container.itemId, { state: 0 })
                        }
                    });
            } else if (container.itemId === 193) {
                bprintf(state, 'You can\'t do that, the chute leads up from here!\n');
                return;
            } else if (container.itemId === 192) {
                if (item.itemId === 32) {
                    bprintf(state, 'You can\'t let go of it!\n');
                    return;
                }
                return getItem(state, 193)
                    .then((chute) => {
                        bprintf(state, 'It vanishes down the chute....\n');
                        const ar = `The ${item.name} comes out of the chute!\n`;
                        sendsys(state, null, null, -10000, chute.locationId, ar);
                        return putItem(state, item.itemId, chute.locationId);
                    });
            } else if (container.itemId === 23) {
                return getItem(state, 21)
                    .then((item21) => {
                        if ((item.itemId === 19) && (item21.state === 1)) {
                            bprintf(state, 'The door clicks open!\n');
                            return setItem(state, 20, { state: 0 });
                        }
                        return bprintf(state, 'Nothing happens\n');
                    });
            } else if (container.itemId === item.itemId) {
                return bprintf(state, 'What do you think this is, the goon show ?\n');
            }

            if (!container.isContainer) {
                return bprintf(state, 'You can\'t do that\n');
            }
            if (container.state !== 0) {
                return bprintf(state, 'That\'s not open\n');
            }
            if (item.flannel) {
                return bprintf(state, 'You can\'t take that !\n');
            }
            if (dragget(state)) {
                return;
            }
            if (item.itemId === 32) {
                return bprintf(state, 'You can\'t let go of it!\n');
            }

            return putItemIn(state, item.itemId, container.itemId)
                .then(() => {
                    bprintf(state, 'Ok.\n');
                    const ar = `${sendPlayerForVisible(state.globme)}${sendVisibleName(` puts the ${item.name} in the ${container.name}.\\n`)}`;
                    sendsys(state, state.globme, state.globme, -10000, state.curch, ar);
                    if (item.changeStateOnTake) {
                        setItem(state, item.itemId, { state: 0 });
                    }
                    if (state.curch === -1081) {
                        setItem(state, 20, { state: 1 });
                        bprintf(state, 'The door clicks shut....\n');
                    }
                });
        });
};

const lightcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return Promise.all([
        getItem(state, itemId),
        byMask(state, { [IS_LIT]: true }),
    ])
        .then(([
            item,
            found,
        ]) => {
            if (!found) {
                return bprintf(state, 'You have nothing to light things from\n');
            }
            if (item.canBeLit) {
                return bprintf(state, 'You can\'t light that!\n');
            }
            if (item.state === 0) {
                return bprintf(state, 'It is lit\n');
            }
            return setItem(state, item.itemId, {
                flags: { [IS_LIT]: true },
                state: 0,
            })
                .then(() => bprintf(state, 'Ok\n'));
        });

};

const extinguishcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return getItem(state, itemId)
        .then((item) => {
            if (item.isLit) {
                return bprintf(state, 'That isn\'t lit\n');
            }
            if (item.canBeExtinguished) {
                return bprintf(state, 'You can\'t extinguish that!\n');
            }
            return setItem(state, item.itemId, {
                flags: { [IS_LIT]: false },
                state: 1,
            })
                .then(() => bprintf(state, 'Ok\n'));
        })

};

const pushcom = (state: State): Promise<void> => {
    const def2 = (item: Item): Promise<void> => {
        if (item.isLever) {
            return setItem(state, item.itemId, { state: 0 })
                .then(() => bprintf(state, `${itemDescription(item, state.debug_mode)}\n`));
        }
        if (item.isSwitch) {
            return setItem(state, item.itemId, { state: 1 - item.state })
                .then(() => bprintf(state, `${itemDescription(item, state.debug_mode)}\n`));
        }
        bprintf(state, 'Nothing happens\n');
        return Promise.resolve();
    };

    if (brkword(state) === -1) {
        bprintf(state, 'Push what ?\n');
        return Promise.resolve();
    }
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'That is not here\n');
            } else if (item.itemId === 126) {
                bprintf(state, 'The tripwire moves and a huge stone crashes down from above!\n');
                broad(state, sendSound('You hear a thud and a squelch in the distance.\n'));
                loseme(state);
                return endGame(state, '             S   P    L      A         T           !');
            } else if (item.itemId === 162) {
                bprintf(state, 'A trapdoor opens at your feet and you plumment downwards!\n');
                state.curch = -140;
                trapch(state, state.curch);
                return;
            } else if (item.itemId === 130) {
                return getItem(state, 132)
                    .then((item132) => {
                        if (item132.state === 1) {
                            return setItem(state, item132.itemId, { state: 0 })
                                .then(() => bprintf(state, 'A secret panel opens in the east wall!\n'));
                        }
                        return bprintf(state, 'Nothing happens\n');
                    })
            } else if (item.itemId === 131) {
                return getItem(state, 134)
                    .then((item134) => {
                        if (item134.state === 1) {
                            bprintf(state, 'Uncovering a hole behind it.\n');
                            return setItem(state, item134.itemId, { state: 0 });
                        }
                    })
            } else if (item.itemId === 138) {
                return getItem(state, 137)
                    .then((item137) => {
                        if (item137.state === 0) {
                            return bprintf(state, 'Ok...\n');
                        } else {
                            bprintf(state, 'You hear a gurgling noise and then silence.\n');
                            return setItem(state, item137.itemId, { state: 0 });
                        }
                    });
            } else if ((item.itemId === 146) || (item.itemId === 147)) {
                return getItem(state, 146)
                    .then((item146) => setItem(state, item146.itemId, { state: 1 - item146.state }))
                    .then(() => bprintf(state, 'Ok...\n'));
            } else if (item.itemId === 30) {
                return Promise.all([
                    getItem(state, 28),
                    getItem(state, 29),
                ])
                    .then(([
                        item1,
                        item2,
                    ]) => setItem(state, item1.itemId, { state: 1 - item1.state })
                        .then(() => {
                            if (item1.state) {
                                sendsys(state, null, null, -10000, item1.locationId, sendVisibleName('The portcullis falls\n'));
                                sendsys(state, null, null, -10000, item2.locationId, sendVisibleName('The portcullis falls\n');
                            } else {
                                sendsys(state, null, null, -10000, item1.locationId, sendVisibleName('The portcullis rises\n'));
                                sendsys(state, null, null, -10000, item2.locationId, sendVisibleName('The portcullis rises\n'));
                            }

                        }));
            } else if (item.itemId === 149) {
                return Promise.all([
                    getItem(state, 150),
                    getItem(state, 151),
                ])
                    .then(([
                        item1,
                        item2,
                    ]) => setItem(state, item1.itemId, { state: 1 - item1.state })
                        .then(() => {
                            if (item1.state) {
                                sendsys(state, null, null, -10000, item1.locationId, sendVisibleName('The drawbridge rises\n'));
                                sendsys(state, null, null, -10000, item2.locationId, sendVisibleName('The drawbridge rises\n'));
                            } else {
                                sendsys(state, null, null, -10000, item1.locationId, sendVisibleName('The drawbridge is lowered\n'));
                                sendsys(state, null, null, -10000, item2.locationId, sendVisibleName('The drawbridge is lowered\n'));
                            }

                        }));
            } else if (item.itemId === 24) {
                return getItem(state, 26)
                    .then((item26) => {
                        if (item26.state === 1) {
                            return setItem(state, item26.itemId, { state: 0 })
                                .then(() => bprintf(state, 'A secret door slides quietly open in the south wall!!!\n'));
                        } else {
                            bprintf(state, 'It moves but nothing seems to happen\n');
                        }
                    });
            } else if (item.itemId === 49) {
                return broad(state, sendSound('Church bells ring out around you\n'));
            } else if (item.itemId === 104) {
                return getPlayer(state, state.mynum)
                    .then(getHelper(state))
                    .then((helper) => {
                        if (!helper) {
                            return bprintf(state, 'You can\'t shift it alone, maybe you need help\n');
                        }
                        /* ELSE RUN INTO DEFAULT */
                        return def2(item);
                    })
            } else {
                return def2(item);
            }

        });
};

const cripplecom = (state: State): Promise<void> => {
    const [b, playerId] = victim(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then(player => sendsys(state, player.name, state.globme, -10101, state.curch, null));
};

const curecom = (state: State): Promise<void> => {
    const [b, playerId] = vichfb(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then(player => sendsys(state, player.name, state.globme, -10100, state.curch, null));
};

const dumbcom = (state: State): Promise<void> => {
    const [b, playerId] = victim(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then(player => sendsys(state, player.name, state.globme, -10102, state.curch, null));
};

const forcecom = (state: State): Promise<void> => {
    const [b, playerId] = victim(state);
    if (b === -1) {
        return Promise.resolve();
    }
    const z = getreinput();
    return getPlayer(state, playerId)
        .then(player => sendsys(state, player.name, state.globme, -10103, state.curch, z));
};

const missilecom = (state: State): Promise<void> => {
    /*
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    extern long my_lev;
    extern long fighting,in_fight;
    extern long my_sco;
    long ar[8];
    */
    const [b, playerId] = vichfb()
    return getPlayer(state, playerId)
        .then((player) => {
            if (b === -1) {
                return;
            }
            const ar = state.my_lev * 2;
            sendsys(state, player.name, state.globme, -10106, state.curch, ar);
            if (player.strength - 2 * state.my_lev < 0) {
                bprintf(state, 'Your last spell did the trick\n');
                if (!player.isDead) {
                    /* Bonus ? */
                    state.my_sco += player.value;
                    setPlayer(state, player.playerId, { isDead: true });
                    /* MARK ALREADY DEAD */
                    state.in_fight = 0;
                    state.fighting = -1;
                }
                if (player.playerId > 15) {
                    woundmn(state, player.playerId, 2 * state.my_lev);
                }
            }
        })
};

const changecom = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'change what (Sex ?) ?\n');
        return Promise.resolve();
    }
    if (state.wordbuf !== 'sex') {
        bprintf(state, 'I don\'t know how to change that\n');
        return Promise.resolve();
    }

    const [b, playerId] = victim(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => {
            sendsys(state, player.name, state.globme, -10107, state.curch, null);
            if (player.playerId < 16) {
                return;
            }
            return setPlayer(state, player.playerId, { sex: 1 - player.sex });
        })
};

const fireballcom = (state: State): Promise<void> => {
    const [b, playerId] = vichfb(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => {
            if (player.playerId === state.mynum) {
                return bprintf(state, 'Seems rather dangerous to me....\n');
            }
            const ar = 2 * state.my_lev;

            return findPlayer(state, 'yeti')
                .then((yeti) => {
                    if (player.strength - ((player.playerId === yeti.playerId) ? 6 : 2) * state.my_lev < 0) {
                        bprintf(state, 'Your last spell did the trick\n');
                        if (!player.isDead) {
                            /* Bonus ? */
                            state.my_sco += player.value;
                            setPlayer(state, player.playerId, { isDead: true });
                            /* MARK ALREADY DEAD */
                            state.in_fight = 0;
                            state.fighting = -1;
                        }
                        sendsys(state, player.name, state.globme, -10109, state.curch, ar);
                        if (player.playerId > 15) {
                            woundmn(state, player.playerId, 2 * state.my_lev);
                        }
                    }

                });
        })
};

const shockcom = (state: State): Promise<void> => {
    const [b, playerId] = vichfb(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => {
            if (player.playerId === state.mynum) {
                return bprintf(state, 'You are supposed to be killing other people not yourself\n');
            }

            if (player.strength - (2 * state.my_lev < 0) {
                bprintf(state, 'Your last spell did the trick\n');
                if (!player.isDead) {
                    /* Bonus ? */
                    state.my_sco += player.value;
                    setPlayer(state, player.playerId, { isDead: true });
                    /* MARK ALREADY DEAD */
                    state.in_fight = 0;
                    state.fighting = -1;
                }
                const ar = 2 * state.my_lev;
                sendsys(state, player.name, state.globme, -10110, state.curch, ar);
                if (player.playerId > 15) {
                    woundmn(state, player.playerId, 2 * state.my_lev);
                }
            }
        })
};

const starecom = (state: State): Promise<void> => {
    const [b, playerId] = vichere(state);
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => {
            if (player.playerId === state.mynum) {
                return bprintf(state, 'That is pretty neat if you can do it!\n');
            }
            sillytp(state, player.playerId, 'stares deep into your eyes\n');
            bprintf(state, `You stare at ${sendName(player.name)}\n`)

        });
};

const gropecom = (state: State): Promise<void> => {
    if (state.isforce) {
        bprintf(state, 'You can\'t be forced to do that\n');
        return Promise.resolve();
    }
    const [b, victimId] = vichere(state);
    if (b === -1) {
        return Promise.resolve();
    }
    if (victimId === state.mynum) {
        bprintf(state, 'With a sudden attack of morality the machine edits your persona\n');
        loseme(state);
        return endGame(state, 'Bye....... LINE TERMINATED - MORALITY REASONS')
    }
    return sillytp(state, victimId, 'gropes you')
        .then(() => bprintf(state, '<Well what sort of noise do you want here ?>\n'));
};

/*
 squeezecom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("Ok....\n");
       return;
       }
    if(a== -1) return;
    sillytp(a,"gives you a squeeze\n");
    bprintf("You give them a squeeze\n");
    return;
    }

 kisscom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("Weird!\n");
       return;
       }
    sillytp(a,"kisses you");
    bprintf("Slurp!\n");
    }

 cuddlecom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(mynum==a)
       {
       bprintf("You aren't that lonely are you ?\n");
       return;
       }
    sillytp(a,"cuddles you");
    }

 hugcom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(mynum==a)
       {
       bprintf("Ohhh flowerr!\n");
       return;
       }
    sillytp(a,"hugs you");
    }

 slapcom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(mynum==a)
       {
       bprintf("You slap yourself\n");
       return;
       }
    sillytp(a,"slaps you");
    }

 ticklecom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("You tickle yourself\n");
       return;
       }
    sillytp(a,"tickles you");
    }

 *//* This one isnt for magic *//*
*/

const vicbase = (state: State): Promise<number[]> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Who ?\n');
        return Promise.resolve([-1]);
    }
    const b = openworld(state);
    if (state.wordbuf === 'at') {
        /* STARE AT etc */
        return vicbase(state);
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                bprintf(state, 'Who ?\n');
                return [-1];
            }
            return [b, player.playerId];
        })
};

const vichere = (state: State, playerId: number): Promise<number> => getPlayer(state, vicbase(state, playerId))
    .then((player) => {
        if (player.playerId === -1) {
            return
        }
        if (player.locationId !== state.curch) {
            bprintf(state, 'They are not here\n');
            return -1;
        }
        return player.locationId;
    };

const vicf2 = (state: State, mode: number): Promise<number[]> => {
    const [a, playerId] = vicbase(state);
    if (a === -1) {
        return Promise.resolve([-1, playerId]);
    }
    if (state.my_str < 10) {
        bprintf(state, 'You are too weak to cast magic\n');
        return Promise.resolve([-1, playerId]);
    }
    if (state.my_lev < 10) {
        state.my_str -= 2;
    }
    return Promise.all([
        getPlayer(state, state.mynum),
        Promise.all([
            111,
            121,
            163,
        ].map(itemId => getItem(state, itemId))),
        roll(),
    ])
        .then(([
            player,
            items,
            successRoll,
        ]) => {
            let i = 5;
            items.forEach((item) => {
                if (isCarriedBy(item, player, (state.my_lev < 10))) {
                    i += 1;
                }
            })
            if ((state.my_lev < 10) && (successRoll > i * state.my_lev)) {
                bprintf(state, 'You fumble the magic\n');
                if (mode === 1) {
                    bprintf(state, 'The spell reflects back\n');
                    return [a, state.mynum];
                } else {
                    return [-1, playerId];
                }
            } else {
                if (state.my_lev < 10) {
                    bprintf(state, 'The spell succeeds!!\n');
                }
                return [a, playerId];
            }
        })
};

/*
 vicf2(x,f1)
long *x;
    {
    extern long mynum;
    long a;
    extern long my_str,my_lev;
    extern long curch;
    long b,i;
    }

 vicfb(x)
 long *x;
    {
    return(vicf2(x,0));
    }
    */

const vichfb = (state: State, playerId: number): Promise<number> => getPlayer(state, vicfb(state, playerId))
    .then((player) => {
        if (player.playerId === -1) {
            return -1;
        }
        if (player.locationId !== state.curch) {
            bprintf(state, 'They are not here\n');
            return -1;
        }
        return player.playerId;
    });

/*
 victim(x)
    	long *x;
    {
    return(vicf2(x,1));
    }
*/

const sillytp = (state: State, playerId: number, message: string): Promise<void> => getPlayer(state, playerId)
    .then((player) => {
        const bk = (message.substr(0, 4) === 'star')
            ? sendVisiblePlayer(state.globme, `${state.globme} ${message}\n`)
            : `${sendName(state.globme)} ${message}\n`;
        sendsys(state, player.name, state.globme, -10111, state.curch, bk);
    });

/*
long ail_dumb=0;
long  ail_crip=0;
long  ail_blind=0;
long  ail_deaf=0;

*/

const new1rcv = (state: State, isMe: boolean, locationId: number, receiver: string, sender: string, code: number, payload: any): Promise<void> => {
    const actions = {
        /*
       case -10100:
          if(isme==1) {
             bprintf("All your ailments have been cured\n");
             ail_dumb=0;
             ail_crip=0;
             ail_blind=0;ail_deaf=0;
             }
          break;
          */
        '-10101': () => new Promise((resolve) => {
            if (!isMe) {
                return resolve();
            }
            if (state.my_lev < 10) {
                bprintf(state, 'You have been magically crippled\n');
                state.ail_crip = true;
            } else {
                bprintf(state, `${sendName(sender)} tried to cripple you\n`)
            }
            return resolve();
        }),
        '-10102': () => new Promise((resolve) => {
            if (!isMe) {
                return resolve();
            }
            if (state.my_lev < 10) {
                bprintf(state, 'You have been struck magically dumb\n');
                state.ail_dumb = true;
            } else {
                bprintf(state, `${sendName(sender)} tried to dumb you\n`)
            }
            return resolve();
        }),
        '-10103': () => new Promise((resolve) => {
            if (!isMe) {
                return resolve();
            }
            if (state.my_lev < 10) {
                bprintf(state, `${sendName(sender)} has forced you to ${payload}\n`);
                addforce(state, payload);
            } else {
                bprintf(state, `${sendName(sender)} tried to force you to ${payload}\n`);
            }
            return resolve();
        }),
        '-10104': () => new Promise((resolve) => {
            if (!isMe) {
                bprintf(state, `${sendName(sender)} shouts '${payload}'\n`);
            }
            return resolve();
        }),
        '-10105': () => new Promise((resolve) => {
            if (!isMe) {
                return resolve();
            }
            if (state.my_lev < 10) {
                bprintf(state, 'You have been struck magically blind\n');
                state.ail_blind = true;
            } else {
                bprintf(state, `${sendName(sender)} tried to blind you\n`);
            }
            return resolve();
        }),
        '-10106': () => new Promise((resolve) => {
            if (iam(sender)) {
                return resolve();
            }
            if (state.curch !== locationId) {
                return resolve();
            }
            bprintf(state, `Bolts of fire leap from the fingers of ${sendName(sender)}\n`);
            if (isMe) {
                bprintf(state, 'You are struck!\n');
                wounded(state, Number(payload));
            } else {
                bprintf(state, `${sendName(receiver)} is struck\n`);
            }
            return resolve();
        }),
        /*
       case -10107:
          if(isme==1)
             {
             bprintf("Your sex has been magically changed!\n");
             my_sex=1-my_sex;
             bprintf("You are now ");
             if(my_sex)bprintf("Female\n");
             else
                bprintf("Male\n");
             calibme();
             }
          break;
          */
        '-10109': () => new Promise((resolve) => {
            if (iam(sender)) {
                return resolve();
            }
            if (state.curch !== locationId) {
                return resolve();
            }
            bprintf(state, `${sendName(sender)} casts a fireball\n`);
            if (isMe) {
                bprintf(state, 'You are struck!\n');
                wounded(state, Number(payload));
            } else {
                bprintf(state, `${sendName(receiver)} is struck\n`);
            }
            return resolve();
        }),
        '-10110': () => new Promise((resolve) => {
            if (iam(sender)) {
                return resolve();
            }
            if (isMe) {
                bprintf(state, `${sendName(sender)} touches you giving you a sudden electric shock!\n`);
                wounded(state, Number(payload));
            }
            return resolve();
        }),
        /*
       case -10111:
          if(isme==1)bprintf("%s\n",text);
          break;
       case -10113:
          if(my_lev>9)bprintf("%s",text);
          break;
         */
        '-10120': () => new Promise((resolve) => {
            if (!isMe) {
                return resolve();
            }
            if (state.my_lev < 10) {
                bprintf(state, 'You have been magically deafened\n');
                state.ail_deaf = true;
            } else {
                bprintf(state, `${sendName(sender)} tried to deafen you\n`);
            }
            return resolve();
        }),
    };
    const action = actions[code] || (() => Promise.resolve());
    return action();
};

const destroy = (state: State, itemId: Item): Promise<void> => setItem(state, itemId, {
    flags: { [IS_DESTROYED]: true }
});

const tscale = (state: State): Promise<number> => getPlayers(state, state.maxu)
    .then(players => players.filter(player => player.exists))
    .then((players) => {
       if (players.length === 1) {
           return 2;
       } else if (players.length === 2) {
           return 3;
       } else if (players.length === 3) {
           return 3;
       } else if (players.length === 4) {
           return 4;
       } else if (players.length === 5) {
           return 4;
       } else if (players.length === 6) {
           return 5;
       } else if (players.length === 7) {
           return 6;
       } else {
           return 7;
       }
    });

/*
 chkdumb()
    {
    extern long ail_dumb;
    if(!ail_dumb) return(0);
    bprintf("You are dumb...\n");
    return(1);
    }

 chkcrip()
    {
    extern long ail_crip;
    if(!ail_crip) return(0);
    bprintf("You are crippled\n");
    return(1);
    }

 chkblind()
    {
    extern long ail_blind;
    if(!ail_blind) return(0);
    bprintf("You are blind, you cannot see\n");
    return(1);
    }

 chkdeaf()
    {
    extern long ail_deaf;
    if(!ail_deaf) return(0);
    return(1);
    }
*/

const wounded = (state: State, damage: number): Promise<void> => {
    if (state.my_lev > 9) {
        return Promise.resolve();
    }
    state.my_str -= damage;
    state.me_cal = 1;
    if (state.my_lev >= 0) {
        return Promise.resolve();
    }
    closeworld(state);
    logger.write(`${state.globme} slain magically`)
        .then(() => {
            delpers(state, state.globme);
            state.zapped = true;
            openworld(state);
            return dropMyItems(state)
                .then(() => {
                    loseme(state);
                    const ms1 = `${state.globme} has just died\n`;
                    sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
                    const ms2 = `[ ${state.globme} has just died ]\n`;
                    sendsys(state, state.globme, state.globme, -10113, state.curch, ms2);
                    return endGame(state, 'Oh dear you just died');
                });
        });
};

const woundmn = (state: State, playerId: number, damage: number): Promise<void> => getPlayer(state, playerId)
    .then((player) => {
        const strength = player.strength - damage;
        return setPlayer(state, player.playerId, { strength })
            .then(() => {
                if (strength >= 0) {
                    return mhitplayer(state, player.playerId, state.mynum);
                }
                return dropItems(state, player)
                    .then(() => {
                        const ms = `[ ${player.name} has just died ]\n`;
                        sendsys(state, state.globme, state.globme, -10113, player.locationId, ms);
                        return setPlayer(state, player.playerId, { exists: false });
                    });
            });
    });

const mhitplayer = (state: State, enemyId: number, playerId: number): Promise<void> => getPlayer(state, enemyId)
    .then((enemy) => {
        /*
        extern long my_lev,mynum;
        long a,b,x[4];
        extern char globme[];
        */
        if (enemy.locationId !== state.curch) {
            return;
        }
        if ((enemy.playerId < 0) || (enemy.playerId > 47)) {
            return;
        }
        return roll()
            .then((a) => {
                let b  = 3 * (15 - state.my_lev) + 20;
                if (iswornby(state, 89, state.mynum) || iswornby(state, 113, state.mynum) || iswornby(state, 114, state.mynum)) {
                    b -= 10;
                }
                if (a < b) {
                    return roll()
                        .then((damageRoll) => {
                            const x = {
                                characterId: enemy.playerId,
                                damage: damageRoll % damof(state, enemy.playerId),
                            };
                            sendsys(state, state.globme, enemy.name, -10021, enemy.locationId, x);
                        });
                } else {
                    const x = {
                        characterId: enemy.playerId,
                        damage: -1,
                    };
                    sendsys(state, state.globme, enemy.name, -10021, enemy.locationId, x);
                }
            });
    });

const resetplayers = (state: State): Promise<void> => getPlayers(state)
    .then(players => players.filter(player => (player.playerId >= 16)))
    .then(players => players.forEach((player) => {
        if (player.playerId < 35) {
            return setPlayer(state, player.playerId, {
                name: state.pinit[player.playerId - 16].name,
                locationId: state.pinit[player.playerId - 16].locationId,
                level: state.pinit[player.playerId - 16].level,
                strength: state.pinit[player.playerId - 16].strength,
                visibility: 0,
                sex: state.pinit[player.playerId - 16].sex,
                weponId: -1,
            });
        } else {
            return setPlayer(state, player.playerId, { name: '' });
        }
    }));

/*
PLAYER pinit[48]=
    { "The Wraith",-1077,60,0,-2,"Shazareth",-1080,99,0,-30,"Bomber",-308,50,0,-10,
    "Owin",-311,50,0,-11,"Glowin",-318,50,0,-12,
    "Smythe",-320,50,0,-13
    ,"Dio",-332,50,0,-14
    ,"The Dragon",-326,500,0,-2,"The Zombie",-639,20,0,-2
    ,"The Golem",-1056,90,0,-2,"The Haggis",-341,50,0,-2,"The Piper"
    ,-630,50,0,-2,"The Rat",-1064,20,0,-2
    ,"The Ghoul",-129,40,0,-2,"The Figure",-130,90,0,-2,
    "The Ogre",-144,40,0,-2,"Riatha",-165,50,0,-31,
    "The Yeti",-173,80,0,-2,"The Guardian",-197,50,0,-2
    ,"Prave",-201,60,0,-400,"Wraith",-350,60,0,-2
    ,"Bath",-1,70,0,-401,"Ronnie",-809,40,0,-402,"The Mary",-1,50,0,-403,
    "The Cookie",-126,70,0,-404,"MSDOS",-1,50,0,-405,
    "The Devil",-1,70,0,-2,"The Copper"
    ,-1,40,0,-2
    };
*/

const wearcom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return Promise.all([
        getPlayer(state, state.mynum),
        getItem(state, itemId),
    ])
        .then(([player, item]) => {
            if (!isCarriedBy(item, player, (state.my_lev < 10))) {
                return bprintf(state, 'You are not carrying this\n');
            }
            if (iswornby(state, item.itemId, player.playerId)) {
                return bprintf(state, 'You are wearing this\n');
            }
            if ((iswornby(state, 89, state.mynum) || iswornby(state, 113, state.mynum) || iswornby(state, 114, state.mynum))
                && ((item.itemId === 89) || (item.itemId === 113) || (item.itemId === 114))) {
                return bprintf(state, 'You can\'t use TWO shields at once...\n');
            }
            if (canwear(state, item.itemId)) {
                return bprintf(state, 'Is this a new fashion ?\n');
            }
            return wearItem(state, item.itemId, state.mynum)
                .then(() => bprintf(state, 'OK\n'));
        });
};

const removecom = (state: State): Promise<void> => {
    const [b, itemId] = ohereandget();
    if (b === -1) {
        return Promise.resolve();
    }
    return getItem(state, itemId)
        .then((item) => {
            if (!iswornby(state, item.itemId, state.mynum)) {
                bprintf(state, 'You are not wearing this\\n')
            }
            return holdItem(state, item.itemId, state.mynum);
        });
};

const iswornby = (state: State, itemId: number, characterId: number): Promise<boolean> => Promise.all([
    getPlayer(state, characterId),
    getItem(state, itemId),
])
    .then(([player, item]) => {
        if (!isCarriedBy(item, player, (state.my_lev < 10))) {
            return false;
        }
        if (item.heldBy === undefined) {
            return false;
        }
        return true;
    });

/*
 addforce(x)
 char *x;
    {
    extern char acfor[];
    extern long forf;
    if(forf==1)bprintf("The compulsion to %s is overridden\n",acfor);
    forf=1;
    strcpy(acfor,x);
    }

long forf=0;
char acfor[128];

 forchk()
    {
    extern long forf;
    extern char acfor[];
    extern long isforce;
    isforce=1;
    if(forf==1) gamecom(acfor);
    isforce=0;
    forf=0;
    }

long isforce=0;
 damof(n)
    {
    switch(n)
       {
       case 20:
case 18:;
case 19:;
case 21:;
case 22:;
          return(6);
       case 23:
          return(32);
       case 24:
          return(8);
       case 28:
          return(6);
case 30:return(20);
case 31:return(14);
case 32:return(15);
case 33:return(10);
       default:
          return(10);
          }
    }
*/

const canwear = (state: State, itemId: number): Promise<boolean> => getItem(state, itemId)
    .then((item) => item.canBeWorn);

/*
 iam(x)
 char *x;
    {
    char a[64],b[64];
    extern char globme[];
    strcpy(a,x);
    strcpy(b,globme);
    lowercase(a);
    lowercase(b);
    if(!strcmp(a,b)) return(1);
    if(strncmp(b,"the ",4)==0)
       {
       if(!strcmp(a,b+4)) return(1);
       }
    return(0);
    }
    */

const deafcom = (state: State): Promise<void> => {
    const [b, playerId] = victim();
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => sendsys(state, player.name, state.globme, -10120, state.curch, null));
};

const blindcom = (state: State): Promise<void> => {
    const [b, playerId] = victim();
    if (b === -1) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => sendsys(state, player.name, state.globme, -10105, state.curch, null));
};

const teletrap = (state: State, locationId: number): Promise<void> => {
    const block1 = sendVisiblePlayer(state.globme, `${state.globme} has left.\n`);
    sendsys(state, state.globme, state.globme, -10000, state.curch, block1);
    state.curch = locationId;
    const block2 = sendVisiblePlayer(state.globme, `${state.globme} has arrived.\n`);
    sendsys(state, state.globme, state.globme, -10000, state.curch, block2);
    trapch(state, state.curch);
};

const on_flee_event = (state: State): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItems(state),
])
    .then(([
        player,
        items,
    ]) => items.forEach((item) => {
        if (isCarriedBy(item, player, (state.my_lev < 10)) && !iswornby(state, item.itemId, state.mynum)) {
            return putItem(state, item.itemId, item.locationId);
        }
    }))
    .then(() => undefined);
