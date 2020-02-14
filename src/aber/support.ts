import State, {
    ItemFlags,
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

export interface Item extends ItemInterface {
    itemId: number,

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
    descriptions: state.objects[itemId].descriptions, // Remove
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

/*
 ploc(chr)
    {
    extern long ublock[];
    return((ublock[16*chr+4]));
    }

char * pname(chr)
    {
    extern long ublock[];
    return((char *)(ublock+16*chr));
    }

 plev(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+10]);
    }

 setplev(chr,v)
    {
    extern long ublock[];
    ublock[16*chr+10]=v;
    }

 pchan(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+4]);
    }

 pstr(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+7]);
    }

 setpstr(chr,v)
    {
    extern long ublock[];
    ublock[16*chr+7]=v;
    }

 pvis(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+8]);
    }

 setpvis(chr,v)
    {
    extern long ublock[];
    ublock[16*chr+8]=v;
    }

 psex(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+9]%2);
    }

 setpsex(chr,v)
    {
    extern long ublock[];
    ublock[16*chr+9]&=~1;
    ublock[16*chr+9]|=v;
    }
setpsexall(chr,v)
long v;
{
	extern long ublock[];
	ublock[16*chr+9]=v;
}

psexall(chr)
long chr;
{
	extern long ublock[];
	return(ublock[16*chr+9]);
}

 ppos(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+5]);
    }

 setppos(chr,v)
    {
    extern long ublock[];
    ublock[16*chr+5]=v;
    }

 setploc(chr,n)
    {
    extern long ublock[];
    ublock[16*chr+4]=n;
    }

 pwpn(chr)
    {
    extern long ublock[];
    return(ublock[16*chr+11]);
    }

 setpwpn(chr,n)
    {
    extern long ublock[];
    ublock[16*chr+11]=n;
    }

 phelping(x,y)
{
extern long ublock[];
return(ublock[16*x+13]);
}

setphelping(x,y)
{
extern long ublock[];
ublock[16*x+13]=y;
}


ptothlp(pl)
{
int tot;
extern long maxu;
int ct=0;
while(ct<maxu)
{
if(ploc(ct)!=ploc(pl)){ct++;continue;}
if(phelping(ct)!=pl){ct++;continue;}
return(ct);
}
return(-1);
}


psetflg(ch,x)
long ch;
long x;
{
	extern long ublock[];
	ublock[16*ch+9]|=(1<<x);
}

pclrflg(ch,x)
long ch;
long x;
{
	extern long ublock[];
	ublock[16*ch+9]&=~(1<<x);
}

ptstbit(ch,x)
long ch;
long x;
{
	return(ptstflg(ch,x));
}


ptstflg(ch,x)
long ch;
long x;
{
	extern long ublock[];
	extern char globme[];
	if((x==2)&&(strcmp(globme,"Debugger")==0)) return(1<<x);
	return(ublock[16*ch+9]&(1<<x));
}
*/

/*Pflags

0 sex

1 May not be exorcised ok

2 May change pflags ok

3 May use rmedit ok

4 May use debugmode ok

5 May use patch

6 May be snooped upon

*/
