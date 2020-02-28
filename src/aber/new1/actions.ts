import State from "../state";
import Action from "../action";
import {
    sendName,
    sendPlayerForVisible,
    sendSound,
    sendSoundPlayer,
    sendVisibleName,
    sendVisiblePlayer,
} from "../bprintf";
import {
    getAvailableItem,
    isWornBy,
    sendBotDamage,
    teleport,
} from "./index";
import {
    brkword,
    sendsys,
} from "../__dummies";
import {
    Item,
    Player,
    getHelper,
    getItem,
    getPlayer,
    holdItem,
    putItem,
    putItemIn,
    setItem,
    setPlayer,
    wearItem
} from "../support";
import {
    byMask,
    findAvailableItem,
    findPlayer,
    findVisiblePlayer,
    isCarriedBy,
    itemDescription,
} from "../objsys";
import {
    CAN_BE_EXTINGUISHED,
    CAN_BE_LIT,
    IS_DESTROYED,
    IS_KEY,
    IS_LIT,
} from "../object";
import {getDragon} from "../mobile";
import {endGame} from "../gamego/endGame";
import {sendMessage} from "../bprintf/bprintf";
import {roll} from "../magic";
import {
    sendBlind,
    sendChangeSex,
    sendCripple,
    sendCure, sendDeaf,
    sendDumb,
    sendFireball,
    sendForce,
    sendMissile,
    sendShock, sendSocial
} from "./events";
import {
    checkDumb,
    checkIsForced,
} from "./reducer";

const broad = (state: State, message: string): void => undefined;
const sillycom = (state: State, message: string): Promise<any> => Promise.resolve({});
const getreinput = (state: State): string => '';
const loseme = (state: State): void => undefined;
const openworld = (state: State): void => undefined;
const trapch = (state: State, locationId: number): void => undefined;

/* This one isnt for magic */

const getTargetPlayer = (state: State): Promise<Player> => {
    if (brkword(state) === -1) {
        throw new Error('Who ?');
    }
    openworld(state);
    if (state.wordbuf === 'at') {
        /* STARE AT etc */
        return getTargetPlayer(state);
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                throw new Error('Who ?');
            }
            return player;
        })
};

export const getAvailablePlayer = (state: State): Promise<Player> => getTargetPlayer(state)
    .then((player) => {
        if (player.locationId !== state.curch) {
            throw new Error('They are not here');
        }
        return player;
    });

const spellFails = (state: State, reflect: boolean) => sendMessage(state, 'You fumble the magic\n')
    .then(() => {
        if (!reflect) {
            return undefined;
        }
        return sendMessage(state, 'The spell reflects back\n')
            .then(() => getPlayer(state, state.mynum));
    });

const spellSuccess = (state: State) => (
    (state.my_lev < 10)
        ? sendMessage(state, 'The spell succeeds!!\n')
        : Promise.resolve()
);

const getSpellTarget = (state: State, reflect: boolean = true): Promise<Player> => getTargetPlayer(state)
    .then((player) => {
        if (state.my_str < 10) {
            throw new Error('You are too weak to cast magic');
        }
        if (state.my_lev < 10) {
            state.my_str -= 2;
        }
        return Promise.all([
            Promise.resolve(player),
            Promise.all([
                111,
                121,
                163,
            ].map(itemId => getItem(state, itemId))),
            roll(),
        ]);
    })
    .then(([
        player,
        items,
        successRoll,
    ]) => {
        const bonus = items.filter(item => isCarriedBy(item, player, (state.my_lev < 10))).length;
        const chance = (bonus + 5) * state.my_lev;
        if ((state.my_lev < 10) && (successRoll > chance)) {
            return spellFails(state, reflect);
        } else {
            return spellSuccess(state)
                .then(() => player);
        }
    })
    .then((target) => {
        if (!target) {
            throw new Error();
        }
        return target;
    });

const getTouchSpellTarget = (state: State): Promise<Player> => getSpellTarget(state, false)
    .then((player) => {
        if (player.locationId !== state.curch) {
            throw new Error('They are not here');
        }
        return player;
    });

const socialInteraction = (state: State, player: Player, message: string, visible: boolean = false, output: string = ''): Promise<any> => sendSocial(
    state,
    player,
    visible
        ? sendVisiblePlayer(state.globme, `${state.globme} ${message}\n`)
        : `${sendName(state.globme)} ${message}\n`,
)
    .then(() => output);

export class Bounce extends Action {
    action(state: State): Promise<any> {
        return sillycom(state, sendVisiblePlayer('%s', '%s bounces around\n'));
    }

    decorate(result: any): void {
        this.output('B O I N G !!!!\n');
    }
}

export class Sigh extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            checkDumb(state),
            sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sighs loudly\n')}`),
        ]);
    }

    decorate(result: any): void {
        this.output('You sigh\n');
    }
}

export class Scream extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            checkDumb(state),
            sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' screams loudly\n')}`),
        ]);
    }

    decorate(result: any): void {
        this.output('ARRRGGGGHHHHHHHHHHHH!!!!!!\n');
    }
}

export class Open extends Action {
    private static open21(state: State, item: Item): Promise<any> {
        if (item.isOpen) {
            throw new Error('It is');
        } else {
            throw new Error('It seems to be magically closed');
        }
    }

    private static open1(state: State, item: Item): Promise<any> {
        if (item.isOpen) {
            throw new Error('It is');
        }
        return setItem(state, item.itemId, { state: 1 })
            .then(() => 'The Umbrella Opens\n');
    }

    private static open20(state: State, item: Item): Promise<any> {
        throw new Error('You can\'t shift the door from this side!!!!');
    }

    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then((item) => {
                if (item.itemId === 21) {
                    return Open.open21(state, item);
                } else if (item.itemId === 1) {
                    return Open.open1(state, item);
                } else if (item.itemId === 20) {
                    return Open.open20(state, item);
                }

                if (!item.canBeOpened) {
                    throw new Error('You can\'t open that');
                }
                if (item.isOpen) {
                    throw new Error('It already is');
                }
                if (item.isLocked) {
                    throw new Error('It\'s locked!');
                }
                return setItem(state, item.itemId, { state: 0 })
                    .then(() => 'Ok\n');
            });
    }

    decorate(result: any): void {
        this.output(result);
    }
}

export class Close extends Action {
    private static close1(state: State, item: Item): Promise<any> {
        if (!item.isOpen) {
            throw new Error('It is closed, silly!');
        }
        return setItem(state, item.itemId, { state: 0 })
            .then(() => 'Ok\n');
    }

    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then((item) => {
                if (item.itemId === 1) {
                    return Close.close1(state, item)
                }
                if (!item.canBeOpened) {
                    throw new Error('You can\'t close that');
                }
                if (!item.isOpen) {
                    throw new Error('It is open already');
                }
                return setItem(state, item.itemId, { state: 1 })
                    .then(() => 'Ok\n');
            });
    }

    decorate(result: any): void {
        this.output(result);
    }
}

export class Lock extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            getAvailableItem(state),
            byMask(state, { [IS_KEY]: true })
        ])
            .then(([
                item,
                found,
            ]) => {
                if (!found) {
                    throw new Error('You haven\'t got a key');
                }
                if (!item.canBeLocked) {
                    throw new Error('You can\'t lock that!');
                }
                if (item.isLocked) {
                    throw new Error('It\'s already locked');
                }
                return setItem(state, item.itemId, { state: 2 });
            })
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Unlock extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            getAvailableItem(state),
            byMask(state, { [IS_KEY]: true })
        ])
            .then(([
                item,
                found,
            ]) => {
                if (!found) {
                    throw new Error('You have no keys');
                }
                if (!item.canBeLocked) {
                    throw new Error('You can\'t unlock that');
                }
                if (!item.isLocked) {
                    throw new Error('Its not locked!');
                }
                return setItem(state, item.itemId, { state: 1 });
            })
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Wave extends Action {
    private static wave136(state: State): Promise<any> {
        return getItem(state, 151)
            .then((item151) => {
                if (!item151) {
                    return null;
                }
                if (item151.state !== 1) {
                    return null;
                }
                if (item151.locationId !== state.curch) {
                    return null;
                }
                return setItem(state, 150, {state: 0})
                    .then(() => 'The drawbridge is lowered!\n');
            });
    }

    private static wave158(state: State): Promise<any> {
        teleport(state, -114);
        return Promise.resolve('You are teleported!\n');
    }

    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then((item) => {
                if (item.itemId == 136) {
                    return Wave.wave136(state);
                } else if (item.itemId == 158) {
                    return Wave.wave158(state);
                } else {
                    return null;
                }
            });
    }

    decorate(result: any): void {
        if (result) {
            this.output(result);
        } else {
            this.output('Nothing happens\n');
        }
    }
}

export class Blow extends Action {
    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then(() => {
                throw new Error('You can\'t blow that\n');
            });
    }
}

export class Put extends Action {
    private static putIn10(state: State, item: Item, container: Item): Promise<any> {
        if ((item.itemId < 4) || (item.itemId > 6)) {
            throw new Error('You can\'t do that');
        }
        if (container.state !== 2) {
            throw new Error('There is already a candle in it!');
        }
        state.my_sco += 50;
        return setItem(state, container.itemId, {
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
        })
            .then(() => 'The candle fixes firmly into the candlestick\n');
    }

    private static putIn137(state: State, item: Item, container: Item): Promise<any> {
        if (container.state === 0) {
            return putItem(state, item.itemId, -162)
                .then(() => 'ok\n');
        }
        return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true }})
            .then(() => {
                const message = 'It dissappears with a fizzle into the slime\n';
                if (item.itemId === 108) {
                    return setItem(state, container.itemId, { state: 0 })
                        .then(() => `${message}The soap dissolves the slime away!\n`)
                }
                return message;
            });
    }

    private static putIn193(state: State, item: Item, container: Item): Promise<any> {
        throw new Error('You can\'t do that, the chute leads up from here!');
    }

    private static putIn192(state: State, item: Item, container: Item): Promise<any> {
        if (item.itemId === 32) {
            throw new Error('You can\'t let go of it!');
        }
        return getItem(state, 193)
            .then((chute) => {
                sendsys(
                    state,
                    null,
                    null,
                    -10000,
                    chute.locationId,
                    `The ${item.name} comes out of the chute!\n`,
                );
                return putItem(state, item.itemId, chute.locationId);
            })
            .then(() => 'It vanishes down the chute....\n');
    }

    private static putIn23(state: State, item: Item, container: Item): Promise<any> {
        return getItem(state, 21)
            .then((item21) => {
                if ((item.itemId === 19) && (item21.state === 1)) {
                    return setItem(state, 20, { state: 0 })
                        .then(() => 'The door clicks open!\n');
                }
                return 'Nothing happens\n';
            });
    }

    private static putDefault(state: State, item: Item, container: Item): Promise<any> {
        return getDragon(state)
            .then((dragon) => {
                if (dragon) {
                    return;
                }
                if (item.itemId === 32) {
                    throw new Error('You can\'t let go of it!');
                }
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10000,
                    state.curch,
                    `${sendPlayerForVisible(state.globme)}${sendVisibleName(` puts the ${item.name} in the ${container.name}.\\n`)}`,
                );
                return Promise.all([
                    putItemIn(state, item.itemId, container.itemId),
                    item.changeStateOnTake
                        ? setItem(state, item.itemId, { state: 0 })
                        : Promise.resolve()
                ])
            })
            .then(() => {
                const message = 'Ok.\n';
                if (state.curch === -1081) {
                            return setItem(state, 20, { state: 1 })
                                .then(() => `${message}The door clicks shut....\n`);
                }
                return message;
            });
    }

    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then((item) => {
                if (brkword(state) === -1) {
                    throw new Error('where ?');
                }
                if ((state.wordbuf === 'on') || (state.wordbuf === 'in')) {
                    if (brkword(state) === -1) {
                        throw new Error('What ?');
                    }
                }
                return Promise.all([
                    Promise.resolve(item),
                    findAvailableItem(state, state.wordbuf),
                ])
            })
            .then(([
                item,
                container,
            ]) => {
                if (!container) {
                    throw new Error('There isn\'t one of those here.');
                }
                if (container.itemId === 10) {
                    return Put.putIn10(state, item, container);
                } else if (container.itemId === 137) {
                    return Put.putIn137(state, item, container);
                } else if (container.itemId === 193) {
                    return Put.putIn193(state, item, container);
                } else if (container.itemId === 192) {
                    return Put.putIn192(state, item, container);
                } else if (container.itemId === 23) {
                    return Put.putIn23(state, item, container);
                } else if (container.itemId === item.itemId) {
                    throw new Error('What do you think this is, the goon show ?');
                }

                if (!container.isContainer) {
                    throw new Error('You can\'t do that');
                }
                if (!container.isOpen) {
                    throw new Error('That\'s not open');
                }
                if (item.flannel) {
                    throw new Error('You can\'t take that !');
                }
                return Put.putDefault(state, item, container);
            });
    }
}

export class Light extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            getAvailableItem(state),
            byMask(state, { [IS_LIT]: true }),
        ])
            .then(([
                item,
                found,
            ]) => {
                if (!found) {
                    throw new Error('You have nothing to light things from');
                }
                if (item.canBeLit) {
                    throw new Error('You can\'t light that!');
                }
                if (item.state === 0) {
                    throw new Error('It is lit');
                }
                return setItem(state, item.itemId, {
                    flags: { [IS_LIT]: true },
                    state: 0,
                });
            });
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Extinguish extends Action {
    action(state: State): Promise<any> {
        return getAvailableItem(state)
            .then((item) => {
                if (item.isLit) {
                    throw new Error('That isn\'t lit');
                }
                if (item.canBeExtinguished) {
                    throw new Error('You can\'t extinguish that!');
                }
                return setItem(state, item.itemId, {
                    flags: { [IS_LIT]: false },
                    state: 1,
                });
            })
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Push extends Action {
    private static pushDefault(state: State, item: Item): Promise<any> {
        if (item.isLever) {
            return setItem(state, item.itemId, { state: 0 })
                .then(() => `${itemDescription(item, state.debug_mode)}\n`);
        }
        if (item.isSwitch) {
            return setItem(state, item.itemId, { state: 1 - item.state })
                .then(() => `${itemDescription(item, state.debug_mode)}\n`);
        }
        return Promise.resolve('Nothing happens\n');
    };

    private static push126(state: State, item: Item): Promise<any> {
        return Promise.all([
            sendMessage(state, 'The tripwire moves and a huge stone crashes down from above!\n'),
            Promise.resolve(broad(state, sendSound('You hear a thud and a squelch in the distance.\n'))),
        ])
            .then(() => {
                loseme(state);
                return endGame(state, '             S   P    L      A         T           !');
            });
    }

    private static push162(state: State, item: Item): Promise<any> {
        state.curch = -140;
        trapch(state, state.curch);
        return Promise.resolve('A trapdoor opens at your feet and you plumment downwards!\n');
    }

    private static push130(state: State, item: Item): Promise<any> {
        return getItem(state, 132)
            .then((item132) => {
                if (item132.state === 1) {
                    return setItem(state, item132.itemId, {state: 0})
                        .then(() => 'A secret panel opens in the east wall!\n');
                }
                return 'Nothing happens\n';
            });
    }

    private static push131(state: State, item: Item): Promise<any> {
        return getItem(state, 134)
            .then((item134) => {
                if (item134.state !== 1) {
                    return null;
                }
                return setItem(state, item134.itemId, {state: 0})
                    .then(() => 'Uncovering a hole behind it.\n');
            })
    }

    private static push138(state: State, item: Item): Promise<any> {
        return getItem(state, 137)
            .then((item137) => {
                if (item137.state === 0) {
                    return 'Ok...\n';
                }
                return setItem(state, item137.itemId, { state: 0 })
                    .then(()=> 'You hear a gurgling noise and then silence.\n');
            });
    }

    private static push146(state: State, item: Item): Promise<any> {
        return getItem(state, 146)
            .then((item146) => setItem(state, item146.itemId, { state: 1 - item146.state }))
            .then(() => 'Ok...\n');
    }

    private static push30(state: State, item: Item): Promise<any> {
        return Promise.all([
            getItem(state, 28),
            getItem(state, 29),
        ])
            .then(([
                item1,
                item2,
            ]) => Promise.all([
                Promise.resolve(item1.state !== 0),
                Promise.resolve(item1.locationId),
                Promise.resolve(item2.locationId),
                setItem(state, item1.itemId, { state: 1 - item1.state }),
            ]))
            .then(([
                isOpen,
                location1,
                location2,
            ]) => {
                const message = isOpen
                    ? sendVisibleName('The portcullis falls\n')
                    : sendVisibleName('The portcullis rises\n');
                sendsys(
                    state,
                    null,
                    null,
                    -10000,
                    location1,
                    message,
                );
                sendsys(
                    state,
                    null,
                    null,
                    -10000,
                    location2,
                    message,
                );
            });
    }

    private static push149(state: State, item: Item): Promise<any> {
        return Promise.all([
            getItem(state, 150),
            getItem(state, 151),
        ])
            .then(([
                item1,
                item2,
            ]) => Promise.all([
                Promise.resolve(item1.state !== 0),
                Promise.resolve(item1.locationId),
                Promise.resolve(item2.locationId),
                setItem(state, item1.itemId, { state: 1 - item1.state }),
            ]))
            .then(([
                isOpen,
                location1,
                location2,
            ]) => {
                const message = isOpen
                    ? sendVisibleName('The drawbridge rises\n')
                    : sendVisibleName('The drawbridge is lowered\n');
                sendsys(
                    state,
                    null,
                    null,
                    -10000,
                    location1,
                    message,
                );
                sendsys(
                    state,
                    null,
                    null,
                    -10000,
                    location2,
                    message,
                );
            });
    }

    private static push24(state: State, item: Item): Promise<any> {
        return getItem(state, 26)
            .then((item26) => {
                if (item26.state === 1) {
                    return setItem(state, item26.itemId, { state: 0 })
                        .then(() => 'A secret door slides quietly open in the south wall!!!\n');
                }
                return 'It moves but nothing seems to happen\n';
            });
    }

    private static push49(state: State, item: Item): Promise<any> {
        return Promise.resolve(broad(state, sendSound('Church bells ring out around you\n')));
    }

    private static push104(state: State, item: Item): Promise<any> {
        return getPlayer(state, state.mynum)
            .then(getHelper(state))
            .then((helper) => {
                if (!helper) {
                    throw new Error('You can\'t shift it alone, maybe you need help');
                }
                /* ELSE RUN INTO DEFAULT */
                return Push.pushDefault(state, item);
            })
    }

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Push what ?');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => {
                if (!item) {
                    throw new Error('That is not here');
                }
                if (item.itemId === 126) {
                    return Push.push126(state, item);
                } else if (item.itemId === 162) {
                    return Push.push162(state, item);
                } else if (item.itemId === 130) {
                    return Push.push130(state, item);
                } else if (item.itemId === 131) {
                    return Push.push131(state, item);
                } else if (item.itemId === 138) {
                    return Push.push138(state, item);
                } else if ((item.itemId === 146) || (item.itemId === 147)) {
                    return Push.push146(state, item);
                } else if (item.itemId === 30) {
                    return Push.push30(state, item);
                } else if (item.itemId === 149) {
                    return Push.push149(state, item);
                } else if (item.itemId === 24) {
                    return Push.push24(state, item);
                } else if (item.itemId === 49) {
                    return Push.push49(state, item);
                } else if (item.itemId === 104) {
                    return Push.push104(state, item);
                } else {
                    return Push.pushDefault(state, item);
                }
            });
    }
}

export class Cripple extends Action {
    action(state: State): Promise<any> {
        return getSpellTarget(state)
            .then(player => sendCripple(state, player));
    }
}

export class Cure extends Action {
    action(state: State): Promise<any> {
        return getTouchSpellTarget(state)
            .then(player => sendCure(state, player));
    }
}

export class Dumb extends Action {
    action(state: State): Promise<any> {
        return getSpellTarget(state)
            .then(player => sendDumb(state, player));
    }
}

export class Force extends Action {
    action(state: State): Promise<any> {
        return getSpellTarget(state)
            .then(player => sendForce(state, player, getreinput(state)));
    }
}

export class Missile extends Action {
    private static killVictim(state: State, victim: Player): Promise<void> {
        if (victim.isDead) {
            return Promise.resolve();
        }
        /* Bonus ? */
        state.my_sco += victim.value;
        state.in_fight = 0;
        state.fighting = -1;
        /* MARK ALREADY DEAD */
        return setPlayer(state, victim.playerId, { isDead: true });
    }

    action(state: State): Promise<any> {
        return getTouchSpellTarget(state)
            .then((player) => {
                const damage = state.my_lev * 2;
                const promises = [sendMissile(state, player, damage)];
                const result = (player.strength < damage);
                if (result) {
                    promises.push(Missile.killVictim(state, player));
                    promises.push(sendBotDamage(state, player, damage));
                }
                return Promise.all(promises).then(() => result);
            })
    }

    decorate(result: any): void {
        if (result) {
            this.output('Your last spell did the trick\n')
        }
    }
}

export class Change extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('change what (Sex ?) ?\n');
        }
        if (state.wordbuf !== 'sex') {
            throw new Error('I don\'t know how to change that\n');
        }
        return getSpellTarget(state)
            .then((player) => {
                const promises = [sendChangeSex(state, player)];
                if (player.isBot) {
                    promises.push(setPlayer(state, player.playerId, { sex: 1 - player.sex }));
                }
                return Promise.all(promises);
            })
    }
}

export class Fireball extends Action {
    private static killVictim(state: State, victim: Player): Promise<void> {
        if (victim.isDead) {
            return Promise.resolve();
        }
        /* Bonus ? */
        state.my_sco += victim.value;
        state.in_fight = 0;
        state.fighting = -1;
        /* MARK ALREADY DEAD */
        return setPlayer(state, victim.playerId, { isDead: true });
    }

    action(state: State): Promise<any> {
        return getTouchSpellTarget(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    throw new Error('Seems rather dangerous to me....');
                }
                return Promise.all([
                    Promise.resolve(player),
                    findPlayer(state, 'yeti'),
                ]);
            })
            .then(([
                player,
                yeti,
            ]) => {
                const damage = ((player.playerId === yeti.playerId) ? 6 : 2) * state.my_lev;
                const promises = [sendFireball(state, player, damage)];
                const result = (player.strength < damage);
                if (result) {
                    promises.push(Fireball.killVictim(state, player));
                    promises.push(sendBotDamage(state, player, damage));
                }
                return Promise.all(promises).then(() => result);
            })
    }

    decorate(result: any): void {
        if (result) {
            this.output('Your last spell did the trick\n')
        }
    }
}

export class Shock extends Action {
    private static killVictim(state: State, victim: Player): Promise<void> {
        if (victim.isDead) {
            return Promise.resolve();
        }
        /* Bonus ? */
        state.my_sco += victim.value;
        state.in_fight = 0;
        state.fighting = -1;
        /* MARK ALREADY DEAD */
        return setPlayer(state, victim.playerId, { isDead: true });
    }

    action(state: State): Promise<any> {
        return getTouchSpellTarget(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    throw new Error('You are supposed to be killing other people not yourself\n');
                }
                const damage = state.my_lev * 2;
                const promises = [sendShock(state, player, damage)];
                const result = (player.strength < damage);
                if (result) {
                    promises.push(Shock.killVictim(state, player));
                    promises.push(sendBotDamage(state, player, damage));
                }
                return Promise.all(promises).then(() => result);
            })
    }

    decorate(result: any): void {
        if (result) {
            this.output('Your last spell did the trick\n')
        }
    }
}

export class Stare extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    throw new Error('That is pretty neat if you can do it!');
                }
                return socialInteraction(
                    state,
                    player,
                    'stares deep into your eyes\n',
                    true,
                    `You stare at ${sendName(player.name)}\n`,
                 );
            });
    }
}

export class Grope extends Action {
    action(state: State): Promise<any> {
        return checkIsForced(state)
            .then(() => getAvailablePlayer(state))
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return sendMessage(state, 'With a sudden attack of morality the machine edits your persona\n')
                        .then(() => {
                            loseme(state);
                            return endGame(state, 'Bye....... LINE TERMINATED - MORALITY REASONS')
                                .then(() => null);
                        });
                }
                return socialInteraction(
                    state,
                    player, 'gropes you',
                    false,
                    '<Well what sort of noise do you want here ?>\n',
                );
            });
    }
}

export class Squeeze extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'Ok....\n';
                }
                if (!player) {
                    throw new Error()
                }
                return socialInteraction(
                    state,
                    player,
                    'gives you a squeeze\n',
                    false,
                    'You give them a squeeze\n',
                );
            });
    }
}

export class Kiss extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'Weird!\n';
                }
                return socialInteraction(
                    state,
                    player,
                    'kisses you\n',
                    false,
                    'Slurp!\n',
                );
            });
    }
}

export class Cuddle extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'You aren\'t that lonely are you ?\n';
                }
                return socialInteraction(state, player, 'cuddles you\n');
            });
    }
}

export class Hug extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'Ohhh flowerr!\n';
                }
                return socialInteraction(state, player, 'hugs you\n');
            });
    }
}

export class Slap extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'You slap yourself\n';
                }
                return socialInteraction(state, player, 'slaps you\n');
            });
    }
}

export class Tickle extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                if (player.playerId === state.mynum) {
                    return 'You tickle yourself\n';
                }
                return socialInteraction(state, player, 'tickles you\n');
            });
    }
}

export class Wear extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            getPlayer(state, state.mynum),
            getAvailableItem(state),
            Promise.all([
                89,
                113,
                114,
            ].map(itemId => getItem(state, itemId)))
        ])
            .then(([
                player,
                item,
                shields,
            ]) => {
                if (!isCarriedBy(item, player, (state.my_lev < 10))) {
                    throw new Error('You are not carrying this');
                }
                if (isWornBy(state, item, player)) {
                    throw new Error('You are wearing this');
                }
                if (
                    shields.some(shield => isWornBy(state, shield, player))
                        && shields.some(shield => (item.itemId === shield.itemId))
                ) {
                    throw new Error('You can\'t use TWO shields at once...');
                }
                if (!item.canBeWorn) {
                    throw new Error('Is this a new fashion ?');
                }
                return wearItem(state, item.itemId, state.mynum)
                    .then(() => 'OK\n');
            });
    }
}

export class Remove extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            getPlayer(state, state.mynum),
            getAvailableItem(state),
        ])
            .then(([
                player,
                item,
            ]) => {
                if (!isWornBy(state, item, player)) {
                    throw new Error('You are not wearing this');
                }
                return holdItem(state, item.itemId, state.mynum);
            });
    }
}

export class Deaf extends Action {
    action(state: State): Promise<any> {
        return getSpellTarget(state)
            .then(player => sendDeaf(state, player));
    }
}

export class Blind extends Action {
    action(state: State): Promise<any> {
        return getSpellTarget(state)
            .then(player => sendBlind(state, player));
    }
}
