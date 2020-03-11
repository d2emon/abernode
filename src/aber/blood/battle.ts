import State from '../state';
import {
    getEnemyId,
    getFight,
    getWeaponId,
    resetFight,
    setWeapon,
} from './reducer';
import {
    Item,
    Player,
    getItem,
    getPlayer,
} from '../support';

export default {
    isBattle: (state: State): boolean => getFight(state) > 0,
    setWeapon: (state: State, weapon?: Item): void => setWeapon(state, weapon),
    getWeapon: (state: State): Promise<Item> => getItem(state, getWeaponId(state)),
    getEnemy: (state: State): Promise<Player> => getPlayer(state, getEnemyId(state)),
    stopFight: (state: State): void => resetFight(state),
}