import Action from './action';
import State from './state';
import {
    createItem,
    getItem,
    setItem,
    getItems,
    holdItem,
    putItem,
    getPlayers,
    getPlayer,
    getHelper, Player, Item,
} from "./support";
import {bprintf, brkword, sendsys} from "./__dummies";
import {CONTAINED_IN, HELD_BY} from "./object";
import {canSeePlayer, seePlayerName, sendPlayerForVisible, sendVisibleName, setName} from "./bprintf/bprintf";
import {getDragon} from "./mobile";
import {isWornBy} from "./new1";

const calibme = (state: State): boolean => false;
const showwthr = (state: State): boolean => false;
const cancarry = (state: State, playerId: number): boolean => false;

const SHIELD_BASE_ID = 112;
const SHIELD_IDS = [113, 114];

// Item checkers

export const isCarriedBy = (item: Item, owner: Player, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.wearingBy === undefined && item.heldBy === undefined) {
        return false
    }
    return item.locationId === owner.playerId;
};

export const isContainedIn = (item: Item, container: Item, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.containedIn === undefined) {
        return false;
    }
    return item.locationId === container.itemId;
};

export const isLocatedIn = (item: Item, locationId: number, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.locatedIn === undefined) {
        return false
    }
    return item.locationId === locationId;
};

export const isAvailable = (item: Item, player: Player, locationId: number, destroyed: boolean = false): boolean => {
    if (isLocatedIn(item, locationId, destroyed)) {
        return true;
    }
    return isCarriedBy(item, player, destroyed);
};

// Item finder

export const byMask = (state: State, mask: { [flagId: number]: boolean }): Promise<boolean> => Promise.all([
    getPlayer(state, state.mynum),
    getItems(state),
])
    .then(([player, items]) => items.some((item) => isAvailable(item, player, state.curch, (state.my_lev < 10))
        && Object.keys(mask).every((key) => item.flags[key] === mask[key])
    ));

export const itemsAt = (state: State, locationId: number, mode: number): Promise<string> => {
    const getLocation = (): Promise<Item | Player | undefined> => {
        if (mode === HELD_BY) {
            return getPlayer(state, locationId);
        } else if (mode === CONTAINED_IN) {
            return getItem(state, locationId);
        } else {
            return undefined;
        }
    };

    const getItemsAt = (state: State, location: Item | Player, mode: number): Promise<Item[]> => getItems(state)
        .then(items => items.filter((item) => {
            /* Carried Loc ! */
            if (mode === HELD_BY) {
                return !!isCarriedBy(item, location as Player, (state.my_lev < 10));
            } else if (mode === CONTAINED_IN) {
                return !!isContainedIn(item, location as Item, (state.my_lev < 10));
            } else {
                return false;
            }
        }));

    const getItemMessage = (owner?: Item | Player) => (item: Item) => {
        let message = [
            item.name,
            state.debug_mode ? item.itemId : '',
            isWornBy(state, item, owner as Player) ? ' <worn>' : '',
        ].join('');
        return  item.isDestroyed
            ? ` (${message})`
            : ` ${message}`;
    };
    const decorate = (messages: string[]) => {
        if (!messages.length) {
            return 'Nothing\n';
        }

        const result = [];
        let row = '';
        messages.forEach((message) => {
            if ((row.length + message.length + 1) > 79) {
                result.push(row);
                row = '';
            }
            row += message;
        });
        result.push('');
        return result.join('\n');
    };

    return getLocation()
        .then(location => getItemsAt(state, location, mode)
            .then(items => items.map(getItemMessage(location))))
        .then(decorate);
};

const itemsCarriedBy = (state: State, player: Player): Promise<void> => itemsAt(state, player.playerId, HELD_BY)
    .then((result) => bprintf(state, result));

// Search item

const baseFindItem = (state: State, name: string): Promise<Item> => {
    const byName = (name: string): Promise<Item> => {
        if (name === 'red') {
            brkword(state);
            return getItem(state, 4);
        } else if (name === 'blue') {
            brkword(state);
            return getItem(state, 5);
        } else if (name === 'green') {
            brkword(state);
            return getItem(state, 6);
        }
        return getItems(state)
           .then(items => items.find(item => item.name.toLowerCase() === name));
    };

    return byName(name)
        .then((item) => {
             if (item) {
                 state.wd_it = name;
             }
             return item;
        });
};

export const findAvailableItem = (state: State, name: string): Promise<Item> => Promise.all([
        getPlayer(state, state.mynum),
        baseFindItem(state, name.toLowerCase()),
    ])
    .then(([
        player,
        item,
    ]) => {
        if (item.itemId !== SHIELD_BASE_ID) {
            return isAvailable(item, player, state.curch, (state.my_lev < 10)) && item;
        }
        return Promise.all(SHIELD_IDS.map(shieldId => getItem(state, shieldId)))
            .then(shields => shields.find(
                shield => isCarriedBy(shield, player, (state.my_lev < 10))
            ));
    });

export const findCarriedItem = (state: State, name: string, player: Player): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then(item => isCarriedBy(item, player, (state.my_lev < 10)) && item);

const findHereItem = (state: State, name: string): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then(item => isLocatedIn(item, state.curch, (state.my_lev < 10)) && item);

const findContainedItem = (state: State, name: string, container: Item): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then(item => isContainedIn(item, container, (state.my_lev < 10)) && item);

export const findItem = (state: State, name: string): Promise<Item> => findAvailableItem(state, name)
    .then((item) => item || baseFindItem(state, name.toLowerCase()));

//

export const itemDescription = (item: Item, debugMode: boolean): string => {
    const itemId = debugMode ? `{${item.itemId}} ` : '';
    return `${itemId}${item.description}`;
};

const listItems = (state: State, items: Item[]): string[] => items.map((item) => {
    /*OLONGT NOTE TO BE ADDED */
    state.wd_it = item.name;
    return `${item.isDestroyed ? '--' : ''}${itemDescription(item, state.debug_mode)}`;
});

export const showItems = (state: State): Promise<void> => getItems(state)
    .then(items => items.filter((item) => {
        if (!isLocatedIn(item, state.curch, (state.my_lev < 10))) {
            return false;
        }
        if (item.state > 3) {
            return false;
        }
        return !!item.description;
    }))
    .then((items) => {
        listItems(state, items.filter(item => item.flannel))
            .forEach(message => bprintf(state, `${message}\n`));
        showwthr(state);
        listItems(state, items.filter(item => !item.flannel))
            .forEach(message => bprintf(state, `${message}\n`));
    });

export const dropItems = (state: State, player: Player, locationId?: number): Promise<void> => getItems(state)
    .then(items => items.filter(item => isCarriedBy(item, player, (state.my_lev < 10))))
    .then(items => Promise.all(items.map(item => putItem(state, item.itemId, (locationId === undefined) ? player.locationId : locationId))))
    .then(() => {});

export const dropMyItems = (state: State) => getPlayer(state, state.mynum)
    .then(player => dropItems(state, player, state.curch));

// Player finders

export const findPlayer = (state: State, name: string): Promise<Player> => getPlayers(state)
    .then((players) => {
        const n1 = name.toLowerCase();
        return players.find((player) => {
            const n2 = player.name.toLowerCase();
            if (player.exists && (n1 === n2)) {
                return true;
            }
            if (n2.substr(0, 4) === 'the ') {
                if (player.exists && (n1 === n2.substr(4))) {
                    return true;
                }
            }
            return false;
        });
    });

export const findVisiblePlayer = (state: State, name: string): Promise<Player> => findPlayer(state, name)
    .then((player) => (
        player
        ? seePlayerName(state, player)
            .then(see => (see ? player : undefined))
        : undefined
    ));

export const listPeople = (state: State): Promise<string[]> => getPlayers(state)
    .then(players => players.filter((player) => {
        if (player.playerId === state.mynum) {
            return false;
        }
        if (!player.exists) {
            return false;
        }
        if (player.locationId !== state.curch) {
            return false;
        }
        return canSeePlayer(state, player);
    }))
    .then(players => players.map((player) => itemsAt(state, player.playerId, HELD_BY)
        .then((items) => {
            setName(state, player);
            if (player.sex) {
                state.wd_her = player.name;
            } else {
                state.wd_him = player.name;
            }
            const playerId = state.debug_mode ? `{${player.playerId}}` : '';
            return `${player.name} ${playerId}${player.title} is here carrying\n${items}`;
        })
    ))
    .then(promises => Promise.all(promises));

// Actions

export class Inventory extends Action {
    action(state: State): Promise<any> {
        return getPlayer(state, state.mynum)
            .then((player) => itemsCarriedBy(state, player))
            .then((result) => ({
                state,
                result,
            }));
    }

    decorate(result: any): Promise<void> {
        bprintf(result.state, 'You are carrying\n');
        return result;
    }
}

export class GetItem extends Action {
    fromContainer(state: State, name:string): Promise<Item[]> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('From what ?'));
        }
        return findAvailableItem(state, state.wordbuf)
            .then((container) => {
                if (!container) {
                    return Promise.reject(new Error('You can\'t take things from that - it\'s not here'));
                }
                return Promise.all([
                    findContainedItem(state, name, container),
                    Promise.resolve(container),
                ])
            });
    }

    getShield(state: State): Promise<Item> {
        return Promise.all(SHIELD_IDS.map(shieldId => getItem(state, shieldId)))
            .then(shields => shields.find(shield => shield.isDestroyed))
            .then((shield) => {
                if (!shield) {
                    return Promise.reject(new Error('The shields are all to firmly secured to the walls'));
                }
                return createItem(state, shield.itemId);
            })
    }

    getRuneSword(state: State, item: Item): Promise<Item> {
        return getPlayer(state, state.mynum)
            .then(getHelper(state))
            .then((helper) => {
                if ((item.state === 1) && !helper) {
                    throw new Error('Its too well embedded to shift alone.\n');
                }
            })
            .then(() => item);

    }

    private static checkDragon(state: State): Promise<boolean> {
        return getDragon(state)
            .then((isDragon) => {
                if (isDragon) {
                    return Promise.reject();
                }
                return true;
            })
    }

    private static checkCarry(state: State): Promise<boolean> {
        if (!cancarry(state, state.mynum)) {
            return Promise.reject(new Error('You can\'t carry any more'));
        }
        return Promise.resolve(true);
    }

    private checkCanGet(state: State, item: Item): Promise<Item> {
        if (item.flannel) {
            throw new Error('You can\'t take that!');
        }
        return Promise.all([
            GetItem.checkDragon(state),
            GetItem.checkCarry(state),
        ])
            .then(() => (item.itemId === 32) ? this.getRuneSword(state, item) : item);
    }

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('Get what ?'));
        }
        const stp = state.stp;
        const name = state.wordbuf;
        return findHereItem(state, name)
            .then((item: Item) => {
                /* Hold */
                if (brkword(state) === -1) {
                    return [item, undefined];
                }
                if ((state.wordbuf !== 'from') && (state.wordbuf !== 'out')) {
                    return [item, undefined];
                }
                return this.fromContainer(state, name);
            })
            .then(([item, container]) => {
                state.stp = stp;
                if (!item) {
                    return Promise.reject(new Error('That is not here.'));
                }
                return (!container && (item.itemId === SHIELD_BASE_ID)) ? this.getShield(state) : item;
            })
            .then(item => this.checkCanGet(state, item))
            .then((item) => {
                const results = [
                    holdItem(state, item.itemId, state.mynum),
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `${sendPlayerForVisible(state.globme)}${sendVisibleName(` takes the ${item.name}\n`)}`,
                        );
                        return resolve();
                    })
                ];
                const messages = [];
                if (item.changeStateOnTake) {
                    results.push(setItem(state, item.itemId, { state: 0 }));
                }
                if (state.curch === -1081) {
                    messages.push('The door clicks shut....\n');
                    results.push(setItem(state, 20, { state: 1 }));
                }
                return Promise.all(results).then(() => ({
                    state,
                    messages,
                }));
            })
            .then(() => ({ state }))
    }

    decorate(result: any): Promise<void> {
        const {
            state,
            messages,
        } = result;
        bprintf(state, 'Ok...\n');
        messages.forEach(message => bprintf(state, `${message}\n`));
        return Promise.resolve();
    }
}

export class DropItem extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('Drop what ?'));
        }
        return getPlayer(state, state.mynum)
            .then(player => findCarriedItem(state, state.wordbuf, player))
            .then((item) => {
                if (!item) {
                    return Promise.reject(new Error('You are not carrying that.'));
                }
                if ((item.itemId === 32) && (state.my_lev < 10)) {
                    return Promise.reject(new Error('You can\'t let go of it!'));
                }
                return Promise.all([
                    putItem(state, item.itemId, state.curch),
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `${sendPlayerForVisible(state.globme)}${sendVisibleName(` drops the ${item.name}\n`)}`,
                        );
                        return resolve();
                    })
                ]).then(() => item)
            })
            .then((item) => {
                if (state.curch !== -183) {
                    return {
                        state,
                        messages: [],
                    };
                }

                state.my_sco += item.value;
                return Promise.all([
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `The ${state.wordbuf} disappears into the bottomless pit.\n`,
                        );
                        return resolve();
                    }),
                    new Promise((resolve) => {
                        calibme(state);
                        return resolve();
                    }),
                    putItem(state, item.itemId, -6),
                ])
                    .then(() => ({
                        state,
                        messages: [
                            'It disappears down into the bottomless pit.....\n',
                        ],
                    }));
            });
    }

    decorate(result: any): Promise<void> {
        const {
            state,
            messages,
        } = result;
        bprintf(state, 'OK..\n');
        messages.forEach(message => bprintf(state, `${message}\n`));
        return Promise.resolve();
    }
}

class Who extends Action {
    getLevel(state: State): number {
        return state.my_lev;
    }

    describePlayer(state: State, player: Player): string {
        if (player.isDead) {
            /* On  Non game mode */
            return;
        }
        if (player.visibility > this.getLevel(state)) {
            return;
        }
        let result = `${player.name}${player.title}`;
        if (player.visibility) {
            result = `(${result})`;
        }
        return `${result}${player.isAbsent ? ' [Absent From Reality]' : ''}`;
    }

    action(state: State): Promise<any> {
        const maxPlayerId = (this.getLevel(state) > 9) ? 0 : state.maxu;
        const players = [];
        const mobiles = [];
        return getPlayers(state, maxPlayerId)
            .then(p => p.filter(player => player.exists))
            .then(p => p.forEach((player) => {
                const description = this.describePlayer(state, player);
                if (!description) {
                    return;
                }
                if (player.playerId < state.maxu) {
                    players.push(description);
                } else {
                    mobiles.push(description);
                }
            }))
            .then(() => ({
                state,
                players,
                mobiles,
            }));
    }

    decorate(result: any): Promise<void> {
        const {
            state,
            players,
            mobiles
        } = result;
        if (players.length) {
            bprintf(state, 'Players\n');
            players.forEach(player => bprintf(state, player))
        }
        if (mobiles.length) {
            if (players.length) {
                bprintf(state, '----------\n');
            }
            bprintf(state, 'Mobiles\n');
            mobiles.forEach(player => bprintf(state, player))
        }
        bprintf(state, '\n');
        return Promise.resolve();
    }
}

class UserCom extends Who {
    getLevel(state: State): number {
        return 0;
    }
}