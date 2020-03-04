import {getItem, getItems, getPlayer, getPlayers, Item, Player, putItem} from "../support";
import State from "../state";
import {isWizard} from "../newuaf/reducer";
import {CONTAINED_IN, HELD_BY} from "../object";
import {isWornBy} from "../new1";
import {canSeePlayer} from "../bprintf/player";
import {sendMessage} from "../bprintf/bprintf";
import {getDebugMode, setHer, setHim, setIt, setName} from "../parse/reducer";
import Action from "../action";

const showwthr = (state: State): boolean => false;

export const RUNE_SWORD_ID = 32;
export const SHIELD_BASE_ID = 112;
export const SHIELD_IDS = [113, 114];

const seePlayerName = (state: State, player: Player): boolean => {
    const canSee = canSeePlayer(state, player);
    if (canSee) {
        setName(state, player);
    }
    return canSee;
};

// Item checkers

export const isCarriedBy = (item: Item, owner: Player, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.wearingBy === undefined && item.heldBy === undefined) {
        return false
    }
    return item.locationId === owner.playerId;
};

export const isContainedIn = (item: Item, container: Item, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.containedIn === undefined) {
        return false;
    }
    return item.locationId === container.itemId;
};

export const isLocatedIn = (item: Item, locationId: number, destroyed: boolean = false): boolean => {
    if (destroyed && item.isDestroyed) {
        return false;
    }
    if (item.locatedIn === undefined) {
        return false
    }
    return item.locationId === locationId;
};

export const isAvailable = (item: Item, player: Player, locationId: number, destroyed: boolean = false): boolean => {
    if (isLocatedIn(item, locationId, destroyed)) {
        return true;
    }
    return isCarriedBy(item, player, destroyed);
};

// Item finder

export const byMask = (state: State, mask: { [flagId: number]: boolean }): Promise<boolean> => Promise.all([
    getPlayer(state, state.mynum),
    getItems(state),
])
    .then(([player, items]) => items.some((item) => isAvailable(item, player, state.curch, !isWizard(state))
        && Object.keys(mask).every((key) => item.flags[key] === mask[key])
    ));

export const itemsAt = (state: State, locationId: number, mode: number): Promise<string> => {
    const getLocation = (): Promise<Item | Player | undefined> => {
        if (mode === HELD_BY) {
            return getPlayer(state, locationId);
        } else if (mode === CONTAINED_IN) {
            return getItem(state, locationId);
        } else {
            return undefined;
        }
    };

    const getItemsAt = (state: State, location: Item | Player, mode: number): Promise<Item[]> => getItems(state)
        .then(items => items.filter((item) => {
            /* Carried Loc ! */
            if (mode === HELD_BY) {
                return !!isCarriedBy(item, location as Player, !isWizard(state));
            } else if (mode === CONTAINED_IN) {
                return !!isContainedIn(item, location as Item, !isWizard(state));
            } else {
                return false;
            }
        }));

    const getItemMessage = (owner?: Item | Player) => (item: Item) => {
        let message = [
            item.name,
            getDebugMode(state) ? item.itemId : '',
            isWornBy(state, item, owner as Player) ? ' <worn>' : '',
        ].join('');
        return  item.isDestroyed
            ? ` (${message})`
            : ` ${message}`;
    };
    const decorate = (messages: string[]) => {
        if (!messages.length) {
            return 'Nothing\n';
        }

        const result = [];
        let row = '';
        messages.forEach((message) => {
            if ((row.length + message.length + 1) > 79) {
                result.push(row);
                row = '';
            }
            row += message;
        });
        result.push('');
        return result.join('\n');
    };

    return getLocation()
        .then(location => getItemsAt(state, location, mode)
            .then(items => items.map(getItemMessage(location))))
        .then(decorate);
};

// Search item

const baseFindItem = (state: State, name: string): Promise<Item> => {
    const byName = (name: string): Promise<Item> => {
        if (name === 'red') {
            return Action.nextWord(state)
                .then(() => getItem(state, 4));
        } else if (name === 'blue') {
            return Action.nextWord(state)
                .then(() => getItem(state, 5));
        } else if (name === 'green') {
            return Action.nextWord(state)
                .then(() => getItem(state, 6));
        }
        return getItems(state)
           .then(items => items.find(item => item.name.toLowerCase() === name));
    };

    return byName(name)
        .then((item) => {
             if (item) {
                 setIt(state, name);
             }
             return item;
        });
};

export const findAvailableItem = (state: State, name: string): Promise<Item> => Promise.all([
        getPlayer(state, state.mynum),
        baseFindItem(state, name.toLowerCase()),
    ])
    .then(([
        player,
        item,
    ]) => {
        if (item.itemId !== SHIELD_BASE_ID) {
            return isAvailable(item, player, state.curch, !isWizard(state)) && item;
        }
        return Promise.all(SHIELD_IDS.map(shieldId => getItem(state, shieldId)))
            .then(shields => shields.find(
                shield => isCarriedBy(shield, player, !isWizard(state))
            ));
    });

export const findCarriedItem = (state: State, name: string, player: Player): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then(item => isCarriedBy(item, player, !isWizard(state)) && item);

export const findHereItem = (state: State, name: string): Promise<Item> => baseFindItem(state, name.toLowerCase())
    .then(item => isLocatedIn(item, state.curch, !isWizard(state)) && item);

export const findContainedItem = (state: State, name: string, container: Item): Promise<Item> => (container
    ? baseFindItem(state, name.toLowerCase())
        .then(item => isContainedIn(item, container, !isWizard(state)) && item)
    : Promise.reject(new Error()));

export const findItem = (state: State, name: string): Promise<Item> => findAvailableItem(state, name)
    .then((item) => item || baseFindItem(state, name.toLowerCase()));

//

export const itemDescription = (item: Item, debugMode: boolean): string => {
    const itemId = debugMode ? `{${item.itemId}} ` : '';
    return `${itemId}${item.description}`;
};

const listItems = (state: State, items: Item[]): string[] => items.map((item) => {
    /*OLONGT NOTE TO BE ADDED */
    setIt(state, item.name);
    return `${item.isDestroyed ? '--' : ''}${itemDescription(item, getDebugMode(state))}`;
});

export const showItems = (state: State): Promise<void> => getItems(state)
    .then(items => items.filter((item) => {
        if (!isLocatedIn(item, state.curch, !isWizard(state))) {
            return false;
        }
        if (item.state > 3) {
            return false;
        }
        return !!item.description;
    }))
    .then((items) => Promise.all(listItems(state, items.filter(item => item.flannel))
        .map(message => sendMessage(state, `${message}\n`)))
        .then(() => showwthr(state))
        .then(() => Promise.all(listItems(state, items.filter(item => !item.flannel))
            .map(message => sendMessage(state, `${message}\n`))))
    )
    .then(() => {});

export const dropItems = (state: State, player: Player, locationId?: number): Promise<void> => getItems(state)
    .then(items => items.filter(item => isCarriedBy(item, player, !isWizard(state))))
    .then(items => Promise.all(items.map(item => putItem(state, item.itemId, (locationId === undefined) ? player.locationId : locationId))))
    .then(() => {});

export const dropMyItems = (state: State) => getPlayer(state, state.mynum)
    .then(player => dropItems(state, player, state.curch));

// Player finders

export const findPlayer = (state: State, name: string): Promise<Player> => getPlayers(state)
    .then((players) => {
        const n1 = name.toLowerCase();
        return players.find((player) => {
            const n2 = player.name.toLowerCase();
            if (player.exists && (n1 === n2)) {
                return true;
            }
            if (n2.substr(0, 4) === 'the ') {
                if (player.exists && (n1 === n2.substr(4))) {
                    return true;
                }
            }
            return false;
        });
    });

export const findVisiblePlayer = (state: State, name: string): Promise<Player> => findPlayer(state, name)
    .then((player) => (
        player && seePlayerName(state, player)
        ?  player
        : undefined
    ));

export const listPeople = (state: State): Promise<string[]> => getPlayers(state)
    .then(players => players.filter((player) => {
        if (player.playerId === state.mynum) {
            return false;
        }
        if (!player.exists) {
            return false;
        }
        if (player.locationId !== state.curch) {
            return false;
        }
        return canSeePlayer(state, player);
    }))
    .then(players => players.map((player) => itemsAt(state, player.playerId, HELD_BY)
        .then((items) => {
            setName(state, player);
            if (player.sex) {
                setHer(state, player.name);
            } else {
                setHim(state, player.name);
            }
            const playerId = getDebugMode(state) ? `{${player.playerId}}` : '';
            return `${player.name} ${playerId}${player.title} is here carrying\n${items}`;
        })
    ))
    .then(promises => Promise.all(promises));
