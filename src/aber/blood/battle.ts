import State from '../state';
import * as BloodReducer from './reducer';
import {
    Item,
    Player,
    getItem,
    getPlayer,
} from '../support';
import {isHere} from "../tk/reducer";

const setWeapon = (state: State) => (weapon?: Item): void => BloodReducer.setWeaponId(
    state,
    weapon
        ? weapon.itemId
        : undefined
);
const getWeapon = (state: State): Promise<Item | undefined> => getItem(
    state,
    BloodReducer.getWeaponId(state)
);

const createBattle = (state: State, enemy: Player) => {
    const inBattle = BloodReducer.getFight(state) > 0;
    const start = () => {
        BloodReducer.setEnemyId(state, enemy.playerId);
        BloodReducer.resetFightCounter(state);
    };
    const stop = () => {
        BloodReducer.setEnemyId(state, undefined);
        BloodReducer.clearFightCounter(state);
    };
    return {
        enemy,
        inBattle,
        check: () => {
            if (inBattle) {
                throw new Error('You are already fighting!');
            }
            return start();
        },
        start,
        stop,
        fight: (): boolean => {
            if (!enemy || !enemy.exists || !isHere(state, enemy.playerId)) {
                stop();
                return false;
            } else {
                return true;
            }
        },
    };
};

const Battle = {
    // Getters
    getWeaponId: BloodReducer.getWeaponId,
    getWeapon,
    getEnemy: (state: State): Promise<Player> => getPlayer(state, BloodReducer.getEnemyId(state)),
    getBattle: (state: State) => Battle.getEnemy(state)
        .then(enemy => createBattle(state, enemy))
        .then(battle => battle.inBattle
            ? battle
            : undefined
        ),
    isBattle: (state: State) => createBattle(undefined).inBattle(state),
    // Setters
    setWeapon: (state: State, weapon?: Item): void => setWeapon(state)(weapon),
    // Actions
    newFight: (state: State, enemy: Player): void => createBattle(enemy).check(state),
    startFight: (state: State, enemy: Player) => createBattle(enemy).start(state),
    stopFight: (state: State, enemy: Player) => createBattle(undefined).stop(state),
    updateFight: (state: State): void => BloodReducer.updateFightCounter(state),
};

export default Battle;
