import Action from "../action";
import State from "../state";
import {
    Item,
    Player,
    getPlayers,
    holdItem,
    putItem, getPlayer, getItems,
} from "../support";
import {getDragon} from "../mobile";
import {sendPlayerForVisible, sendVisibleName} from "../bprintf";
import {getLevel, isWizard} from "../newuaf/reducer";
import {HELD_BY} from "../object";
import {
    findAvailableItem,
    findCarriedItem,
    findContainedItem,
    findHereItem, isCarriedBy,
    itemsAt,
} from "./index";
import {sendMessage} from "../bprintf/bprintf";
import {sendMyMessage} from "../parse/events";
import * as ChannelEvents from "../events/channel";
import * as ItemEvents from "../events/item";
import {getLocationId, getName} from "../tk/reducer";

export const canCarry = (state: State, player: Player): Promise<boolean> => {
    if (player.isWizard) {
        return Promise.resolve(true);
    }
    if (player.level < 0) {
        return Promise.resolve(true);
    }
    return getItems(state)
        .then(items => items.reduce((count, item)  => {
            if (isCarriedBy(item, player, false)) {
                return count + 1;
            } else {
                return count;
            }
        }, 0))
        .then(count => (count < player.level + 5));
};

const itemsCarriedBy = (state: State, player: Player): Promise<void> => itemsAt(state, player.playerId, HELD_BY)
    .then((result) => sendMessage(state, result));

interface ItemRequest {
    state: State,
    actor: Player,
    item?: string,
    container?: string,
}

export class GetItem extends Action {
    getArgs = (state: State, actor: Player): Promise<ItemRequest> => {
        const getItemName = Action.nextWord(state, 'Get what?');
        const getFrom = (itemName: string) => Promise.all([
            Promise.resolve(itemName),
            Action.nextWord(state),
        ]);
        const getContainerName = ([
            itemName,
            containerName,
        ]) => {
            /* Hold */
            if (!containerName) {
                return [
                    itemName,
                ];
            } else if ((containerName !== 'from') && (containerName !== 'out')) {
                return [
                    itemName,
                ];
            } else {
                return Promise.all([
                    Promise.resolve(itemName),
                    Action.nextWord(state, 'From what ?'),
                ])
            }
        };
        const getRequest = ([
            item,
            container,
        ]) => ({
            state,
            actor,
            item,
            container,
        });
        return getItemName
            .then(getFrom)
            .then(getContainerName)
            .then(getRequest);
    };

    private static getItem = (request: ItemRequest) => {
        const {
            actor,
            item,
            container,
            state,
        } = request;

        const getFromContainer = (container?: Item) => container
            ? findContainedItem(state, item, container)
            : Promise.reject(new Error('You can\'t take things from that - it\'s not here'));

        return container
            ? findAvailableItem(state, container, actor)
                .then(getFromContainer)
            : findHereItem(state, item);
    };

    private static checkGet = (state: State, actor: Player) => (item: Item): Promise<Item> => {
        const checkDragon = (): Promise<boolean> => getDragon(state)
            .then(dragon => !dragon || Promise.reject());
        const checkCarry = (): Promise<boolean> => canCarry(state, actor)
            .then(result => result || Promise.reject(new Error('You can\'t carry any more')));
        const checkAll = (item: Item): Promise<Item> => Promise.all([
            checkDragon(),
            checkCarry(),
        ])
            .then(() => item);

        if (!item) {
            return Promise.reject(new Error('That is not here.'));
        }

        return ItemEvents.onGet(item)(state, actor, item)
            .then(checkAll);
    };

    private static onAfterGet = (item: Item, channelId: number) => ([
        ItemEvents.onAfterGet(item),
        ChannelEvents.onAfterGet(channelId),
    ]);

    private static take = (state: State, actor: Player) => (item: Item): Promise<any> => Promise.all([
        holdItem(state, item.itemId, actor.playerId),
        sendMyMessage(state, `${sendPlayerForVisible(getName(state))}${sendVisibleName(` takes the ${item.name}\n`)}`),
        Promise.all(GetItem.onAfterGet(item, getLocationId(state)).map(event => event(state, actor, item))),
    ])
       .then(() => ({}));

    action(state: State, actor: Player, args: ItemRequest): Promise<any> {
        return GetItem.getItem(args)
            .then(GetItem.checkGet(args.state, actor))
            .then(GetItem.take(args.state, actor));
    }

    decorate(result: any): void {
        this.output('Ok...\n');
    }
}

export class DropItem extends Action {
    getArgs(state: State, actor: Player): Promise<ItemRequest> {
        return Action.nextWord(state, 'Drop what ?')
            .then(item => ({
                state,
                actor,
                item,
            }));
    }

    private static getItem = (request: ItemRequest, actor: Player): Promise<Item> => {
        const {
            state,
            item,
        } = request;
        return findCarriedItem(state, item, actor)
    };

    private static checkItem = (state: State, actor: Player) => (item: Item): Promise<Item> => {
        if (!item) {
            return Promise.reject(new Error('You are not carrying that.'));
        }
        return ItemEvents.onDrop(item)(state, actor, item)
            .then(() => item);
    };

    private static drop = (state: State, actor: Player) => (item: Item): Promise<any> => Promise.all([
        putItem(state, item.itemId, getLocationId(state)),
        sendMyMessage(state, `${sendPlayerForVisible(getName(state))}${sendVisibleName(` drops the ${item.name}\n`)}`),
        ChannelEvents.onDrop(getLocationId(state))(state, actor, item),
    ])
        .then(() => ({}));

    action(state: State, actor: Player, request: ItemRequest): Promise<any> {
        return DropItem.getItem(request, actor)
            .then(DropItem.checkItem(request.state, actor))
            .then(DropItem.drop(request.state, actor));
    }

    decorate(result: any): void {
        this.output('OK..\n');
    }
}

export class Inventory extends Action {
    action(state: State, actor: Player): Promise<any> {
        return itemsCarriedBy(state, actor);
    }

    decorate(result: any): void {
        this.output( 'You are carrying\n');
        this.output(result);
    }
}

export class Who extends Action {
    describePlayer(state: State, player: Player): string {
        if (player.isDead) {
            /* On  Non game mode */
            return;
        }
        if (player.visibility > getLevel(state)) {
            return;
        }
        let result = `${player.name}${player.title}`;
        if (player.visibility) {
            result = `(${result})`;
        }
        return `${result}${player.isAbsent ? ' [Absent From Reality]' : ''}`;
    }

    action(state: State): Promise<any> {
        const maxPlayerId = isWizard(state) ? 0 : state.maxu;
        const players = [];
        const mobiles = [];
        return getPlayers(state, maxPlayerId)
            .then(p => p.filter(player => player.exists))
            .then(p => p.forEach((player) => {
                const description = this.describePlayer(state, player);
                if (!description) {
                    return;
                }
                if (player.playerId < state.maxu) {
                    players.push(description);
                } else {
                    mobiles.push(description);
                }
            }))
            .then(() => ({
                players,
                mobiles,
            }));
    }

    decorate(result: any): void {
        const {
            players,
            mobiles
        } = result;
        if (players.length) {
            this.output('Players\n');
            players.forEach(player => this.output(player))
        }
        if (mobiles.length) {
            if (players.length) {
                this.output('----------\n');
            }
            this.output('Mobiles\n');
            mobiles.forEach(player => this.output(player))
        }
        this.output('\n');
    }
}

class UserCom extends Who {
    getLevel(state: State): number {
        return 0;
    }
}
