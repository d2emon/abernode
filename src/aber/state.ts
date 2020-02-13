import Item from './object';

interface ItemData {
    locationId: number,
    value1: number,
    value2: number,
    carryFlag: number,
}

export default interface State {
    NOBS: number,
    brmode: boolean,
    curch: number,
    debug_mode: boolean,
    ex_dat: number[],
    exittxt: string[],
    fighting: number,
    globme: string,
    in_fight: number,
    me_cal: number,
    my_lev: number,
    my_sco: number,
    my_str: number,
    mynum: number,
    numobs: number,
    objects: Item[],
    objinfo: ItemData[],
    out_ms: string,
    stp: number,
    wd_it: string,
    wordbuf: string,
    wpnheld: number,
}
