export const HELD_BY = 0;
export const LOCATED_IN = 1;
export const WEARING_BY = 2;
export const CONTAINED_IN = 3;

export default interface Item {
    name: string,
    descriptions: string[],
    maxState: number,
    value: number,
    flannel: boolean,
}
