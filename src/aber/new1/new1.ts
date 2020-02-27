import {
    bprintf,
    sendsys,
} from '../__dummies';
import State from "../state";
import {
    getItem,
    putItem,
    holdItem,
    wearItem,
    getItems,
    getPlayer,
    setPlayer,
    getPlayers,
} from "../support";
import {
    isCarriedBy,
    dropItems,
} from "../objsys";
import {
    sendVisiblePlayer
} from "../bprintf";
import {roll} from "../magic";
import {getAvailableItem, getSpellTarget} from "./index";
import {sendBlind, sendDeaf, sendWizards} from "./receivers";

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
    return getSpellTarget(state)
        .then(player => sendDeaf(state, player));
};

const blindcom = (state: State): Promise<void> => {
    return getSpellTarget(state)
        .then((player) => sendBlind(state, player));
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
