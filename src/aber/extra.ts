import {
    bprintf,
    brkword,
    desrm,
    sendsys,
} from './__dummies';
import State from "./state";
import {createItem, getItem, getItems, getPlayer, holdItem, Item, setItem, setPlayer} from "./support";
import {EXAMINES, HELP1} from "./files";
import get = Reflect.get;
import {CONTAINED_IN, HELD_BY, IS_DESTROYED, LOCATED_IN} from "./object";

/*
#include "files.h"
extern FILE * openlock();
extern FILE * openuaf();
extern FILE * openroom();
extern char globme[];
extern char wordbuf[];
extern long mynum;
extern long curch;
extern long my_lev;
long getnarg();
*/

const helpcom = (state: State): Promise<void> => {
    if (brkword(state) !== -1) {
        return Promise.all([
            getPlayer(state, fpbn(state, state.wordbuf)),
            getPlayer(state, state.mynum),
        ])
            .then(([player, me]) => {
                if (player.playerId === -1) {
                    bprintf(state, 'Help who ?\n');
                    return;
                }
                if (player.locationId !== state.curch) {
                    bprintf(state, 'They are not here\n');
                    return;
                }
                if (player.playerId === me.playerId) {
                    bprintf(state, 'You can\'t help yourself.\n');
                    return;
                }
                if (me.helping !== -1) {
                    const b = `[c]${state.globme}[/c] has stopped helping you\n`;
                    sendsys(state, player.name, player.name, -10011, state.curch, b);
                    return getPlayer(state, player.helping)
                        .then(helper => bprintf(state, `Stopped helping ${helper.name}\n`));
                }
                return setPlayer(state, me.playerId, { helping: player.playerId })
                    .then(() => {
                        const b = `[c]${state.globme}[/c] has offered to help you\n`;
                        sendsys(state, player.name, player.name, -10011, state.curch, b);
                        bprintf(state, 'OK...\n');
                    });
            });
    }
    closeworld(state);
    bprintf(state, `[f]${HELP1}[/f]\n`);
    if (state.my_lev > 9) {
        bprintf(state, 'Hit <Return> For More....\n');
        pbfr(state);
        while (getchar(state) !== '\n') {}
        bprintf(state, `[f]${HELP2}[/f]\n`);
    }
    bprintf(state, '\n');
    if (state.my_lev > 9999) {
        bprintf(state, 'Hit <Return> For More....\n');
        pbfr(state);
        while (getchar(state) !== '\n') {}
        bprintf(state, `[f]${HELP3}[/f]\n`);
    }
    bprintf(state, '\n');
    return Promise.resolve();
};

/*
 levcom()
    {
    closeworld();
    bprintf("\001f%s\001",LEVELS);
    }
*/

const valuecom = (state: State): Promise<void> => {
    if (brkword(state) == -1) {
        bprintf(state, 'Value what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobna(state, state.wordbuf))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'There isn\'t one of those here.\n');
            }
            bprintf(state, `${state.wordbuf} : ${item.value} points\n`);
        })

};

const stacom = (state: State): Promise<void> => {
    if (brkword(state) == -1) {
        bprintf(state, 'STATS what ?\n');
        return Promise.resolve();
    }
    if (state.my_lev < 10) {
        bprintf(state, 'Sorry, this is a wizard command buster...\n');
        return Promise.resolve();
    }

    return getItem(state, fobn(state, state.wordbuf))
        .then((item: Item) => (
            item.containedIn !== undefined)
                ? getItem(state, item.containedIn).then((container: Item) => [
                    item,
                    container,
                ])
                : [item]
        )
        .then(([
            item,
            container,
        ]) => {
            if (item.itemId === -1) {
                return statplyr(state);
            }

            let p = Promise.resolve();
            bprintf(state, `\nItem        :${item.name}`);
            if (item.containedIn !== undefined) {
                bprintf(state, `\nContained in:${container.name}`);
            } else if (item.heldBy !== undefined) {
                p = getPlayer(state, item.heldBy)
                    .then(() => bprintf(state, `\nHeld By     :${player.name}`))
            } else {
                bprintf(state, '\nPosition    :');
                showname(state, item.locationId);
            }
            return p.then(() => {
                bprintf(state, `\nState       :${item.state}`);
                bprintf(state, `\nCarr_Flag   :${item.carryFlag}`);
                bprintf(state, `\nSpare       :${item.isDestroyed ? -1 : 0}`);
                bprintf(state, `\nMax State   :${item.maxState}`);
                bprintf(state, `\nBase Value  :${item.baseValue}`);
                bprintf(state, '\n');
            })
        });
};

const examcom = (state: State): Promise<void> => {
    if (brkword(state) == -1) {
        bprintf(state, 'Examine what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobna(state.wordbuf))
        .then((item: Item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'You see nothing special at all\n');
            }
            if (item.itemId === 144) {
                if (!item.payload.used) {
                    bprintf(state, 'You take a scroll from the tube.\n');
                    setItem(state, item.itemId, { payload: { used: true } })
                        .then(() => createItem(state, 145))
                        .then((item145) => holdItem(state, item145.itemId, state.mynum));
                }
            } else if (item.itemId === 145) {
                state.curch = -114;
                bprintf(state, 'As you read the scroll you are teleported!\n');
                return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true } })
                    .then(() => trapch(state, state.curch));
            } else if (item.itemId === 101) {
                if (!item.payload.used) {
                    bprintf(state, 'You take a key from one pocket\n');
                    return setItem(state, item.itemId, { payload: { used: true } })
                        .then(() => createItem(state, 107))
                        .then((item107) => holdItem(state, item107.itemId, state.mynum));
                }
            } else if (item.itemId === 7) {
                return setItem(state, item.itemId, { state: randperc(state) % 3 + 1 })
                    .then(() => getItem(state, item.itemId))
                    .then((item) => {
                        if (item.state === 1) {
                            bprintf(state, 'It glows red');
                        } else if (item.state === 2) {
                            bprintf(state, 'It glows blue');
                        } else if (item.state === 3) {
                            bprintf(state, 'It glows green');
                        }
                        bprintf(state, '\n');
                        return;
                    });
            } else if (item.itemId === 8) {
                getItem(state, 7)
                    .then((item7) => {
                        if (item7.state !== 0) {
                            Promise.all([
                                getItem(state, 3 + item7.state),
                                getPlayer(state, state.mynum),
                            ])
                                .then(([connected, player]) => {
                                    if (isCarriedBy(connected, player, (state.my_lev < 10)) && connected.isLit) {
                                        bprintf(state, 'Everything shimmers and then solidifies into a different view!\n');
                                        return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true } })
                                            .then(() => teletrap(state, -1074));
                                    }
                                })
                        }
                    })
            } else if (item.itemId === 85) {
                getItem(state, 83)
                    .then((item83) => {
                        if (!item83.payload.used) {
                            bprintf(state, 'Aha. under the bed you find a loaf and a rabbit pie\n');
                            return Promise.all([
                                createItem(state, 83, { payload: { used: true } }),
                                createItem(state, 84),
                            ]);
                        }
                    });
            } else if (item.itemId === 91) {
                getItem(state, 90)
                    .then((item90) => {
                        if (!item90.payload.used) {
                            bprintf(state, 'You pull an amulet from the bedding\n');
                            return createItem(state, 90, { payload: { used: true } });
                        }
                    });
            }

            const r = `${EXAMINES}${item.itemId}`;
            return  fopen(r, 'r')
                .then((x) => {
                    if (x === null) {
                        throw new Error('You see nothing special.\n');
                    }
                    getstr(x).forEach(s => bprintf(state, `${s}\n`));
                    return x;
                })
                .then(fclose)
                .catch(err => bprintf(state, err));
        });
};

const statplyr = (state: State): Promise<void> => getPlayer(state, fpbn(state, state.wordbuf))
    .then((player) => {
        if (player.playerId === -1) {
            return bprintf(state, 'Whats that ?\n');
        }
        bprintf(state, `Name      : ${player.name}\n`);
        bprintf(state, `Level     : ${player.level}\n`);
        bprintf(state, `Strength  : ${player.strength}\n`);
        bprintf(state, `Sex       : ${player.sex ? 'MALE' : 'FEMALE'}\n`);
        bprintf(state, `Location  : `);
        showname(state, player.locationId);
    });

/*
 statplyr()
 {
 extern char wordbuf[];
 long a,b;
 b=fpbn(wordbuf);
 }
 wizlist()
 {
 extern long my_lev;
 if(my_lev<10)
 {
 bprintf("Huh ?\n");
 return;
 }
 closeworld();
 bprintf("\001f%s\001",WIZLIST);
 }

 incom()
 {
 extern long my_lev,curch;
 extern char wordbuf[];
 char st[80],rn[80],rv[80];
 long ex_bk[7];
 extern long ex_dat[];
 long a;
 long x;
 long y;
 FILE *unit;
 a=0;
 if(my_lev<10){bprintf("Huh\n");return;}
 while(a<7)
 {
 ex_bk[a]=ex_dat[a];
 a++;
 }
 if(brkword()== -1)
 {
 bprintf("In where ?\n");
 return;
 }
 strcpy(rn,wordbuf);
 if(brkword()== -1)
 {
 bprintf("In where ?\n");
 return;
 }
 strcpy(rv,wordbuf);
 x=roomnum(rn,rv);
 if(x==0)
 {
 bprintf("Where is that ?\n");
 return;
 }
 getreinput(st);
 y=curch;
 curch=x;
 closeworld();
 unit=openroom(curch,"r");
if(unit==NULL){curch=y;bprintf("No such room\n");return;}
 lodex(unit);
 fclose(unit);
 openworld();
 gamecom(st);
 openworld();
 if(curch==x)
 {
 a=0;
 while(a<7) {ex_dat[a]=ex_bk[a];a++;}
 }
 curch=y;
 }
 smokecom()
 {
 lightcom();
 }

*/

const jumpcom = (state: State): Promise<void> => {
    let b = 0;
    for(let a = 0; state.jumtb[a]; a += 2) {
        if (state.jumtb[a] === state.curch) {
            b = state.jumtb[a + 1];
        }
    }
    if (b === 0) {
        bprintf(state, 'Wheeeeee....\n');
        return Promise.resolve();
    }
    return Promise.all([
        getItem(state, 1),
        getPlayer(state, state.mynum),
    ])
        .then(([umbrella, player]) => {
            if ((state.my_lev < 10) && (!isCarriedBy(umbrella, player, (state.my_lev < 10)) || (umbrella.state === 0))) {
                state.curch = b;
                bprintf(state, 'Wheeeeeeeeeeeeeeeee  <<<<SPLAT>>>>\n');
                bprintf(state, 'You seem to be splattered all over the place\n');
                loseme();
                crapup(state, 'I suppose you could be scraped up - with a spatula');
            }
            const ms1 = `[s name=\"${state.globme}\"]${state.globme} has just left\n[/s]`;
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
            state.curch = b;
            const ms2 = `[s name=\"${state.globme}\"]${state.globme} has just dropped in\n[/s]`;
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms2);
            trapch(b);
        });
};

/*
 ong jumtb[]={-643,-633,-1050,-662,-1082,-1053,0,0};

*/

const wherecom = (state: State): Promise<void> => {
    if (state.my_str < 10) {
        bprintf(state, 'You are too weak\n');
        return Promise.resolve();
    }
    if (state.my_lev < 10) {
        state.my_str -= 2;
    }

    const rnd: number = randperc(state);
    let cha = 10 * state.my_lev;
    getPlayer(state, state.mynum)
        .then((player) => {
            return Promise.all([
                getItem(state, 111),
                getItem(state, 121),
                getItem(state, 163),
            ])
                .then((items) => {
                    if (items.some(item => isCarriedBy(item, player, (state.my_lev < 10)))) {
                        cha = 100;
                    }
                })
        });
    closeworld(state);
    if (rnd > cha) {
        bprintf(state, 'Your spell fails...\n');
        return Promise.resolve();
    }

    if (brkword(state) === -1) {
        bprintf(state, 'What is that ?\n');
        return Promise.resolve();
    }

    let found = false;
    return getItems(state)
        .then((items) => items.forEach((item) => {
            if (item.name === state.wordbuf) {
                found = true;
                if (state.my_lev > 9999) {
                    bprintf(state, `[${item.itemId}]`);
                }
                bprintf(state, `${item.name} - `);
                if ((state.my_lev < 10) && item.isDestroyed) {
                    bprintf(state, 'Nowhere\n');
                } else {
                    desrm(state, item.locationId, item.carryFlag);
                }
            }
        }))
        .then(() => getPlayer(state, fpbn(state.wordbuf)))
        .then((player) => {
            if (player.playerId !== -1) {
                found = true;
                bprintf(state, `${player.name} - `);
                desrm(state, player.locationId,0);
            }
            if (!found) {
                return bprintf(state, 'I dont know what that is\n');
            }
        });
};

const desrm = (state: State, locationId: number, carryFlag: number): Promise<void> => {
    if ((state.my_lev < 10) && (carryFlag === LOCATED_IN) && (locationId > -5)) {
        bprintf(state, 'Somewhere.....\n');
        return Promise.resolve()
    }
    if (carryFlag === CONTAINED_IN) {
        return getItem(state, locationId)
            .then((item) => bprintf(state, `In the ${item.name}\n`));
    }
    if (carryFlag > 0) {
        return getPlayer(state, locationId)
            .then((player) => bprintf(state, `Carried by [c]${player.name}[/c]\n`));
    }
    return openroom(locationId, 'r')
        .then((unit) => {
            if (unit === null) {
                return bprintf(state, 'Out in the void\n');
            }
            let x = '';
            for (let b = 0; b <= 7; b++) {
                x = getstr(unit);
            }
            bprintf(state, x);
            if (state.my_lev > 9) {
                bprintf(state, ' | ');
                showname(state, locationId);
            } else {
                bprintf(state, '\n');
            }
            return fclose(unit);
        });
};

const edit_world = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        const ePlayer = () => {
            const b = getnarg(state, 0, 47);
            if (b === -1) {
                return Promise.resolve();
            }
            const c = getnarg(state, 0, 15);
            if (c === -1) {
                return Promise.resolve();
            }
            const d = getnarg(state, 0, 0);
            if (d === -1) {
                return Promise.resolve();
            }
            return setPlayer(state, b, { [c]: d })
                .then(() => bprintf(state, 'Tis done\n'));
        };

        if (!editor.canEditWorld) {
            bprintf(state, 'Must be Game Administrator\n');
            return;
        }
        if (brkword(state) === -1) {
            bprintf(state, 'Must Specify Player or Object\n');
            return Promise.resolve();
        }
        if (state.wordbuf === 'player') {
            return ePlayer();
        }
        if (state.wordbuf !== 'player') {
            bprintf(state, 'Must Specify Player or Object\n');
            return Promise.resolve();
        }
        const b = getnarg(state, 0, state.numobs - 1);
        if (b === -1) {
            return Promise.resolve();
        }
        const c = getnarg(state, 0, 3);
        if (c === -1) {
            return Promise.resolve();
        }
        const d = getnarg(state, 0, 0);
        if (d === -1) {
            return Promise.resolve();
        }
        return setItem(state, b, { [c]: d })
            .then(() => bprintf(state, 'Tis done\n'));

    });

/*
long getnarg(bt,to)
long bt,to;
{
	extern char wordbuf[];
	long x;
	if(brkword()==-1)
	{
		bprintf("Missing numeric argument\n");
		return(-1);
	}
	x=numarg(wordbuf);
	if(x<bt) {bprintf("Invalid range\n");return(-1);}
	if((to)&&(x>to)) {bprintf("Invalid range\n");return(-1);}
	return(x);
}
 */
