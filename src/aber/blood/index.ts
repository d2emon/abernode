import State from '../state';
import Battle, {BattleModel} from './battle';
import {
    Item,
    Player,
    setPlayer,
} from '../support';
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
import {
    DefaultWeapon,
    Weapon,
    WeaponModel,
} from "./weapon";
import {isCarriedBy} from "../objsys";

export const hitPlayer = (state: State, battle: BattleModel, actor: Player, target: Player, weapon?: Item): Promise<void> => {
    const onHit = (attack: Attack): Promise<Attack> => {
        const killTarget = () => (attack.damage > target.strength)
            && sendBaseMessage(state, 'Your last blow did the trick\n')
                .then(() => (!target.isDead) && updateScore(state, target.value)) // Bonus
                .then(() => battle.stop())
                .then(() => setPlayer(state, target.playerId, { isDead: true })); // MARK ALREADY DEAD
        const addScore = () => calibrate(state, actor, attack.damage * 2);

        const weaponDescription = weapon ? `with the ${weapon.name}` : '';
        return sendBaseMessage(state, `You hit ${playerName(target)} ${weaponDescription}\n`)
            .then(killTarget)
            .then(addScore)
            .then(() => attack);
    };
    const onMiss = (attack: Attack): Promise<Attack> => sendBaseMessage(
        state,
        `You missed ${playerName(target)}\n`
    )
        .then(() => attack);

    const checkFight = (model: BattleModel): Promise<BattleModel> => model.inBattle
        ? Promise.reject(new Error('You are already fighting!'))
        : Promise.resolve(model);
    const getWeapon = (item: Item): Promise<WeaponModel> => (item && !isCarriedBy(item, actor, !isWizard(state)))
        ? sendBaseMessage(
            state,
            `You belatedly realise you dont have the ${item.name},\n`
                + 'and are forced to use your hands instead..',
        )
            .then(() => Weapon())
        : Promise.resolve(Weapon(item));
    const wieldWeapon = (weapon: WeaponModel) => weapon.wield(state)
        .then(() => weapon);
    const startFight = (model: BattleModel): Promise<void> => checkFight(model)
        .then(model => model.start(target));
    const getAttack = (): Promise<Attack> => getWeapon(weapon)
        .then(wieldWeapon)
        .then(weapon => weapon.attack(state, actor, target))
        .catch(() => Promise.reject(new Error('That\'s no good as a weapon')));
    const doHit = (attack: Attack): Promise<Attack> => attack.hit
        ? onHit(attack)
        : onMiss(attack);
    const sendDamage = (attack: Attack): Promise<void> => target.isBot
        ? sendBotDamage(state, actor, target, attack.damage || 0)
        : Events.sendDamage(state, target, attack);

    if (!target.exists) {
        return;
    }
    return startFight(battle)
        .then(getAttack)
        .then(doHit)
        .then(sendDamage);
};

export const doFight = (state: State, actor: Player, battle: BattleModel): Promise<void> => Promise.all([
        battle.fight(),
        battle.getEnemy(),
        DefaultWeapon(state),
    ])
    .then(([
        inFight,
        enemy,
        weapon,
    ]) => inFight && hitPlayer(state, battle, actor, enemy, weapon.item))
    .then(() => battle.stop());
