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

/**
 * Object structure
 *
 * Name,
 * Long Text 1
 * Long Text 2
 * Long Text 3
 * Long Text 4
 * statusmax
 * Value
 * flags (0=Normal 1+flannel)
 */

/**
 * Objinfo
 *
 * Loc
 * Status
 * Stamina
 * Flag 1=carr 0=here
 */

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

export interface ItemData {
    locationId: number,
    state: number,
    flags: ItemFlags,
    payload: any,
    carryFlag: number,
}

/**
 * Pflags
 *
 * 0 sex
 * 1 May not be exorcised ok
 * 2 May change pflags ok
 * 3 May use rmedit ok
 * 4 May use debugmode ok
 * 5 May use patch
 * 6 May be snooped upon
 */

export interface PlayerFlags {
    sex: boolean,
    canNotBeExorcised: boolean,
    canSetFlags: boolean,
    isEditor: boolean,
    canUseDebugMode: boolean,
    canEditWorld: boolean,
    canNotBeSnooped: boolean,
    flag7: boolean,
    flag8: boolean,
}

export interface PlayerData {
    name: string,
    locationId: number,
    eventId: number,
    value6: number,
    strength: number,
    visibility: number,
    flags: PlayerFlags,
    level: number,
    weaponId: number,
    value12: number,
    helping: number,
    value14: number,
    value15: number,
}

export default interface State {
    // blood
    fighting: number,
    in_fight: number,
    wpnheld: number,
    // bprintf
    messagesId: number,
    iskb: boolean,
    log_fl?: any,
    pr_due: boolean,
    pr_qcr: boolean,
    snoopd: number,
    snoopt: number,
    sysbuf: string,
    // objsys
    numobs: number; // NOBS
    ublock: PlayerData[],
    // gamego
    programName: string,
    alarm?: number,
    sig_active: boolean,
    interrupt: boolean,
    // new1
    acfor: string,
    ail_blind: boolean,
    ail_crip: boolean,
    ail_deaf: boolean,
    ail_dumb: boolean,
    forf: boolean,
    isforce: boolean,
    // newuaf
    my_lev: number,
    my_sex: number,
    my_sco: number,
    my_str: number,
    // opensys
    filrf: any,
    // parse
    debug_mode: boolean,
    stp: number,
    strbuf: string,
    wd_her: string,
    wd_him: string,
    wd_it: string,
    wd_them: string,
    wd_there: string,
    wordbuf: string,
    //
    brmode: boolean,
    curch: number,
    curmode: number,
    ex_dat: number[],
    exittxt: string[],
    globme: string,
    hasfarted: boolean,
    i_setup: boolean,
    in_ms: string,
    jumtb: number[],
    maxu: number,
    me_cal: number,
    min_ms: string,
    mout_ms: string,
    mynum: number,
    objects: Item[],
    objinfo: ItemData[],
    out_ms: string,
    rd_qd: boolean,
    zapped: boolean,
    //
    me: {},
}
