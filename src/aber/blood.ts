import State from './state';
import {
    bprintf,
    brkword,
    sendsys,
} from './__dummies';
import {
    Item,
    Player,
    getItem,
    getPlayer,
    setPlayer,
} from './support';
import {logger} from './files';
import {
    dropMyItems,
    findAvailableItem,
    findCarriedItem,
    findVisiblePlayer,
    isCarriedBy,
} from './objsys';
import Action from './action';
import {sendName} from "./bprintf/bprintf";

const openworld = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const calibme = (state: State): void => undefined;
const crapup = (state: State, message: string): void => undefined;
const delpers = (state: State, name: string): void => undefined;
const loseme = (state: State): void => undefined;
const randperc = (state: State): number => 0;
const sys_reset = (state: State): void => undefined;
const iswornby = (state: State, item: Item, player: Player): boolean => false;
const woundmn = (state: State, victim: Player, damage: number): void => undefined;

interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}

const getWeaponId = (state: State): number => state.wpnheld;
const setWeapon = (state: State, weapon?: Item): void => {
    state.wpnheld = weapon ? weapon.itemId : undefined;
};

const getFight = (state: State): number => state.in_fight;
const setFight = (state: State, enemy: Player): void => {
    state.fighting = enemy.playerId;
    state.in_fight = 300;
};
const resetFight = (state: State): void => {
    state.in_fight = 0;
    state.fighting = -1;
};

const damageByItem = (item?: Item): number => item ? item.damage : 4;

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;
const WRAITH_ID = 16;

export const hitPlayer = (state: State, victim: Player, weapon?: Item): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (!victim.exists) {
            return;
        }
        /* Chance to hit stuff */
        if (weapon && !isCarriedBy(weapon, player, (state.my_lev < 10))) {
            bprintf(state, `You belatedly realise you dont have the ${weapon.name},\n`);
            bprintf(state, 'and are forced to use your hands instead..\n');
            weapon = undefined;
        }
        setWeapon(state, weapon);

        let p = Promise.resolve();
        if (weapon && (weapon.itemId === RUNE_SWORD_ID)) {
            p = getItem(state, SCEPTRE_ID)
                .then((sceptre) => {
                    if (isCarriedBy(sceptre, victim, (state.my_lev < 10))) {
                        throw new Error('The runesword flashes back away from its target, growling in anger!');
                    }
                })
        }
        return p
            .then(() => {
                if (damageByItem(weapon) === undefined) {
                    setWeapon(state, undefined);
                    throw new Error('Thats no good as a weapon');
                }
                if (getFight(state)) {
                    throw new Error('You are already fighting!');
                }

                setFight(state, victim);
                return Promise.all([
                    getItem(state, 89),
                    getItem(state, 113),
                    getItem(state, 114),
                ])
            })
            .then((shields) => {
                let toHit = 40 + 3 * state.my_lev;
                if (shields.some(shield => iswornby(state, shield, victim))) {
                    toHit -= 10;
                }
                if (toHit < 0) {
                    toHit = 0;
                }
                return randperc(state) < toHit;
            })
            .then((hit: boolean) => {
                if (hit) {
                    const weaponDescription = weapon ? `with the ${weapon.name}` : '';
                    bprintf(state, `You hit ${sendName(victim.name)} ${weaponDescription}\n`);

                    const attack: Attack = {
                        characterId: state.mynum,
                        damage: randperc(state) % damageByItem(weapon),
                        weaponId: weapon ? weapon.itemId : undefined,
                    };
                    const promises = [];
                    if (attack.damage > victim.strength) {
                        // Killed
                        bprintf(state, 'Your last blow did the trick\n');
                        if (!victim.isDead) {
                            /* Bonus ? */
                            state.my_sco += victim.value;
                        }
                        resetFight(state);
                        /* MARK ALREADY DEAD */
                        promises.push(setPlayer(state, victim.playerId, { isDead: true }));
                    }
                    return Promise.all(promises)
                        .then(() => {
                            state.my_sco += attack.damage * 2;
                            calibme(state);
                            return attack;
                        });
                } else {
                    bprintf(state, `You missed ${sendName(victim.name)}\n`);
                    return {
                        characterId: state.mynum,
                        damage: undefined,
                        weaponId: weapon ? weapon.itemId : undefined,
                    };
                }
            })
            .then((attack) => {
                if (!victim.isBot) {
                    return sendsys(
                        state,
                        victim.name,
                        state.globme,
                        -10021,
                        state.curch,
                        attack,
                    );
                } else {
                    return woundmn(state, victim, attack.damage || 0);
                }
            })
            .catch(e => bprintf(state, `${e}\n`));
    });

export const receiveDamage = (state: State, attack: Attack, isMe: boolean): Promise<void> => Promise.all([
    getPlayer(state, attack.characterId),
    Promise.resolve(attack.damage),
    getItem(state, attack.weaponId),
])
    .then(([
        enemy,
        damage,
        weapon,
    ]) => {
        const lifeDrain = () => {
            state.my_sco -= 100 * damage;
            bprintf(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
            if (state.my_sco < 0) {
                state.my_str = -1;
            }
        };

        const killed = () => Promise.all([
            logger.write(`${state.globme} slain by ${enemy.name}`),
            dropMyItems(state),
        ])
            .then(() => {
                loseme(state);
                closeworld(state);
                delpers(state, state.globme);
                openworld(state);
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10000,
                    state.curch,
                    `${sendName(state.globme)} has just died.\n`,
                );
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10113,
                    state.curch,
                    `[ ${sendName(state.globme)} has been slain by ${sendName(enemy.name)}[/p] ]\n`,
                );
                return crapup(state, 'Oh dear... you seem to be slightly dead');
            });

        const missed = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            bprintf(state, `${sendName(enemy.name)} attacks you${weaponMessage}\n`);
        };

        const wounded = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            bprintf(state, `You are wounded by ${sendName(enemy.name)}${weaponMessage}\n`);

            if (state.my_lev < 10) {
                // Set Damage
                state.my_str -= damage;
                if (enemy.playerId === WRAITH_ID) {
                    lifeDrain();
                }
            }

            if (state.my_str < 0) {
                return killed();
            }

            state.me_cal = 1; /* Queue an update when ready */
        };

        if (!isMe) {
            /* for mo */
            return;
        }
        if (!enemy) {
            return;
        }
        if (!enemy.exists) {
            return;
        }

        setFight(state, enemy);
        return (damage === undefined)
            ? missed()
            : wounded();
    });

// Actions

export class Weapon extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Which weapon do you wish to select though');
        }
        return getPlayer(state, state.mynum)
            .then(player => findCarriedItem(state, state.wordbuf, player))
            .then((item) => {
                if (!item) {
                    throw new Error('Whats one of those ?');
                }
                const weapon = (damageByItem(item) !== undefined) ? item : undefined;
                setWeapon(state, weapon);
                if (!weapon) {
                    throw new Error('Thats not a weapon');
                }
                calibme(state);
            });
    }

    decorate(result: any): void {
        this.output('OK...\n');
    }
}

export class Kill extends Action {
    getVictim(state: State): Promise<Player> {
        return findVisiblePlayer(state, state.wordbuf)
            .then((player) => {
                if (!player) {
                    throw new Error('You can\'t do that');
                }
                if (player.playerId === state.mynum) {
                    throw new Error('Come on, it will look better tomorrow...');
                }
                if (player.locationId !== state.curch) {
                    throw new Error('They aren\'t here');
                }
                return player;
            });
    }

    getWeapon(state: State): Promise<Item> {
        if (brkword(state) === -1) {
            return getItem(state, getWeaponId(state));
        }
        if (state.wordbuf !== 'with') {
            return this.getWeapon(state);
        }
        if (brkword(state) === -1) {
            throw new Error('with what ?\n');
        }
        return getPlayer(state, state.mynum)
            .then(me => findCarriedItem(state, state.wordbuf, me))
            .then((weapon) => {
                if (!weapon) {
                    throw new Error('with what ?\n');
                }
                return weapon;
            });
    }

    breakItem(state: State, item?: Item): Promise<any> {
        if (!item) {
            throw new Error('What is that ?');
        }
        if (item.itemId === 171) {
            sys_reset(state);
            return;
        }
        throw new Error('You can\'t do that');
    }

    killPlayer(state: State): Promise<any> {
        return Promise.all([
            this.getVictim(state),
            this.getWeapon(state),
        ])
            .then(([player, weapon]) => {
                return hitPlayer(state, player, weapon);
            });
    };

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Kill who');
        }
        if (state.wordbuf === 'door') {
            throw new Error('Who do you think you are , Moog?');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => (
                item
                    ? this.breakItem(state, item)
                    : this.killPlayer(state)
            ));
    }
}
