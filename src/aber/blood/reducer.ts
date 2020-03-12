import State from '../state';

export const getWeaponId = (state: State): number => state.wpnheld;
export const getEnemyId = (state: State): number => state.fighting;
export const getFight = (state: State): number => state.in_fight;

export const setWeaponId = (state: State, weaponId?: number): void => { state.wpnheld = weaponId; };
export const setEnemyId = (state: State, enemyId?: number): void => { state.fighting = enemyId; };
export const resetFightCounter = (state: State): void => { state.in_fight = 300; };
export const clearFightCounter = (state: State): void => { state.in_fight = 0; };
export const updateFightCounter = (state: State): void => {
    if (state.in_fight) {
        state.in_fight -= 1;
    }
};
