import State from '../state';
import {
    Item,
    Player,
    getItem,
    getPlayer,
    setPlayer,
} from '../support';
import {isCarriedBy} from '../objsys';
import {sendsys} from '../__dummies';
import {
    getFight,
    resetFight,
    setFight,
    setWeapon,
} from './reducer';
import {sendName} from '../bprintf';
import {sendMessage} from '../bprintf/bprintf';
import {roll} from "../magic";
import {receiveDamage} from "../new1";

const calibme = (state: State): void => undefined;
const iswornby = (state: State, item: Item, player: Player): boolean => false;

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;

export interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}

export const damageByItem = (item?: Item): number => item ? item.damage : 4;

const badWeapon = (state: State, weapon: Item): Promise<undefined> => Promise.all([
    sendMessage(state, `You belatedly realise you dont have the ${weapon.name},\n`),
    sendMessage(state, 'and are forced to use your hands instead..\n'),
])
    .then(() => undefined);
const swordVsSceptre = (state: State, victim: Player): Promise<void> => getItem(state, SCEPTRE_ID)
    .then((sceptre) => {
        if (isCarriedBy(sceptre, victim, (state.my_lev < 10))) {
            throw new Error('The runesword flashes back away from its target, growling in anger!');
        }
    });

export const hitPlayer = (state: State, victim: Player, weapon?: Item): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (!victim.exists) {
            return;
        }
        /* Chance to hit stuff */
        let p = Promise.resolve(weapon);
        if (weapon && !isCarriedBy(weapon, player, (state.my_lev < 10))) {
            p = badWeapon(state, weapon)
        }
        return p
            .then((weapon) => {
                setWeapon(state, weapon);
                if (!weapon) {
                    return;
                }
                if (weapon.itemId === RUNE_SWORD_ID) {
                    return swordVsSceptre(state, victim);
                }
            })
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
                return Promise.all([
                    roll(),
                    Promise.resolve(toHit),
                    roll(),
                ]);
            })
            .then(([
                hitRoll,
                toHit,
                damageRoll,
            ]) => ({
                characterId: state.mynum,
                damage: (hitRoll < toHit) ? (damageRoll % damageByItem(weapon)) : undefined,
                weaponId: weapon ? weapon.itemId : undefined,
            }))
            .then((attack: Attack) => {
                const promises = [];
                if (attack.damage) {
                    const weaponDescription = weapon ? `with the ${weapon.name}` : '';
                    promises.push(sendMessage(state, `You hit ${sendName(victim.name)} ${weaponDescription}\n`));
                    if (attack.damage > victim.strength) {
                        // Killed
                        promises.push(sendMessage(state, 'Your last blow did the trick\n'));
                        if (!victim.isDead) {
                            /* Bonus ? */
                            state.my_sco += victim.value;
                        }
                        resetFight(state);
                        /* MARK ALREADY DEAD */
                        promises.push(setPlayer(state, victim.playerId, { isDead: true }));
                    }
                    promises.push(new Promise((resolve) => {
                        state.my_sco += attack.damage * 2;
                        calibme(state);
                    }));
                } else {
                    promises.push(sendMessage(state, `You missed ${sendName(victim.name)}\n`));
                }
                return Promise.all(promises)
                    .then(() => attack);
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
                    return receiveDamage(state, victim, attack.damage || 0);
                }
            })
            .catch(e => sendMessage(state, `${e}\n`));
    });
