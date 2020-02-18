import State from "./state";
import {bprintf, brkword, sendsys} from "./__dummies";
import {Item, getItem, getPlayer, Player, setPlayer} from "./support";
import {logger} from "./files";
import {findAvailableItem, findCarriedItem, isCarriedBy} from './objsys';

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
*/

const weapcom = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Which weapon do you wish to select though\n');
        return Promise.resolve();
    }
    return getPlayer(state, state.mynum)
        .then(player => findCarriedItem(state, state.wordbuf, player))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'Whats one of those ?\n');
            }
            const b = dambyitem(state, item.itemId);
            if (b < 0) {
                state.wpnheld = -1;
                return bprintf(state, 'Thats not a weapon\n');
            }
            state.wpnheld = item.itemId;
            calibme(state);
            return bprintf(state, 'OK...\n');
        })
};

const hitplayer = (state: State, victimId: number, weaponId: number): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getPlayer(state, victimId),
    getItem(state, weaponId),
])
    .then(([
        player,
        victim,
        weapon,
    ]) => {
        if (!victim.exists) {
            return;
        }
        /* Chance to hit stuff */
        if (!isCarriedBy(weapon, player, (state.my_lev < 10)) && (weapon.itemId !== -1)) {
            bprintf(state, `You belatedly realise you dont have the ${weapon.name},\nand are forced to use your hands instead..\n`);
            if (state.wpnheld === weapon.itemId) {
                state.wpnheld = -1;
            }
            weapon = undefined;
        }
        state.wpnheld = weapon ? weapon.itemId : undefined;
        return getItem(state, 16)
            .then((runeShield) => {
                if (weapon && (weapon.itemId === 32) && isCarriedBy(runeShield, victim, (state.my_lev < 10))) {
                    return bprintf(state, 'The runesword flashes back away from its target, growling in anger!\n');
                }
                return dambyitem(state, weapon.itemId)
                    .then((damage) => {
                        if (damage < 0) {
                            bprintf(state, 'Thats no good as a weapon\n');
                            state.wpnheld = -1;
                            return;
                        }
                        if (state.in_fight) {
                            bprintf(state, 'You are already fighting!\n');
                            return;
                        }
                        state.fighting = victim.playerId;
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
                            bprintf(state, `You hit [p]${victim.name}[/p] `);
                            if (weapon && (weapon.itemId === -1)) {
                                bprintf(state, `with the ${weapon.name}`);
                            }
                            bprintf(state, '\n');
                            const ddn = randperc(state) % damage;
                            const x: Attack = {
                                characterId: state.mynum,
                                damage: ddn,
                                weaponId: weapon && weapon.itemId,
                            };
                            if (victim.strength - ddn < 0) {
                                bprintf(state, 'Your last blow did the trick\n');
                                if (!victim.isDead) {
                                    /* Bonus ? */
                                    state.my_sco += victim.value;
                                }
                                setPlayer(state, victim.playerId, { isDead: true });
                                /* MARK ALREADY DEAD */
                                state.in_fight = 0;
                                state.fighting = -1;
                            }
                            if (victim.playerId < 16) {
                                sendsys(state, victim.name, state.globme, -10021, state.curch, x);
                            } else {
                                woundmn(state, victim.playerId, ddn);
                            }
                            state.my_sco += ddn * 2;
                            calibme(state);
                            return;
                        } else {
                            bprintf(state, `You missed [p]${victim.name}[/p]\n`);
                            const x: Attack = {
                                characterId: state.mynum,
                                damage: -1,
                                weaponId: weapon && weapon.itemId,
                            };
                            if (victim.playerId < 16) {
                                sendsys(state, victim.name, state.globme, -10021, state.curch, x);
                            } else {
                                woundmn(state, victim, 0);
                            }
                        }
                    });
            });
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

        return getPlayer(state, state.mynum)
            .then(me => findCarriedItem(state, state.wordbuf, me))
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
    return findAvailableItem(state, state.wordbuf)
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

const bloodrcv = (state: State, attack: Attack, isMe: boolean): Promise<void> => Promise.all([
    getPlayer(state, attack.characterId),
    Promise.resolve(attack.damage),
    getItem(state, attack.weaponId),
])
    .then(([
        enemy,
        damage,
        weapon,
    ]) => {
        if (!isMe) {
            /* for mo */
            return;
        }
        if (enemy.playerId < 0) {
            return;
        }
        if (!enemy.exists) {
            return;
        }
        state.fighting = enemy.playerId;
        state.in_fight = 300;
        if (damage === -1) {
            bprintf(state, `[p]${enemy.name}[/p] attacks you`);
            if (weapon && weapon.itemId !== -1) {
                bprintf(state, ` with the ${weapon.name}`);
            }
            bprintf(state, '\n');
            return;
        }
        bprintf(state, `You are wounded by [p]${enemy.name}[/p]`);
        if (weapon && weapon.itemId !== -1) {
            bprintf(state, ` with the ${weapon.name}`);
        }
        bprintf(state, '\n');
        if (state.my_lev < 10) {
            state.my_str -= damage;
            if (enemy.playerId === 16) {
                state.my_sco -= 100 * damage;
                bprintf(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
                if (state.my_sco < 0) {
                    state.my_str = -1;
                }
            }
        }
        if (state.my_str < 0) {
            logger.write(`${state.globme} slain by ${enemy.name}`);
            dumpitems(state);
            loseme(state);
            closeworld(state);
            delpers(state, state.globme);
            openworld(state);
            const ms1 = `[p]${state.globme}[/p] has just died.\n`;
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
            const ms2 = `[ [p]${state.globme}[/p] has been slain by [p]${enemy.name}[/p] ]\n`;
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
