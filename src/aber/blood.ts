import State from "./state";
import {bprintf, sendsys} from "./__dummies";
import {Item, getItem} from "./support";

interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}


/*
#include <stdio.h>
#include "files.h"
#include "System.h"



long in_fight=0;
long  fighting= -1;



int dambyitem(it)
long it;
    {
    switch(it)
       {
case -1:return(4);
default:if(!otstbit(it,15))return(-1);
else return(obyte(it,0));
          }

    }

long wpnheld= -1;

void weapcom()
    {
    long a,b;
    if(brkword()== -1)
       {
       bprintf("Which weapon do you wish to select though\n");
       return;
       }
    a=fobnc(wordbuf);
    if(a== -1)
       {
       bprintf("Whats one of those ?\n");
       return;
       }
    b=dambyitem(a);
    if(b<0)
       {
       bprintf("Thats not a weapon\n");
       wpnheld= -1;
       return;
       }
    wpnheld=a;
    	calibme();
    bprintf("OK...\n");
    }
*/

const hitplayer = (state: State, victim: number, weaponId: number): Promise<void> => getItem(state, weaponId)
    .then((weapon) => {
        /*
        long a,b,c,d;
        extern long my_lev,my_str;
        extern long wpnheld;
        long z;
        long x[4];
        long cth,ddn,res;
        */
        if (pname(state, victim)) {
            return;
        }
        /* Chance to hit stuff */
        if (!iscarrby(state, weapon.itemId, state.mynum) && (weapon.itemId !== -1)) {
            bprintf(state, `You belatedly realise you dont have the ${weapon.name},\nand are forced to use your hands instead..\n`);
            if (state.wpnheld === weapon.itemId) {
                state.wpnheld = -1;
            }
            weapon = undefined;
        }
        state.wpnheld = weapon ? weapon.itemId : undefined;
        if (weapon && (weapon.itemId === 32) && iscarrby(state, 16, victim)) {
            return bprintf(state, 'The runesword flashes back away from its target, growling in anger!\n');
        }
        if (dambyitem(state, weapon) < 0) {
            bprintf(state, 'Thats no good as a weapon\n');
            state.wpnheld = -1;
            return;
        }
        if (state.in_fight) {
            bprintf(state, 'You are already fighting!\n');
            return;
        }
        state.fighting = victim;
        state.in_fight = 300;
        const res = randperc(state);
        let cth = 40 + 3 * state.my_lev;
        if (iswornby(state, 89, victim) || iswornby(state, 113, victim) || iswornby(state, 114, victim)) {
            cth -= 10;
        }
        if (cth < 0) {
            cth = 0;
        }
        if (cth > res) {
            bprintf(state, `You hit [p]${pname(state, victim)}[/p] `);
            if (weapon && (weapon.itemId === -1)) {
                bprintf(state, `with the ${weapon.name}`);
            }
            bprintf(state, '\n');
            const ddn = randperc(state) % dambyitem(state, weapon && weapon.itemId);
            const x: Attack = {
                characterId: state.mynum,
                damage: ddn,
                weaponId: weapon && weapon.itemId,
            };
            if (pstr(state, victim) - ddn < 0) {
                bprintf(state, 'Your last blow did the trick\n');
                if (pstr(state, victim) >= 0) {
                    /* Bonus ? */
                    if (victim < 16) {
                        state.my_sco += plev(state, victim) * plev(state, victim) * 100;
                    } else {
                        state.my_sco += 10 * damof(state, victim);
                    }
                }
                setpstr(state, victim, -1); /* MARK ALREADY DEAD */
                state.in_fight = 0;
                state.fighting = -1;
            }
            if (victim < 16) {
                sendsys(state, pname(state, victim), state.globme, -10021, state.curch, x);
            } else {
                woundmn(state, victim, ddn);
            }
            state.my_sco += ddn * 2;
            calibme(state);
            return;
        } else {
            bprintf(state, `You missed [p]${pname(state, victim)}[/p]\n`);
            const x: Attack = {
                characterId: state.mynum,
                damage: -1,
                weaponId: weapon && weapon.itemId,
            };
            if (victim < 16) {
                sendsys(state, pname(state, victim), state.globme, -10021, state.curch, x);
            } else {
                woundmn(state, victim, 0);
            }
        }
    });

/*
 killcom()
    {
    long vic,a;
    long x;
    if(brkword()== -1)
       {
       bprintf("Kill who\n");
       return;
       }
    if(!strcmp(wordbuf,"door"))
	{
		bprintf("Who do you think you are , Moog ?\n");
		return;
	}
	if(fobna(wordbuf)!= -1)
       {
	       breakitem(fobna(wordbuf));
	       return;
       }
    if((a=fpbn(wordbuf))== -1)
       {
	       bprintf("You can't do that\n");
	       return;
       }
    if(a==mynum)
       {
	       bprintf("Come on, it will look better tomorrow...\n");
	       return;
       }
    if(ploc(a)!=curch)
       {
	       bprintf("They aren't here\n");
	       return;
       }
    xwisc:if(brkword()== -1)
       {
	       hitplayer(a,wpnheld);
	       return;
       }
    if(!strcmp(wordbuf,"with"))
       {
	       if(brkword()== -1)
	          {
		          bprintf("with what ?\n");
		          return;
	          }
	       }
	    else
	       goto xwisc;
	    x=fobnc(wordbuf);
	    if(x== -1)
	       {
		       bprintf("with what ?\n");
		       return;
	       }
    hitplayer(a,x);
    }
*/

const bloodrcv = (state: State, attack: Attack, isMe: boolean): Promise<void> => getItem(state, attack.weaponId)
    .then((weapon: Item) => {
        const {
            characterId,
            damage,
        } = attack;
        if (!isMe) {
            /* for mo */
            return;
        }
        if (characterId < 0) {
            return;
        }
        // nlod:
        if (!pname(state, characterId).length) {
            return;
        }
        state.fighting = characterId;
        state.in_fight = 300;
        if (damage === -1) {
            bprintf(state, `[p]${pname(state, characterId)}[/p] attacks you`);
            if (weapon && weapon.itemId !== -1) {
                bprintf(state, ` with the ${weapon.name}`);
            }
            bprintf(state, '\n');
            return;
        }
        bprintf(state, `You are wounded by [p]${pname(state, characterId)}[/p]`);
        if (weapon && weapon.itemId !== -1) {
            bprintf(state, ` with the ${weapon.name}`);
        }
        bprintf(state, '\n');
        if (state.my_lev < 10) {
            state.my_str -= damage;
            if (characterId === 16) {
                state.my_sco -= 100 * damage;
                bprintf(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
                if (state.my_sco < 0) {
                    state.my_str = -1;
                }
            }
        }
        if (state.my_str < 0) {
            syslog(state, `${state.globme} slain by ${pname(state, characterId)}`);
            dumpitems(state);
            loseme(state);
            closeworld(state);
            delpers(state, state.globme);
            openworld(state);
            const ms1 = `[p]${state.globme}[/p] has just died.\n`;
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
            const ms2 = `[ [p]${state.globme}[/p] has been slain by [p]${pname(state, characterId)}[/p] ]\n`;
            sendsys(state, state.globme, state.globme, -10113, state.curch, ms2);
            crapup(state, 'Oh dear... you seem to be slightly dead\\n');
        }
        state.me_cal = 1; /* Queue an update when ready */
    });

/*
void  breakitem(x)
    {
    switch(x)
       {
	case 171:sys_reset();break;
	case -1:
          bprintf("What is that ?\n");break;
       default:
          bprintf("You can't do that\n");
          }
    }


 */