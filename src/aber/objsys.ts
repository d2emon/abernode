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

const iswornby = (state: State, item: Item, player: Player): boolean => false;
const calibme = (state: State): boolean => false;
const dragget = (state: State): boolean => false;
const showwthr = (state: State): boolean => false;
const cancarry = (state: State, playerId: number): boolean => false;

const SHIELD_BASE_ID = 112;
const SHIELD_IDS = [113, 114];

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
            iswornby(state, item, owner as Player) ? ' <worn>' : '',
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
    const byColor = (color: string): Promise<Item> => {
        if (color === 'red') {
            brkword(state);
            return getItem(state, 4);
        } else if (color === 'blue') {
            brkword(state);
            return getItem(state, 5);
        } else if (color === 'green') {
            brkword(state);
            return getItem(state, 6);
        }
        return undefined;
    };

    return byColor(name)
        .then(
            (item) => item || getItems(state)
                .then(items => items.find(item => item.name.toLowerCase() === name))
                .then((item) => {
                    if (item) {
                        state.wd_it = name;
                    }
                    return item;
                })
        );
};

export const findAvailableItem = (state: State, name: string): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then((item: Item) => Promise.all([
        getPlayer(state, state.mynum),
        Promise.resolve(item),
    ]))
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

const dispuser = (state: State, player: Player): void => {
    if (player.isDead) {
        /* On  Non game mode */
        return;
    }
    if (player.visibility > state.my_lev) {
        return;
    }
    if (player.visibility) {
        bprintf(state, '(');
    }
    bprintf(state, `${player.name} `);
    disl4(state, player.level, player.sex);
    if (player.visibility) {
        bprintf(state, ')');
    }
    if (player.isAbsent) {
        bprintf(state, ' [Absent From Reality]');
    }
    bprintf(state, '\n');
};

/*
 disle3(n,s)
    {
    disl4(n,s);
   bprintf("\n");
    }
 disl4(n,s)
    {
    extern long hasfarted;
    switch(n)
       {
       case 1:
         bprintf("The Novice");
          break;
       case 2:
          if(!s)bprintf("The Adventurer");
          else
            bprintf("The Adventuress");
          break;
       case 3:
         bprintf("The Hero");
          if(s)bprintf("ine");
          break;
       case 4:
         bprintf("The Champion");
          break;
       case 5:
          if(!s)bprintf("The Conjurer");
          else
            bprintf("The Conjuress");
          break;
       case 6:
         bprintf("The Magician");
          break;
       case 7:
          if(s)bprintf("The Enchantress");
          else
            bprintf("The Enchanter");
          break;
       case 8:
          if(s)bprintf("The Sorceress");
          else
            bprintf("The Sorceror");
          break;
case 9:bprintf("The Warlock");
break;
       case 10:
          if(s)bprintf("The Apprentice Witch");
          else
            bprintf("The Apprentice Wizard");
          break;
case 11:bprintf("The 370");
break;
case 12:bprintf("The Hilbert-Space");
break;
case 14:bprintf("The Completely Normal Naughty Spud");
break;
case 15:bprintf("The Wimbledon Weirdo");
break;
case 16:bprintf("The DangerMouse");
break;
case 17:bprintf("The Charred Wi");
if(s) bprintf("tch");
else bprintf("zard");
break;
case 18:bprintf("The Cuddly Toy");
break;
case 19:if(!hasfarted) bprintf("Of The Opera");
else bprintf("Raspberry Blower Of Old London Town");
break;
case 20:bprintf("The 50Hz E.R.C.S");
break;
case 21:bprintf("who couldn't decide what to call himself");
break;
case 22:bprintf("The Summoner");
break;
case 10000:
bprintf("The 159 IQ Mega-Creator");
break;
case 10033:
case 10001:bprintf("The Arch-Wi");
if(s)bprintf("tch");
else bprintf("zard");
break;
case 10002:bprintf("The Wet Kipper");
break;
case 10003:bprintf("The Thingummy");
break;
case 68000:
bprintf("The Wanderer");
break;
case -2:
bprintf("\010");
break;
case -11:bprintf("The Broke Dwarf");break;
case -12:bprintf("The Radioactive Dwarf");break;
case -10:bprintf("The Heavy-Fan Dwarf");break;
case -13:bprintf("The Upper Class Dwarven Smith");break;
case -14:bprintf("The Singing Dwarf");break;
case -30:bprintf("The Sorceror");break;
case -31:bprintf("the Acolyte");break;
       default:
         bprintf("The Cardboard Box");
          break;
          }
    }
fpbn(name)
char *name;
{
long s;
extern char wd_them[],wd_him[],wd_her[],wd_it[];
s=fpbns(name);
if(s==-1) return(s);
if(!seeplayer(s)) return(-1);
return(s);
}
*/

const fpbns = (state: State, name: string): Promise<number> => getPlayers(state)
    .then((players) => {
        let res = null;
        const n1 = name.toLowerCase();
        players.forEach((player) => {
            if (res !== null) {
                return;
            }
            const n2 = player.name.toLowerCase();
            if (player.exists && (n1 === n2)) {
                res = player.playerId;
                return;
            }
            if (n2.substr(0, 4) === 'the ') {
                if (player.exists && (n1 === n2.substr(4))) {
                    res = player.playerId;
                    return;
                }
            }
        });
        return (res === null) ? -1 : res;
    });

const lispeople = (state: State): Promise<void> => getPlayers(state)
    .then(players => players.forEach((player) => {
        if (player.playerId === state.mynum) {
            return;
        }
        if (player.exists && (player.locationId === state.curch) && seeplayer(state, player.playerId)) {
            bprintf(state, `${player.name} `);
            if (state.debug_mode) {
                bprintf(state, `{${player.playerId}}`);
            }
            disl4(state, player.level, player.sex);
            if (player.sex) {
                state.wd_her = player.name;
            } else {
                state.wd_him = player.name;
            }
            bprintf(state, ' is here carrying\n');
            return itemsCarriedBy(state, player);
        }
    }));

/*
usercom()
{
extern long my_lev;
long a;
a=my_lev;
my_lev=0;
whocom();
my_lev=a;
}
 */

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
            .then((item) => {
                if (item.flannel) {
                    return Promise.reject(new Error('You can\'t take that!'));
                }
                if (dragget(state)) {
                    return Promise.reject();
                }
                if (!cancarry(state, state.mynum)) {
                    return Promise.reject(new Error('You can\'t carry any more'));
                }
                if (item.itemId === 32) {
                    return this.getRuneSword(state, item);
                }
                return item;
            })
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
                            `[D]${state.globme}[/D][c] takes the ${item.name}\n[/c]`,
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
                return putItem(state, item.itemId, state.curch).then(() => item)
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
    action(state: State): Promise<any> {
        const maxPlayerId = (state.my_lev > 9) ? 0 : state.maxu;
        if (maxPlayerId === 0) {
            bprintf(state, 'Players\n');
        }
        return getPlayers(state, maxPlayerId)
            .then(players => players.forEach((player) => {
                if (player.playerId === state.maxu) {
                    bprintf(state, '----------\nMobiles\n');
                }
                if (!player.exists) {
                    return;
                }
                return dispuser(state, player);
            }))
            .then(() => ({
                state,
            }));
    }

    decorate(result: any): Promise<void> {
        const {
            state,
        } = result;
        bprintf(state, '\n');
        return Promise.resolve();
    }
}