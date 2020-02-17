import State from "./state";
import {getItem, getItems, getPlayer, Item, setItem, setPlayer} from "./support";
import {bprintf, brkword} from "./__dummies";

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

/*
 longwthr()
    {
    long a;
    a=randperc();
    if(a<50)
       {
       adjwthr(1);
       return;
       }
    if(a>90)
       {
       adjwthr(2);
       return;
       }
    adjwthr(0);
    return;
    }


 wthrrcv(type)
    {
    if(!outdoors()) return;
    type=modifwthr(type);
    switch(type)
       {
       case 0:
          bprintf("\001cThe sun comes out of the clouds\n\001");
          break;
       case 1:
          bprintf("\001cIt has started to rain\n\001");
          break;
       case 2:
          break;
       case 3:
          bprintf("\001cIt has started to snow\n\001");
          break;
       case 4:
          bprintf("\001cYou are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n\001");
          break;
          }
    }
*/

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
                    bprintf(state, '[c]It is raining\n[/c]');
                }
            } else if (weatherId === 2) {
                bprintf(state, '[c]The skies are dark and stormy\n[/c]');
            } else if (weatherId === 3) {
                bprintf(state, '[c]It is snowing\n[/c]');
            } else if (weatherId === 4) {
                bprintf(state, '[c]A blizzard is howling around you\n[/c]');
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

 laughcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d falls over laughing\n\001");
    bprintf("You start to laugh\n");
    }

 purrcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d starts purring\n\001");
    bprintf("MMMMEMEEEEEEEOOOOOOOWWWWWWW!!\n");
    }

 crycom()
    {
    if(chkdumb()) return;
    sillycom("\001s%s\001%s bursts into tears\n\001");
    bprintf("You burst into tears\n");
    }

 sulkcom()
    {
    sillycom("\001s%s\001%s sulks\n\001");
    bprintf("You sulk....\n");
    }

 burpcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d burps loudly\n\001");
    bprintf("You burp rudely\n");
    }

 hiccupcom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d hiccups\n\001");
    bprintf("You hiccup\n");
    }

long hasfarted=0;

fartcom()
    {
    extern long hasfarted;
    hasfarted=1;
    sillycom("\001P%s\001\001d lets off a real rip roarer\n\001");
    bprintf("Fine...\n");
    }

 grincom()
    {
    sillycom("\001s%s\001%s grins evilly\n\001");
    bprintf("You grin evilly\n");
    }

 smilecom()
    {
    sillycom("\001s%s\001%s smiles happily\n\001");
    bprintf("You smile happily\n");
    }

 winkcom()
    {					*//* At person later maybe ? *//*
    sillycom("\001s%s\001%s winks suggestively\n\001");
    bprintf("You wink\n");
    }

 sniggercom()
    {
    if(chkdumb()) return;
    sillycom("\001P%s\001\001d sniggers\n\001");
    bprintf("You snigger\n");
    }

 posecom()
    {
    long a;
    extern long my_lev;
    if(my_lev<10)
       {
       bprintf("You are just not up to this yet\n");
       return;
       }
    time(&a);
    srand(a);
    a=randperc();
    a=a%5;
    bprintf("POSE :%d\n",a);
    switch(a)
       {
       case 0:
          break;
       case 1:
	sillycom("\001s%s\001%s throws out one arm and sends a huge bolt of fire high\n\
into the sky\n\001");
          broad("\001cA massive ball of fire explodes high up in the sky\n\001");
          break;
       case 2:
          sillycom("\001s%s\001%s turns casually into a hamster before resuming normal shape\n\001");
          break;
       case 3:
          sillycom("\001s%s\001%s \
starts sizzling with magical energy\n\001");
          break;
       case 4:
          sillycom("\001s%s\001%s begins to crackle with magical fire\n\001");
          break;
          }
    }

 emotecom()
 *//*
  (C) Jim Finnis
 *//*
 {
 	extern long my_lev;
 	char buf[100];
 	strcpy(buf,"\001P%s\001 ");
 	getreinput(buf+6);
 	strcat(buf,"\n");
 	if (my_lev<10000)
 		bprintf("Your emotions are strictly limited!\n");
	else
		sillycom(buf);
}

 praycom()
    {
    extern long curch;
    sillycom("\001s%s\001%s falls down and grovels in the dirt\n\001");
    bprintf("Ok\n");
    }

 yawncom()
    {
    sillycom("\001P%s\001\001d yawns\n\001");
    }

 groancom()
    {
    sillycom("\001P%s\001\001d groans loudly\n\001");
    bprintf("You groan\n");
    }

 moancom()
    {
    sillycom("\001P%s\001\001d starts making moaning noises\n\001");
    bprintf("You start to moan\n");
    }

*/

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
                if (iscarrby(state, item.itemId, player.playerId) && !item.isDestroyed) {
                    return count + 1;
                } else {
                    return count;
                }
            }, 0))
            .then(count => (count < player.level + 5));

    });

const setcom = (state: State): Promise<void> => {
    const setmobile = () => {
        const playerId = fpbn(state, state.wordbuf);
        if (playerId === -1) {
            return bprintf(state, 'Set what ?\n');
        }
        if (playerId < 16) {
            return bprintf(state, 'Mobiles only\n');
        }
        if (brkword(state) === -1) {
            return bprintf(state, 'To what value ?\n');
        }
        return setPlayer(state, playerId, { strength: Number(state.wordbuf) });
    };

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
    return getItem(state, fobna(state, state.wordbuf))
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
                if (ishere(state, item.itemId)) {
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
        return getPlayer(state, fpbn(state, state.wordbuf))
            .then((player) => {
                if (player.playerId === -1) {
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
