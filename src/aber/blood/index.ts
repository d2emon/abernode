import State from '../state';
import {
    Item,
    Player,
    getItem,
    setPlayer,
} from '../support';
import {isCarriedBy} from '../objsys';
import {
    getFight,
    resetFight,
    setFight,
    setWeapon,
} from './reducer';
import {playerName} from '../bprintf';
import {sendMessage} from '../bprintf/bprintf';
import {checkRoll, roll} from "../magic";
import {isWornBy, sendBotDamage} from "../new1";
import {getToHit, isWizard, updateScore} from "../newuaf/reducer";
import Events, {Attack} from "../tk/events";
import {calibrate} from "../parse";

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;

export const damageByItem = (item?: Item): number => item ? item.damage : 4;

const badWeapon = (state: State, weapon: Item): Promise<undefined> => Promise.all([
    sendMessage(state, `You belatedly realise you dont have the ${weapon.name},\n`),
    sendMessage(state, 'and are forced to use your hands instead..\n'),
])
    .then(() => undefined);
const swordVsSceptre = (state: State, victim: Player): Promise<void> => getItem(state, SCEPTRE_ID)
    .then((sceptre) => {
        if (isCarriedBy(sceptre, victim, !isWizard(state))) {
            throw new Error('The runesword flashes back away from its target, growling in anger!');
        }
    });

export const hitPlayer = (state: State, actor: Player, victim: Player, weapon?: Item): Promise<void> => {
    if (!victim.exists) {
        return;
    }
    /* Chance to hit stuff */
    let p = Promise.resolve(weapon);
    if (weapon && !isCarriedBy(weapon, actor, !isWizard(state))) {
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
            let toHit = getToHit(state);
            if (shields.some(shield => isWornBy(state, shield, victim))) {
                toHit -= 10;
            }
            if (toHit < 0) {
                toHit = 0;
            }
            return Promise.all([
                checkRoll(r => r < toHit),
                roll(),
            ]);
        })
        .then(([
            hit,
            damageRoll,
        ]) => ({
            characterId: actor.playerId,
            damage: hit ? (damageRoll % damageByItem(weapon)) : undefined,
            weaponId: weapon ? weapon.itemId : undefined,
        }))
        .then((attack: Attack) => {
            const promises = [];
            if (attack.damage) {
                const weaponDescription = weapon ? `with the ${weapon.name}` : '';
                promises.push(sendMessage(state, `You hit ${playerName(victim)} ${weaponDescription}\n`));
                if (attack.damage > victim.strength) {
                    // Killed
                    promises.push(sendMessage(state, 'Your last blow did the trick\n'));
                    if (!victim.isDead) {
                        /* Bonus ? */
                        updateScore(state, victim.value);
                    }
                    resetFight(state);
                    /* MARK ALREADY DEAD */
                    promises.push(setPlayer(state, victim.playerId, { isDead: true }));
                }
                promises.push(calibrate(state, actor, attack.damage * 2));
            } else {
                promises.push(sendMessage(state, `You missed ${playerName(victim)}\n`));
            }
            return Promise.all(promises)
                .then(() => attack);
        })
        .then((attack) => {
            if (!victim.isBot) {
                return Events.sendDamage(state, victim, attack);
            } else {
                return sendBotDamage(state, actor, victim, attack.damage || 0);
            }
        })
        .catch(e => sendMessage(state, `${e}\n`));
};
