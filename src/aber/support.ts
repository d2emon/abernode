import State, {
    ItemFlags, PlayerFlags,
} from './state';
import ItemInterface, {
    HELD_BY,
    LOCATED_IN,
    WEARING_BY,
    CONTAINED_IN,
    IS_DESTROYED,
    IS_WEAPON,
    IS_LIT,
    CAN_BE_OPENED,
    HAS_CONNECTED,
    IS_KEY,
    CAN_BE_LOCKED,
    IS_CONTAINER,
    CAN_BE_LIT,
    CAN_BE_EXTINGUISHED,
    CHANGE_STATE_ON_TAKE, IS_LEVER, IS_SWITCH, CAN_BE_WORN, IS_FOOD,
} from './object';

const ishere = (state: State, itemId: number, playerId: number): boolean => false;
const iscarrby = (state: State, itemId: number, playerId: number): boolean => false;
const __state = (itemId: number): number => 0;
const tscale = (state: State): number => 1;
const damof = (state: State, playerId: number): number => 0;

/**
 * Some more basic functions
 *
 * Note
 *
 * state(obj)
 * setstate(obj,val)
 * destroy(obj)
 *
 * are elsewhere
 */

// Item

export interface Item {
    itemId: number,

    name: string,
    maxState: number,
    baseValue: number,
    flannel: boolean,

    locationId: number,
    state: number,
    flags: ItemFlags,
    payload: any,
    carryFlag: number,

    heldBy?: number,
    locatedIn?: number,
    wearingBy?: number,
    containedIn?: number,

    isDestroyed: boolean,
    hasConnected: boolean,
    canBeOpened: boolean,
    canBeLocked: boolean,
    isLever: boolean,
    isSwitch: boolean,
    isFood: boolean,
    canBeWorn: boolean,
    canBeLit: boolean,
    canBeExtinguished: boolean,
    isKey: boolean,
    changeStateOnTake: boolean,
    isLit: boolean,
    isContainer: boolean,
    isWeapon: boolean,

    description: string,
    value: number,
    connectedItemId?: number,
    damage: number,
}

const itemFromState = (state: State, itemId: number): Item => ({
    itemId,

    name: state.objects[itemId].name,
    maxState: state.objects[itemId].maxState,
    baseValue: state.objects[itemId].baseValue,
    flannel: state.objects[itemId].flannel,

    locationId: state.objinfo[itemId].locationId,
    state: state.objinfo[itemId].state,
    flags: state.objinfo[itemId].flags,
    payload: state.objinfo[itemId].payload,
    carryFlag: state.objinfo[itemId].carryFlag,

    heldBy: state.objinfo[itemId].carryFlag === HELD_BY ? state.objinfo[itemId].locationId : undefined,
    locatedIn: state.objinfo[itemId].carryFlag === LOCATED_IN ? state.objinfo[itemId].locationId : undefined,
    wearingBy: state.objinfo[itemId].carryFlag === WEARING_BY ? state.objinfo[itemId].locationId : undefined,
    containedIn: state.objinfo[itemId].carryFlag === CONTAINED_IN ? state.objinfo[itemId].locationId : undefined,

    isDestroyed: state.objinfo[itemId].flags[IS_DESTROYED],
    hasConnected: state.objinfo[itemId].flags[HAS_CONNECTED],
    canBeOpened: state.objinfo[itemId].flags[CAN_BE_OPENED],
    canBeLocked: state.objinfo[itemId].flags[CAN_BE_LOCKED],
    isLever: state.objinfo[itemId].flags[IS_LEVER],
    isSwitch: state.objinfo[itemId].flags[IS_SWITCH],
    isFood: state.objinfo[itemId].flags[IS_FOOD],
    canBeWorn: state.objinfo[itemId].flags[CAN_BE_WORN],
    canBeLit: state.objinfo[itemId].flags[CAN_BE_LIT],
    canBeExtinguished: state.objinfo[itemId].flags[CAN_BE_EXTINGUISHED],
    isKey: state.objinfo[itemId].flags[IS_KEY],
    changeStateOnTake: state.objinfo[itemId].flags[CHANGE_STATE_ON_TAKE],
    isLit: state.objinfo[itemId].flags[IS_LIT],
    isContainer: state.objinfo[itemId].flags[IS_CONTAINER],
    isWeapon: state.objinfo[itemId].flags[IS_WEAPON],

    description: state.objects[itemId].descriptions[__state(itemId)],
    value: (tscale(state) * state.objects[itemId].baseValue) / 5,
    connectedItemId: state.objinfo[itemId].flags[HAS_CONNECTED]
        ? ((itemId % 2) ? itemId - 1 : itemId + 1)
        : undefined,
    damage: state.objinfo[itemId].flags[IS_WEAPON]
        ? state.objinfo[itemId].payload.damage
        : -1,
});
export const getItem = (state: State, itemId: number): Promise<Item> => Promise.resolve(
    itemFromState(state, itemId)
);
export const getItems = (state: State): Promise<Item[]> => Promise.all(
    state.objects.map((item, itemId) => getItem(state, itemId))
);

export const setItem = (state: State, itemId: number, newItem: { state?: number, [key: string]: any }): Promise<void> => new Promise(() => {
    state.objinfo[itemId] = {
        ...state.objinfo[itemId],
        ...newItem,
    };
    if (newItem.state !== undefined) {
        const item = itemFromState(state, itemId);
        if (item.connectedItemId !== undefined) {
            state.objinfo[item.connectedItemId].state = newItem.state;
        }
    }
});

export const putItem = (state: State, itemId: number, locationId: number): Promise<void> => setItem(state, itemId, {
    locationId,
    carryFlag: LOCATED_IN,
});
export const wearItem = (state: State, itemId: number, characterId: number): Promise<void> => setItem(state, itemId, {
    locationId: characterId,
    carryFlag: WEARING_BY,
});
export const holdItem = (state: State, itemId: number, characterId: number): Promise<void> => setItem(state, itemId, {
    locationId: characterId,
    carryFlag: HELD_BY,
});
export const putItemIn = (state: State, itemId: number, locationId: number): Promise<void> => setItem(state, itemId, {
    locationId,
    carryFlag: CONTAINED_IN,
});

export const itemIsAvailable = (state: State, item: Item): boolean => {
    if (ishere(state, item.itemId, state.mynum)) {
        return true;
    }
    return iscarrby(state, item.itemId, state.mynum);
};
export const createItem = (state: State, itemId: number, newItem: {} = {}): Promise<Item> => setItem(state, itemId, {
    ...newItem,
    flags: {
        [IS_DESTROYED]: false,
    },
})
    .then(() => getItem(state, itemId));

export const availableByMask = (state: State, mask: { [flagId: number]: boolean }): Promise<boolean> => getItems(state)
    .then(items => items.some((item) => itemIsAvailable(state, item)
        && Object.keys(mask).every((key) => item.flags[key] === mask[key])
    ));

// Player

export interface Player {
    playerId: number,

    name: string,
    locationId: number,
    eventId: number,
    strength: number,
    visibility: number,
    flags: PlayerFlags,
    level: number,
    weaponId: number,
    helping: number,

    sex: number,
    canBeExorcised: boolean,
    isDebugger: boolean,
    canSetFlags: boolean,
    isEditor: boolean,
    canUseDebugMode: boolean,
    canEditWorld: boolean,
    canBeSnooped: boolean,

    isWizard: boolean,
    isGod: boolean,

    exists: boolean,
    isDead: boolean,
    value: number,
    isAbsent: boolean,
}
const playerFromState = (state: State, playerId: number): Player => ({
    playerId,

    name: state.ublock[playerId].name,
    locationId: state.ublock[playerId].locationId,
    eventId: state.ublock[playerId].eventId,
    strength: state.ublock[playerId].strength,
    visibility: state.ublock[playerId].visibility,
    flags: state.ublock[playerId].flags,
    level: state.ublock[playerId].level,
    weaponId: state.ublock[playerId].weaponId,
    helping: state.ublock[playerId].helping,

    sex: state.ublock[playerId].flags.sex ? 1 : 0,
    canBeExorcised: !state.ublock[playerId].flags.canNotBeExorcised,
    isDebugger: state.ublock[playerId].name === 'Debugger',
    canSetFlags: state.ublock[playerId].flags.canSetFlags,
    isEditor: state.ublock[playerId].flags.isEditor,
    canUseDebugMode: state.ublock[playerId].flags.canUseDebugMode,
    canEditWorld: state.ublock[playerId].flags.canEditWorld,
    canBeSnooped: !state.ublock[playerId].flags.canNotBeSnooped,

    isWizard: state.ublock[playerId].level >= 10,
    isGod: state.ublock[playerId].level >= 10000,

    exists: !!state.ublock[playerId].name.length,
    isDead: state.ublock[playerId].strength < 0,
    value: (playerId < 16)
        ? state.ublock[playerId].level * state.ublock[playerId].level * 100
        : 10 * damof(state, playerId),
    isAbsent: state.ublock[playerId].eventId === -2,
});
export const getPlayer = (state: State, playerId: number): Promise<Player> => Promise.resolve(
    playerFromState(state, playerId)
);
export const getPlayers = (state: State, maxId: number = 0): Promise<Player[]> => Promise.all(
    state.ublock.map((player, playerId) => getPlayer(state, playerId))
)
    .then(players => players.filter(player => ((maxId === 0) || (player.playerId < maxId))));

export const setPlayer = (state: State, playerId: number, newPlayer: { [key: string]: any }): Promise<void> => new Promise(() => {
    state.ublock[playerId] = {
        ...state.ublock[playerId],
        ...newPlayer,
    };
});

export const getHelper = (state: State) => (player: Player): Promise<Player | undefined> => getPlayers(
    state,
    state.maxu,
)
    .then(players => players.find(
        helper => ((player.locationId !== helper.locationId) && (player.playerId === helper.helping))
    ));
