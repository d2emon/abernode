export const HELD_BY = 0;
export const LOCATED_IN = 1;
export const WEARING_BY = 2;
export const CONTAINED_IN = 3;

export const IS_DESTROYED = 0;
export const HAS_CONNECTED = 1;
export const CAN_BE_OPENED = 2;
export const CAN_BE_LOCKED = 3;
export const IS_LEVER = 4;
export const IS_SWITCH = 5;
export const IS_FOOD = 6;
const FLAG_7 = 7;
export const CAN_BE_WORN = 8;
export const CAN_BE_LIT = 9;
export const CAN_BE_EXTINGUISHED = 10;
export const IS_KEY = 11;
export const CHANGE_STATE_ON_TAKE = 12;
export const IS_LIT = 13;
export const IS_CONTAINER = 14;
export const IS_WEAPON = 15;

export default interface Item {
    name: string,
    descriptions: string[],
    maxState: number,
    baseValue: number,
    flannel: boolean,
}
