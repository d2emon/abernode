import State from "./state";
import {bprintf, brkword, sendsys} from "./__dummies";
import {Item, getItem, getPlayer, Player} from "./support";
import {logger} from "./files";

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
*/

const dambyitem = (state: State, itemId: number): Promise<number> => {
    if (itemId === -1) {
        return Promise.resolve(4);
    }
    return getItem(state, itemId).then(item => item.damage);
};

/*
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

const killcom = (state: State): Promise<void> => {
    const hitWith = (player: Player): Promise<void> => {
        if (brkword(state) === -1) {
            return hitplayer(state, player.playerId, state.wpnheld);
        }
        if (state.wordbuf === 'with') {
            if (brkword(state) === -1) {
                bprintf(state, 'with what ?\n');
                return Promise.resolve();
            }
        } else {
            return hitWith(player);
        }

        return getItem(state, fobnc(state, state.wordbuf))
            .then((item) => {
                if (item.itemId === -1) {
                    bprintf(state, 'with what ?\n');
                    return Promise.resolve();
                }
                return hitplayer(state, player.playerId, item.itemId);
            });
    };

    if (brkword(state) === -1) {
        bprintf(state, 'Kill who\n');
        return Promise.resolve();
    }
    if (state.wordbuf === 'door') {
        bprintf(state, 'Who do you think you are , Moog?\n');
        return Promise.resolve();
    }
    return getItem(state, fobna(state, state.wordbuf))
        .then((item) => {
            if (item.itemId !== -1) {
                return breakitem(state, item.itemId);
            }
            return getPlayer(state, fpbn(state, state.wordbuf))
                .then((player) => {
                    if (player.playerId === -1) {
                        bprintf(state, 'You can\'t do that\n');
                        return Promise.resolve();
                    }
                    if (player.playerId === state.mynum) {
                        bprintf(state, 'Come on, it will look better tomorrow...\n');
                        return Promise.resolve();
                    }
                    if (player.locationId !== state.curch) {
                        bprintf(state, 'They aren\'t here\n');
                        return Promise.resolve();
                    }
                    return hitWith(player);
                });
        })
};

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
            logger.write(`${state.globme} slain by ${pname(state, characterId)}`);
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
