import {
    bprintf,
    brkword,
    sendsys,
} from './__dummies';
import State from "./state";
import {Item, getItem, putItem, holdItem, wearItem, putItemIn, setItem, availableByMask, getItems} from "./support";
import {
    IS_DESTROYED,
    CAN_BE_LIT,
    CAN_BE_EXTINGUISHED,
    IS_LIT, IS_KEY,
} from "./object";
import {logger} from "./files";

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
extern char * pname();
extern FILE * openroom();
extern char globme[];
extern char wordbuf[];

 bouncecom()
    {
    sillycom("\001s%s\001%s bounces around\n\001");
    bprintf("B O I N G !!!!\n");
    }

 sighcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d sighs loudly\n\001");
    bprintf("You sigh\n");
    }

 screamcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d screams loudly\n\001");
    bprintf("ARRRGGGGHHHHHHHHHHHH!!!!!!\n");
    }

 *//* Door is 6 panel 49
 *//*

 ohereandget(onm)
 long *onm;
    {
    long b;
    extern char wordbuf[];
    if(brkword()==-1)
       {
       bprintf("Tell me more ?\n");
       return(-1);
       }
    openworld();
    *onm=fobna(wordbuf);
    if(*onm==-1)
       {
       bprintf("There isn't one of those here\n");
       return(-1);
       }
    return(1);
    }
*/

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
    return availableByMask(state, { [IS_KEY]: true })
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
    return availableByMask(state, { [IS_KEY]: true })
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
        getItem(state, fobna(state, state.wordbuf)),
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
                destroy(state, item.itemId);
                setItem(state, container.itemId, {
                    flags: {
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
                destroy(state, item.itemId);
                bprintf(state, 'It dissappears with a fizzle into the slime\n');
                if (item.itemId === 108) {
                    bprintf(state, 'The soap dissolves the slime away!\n');
                    return setItem(state, container.itemId, { state: 0 })
                }
                return;
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
                    const ar = `[D]${state.globme}[/D][c] puts the ${item.name} in the ${container.name}.\n[/c]`;
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
        availableByMask(state, { [IS_LIT]: true }),
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
    const def2 = (item: Item): void => {
        if (item.isLever) {
            return setItem(state, item.itemId, { state: 0 })
                .then(() => oplong(state, item.itemId));
        }
        if (item.isSwitch) {
            return setItem(state, item.itemId, { state: 1 - item.state })
                .then(() => oplong(state, item.itemId));
        }
        bprintf(state, 'Nothing happens\n');
    };

    if (brkword(state) === -1) {
        bprintf(state, 'Push what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobna(state, state.wordbuf))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'That is not here\n');
            } else if (item.itemId === 126) {
                bprintf(state, 'The tripwire moves and a huge stone crashes down from above!\n');
                broad(state, '[d]You hear a thud and a squelch in the distance.\n[/d]');
                loseme(state);
                return crapup(state, '             S   P    L      A         T           !');
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
                                sendsys(state, null, null, -10000, item1.locationId, '[c]The portcullis falls\n[/c]');
                                sendsys(state, null, null, -10000, item2.locationId, '[c]The portcullis falls\n[/c]');
                            } else {
                                sendsys(state, null, null, -10000, item1.locationId, '[c]The portcullis rises\n[/c]');
                                sendsys(state, null, null, -10000, item2.locationId, '[c]The portcullis rises\n[/c]');
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
                                sendsys(state, null, null, -10000, item1.locationId, '[c]The drawbridge rises\n[/c]');
                                sendsys(state, null, null, -10000, item2.locationId, '[c]The drawbridge rises\n[/c]');
                            } else {
                                sendsys(state, null, null, -10000, item1.locationId, '[c]The drawbridge is lowered\n[/c]');
                                sendsys(state, null, null, -10000, item2.locationId, '[c]The drawbridge is lowered\n[/c]');
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
                return broad(state, '[d]Church bells ring out around you\n[/d]');
            } else if (item.itemId === 104) {
                if (ptothlp(state, state.mynum) === -1) {
                    return bprintf(state, 'You can\'t shift it alone, maybe you need help\n');
                }
                /* ELSE RUN INTO DEFAULT */
                return def2(item);
            } else {
                return def2(item);
            }

        });
};

/*
 cripplecom()
    {
    long a,b;
    extern char globme[];
    extern long mynum,curch;
    b=victim(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10101,curch,"");
    }

 curecom()
    {
    long a,b;
    extern char globme[];
    extern long mynum,curch;
    b=vichfb(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10100,curch,"");
    }

 dumbcom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    b=victim(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10102,curch,"");
    }

 forcecom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    char z[128];
    b=victim(&a);
    if(b== -1) return;
    getreinput(z);
    sendsys(pname(a),globme,-10103,curch,z);
    }

 missilecom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    extern long my_lev;
    extern long fighting,in_fight;
    extern long my_sco;
    long ar[8];
    b=vichfb(&a);
    if(b== -1) return;
    sprintf(ar,"%d",my_lev*2);
    sendsys(pname(a),globme,-10106,curch,ar);
    if(pstr(a)-2*my_lev<0)
	{
	bprintf("Your last spell did the trick\n");
	if(pstr(a)>=0)
	{
	*//* Bonus ? *//*
		if(a<16) my_sco+=(plev(a)*plev(a)*100);
		else my_sco+=10*damof(a);
	}
	setpstr(a,-1); *//* MARK ALREADY DEAD *//*
	in_fight=0;
	fighting= -1;
    }
    if(a>15) woundmn(a,2*my_lev);
}

 changecom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    extern char wordbuf[];
    if(brkword()== -1)
       {
       bprintf("change what (Sex ?) ?\n");
       return;
       }
    if(!!strcmp(wordbuf,"sex"))
       {
       bprintf("I don't know how to change that\n");
       return;
       }
    b=victim(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10107,curch,"");
    if(a<16) return;
    setpsex(a,1-psex(a));
    }

 fireballcom()
    {
    long a,b;
    extern long mynum,curch;
    extern long fighting,in_fight;
    extern char globme[];
    extern long my_lev;
    extern long my_sco;
    long ar[2];
    b=vichfb(&a);
    if(b== -1) return;
    if(mynum==a)
       {
       bprintf("Seems rather dangerous to me....\n");
       return;
       }
    sprintf(ar,"%d",2*my_lev);
    if(pstr(a)-(a==fpbns("yeti")?6:2)*my_lev<0)
	{
	bprintf("Your last spell did the trick\n");
	if(pstr(a)>=0)
	{
	*//* Bonus ? *//*
		if(a<16) my_sco+=(plev(a)*plev(a)*100);
		else my_sco+=10*damof(a);
	}
	setpstr(a,-1); *//* MARK ALREADY DEAD *//*
	in_fight=0;
	fighting= -1;
    }
    sendsys(pname(a),globme,-10109,curch,ar);
    if(a==fpbns("yeti")) {woundmn(a,6*my_lev);return;}
    if(a>15) woundmn(a,2*my_lev);
    }

 shockcom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[];
    extern long my_lev;
    extern long fighting,in_fight;
    extern long my_sco;
    long ar[2];
    b=vichfb(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("You are supposed to be killing other people not yourself\n");
       return;
       }
       if(pstr(a)-2*my_lev<0)
	{
	bprintf("Your last spell did the trick\n");
	if(pstr(a)>=0)
	{
	*//* Bonus ? *//*
		if(a<16) my_sco+=(plev(a)*plev(a)*100);
		else my_sco+=10*damof(a);
	}
	setpstr(a,-1); *//* MARK ALREADY DEAD *//*
	in_fight=0;
	fighting= -1;
    }
    sprintf(ar,"%d",my_lev*2);
    sendsys(pname(a),globme,-10110,curch,ar);
    if(a>15) woundmn(a,2*my_lev);
    }

 starecom()
    {
    extern long mynum;
    long a,b;
    b=vichere(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("That is pretty neat if you can do it!\n");
       return;
       }
    sillytp(a,"stares deep into your eyes\n");
    bprintf("You stare at \001p%s\001\n",pname(a));
    }

 gropecom()
    {
    extern long mynum;
    long a,b;
    extern long isforce;
    if(isforce){bprintf("You can't be forced to do that\n");return;}
    b=vichere(&a);
    if(b== -1) return;
    if(a==mynum)
       {
       bprintf("With a sudden attack of morality the machine edits your persona\n");
       loseme();
       crapup("Bye....... LINE TERMINATED - MORALITY REASONS");
       }
    sillytp(a,"gropes you");
    bprintf("<Well what sort of noise do you want here ?>\n");
    }

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

 vicbase(x)
 long *x;
    {
    long a,b;
    extern char wordbuf[];
    a0:if(brkword()== -1)
       {
       bprintf("Who ?\n");
       return(-1);
       }
    b=openworld();
    if(!strcmp(wordbuf,"at")) goto a0; *//* STARE AT etc *//*
    a=fpbn(wordbuf);
    if(a== -1)
       {
       bprintf("Who ?\n");
       return(-1);
       }
    *x=a;
    return(b);
    }

 vichere(x)
long *x;
    {
    extern long curch;
    long a;
    a=vicbase(x);
    if(a== -1) return(a);
    if(ploc(*x)!=curch)
       {
       bprintf("They are not here\n");
       return(-1);
       }
    return(a);
    }


 vicf2(x,f1)
long *x;
    {
    extern long mynum;
    long a;
    extern long my_str,my_lev;
    extern long curch;
    long b,i;
    a=vicbase(x);
    if(a== -1) return(-1);
    if(my_str<10)
       {
       bprintf("You are too weak to cast magic\n");
       return(-1);
       }
    if(my_lev<10) my_str-=2;
i=5;
if(iscarrby(111,mynum)) i++;
if(iscarrby(121,mynum)) i++;
if(iscarrby(163,mynum)) i++;
    if((my_lev<10)&&(randperc()>i*my_lev))
       {
       bprintf("You fumble the magic\n");
       if(f1==1){*x=mynum;bprintf("The spell reflects back\n");}
       else
          {
          return(-1);
          }
       return(a);
       }

    else
       {
       if(my_lev<10)bprintf("The spell succeeds!!\n");
       return(a);
       }
    }

 vicfb(x)
 long *x;
    {
    return(vicf2(x,0));
    }
 vichfb(x)
 long *x;
    {
    long a;
    extern long curch;
    a=vicfb(x);
    if(a== -1) return(-1);
    if(ploc(*x)!=curch)
       {
       bprintf("They are not here\n");
       return(-1);
       }
    return(a);
    }

 victim(x)
    	long *x;
    {
    return(vicf2(x,1));
    }

 sillytp(per,msg)
 char *msg;
    {
    extern long curch;
    extern char globme[];
    char bk[256];
    if(strncmp(msg,"star",4)==0)
      sprintf(bk, "%s%s%s%s%s%s%s","\001s",globme,"\001",globme," ",msg,"\n\001");
    else
       sprintf(bk,"%s%s%s%s%s","\001p",globme,"\001 ",msg,"\n");
    sendsys(pname(per),globme,-10111,curch,bk);
    }

long ail_dumb=0;
long  ail_crip=0;
long  ail_blind=0;
long  ail_deaf=0;


 new1rcv(isme,chan,to,from,code,text)
 char *to,*from,*text;
    {
    extern long mynum,my_lev,ail_dumb,ail_crip;
    extern long ail_deaf,ail_blind;
    extern long curch,my_sex;
    extern char globme[];
    switch(code)
       {
       case -10100:
          if(isme==1) {
             bprintf("All your ailments have been cured\n");
             ail_dumb=0;
             ail_crip=0;
             ail_blind=0;ail_deaf=0;
             }
          break;
       case -10101:
          if(isme==1)
             {
             if(my_lev<10)
                {
                bprintf("You have been magically crippled\n");
                ail_crip=1;
                }

             else
                bprintf("\001p%s\001 tried to cripple you\n",from);
             }
          break;
       case -10102:
          if(isme==1)
             {
             if(my_lev<10)
                {
                bprintf("You have been struck magically dumb\n");
                ail_dumb=1;
                }

             else
                bprintf("\001p%s\001 tried to dumb you\n",from);
             }
          break;
       case -10103:
          if(isme==1)
             {
             if(my_lev<10)
                {
                bprintf("\001p%s\001 has forced you to %s\n",from,text);
                addforce(text);
                }

             else
                bprintf("\001p%s\001 tried to force you to %s\n",from,text);
             }
          else
          break;
       case -10104:
          if(isme!=1)bprintf("\001p%s\001 shouts '%s'\n",from,text);
          break;
       case -10105:
          if(isme==1)
             {
             if(my_lev<10)
                {
                bprintf("You have been struck magically blind\n");
                ail_blind=1;
                }

             else
                bprintf("\001p%s\001 tried to blind you\n",from);
             }
          break;
       case -10106:
          if(iam(from))break;
          if(curch==chan)
             {
             bprintf("Bolts of fire leap from the fingers of \001p%s\001\n",from);
             if(isme==1)
                {
                bprintf("You are struck!\n");
                wounded(numarg(text));
                }

             else
                bprintf("\001p%s\001 is struck\n",to);
             }
          break;
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
       case -10109:
          if(iam(from)) break;
          if(curch==chan)
             {
             bprintf("\001p%s\001 casts a fireball\n",from);
             if(isme==1)
                {
                bprintf("You are struck!\n");
                wounded(numarg(text));
                }

             else
                bprintf("\001p%s\001 is struck\n",to);
             }
          break;
       case -10110:
          if(iam(from)) break;
          if(isme==1)
             {
             bprintf("\001p%s\001 touches you giving you a sudden electric shock!\n",from);
             wounded(numarg(text));
             }
          break;
       case -10111:
          if(isme==1)bprintf("%s\n",text);
          break;
       case -10113:
          if(my_lev>9)bprintf("%s",text);
          break;
       case -10120:
          if(isme==1)
             {
             if(my_lev>9)
                {
                bprintf("\001p%s\001 tried to deafen you\n",from);
                break;
                }
             bprintf("You have been magically deafened\n");
             ail_deaf=1;
             break;
             }
          }
    }
*/

const destroy = (state: State, itemId: Item): Promise<void> => setItem(state, itemId, {
    flags: { [IS_DESTROYED]: true }
});

/*
 tscale()
    {
    long a,b;
    a=0;
    b=0;
    while(b<16)
       {
       if(!!strlen(pname(b))) a++;
       b++;
       }
    switch(a)
       {
       case 1:
          return(2);
       case 2:
          return(3);
       case 3:
          return(3);
       case 4:
          return(4);
       case 5:
          return(4);
       case 6:
          return(5);
       case 7:
          return(6);
       default:
          return(7);
          }
    }

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
            dumpitems(state);
            loseme(state);
            const ms1 = `${state.globme} has just died\n`;
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
            const ms2 = `[ ${state.globme} has just died ]\n`;
            sendsys(state, state.globme, state.globme, -10113, state.curch, ms1);
            crapup(state, 'Oh dear you just died\n');
        });
};

/*
 woundmn(mon,am)
    {
    extern long mynum;
    extern char globme[];
    long a;
    long b;
    char ms[128];
    a=pstr(mon)-am;
    setpstr(mon,a);

    if(a>=0){mhitplayer(mon,mynum);}

    else
       {
       dumpstuff(mon,ploc(mon));
       sprintf(ms,"%s has just died\n",pname(mon));
       sendsys(" "," ",-10000,ploc(mon),ms);
       sprintf(ms,"[ %s has just died ]\n",pname(mon));
       pname(mon)[0]=0;
       sendsys(globme,globme,-10113,ploc(mon),ms);
       }
    }


 mhitplayer(mon,mn)
    {
    extern long curch,my_lev,mynum;
    long a,b,x[4];
    extern char globme[];
    if(ploc(mon)!=curch) return;
    if((mon<0)||(mon>47)) return;
    a=randperc();
    b=3*(15-my_lev)+20;
if((iswornby(89,mynum))||(iswornby(113,mynum))||(iswornby(114,mynum)))
       b-=10;
    if(a<b)
       {
       x[0]=mon;
       x[1]=randperc()%damof(mon);
       x[2]= -1;
       sendsys(globme,pname(mon),-10021,ploc(mon),(char *)x);
       }

    else
       {

       x[0]=mon;
       x[2]= -1;
       x[1]= -1;
       sendsys(globme,pname(mon),-10021,ploc(mon),x) ;
       }
    }

 resetplayers()
    {
    extern PLAYER pinit[];
    long a,b,c;
    a=16;
    c=0;
    while(a<35)
       {
       strcpy(pname(a),pinit[c].p_name);
       setploc(a,pinit[c].p_loc);
       setpstr(a,pinit[c].p_str);
       setpsex(a,pinit[c].p_sex);
       setpwpn(a,-1);
       setpvis(a,0);
       setplev(a,pinit[c].p_lev);
       a++;c++;
       }
    while(a<48)
       {
       strcpy(pname(a),"");
       a++;
       }
    }

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
    return getItem(state, itemId)
        .then((item) => {
            if (!iscarrby(state, item.itemId, state.mynum)) {
                return bprintf(state, 'You are not carrying this\n');
            }
            if (iswornby(state, item.itemId, state.mynum)) {
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

const iswornby = (state: State, itemId: number, characterId: number): Promise<boolean> => getItem(state, itemId)
    .then((item) => {
        if (!iscarrby(state, item.itemId, characterId)) {
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
 deafcom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[64];
    b=victim(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10120,curch,"");
    }

blindcom()
    {
    long a,b;
    extern long mynum,curch;
    extern char globme[64];
    b=victim(&a);
    if(b== -1) return;
    sendsys(pname(a),globme,-10105,curch,"");
    }

teletrap(newch)
long newch;
{
       extern long curch;
       char block[200];
       sprintf(block,"%s%s%s%s%s","\001s",globme,"\001",globme," has left.\n\001");
       sendsys(globme,globme,-10000,curch,block);
       curch=newch;
       sprintf(block,"%s%s%s%s%s","\001s",globme,"\001",globme," has arrived.\n\001");
       sendsys(globme,globme,-10000,newch,block);
       trapch(curch);
}
 */

const on_flee_event = (state: State): Promise<void> => getItems(state)
    .then(items => items.forEach((item) => {
        if ((iscarrby(state, item.itemId, state.mynum)) && (!iswornby(state, item.itemId, state.mynum))) {
            return putItem(state, item.itemId, ploc(state.mynum));
        }
    }))
    .then(() => undefined);
