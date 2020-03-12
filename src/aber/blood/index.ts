import State from '../state';
import Battle from './battle';
import {
    Item,
    Player,
    getItem,
    setPlayer,
} from '../support';
import {isCarriedBy} from '../objsys';
import {playerName, sendBaseMessage} from '../bprintf';
import {sendBotDamage} from "../new1";
import {
    isWizard,
    updateScore,
} from "../newuaf/reducer";
import Events, {
    Attack,
} from "../tk/events";
import {calibrate} from "../parse";
import {isHere} from "../tk/reducer";
import {
    DefaultWeapon,
    useWeapon,
} from "./weapon";

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;

const swordVsSceptre = (state: State, victim: Player): Promise<void> => getItem(state, SCEPTRE_ID)
    .then((sceptre) => {
        if (isCarriedBy(sceptre, victim, !isWizard(state))) {
            throw new Error('The runesword flashes back away from its target, growling in anger!');
        }
    });

export const hitPlayer = (state: State, actor: Player, target: Player, weapon?: Item): Promise<void> => {
    const onHit = (attack: Attack): Promise<void> => target.isBot
        ? sendBotDamage(state, actor, target, attack.damage || 0)
        : Events.sendDamage(state, target, attack);
    const hitTarget = (attack: Attack): Promise<void> => {
        const killTarget = () => sendBaseMessage(state, 'Your last blow did the trick\n')
            .then(() => (!target.isDead) && updateScore(state, target.value)) // Bonus
            .then(() => Battle.stopFight(state))
            .then(() => setPlayer(state, target.playerId, { isDead: true })); // MARK ALREADY DEAD

        const weaponDescription = weapon ? `with the ${weapon.name}` : '';
        return sendBaseMessage(state, `You hit ${playerName(target)} ${weaponDescription}\n`)
            .then(() => (attack.damage > target.strength) && killTarget())
            .then(() => calibrate(state, actor, attack.damage * 2))
            .then(() => onHit(attack));
    };
    const missTarget = (attack: Attack): Promise<void> => sendBaseMessage(state, `You missed ${playerName(target)}\n`)
        .then(() => onHit(attack));

    return target.exists && Promise.all([
        useWeapon(state, actor, weapon),
        Battle.newFight(state, target),
    ])
        .then(([
            weapon,
        ]) => weapon.attack(state, actor, target))
        .then(attack => attack.hit
            ? hitTarget(attack)
            : missTarget(attack)
        );
};

const hitPlayerDefault = (state: State, actor: Player, battle): Promise<void> => DefaultWeapon(state)
    .then(weapon => hitPlayer(state, actor, battle.enemy, weapon.item))
    .then(() => battle.stop());

export const doFight = (state: State, actor: Player, interrupt: boolean): Promise<void> => Battle.getBattle(state)
    .then((battle) => {
        if (!battle) {
            return battle.stop();
        } else if (battle.fight() && interrupt) {
            return hitPlayerDefault(state, actor, battle);
        }
    })
    .catch(e => sendBaseMessage(state, `${e}\n`));
