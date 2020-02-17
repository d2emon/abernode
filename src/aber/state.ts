import Item, {
    IS_DESTROYED,
    HAS_CONNECTED,
    CAN_BE_OPENED,
    CAN_BE_LOCKED,
    CAN_BE_LIT,
    CAN_BE_EXTINGUISHED,
    IS_KEY,
    CHANGE_STATE_ON_TAKE,
    IS_LIT,
    IS_CONTAINER,
    IS_WEAPON, IS_LEVER, IS_SWITCH, IS_FOOD, CAN_BE_WORN,
} from './object';

export const NOBS = 194;

export interface ItemFlags {
    [IS_DESTROYED]: boolean,
    [HAS_CONNECTED]: boolean,
    [CAN_BE_OPENED]: boolean,
    [CAN_BE_LOCKED]: boolean,
    [IS_LEVER]: boolean,
    [IS_SWITCH]: boolean,
    [IS_FOOD]: boolean,
    [CAN_BE_WORN]: boolean,
    [CAN_BE_LIT]: boolean,
    [CAN_BE_EXTINGUISHED]: boolean,
    [IS_KEY]: boolean,
    [CHANGE_STATE_ON_TAKE]: boolean,
    [IS_LIT]: boolean,
    [IS_CONTAINER]: boolean,
    [IS_WEAPON]: boolean,
}

interface ItemData {
    locationId: number,
    state: number,
    flags: ItemFlags,
    payload: any,
    carryFlag: number,
}

interface PlayerData {
    value0: number,
    value1: number,
    value2: number,
    value3: number,
    locationId: number,
    value5: number,
    value6: number,
    value7: number,
    value8: number,
    value9: number,
    value10: number,
    value11: number,
    value12: number,
    value13: number,
    value14: number,
    value15: number,
}

export default interface State {
    // objsys
    numobs: number; // NOBS
    //
    argv_p: any,
    brmode: boolean,
    curch: number,
    debug_mode: boolean,
    ex_dat: number[],
    exittxt: string[],
    fighting: number,
    globme: string,
    i_setup: boolean,
    in_fight: number,
    jumtb: number[],
    me_cal: number,
    my_lev: number,
    my_sex: number,
    my_sco: number,
    my_str: number,
    mynum: number,
    objects: Item[],
    objinfo: ItemData[],
    out_ms: string,
    stp: number,
    sysbuf: string,
    ublock: PlayerData[],
    wd_it: string,
    wordbuf: string,
    wpnheld: number,
    zapped: boolean,
}
