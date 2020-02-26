import {
    bprintf,
    brkword,
    sendsys,
} from '../__dummies';
import State from "../state";
import {
    Item,
    getItem,
    putItem,
    holdItem,
    wearItem,
    setItem,
    getItems,
    getPlayer,
    setPlayer,
    getPlayers,
} from "../support";
import {
    IS_DESTROYED,
} from "../object";
import {logger} from "../files";
import {
    isCarriedBy,
    dropItems,
    dropMyItems,
} from "../objsys";
import {
    sendName,
    sendVisiblePlayer
} from "../bprintf";
import {endGame} from "../gamego/endGame";
import {roll} from "../magic";
import {getAvailableItem} from "./index";


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
    return Promise.all([
        getPlayer(state, state.mynum),
        getAvailableItem(state),
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
    return getAvailableItem(state)
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
