import State from '../state';
import * as BloodReducer from './reducer';
import {
    Player,
    getPlayer,
} from '../support';
import {isHere} from "../tk/reducer";

export interface BattleModel {
    getEnemy: () => Promise<Player>,
    inBattle: boolean,
    start: (enemy: Player) => void,
    stop: () => void,
    fight: () => Promise<boolean>,
    removeEnemy: (player: Player) => void,
}

const Battle = (state: State): BattleModel => {
    const getEnemy = (): Promise<Player> => getPlayer(state, BloodReducer.getEnemyId(state));
    const inBattle = BloodReducer.getFight(state) > 0;
    const start = (enemy: Player) => {
        BloodReducer.setEnemyId(state, enemy.playerId);
        BloodReducer.resetFightCounter(state);
    };
    const stop = () => {
        BloodReducer.setEnemyId(state, undefined);
        BloodReducer.clearFightCounter(state);
    };
    return {
        getEnemy,
        inBattle,
        start,
        stop,
        fight: (): Promise<boolean> => getEnemy()
            .then((enemy) => {
                if (!enemy || !enemy.exists || !isHere(state, enemy.locationId)) {
                    stop();
                    return false;
                } else {
                    BloodReducer.updateFightCounter(state);
                    return true;
                }
            }),
        removeEnemy: (player: Player): Promise<void> => getEnemy()
            .then(enemy => enemy && (enemy.playerId === player.playerId) && stop()),
    };
};

export default Battle;
