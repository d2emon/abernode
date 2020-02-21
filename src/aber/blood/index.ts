import State from '../state';
import {
    Item,
    Player,
    getItem,
    getPlayer,
    setPlayer,
} from '../support';
import {isCarriedBy} from '../objsys';
import {
    bprintf,
    sendsys,
} from '../__dummies';
import {
    getFight,
    resetFight,
    setFight,
    setWeapon,
} from './reducer';
import {sendName} from '../bprintf';

const calibme = (state: State): void => undefined;
const iswornby = (state: State, item: Item, player: Player): boolean => false;
const randperc = (state: State): number => 0;
const woundmn = (state: State, victim: Player, damage: number): void => undefined;

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;

export interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}

export const damageByItem = (item?: Item): number => item ? item.damage : 4;

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
