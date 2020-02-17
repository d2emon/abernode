import Action from './action';
import State from './state';
import {
    createItem,
    getItem,
    setItem,
    getItems,
    holdItem,
    itemIsAvailable,
    putItem,
    getPlayers,
    getPlayer,
    getHelper, Player, Item,
} from "./support";
import {bprintf, brkword, sendsys} from "./__dummies";
import {CONTAINED_IN, HELD_BY} from "./object";

const iscarrby = (state: State, item: Item, player: Player): boolean => false;
const iswornby = (state: State, item: Item, player: Player): boolean => false;

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

const itemsCarriedBy = (state: State, player: Player): Promise<void> => new Promise(() => itemsAt(state, player.playerId, HELD_BY)
    .then((result) => bprintf(state, result));

const MODE_NAME = 0;
const MODE_SHIELDS = 1;
const MODE_MY = 2;
const MODE_CARRIED = 3;
const MODE_HERE = 4;
const MODE_CONTAINED = 5;

const findItem = (state: State, name: string, mode: number, payload: number): Promise<Item> => {
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

    const patchForShields = (item: Item) => getPlayer(state, state.mynum)
        .then((player) => {
            if (item.itemId === 112) {
                return Promise.all([
                    getItem(state, 113),
                    getItem(state, 114),
                ])
                    .then(shields => shields.find(i => isCarriedBy(i, player, (state.my_lev < 10))))
            }
            return undefined;
        })
        .then((i) => {
            if (i) {
                return i;
            }
            return itemIsAvailable(state, item);
        });

    const findMy = (item: Item) => getPlayer(state, state.mynum)
        .then(player => isCarriedBy(item, player, (state.my_lev < 10)));

    const findCarried = (item: Item) => getPlayer(state, ctInf)
        .then(player => isCarriedBy(item, player, (state.my_lev < 10)));

    const findHere = (item: Item) => ishere(state, item.itemId);

    const findContained = (item: Item) => getItem(state, ctInf)
        .then(container => isContainedIn(item, container, (state.my_lev < 10)));

    const searchItem = (item: Item) => {
        if (item.name.toLowerCase() === name) {
            state.wd_it = name;
            if (mode === MODE_NAME) {
                return true;
            } else if (mode === MODE_SHIELDS) {
                /* Patch for shields */
                return patchForShields(item);
            } else if (mode === MODE_MY) {
                return findMy(item);
            } else if (mode === MODE_CARRIED) {
                return findCarried(item);
            } else if (mode === MODE_HERE) {
                return findHere(item);
            } else if (mode === MODE_CONTAINED) {
                return findContained(item);
            } else {
                return true;
            }
        }
    };

    return byColor(name)
        .then((item) => item || getItems(state).then(items => items.find(searchItem)));
};

/*
 fobn(word)
 char *word;
    {
long x;
x=fobna(word);
if(x!=-1) return(x);
    return(findItem(word.toLowerCase(),0,0));
    }

 fobna(word)
 char *word;
    {
    return(findItem(word.toLowerCase(),1,0));
    }

 fobnin(word,ct)
 char *word;
 long ct;
 {
 	return(findItem(word.toLowerCase(),5,ct));
 }

 fobnc(word)
 char *word;
    {
    return(findItem(word.toLowerCase(),2,0));
    }

 fobncb(word,by)
 char *word;
    {
    return(findItem(word.toLowerCase(),3,by));
    }

 fobnh(word)
 char *word;
    {
    return(findItem(word.toLowerCase(),4,0));
    }
*/

const getobj = (state: State): Promise<void> => {
    let des_inf: number = -1;

    if (brkword(state) === -1) {
        bprintf(state, 'Get what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobnh(state, state.wordbuf))
        .then((item) => {
            /* Hold */
            const i = state.stp;
            const bf = state.wordbuf;
            if ((brkword(state) !== -1) && ((state.wordbuf === 'from') || (state.wordbuf === 'out'))) {
                if (brkword(state) === -1) {
                    return bprintf(state, 'From what ?\n')
                }
                des_inf = fobna(state, state.wordbuf);
                if (des_inf === -1) {
                    return bprintf(state, 'You can\'t take things from that - it\'s not here\n');
                }
                state.stp = i;
                return getItem(state, fobnin(state, bf, des_inf));
            }
            state.stp = i;
            return item;
        })
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'That is not here.\n');
            }

            if ((item.itemId === 112) && (des_inf === -1)) {
                return Promise.all([
                    getItem(state, 113),
                    getItem(state, 114),
                ])
                    .then(([shield1, shield2]) => {
                        if (shield1.isDestroyed) {
                            return shield1;
                        } else if (shield2.isDestroyed) {
                            return shield2;
                        } else {
                            return undefined;
                        }
                    })
                    .then((shield) => {
                        if (shield !== undefined) {
                            createItem(state, shield.itemId)
                                .then((created) => {
                                    item = created;
                                });
                        } else {
                            return bprintf(state, 'The shields are all to firmly secured to the walls\n');
                        }
                    })
            }

            if (item.flannel) {
                return bprintf(state, 'You can\'t take that!\n');
            }
            if (dragget(state)) {
                return;
            }
            if (!cancarry(state, state.mynum)) {
                return bprintf(state, 'You can\'t carry any more\n');
            }
            let p = Promise.resolve();
            if (item.itemId === 32) {
                p = getPlayer(state, state.mynum)
                    .then(getHelper(state))
                    .then((helper) => {
                        if ((item.state === 1) && !helper) {
                            throw new Error('Its too well embedded to shift alone.\n');
                        }
                    })
            }
            return p
                .then(() => {
                    holdItem(state, item.itemId, state.mynum);
                    const bf2 = `[D]${state.globme}[/D][c] takes the ${item.name}\n[/c]`;
                    bprintf(state, 'Ok...\n');
                    sendsys(state, state.globme, state.globme, -10000, state.curch, bf2);
                    if (item.changeStateOnTake) {
                        setItem(state, item.itemId, { state: 0 });
                    }
                    if (state.curch === -1081) {
                        return setItem(state, 20, { state: 1 })
                            .then(() => bprintf(state, 'The door clicks shut....\n'));
                    }
                })
                .catch(e => bprintf(state, e));
        });
};

const ishere = (state: State, itemId: number): Promise<boolean> => getItem(state, itemId)
    .then((item) => {
        if ((state.my_lev < 10) && item.isDestroyed) {
            return false;
        }
        if (item.locatedIn !== undefined) {
            return false
        }
        if (item.locationId !== state.curch) {
            return false;
        }
        return true;
    });

const dropitem = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Drop what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobnc(state, state.wordbuf))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'You are not carrying that.\n');
            }

            if ((state.my_lev < 10) && (item.itemId === 32)) {
                return bprintf(state, 'You can\'t let go of it!\n');
            }
            return putItem(state, item.itemId, state.curch)
                .then(() => {
                    bprintf(state, 'OK..\n');
                    const bf = `[D]${state.globme}[/D][c] drops the ${state.wordbuf}.\n\n[/c]`;
                    sendsys(state, state.globme, state.globme, -10000, state.curch, bf);
                    if ((state.curch !== -183) && (state.curch !== -183)) {
                        return;
                    }
                    const bf2 = `The ${state.wordbuf} disappears into the bottomless pit.\n`;
                    bprintf(state, 'It disappears down into the bottomless pit.....\n');
                    sendsys(state, state.globme, state.globme, -10000, state.curch, bf2);
                    state.my_sco += item.value;
                    calibme(state);
                    return putItem(state, item.itemId, -6);
                });
        });
};

/*
 lisobs()
    {
    lojal2(1);
    showwthr();
    lojal2(0);
    }
*/

const lojal2 = (state: State, flannel: boolean): Promise<void> => getItems(state)
    .then(items => items.forEach((item) => {
        if (ishere(state, item.itemId) && (item.flannel === flannel)) {
            if (item.state > 3) {
                return;
            }
            if (item.description) {
                /*OLONGT NOTE TO BE ADDED */
                if (item.isDestroyed) {
                    bprintf(state, '--');
                }
                oplong(state, item.itemId);
                state.wd_it = item.name;
            }
        }
    }));

/*
 dumpitems()
    {
    extern long mynum;
    extern long curch;
    dumpstuff(mynum,curch);
    }
*/

const dumpstuff = (state: State, playerId: number, locationId: number): Promise<void> => getPlayer(state, playerId)
    .then(player => getItems(state)
        .then(items => items.forEach((item) => {
            if (isCarriedBy(item, player, (state.my_lev < 10))) {
                return putItem(state, item.itemId, locationId);
            }
        }))
    );

/*
long ublock[16*49];
*/

const whocom = (state: State): Promise<void> => {
    let base = state.maxu;
    if (state.my_lev > 9) {
        bprintf(state, 'Players\n');
        base = 0;
    }
    return getPlayers(state, base)
        .then(players => players.forEach((player) => {
            if (player.playerId === state.maxu) {
                bprintf(state, '----------\nMobiles\n');
                if (!player.exists) {
                    return;
                }
                dispuser(state, player.playerId);
            }
        }))
        .then(() => bprintf(state, '\n'));
};

const dispuser = (state: State, playerId: number): Promise<void> => getPlayer(state, playerId)
    .then((player) => {
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
    });

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

const oplong = (state: State, itemId: number): Promise<void> => getItem(state, itemId)
    .then((item) => {
        if (state.debug_mode) {
            return bprintf(state, `{${item.itemId}} ${item.description}\n`);
        }
        if (item.description) {
            return bprintf(state, `${item.description}\n`);
        }
    });

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
