import State from "./state";
import {getItem, getItems, getPlayer, Item, setItem, setPlayer} from "./support";
import {bprintf, brkword} from "./__dummies";
import {findAvailableItem, findVisiblePlayer, isCarriedBy, isLocatedIn} from "./objsys";
import {sendSound, sendSoundPlayer, sendVisibleName, sendVisiblePlayer} from "./bprintf/bprintf";
import {roll} from "./magic";
import {checkDumb} from "./new1/reducer";

/*
#include "files.h"
extern FILE *openlock();
extern FILE *openuaf();
extern FILE *openroom();
extern FILE *openworld();
extern char globme[];
extern char wordbuf[];
*/

 /*

 The next part of the universe...


 */

 /*

 Weather Routines

 Current weather defined by state of object 47

 states are

 0   Sunny
 1   Rain
 2   Stormy
 3   Snowing

 */

/*
 setwthr(n)
    {
    extern long my_lev;
    if(my_lev<10)
       {
       bprintf("What ?\n");
       return;
       }
    adjwthr(n);
    }

 suncom()
    {
    setwthr(0);
    }

 raincom()
    {
    setwthr(1);
    }

 stormcom()
    {
    setwthr(2);
    }

 snowcom()
    {
    setwthr(3);
    }

 blizzardcom()
    {
    	setwthr(4);
    }
*/

const adjwthr = (state: State, weatherId: number): Promise<void> => getItem(state, 0)
    .then((weather) => {
        const oldState = weather.state;
        return setItem(state, weather.itemId, { state: weatherId })
            .then(() => {
                if (oldState !== weatherId) {
                    sendsys(state, state.globme, state.globme, -10030, weatherId, null);
                }
            });
    });

const longwthr = (state: State): Promise<void> => roll()
    .then((a) => {
        if (a < 50) {
            return 1;
        } else if (a > 90) {
            return 2;
        } else {
            return 0;
        }
    })
    .then(weatherId => adjwthr(state, weatherId));

const whtrrcv = (state: State, weatherId: number): Promise<void> => {
    if (!outdoors(state)) {
        return Promise.resolve();
    }
    weatherId = modifwthr(state, weatherId);
    if (weatherId === 0) {
        bprintf(state, sendVisibleName('The sun comes out of the clouds\n'));
    } else if (weatherId === 1) {
        bprintf(state, sendVisibleName('It has started to rain\n'));
    } else if (weatherId === 2) {
    } else if (weatherId === 3) {
        bprintf(state, sendVisibleName('It has started to snow\n'));
    } else if (weatherId === 4) {
        bprintf(state, sendVisibleName('You are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n'));
    }
    return Promise.resolve();
};

const showwthr = (state: State): Promise<void> => {
    if (!outdoors(state)) {
        return Promise.resolve();
    }
    getItem(state, 0)
        .then((weather) => {
            const weatherId = modifwthr(state, weather.state);
            if (weatherId === 1) {
                if ((state.curch > -199) && (state.curch < -178)) {
                    bprintf(state, 'It is raining, a gentle mist of rain, which sticks to everything around\n');
                    bprintf(state, 'you making it glisten and shine. High in the skies above you is a rainbow\n');
                } else {
                    bprintf(state, sendVisibleName('It is raining\n'));
                }
            } else if (weatherId === 2) {
                bprintf(state, sendVisibleName('The skies are dark and stormy\n'));
            } else if (weatherId === 3) {
                bprintf(state, sendVisibleName('It is snowing\n'));
            } else if (weatherId === 4) {
                bprintf(state, sendVisibleName('A blizzard is howling around you\n'));
            }
        });
};


/*
 outdoors()
    {
    extern long curch;
    switch(curch)
       {
       case -100:;
       case -101:;
       case -102:return(1);
       case -183:return(0);
       case -170:return(0);
       default:
          if((curch>-191)&&(curch<-168)) return(1);
          if((curch>-172)&&(curch<-181)) return(1);
          return(0);
       }
    }

*/
 /* Silly Section */
/*
 sillycom(txt)
 char *txt;
    {
    extern char globme[];
    extern long curch;
    char bk[256];
    sprintf(bk,txt,globme,globme);
    sendsys(globme,globme,-10000,curch,bk);
    }
*/

const laughcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' falls over laughing\n')}`);
        bprintf(state, 'You start to laugh\n');
    });

const purrcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' starts purring\n')}`);
        bprintf(state, 'MMMMEMEEEEEEEOOOOOOOWWWWWWW!!\n');
    });

const crycom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, sendVisiblePlayer('%s', '%s bursts into tears\n'));
        bprintf(state, 'You burst into tears\n');
    });

const sulkcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, sendVisiblePlayer('%s', '%s sulks\n'));
        bprintf(state, 'You sulk....\n');
    });

const burpcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' burps loudly\n')}`);
        bprintf(state, 'You burp rudely\n');
    });

const hiccupcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' hiccups\n')}`);
        bprintf(state, 'You hiccup\n');
    });

/*
long hasfarted=0;
*/

const fartcom = (state: State): Promise<void> => {
    state.hasfarted = true;
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' lets off a real rip roarer\n')}`);
    bprintf(state, 'Fine...\n');
};

const grincom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s grins evilly\n'));
    bprintf(state, 'You grin evilly\n');
};

const smilecom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s smiles happily\n'));
    bprintf(state, 'You smile happily\n');
};

const winkcom = (state: State): Promise<void> => {
    /* At person later maybe ? */
    sillycom(state, sendVisiblePlayer('%s', '%s winks suggestively\n'));
    bprintf(state, 'You wink\n');
};

const sniggercom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sniggers\n')}`);
        bprintf(state, 'You snigger\n');
    });

const posecom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'You are just not up to this yet\n');
        return Promise.resolve();
    }
    srnd(time(state));
    return roll()
        .then((poseRoll) => {
            const a = poseRoll % 5;
            bprintf(state, `POSE :${a}\n`);
            if (a === 0) {
                return Promise.resolve()
            } else if (a === 1) {
                sillycom(state, sendVisiblePlayer('%s', '%s throws out one arm and sends a huge bolt of fire high\ninto the sky\n'));
                broad(state, sendVisibleName('A massive ball of fire explodes high up in the sky\n'));
                return Promise.resolve()
            } else if (a === 2) {
                sillycom(state, sendVisiblePlayer('%s', '%s turns casually into a hamster before resuming normal shape\n'));
                return Promise.resolve()
            } else if (a === 3) {
                sillycom(state, sendVisiblePlayer('%s', '%s starts sizzling with magical energy\n'));
                return Promise.resolve()
            } else if (a === 4) {
                sillycom(state, sendVisiblePlayer('%s', '%s begins to crackle with magical fire\n'));
                return Promise.resolve()
            }
        });
};

const emotecom = (state: State): Promise<void> => {
    /* (C) Jim Finnis */
    if (state.my_lev < 10000) {
        bprintf(state, 'Your emotions are strictly limited!\n');
        return Promise.resolve();
    }
    sillycom(state, `${sendSoundPlayer('%s')} ${getreinput(state)}\n`);
    return Promise.resolve();
};

const praycom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s falls down and grovels in the dirt\n'));
    bprintf(state, 'Ok\n');
};

const yawncom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' yawns\n')}`);
};

const groancom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' groans loudly\n')}`);
    bprintf(state, 'You groan\n');
};

const moancom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' starts making moaning noises\n')}`);
    bprintf(state, 'You start to moan\n');
};

const cancarry = (state: State, playerId: number): Promise<boolean> => getPlayer(state, playerId)
    .then((player) => {
        if (player.isWizard) {
            return Promise.resolve(true);
        }
        if (player.level < 0) {
            return Promise.resolve(true);
        }
        return getItems(state)
            .then(items => items.reduce((count, item)  => {
                if (isCarriedBy(item, player, false)) {
                    return count + 1;
                } else {
                    return count;
                }
            }, 0))
            .then(count => (count < player.level + 5));

    });

const setcom = (state: State): Promise<void> => {
    const setmobile = () => findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'Set what ?\n');
            }
            if (player.playerId < 16) {
                return bprintf(state, 'Mobiles only\n');
            }
            if (brkword(state) === -1) {
                return bprintf(state, 'To what value ?\n');
            }
            return setPlayer(state, player.playerId, { strength: Number(state.wordbuf) });
        });

    const bitset = (item: Item) => {
        if (brkword(state) === -1) {
            return bprintf(state, 'Which bit ?\n');
        }
        const b = Number(state.wordbuf);
        if (brkword(state) === -1) {
            return bprintf(state, `The bit is ${item.flags[b] ? 'TRUE' : 'FALSE'}\n`);
        }
        const c = Number(state.wordbuf);
        if ((c < 0) || (c > 1) || (b < 0) || (b > 15)) {
            return bprintf(state, 'Number out of range\n');
        }
        return setItem(state, item.itemId, { flags: { [b]: !!c } });
    };

    const byteset = (item: Item) => {
        if (brkword(state) === -1) {
            return bprintf(state, 'Which byte ?\n');
        }
        const b = Number(state, state.wordbuf);
        if (brkword(state) === -1) {
            return bprintf(state, `Current Value is : ${item.payload[b]}\n`);
        }
        const c = Number(state, state.wordbuf);
        if ((c < 0) || (c > 255) || (b < 0) || (b > 1)) {
            return bprintf(state, 'Number out of range\n');
        }
        return setItem(state, item.itemId, { payload: { [b]: c } });
    };

    if (brkword(state) === -1) {
        bprintf(state, 'set what\n');
        return Promise.resolve();
    }
    if (state.my_lev < 10) {
        bprintf(state, 'Sorry, wizards only\n');
        return Promise.resolve();
    }
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return setmobile();
            }
            if (brkword(state) === -1) {
                bprintf(state, 'Set to what value ?\n');
                return Promise.resolve();
            }
            if (state.wordbuf === 'bit') {
                return bitset(item);
            }
            if (state.wordbuf === 'byte') {
                return byteset(item);
            }
            const b = Number(state.wordbuf);
            if (b > item.maxState) {
                return bprintf(state, `Sorry max state for that is ${item.maxState}\n`);
            }
            if (b < 0) {
                return bprintf(state, 'States start at 0\n');
            }
            return setItem(state, item.itemId, { state: b });
        })
};

const isdark = (state: State): Promise<boolean> => {
    const idk = () => {
        let found = undefined;
        return getItems(state)
            .then(items => items.forEach((item) => {
                if (found !== undefined) return;
                if ((item.itemId !== 32) && !item.isLit) {
                    return;
                }
                if (isLocatedIn(item, state.curch, (state.my_lev < 10))) {
                    found = false;
                    return;
                }
                if ((item.heldBy === undefined) && (item.wearingBy === undefined)) {
                    return;
                }
                return getPlayer(state, item.locationId)
                    .then((player) => {
                        if (player.locationId !== state.curch) {
                            return;
                        }
                        found = false;
                    });
            }))
            .then(() => (found === undefined) ? true : found);
    };

    if (state.my_lev > 9) {
        return Promise.resolve(false);
    }
    if ((state.curch === -1100) || (state.curch === -1101)) {
        return Promise.resolve(false);
    }
    if ((state.curch <= -1113) || (state.curch >= -1123)) {
        return idk();
    }
    if ((state.curch < -399) || (state.curch > -300)) {
        return Promise.resolve(false);
    }
    return idk();
};

/*
modifwthr(n)
{
extern long curch;
switch(curch)
{
default:
if((curch>=-179)&&(curch<=-199))
{
	if(n>1)return(n%2);
	else return(n);
}
if((curch>=-178)&&(curch<=-100))
{
	if((n==1)||(n==2)) n+=2;
	return(n);
}
return(n);
}
}
*/

const setpflags = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (!editor.isDebugger) {
            bprintf(state, 'You can\'t do that\n');
            return Promise.resolve();
        }
        if (brkword(state) === -1) {
            bprintf(state, 'Whose PFlags ?\n');
            return Promise.resolve();
        }
        return findVisiblePlayer(state, state.wordbuf)
            .then((player) => {
                if (!player) {
                    return bprintf(state, 'Who is that ?\n');
                }
                if (brkword(state) === -1) {
                    return bprintf(state, 'Flag number ?\n');
                }
                const b = Number(state.wordbuf);
                if (brkword(state) === -1) {
                    return bprintf(state, `Value is ${player.flags[b] ? 'TRUE' : 'FALSE'}\n`);
                }
                const c = Number(state.wordbuf);
                if ((c < 0) || (c > 1) || (b < 0) || (b > 31)) {
                    return bprintf(state, 'Out of range\n');
                }
                return setPlayer(state, player.playerId, { flags: {
                        ...player.flags,
                        [b]: c !== 0,
                    }})
            });
    });
