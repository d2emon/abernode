interface ItemData {
    locationId: number,
    value1: number,
    value2: number,
    carryFlag: number,
}

export default interface State {
    curch: number,
    globme: string,
    my_lev: number,
    my_sco: number,
    my_str: number,
    mynum: number,
    numobs: number,
    objinfo: ItemData[],
    wordbuf: string,
}
