import State from '../state';
import {
    Item,
    Player,
    getItem,
} from '../support';

export const getWeaponId = (state: State): number => state.wpnheld;
export const setWeapon = (state: State, weapon?: Item): void => {
    state.wpnheld = weapon ? weapon.itemId : undefined;
};
export const getWeapon = (state: State): Promise<Item> => getItem(state, state.wpnheld);

export const getFight = (state: State): number => state.in_fight;
export const setFight = (state: State, enemy: Player): void => {
    state.fighting = enemy.playerId;
    state.in_fight = 300;
};
export const resetFight = (state: State): void => {
    state.in_fight = 0;
    state.fighting = -1;
};
