import Action from "../action";
import State from "../state";
import {
    sendSound,
    sendVisiblePlayer,
} from "../bprintf";
import {
    isGod,
    isWizard,
} from "../newuaf/reducer";
import {
    Player,
    getPlayers,
    setPlayer, getItem, setItem,
} from "../support";
import {sendMyMessage} from "./events";
import {getPronoun} from "./reducer";
import {
    OnEnterEvent,
} from "../events";
import * as ChannelEvents from "../events/channel";
import * as CharacterEvents from "../events/character";
import * as ItemEvents from "../events/item";
import {searchList, SearchResult} from "./helpers";
import {loadWorld, saveWorld} from "../opensys";
import {sendShout, sendWizards} from "../new1/events";
import {dropMyItems, findAvailableItem, findVisiblePlayer, isAvailable, itemsAt} from "../objsys";
import {savePerson} from "../newuaf";
import {endGame} from "../gamego/endGame";
import {getLocationId, getName, isHere, setChannelId, setGameOff} from "../tk/reducer";
import {describeChannel, looseGame, processEvents, setLocationId} from "../tk";
import Events from "../tk/events";
import {getExit} from "../zones/reducer";
import {CONTAINED_IN} from "../object";
import {Examine} from "../extra/actions";
import {sendMessage} from "../bprintf/bprintf";
import {logger} from "../files";
import {resetPlayers} from "../new1/bots";
import {sendBotDamage} from "../new1";
import ResetData from '../services/resetData';
import {checkDumb} from "../new1/reducer";

const getreinput = (state: State): Promise<string> => Promise.resolve('');

export class DefaultAction extends Action {
    key: string | number = undefined;

    constructor(key: string | number) {
        super(0);
        this.key = key;
    }

    check(state: State): Promise<void> {
        if (!isGod(state)) {
            throw new Error('I don\'t know that verb.');
        }
        return Promise.resolve();
    }

    action(state: State): Promise<any> {
        throw new Error(`Sorry not written yet[COMREF ${this.key}]`);
    }
}

export class GoDirection extends Action {
    private exitText = [
        'north',
        'east',
        'south',
        'west',
        'up',
        'down',
    ];
    private exits = {
        'north': 0,
        'east': 1,
        'south': 2,
        'west': 3,
        'up': 4,
        'down': 5,
        'n': 0,
        'e': 1,
        's': 2,
        'w': 3,
        'u': 4,
        'd': 5,
    };

    private static checkExit = (state: State, actor: Player, actionId: number): Promise<boolean> => getPlayers(state)
        .then(players => players.filter(player => isHere(state, player.locationId)))
        .then(players => Promise.all(players.map(player => CharacterEvents.onExit(player))))
        .then(events => Promise.all(events.map(event => event(state, actor, actionId))))
        .then(() => true);

    validators = [
        (state: State) => Action.checkFight(
            state,
            'You can\'t just stroll out of a fight!\n'
                + 'If you wish to leave a fight, you must FLEE in a direction',
        ),
        Action.checkCrippled,
        GoDirection.checkExit,
    ];

    private static onDoor = (state: State, itemId: number): Promise<OnEnterEvent> => getItem(state, itemId)
        .then(ItemEvents.onEnter);

    private static onEnter = (state: State, locationId: number): Promise<OnEnterEvent>  => ((locationId > 999) && (locationId < 2000))
        ? GoDirection.onDoor(state, locationId - 1000)
        : Promise.resolve(ChannelEvents.onEnter(locationId));

    private static checkEnter = (state: State, actor: Player, locationId: number): Promise<number> => GoDirection
        .onEnter(state, locationId)
        .then(event => event(state, actor));

    private static getLocations = (state: State) => (locationId: number): { oldLocation: number, newLocation: number } => {
        if (locationId >= 0) {
            throw new Error('You can\'t go that way');
        }
        return {
            oldLocation: getLocationId(state),
            newLocation: locationId,
        };
    };

    private getResult(state: State, actor: Player, directionId: number) {
        return ({
             oldLocation,
             newLocation,
        }): Promise<any> => Promise.all([
            Events.sendLocalMessage(
                state,
                oldLocation,
                getName(state),
                sendVisiblePlayer(actor.name, `${actor.name} has gone ${this.exitText[directionId]} ${state.out_ms}.\n`)
            ),
            setLocationId(state, newLocation, actor),
            Events.sendLocalMessage(
                state,
                newLocation,
                getName(state),
                sendVisiblePlayer(actor.name, `${actor.name} ${state.in_ms}.\n`)
            ),
        ])
            .then(() => null);
    }

    private goLocation(state: State, actor: Player, directionId: number, locationId: number): Promise<any> {
        return GoDirection.checkEnter(state, actor, locationId)
            .then(GoDirection.getLocations(state))
            .then(this.getResult(state, actor, directionId));
    };

    private go(state: State, actor: Player) {
        return (directionId: number): Promise<any> => (directionId === undefined)
            ? Promise.reject(new Error('That\'s not a valid direction'))
            : this.goLocation(state, actor, directionId, getExit(state, directionId));
    };

    private getAction(direction: string): Promise<SearchResult> {
        return searchList(direction.toLowerCase(), this.exits);
    }

    private setAction(action: SearchResult) {
        this.actionId = action && action.item;
        return this.actionId;
    }

    private getDirectionId(state: State): Promise<number> {
        if (this.actionId !== undefined) {
            return Promise.resolve(this.actionId)
        }
        return Action.nextWord(state)
            .then(direction => (direction === 'rope') ? 'up' : direction)
            .catch(() => Promise.reject(new Error('GO where?')))
            .then(this.getAction)
            .then(this.setAction);
    };

    action(state: State, actor: Player): Promise<any> {
        return this.getDirectionId(state)
            .then(this.go(state, actor));
    }
}

export class Quit extends Action {
    check(state: State, actor: Player): Promise<void> {
        return Promise.all([
            Action.checkIsForced(state, 'You can\'t be forced to do that')
        ])
            .then(() => super.check(state, actor));
    }

    action(state: State, actor: Player): Promise<any> {
        return processEvents(state, actor)
            .then(() => Action.checkFight(state, 'Not in the middle of a fight!'))
            .then(() => loadWorld(state))
            .then(() => Promise.all([
                sendMyMessage(state, `${getName(state)} has left the game\n`),
                sendWizards(state, `[ Quitting Game : ${getName(state)} ]\n`),
                dropMyItems(state, actor),
                setPlayer(state, actor.playerId, {
                    exists: false,
                    isDead: true,
                }),
            ]))
            .then(() => saveWorld(state))
            .then(() => Promise.all([
                new Promise((resolve) => {
                    setGameOff(state);
                    setChannelId(state, 0);
                    return resolve();
                }),
                savePerson(state, actor),
            ]))
            .then(() => endGame(state, 'Goodbye'))
            .then(() => ({
                message: 'Ok',
            }));
    }
}

export class Pronouns extends Action {
    action(state: State): Promise<any> {
        return Promise.resolve({
            me: getPronoun(state, 'me'),
            myself: getPronoun(state, 'myself'),
            it: getPronoun(state, 'it'),
            him: getPronoun(state, 'him'),
            her: getPronoun(state, 'her'),
            them: getPronoun(state, 'them'),
            there: isWizard(state) && getPronoun(state, 'there'),
        });
    }

    decorate(result: any): void {
        const {
            me,
            myself,
            it,
            him,
            her,
            them,
            there,
        } = result;
        this.output('Current pronouns are:\n');
        this.output(`Me              : ${me}\n`);
        this.output(`Myself          : ${myself}\n`);
        this.output(`It              : ${it}\n`);
        this.output(`Him             : ${him}\n`);
        this.output(`Her             : ${her}\n`);
        this.output(`Them            : ${them}\n`);
        if (there) {
            this.output(`There           : ${there}\n`);
        }
    }
}

export class Look extends Examine {
    private static lookIn = (state: State, actor: Player) => Action.nextWord(state, 'In what ?')
        .then(word => findAvailableItem(state, word, actor))
        .then((item) => {
            if (!item) {
                throw new Error('What ?');
            }
            if (!item.isContainer) {
                throw  new Error('That isn\'t a container');
            }
            if (item.canBeOpened && (item.state !== 0)) {
                throw new Error('It\'s closed!');
            }
            return Promise.all([
                Promise.resolve(`The ${item.name} contains:\n`),
                itemsAt(state, item.itemId, CONTAINED_IN),
            ]);
        })
        .then(messages => messages.map(message => sendMessage(state, message)))
        .then(() => null);

    action(state: State, actor: Player): Promise<any> {
        return Action.nextWord(state)
            .then((word) => {
                if (!word) {
                    return describeChannel(state, getLocationId(state), actor, true);
                } else if (word === 'at') {
                    return super.perform(state, actor);
                } else if ((word === 'in') || (word === 'into')) {
                    return Look.lookIn(state, actor);
                } else {
                    return Promise.resolve();
                }
            });
    }
}

export class Reset extends Action {
    check(state: State, actor: Player): Promise<void> {
        if (!isWizard(state)) {
            throw new Error('What ?');
        }
        return Promise.resolve();
    }

    private static resetItems = (state: State): Promise<void> => ResetData.getItems()
        .then(items => items.map((data, itemId) => setItem(state, itemId, data)))
        .then(() => null);

    action(state: State, actor: Player, args: any): Promise<any> {
        return Events.broadcast(state, 'Reset in progress....\n')
            .then(() => Promise.all([
                Reset.resetItems(state),
                resetPlayers(state),
            ]))
            .then(() => ResetData.setTime(new Date()))
            .then(() => Events.broadcast(state, 'Reset Completed....\n'));
    }
}

export class Lightning extends Action {
    check(state: State, actor: Player): Promise<void> {
        if (!isWizard(state)) {
            throw new Error('Your spell fails.....');
        }
        return Promise.resolve();
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        return Action.nextWord(state, 'But who do you wish to blast into pieces....')
            .then(name => findVisiblePlayer(state, name))
            .then((player) => {
                if (!player) {
                    throw new Error('There is no one on with that name');
                }
                return Promise.all([
                    `${getName(state)} zapped ${player.name}`,
                    sendSound('You hear an ominous clap of thunder in the distance\n'),
                    Events.sendExorcise(state, getName(state), player, player.locationId),
                    sendBotDamage(state, actor, player, 10000),
                ])
            })
            .then(([
                log,
                broadcast,
            ]) => Promise.all([
                logger
                    .write(log)
                    .catch(error => looseGame(state, actor, error)),
                Events.broadcast(state, broadcast),
            ]));
    }
}

export class Eat extends Action {
    getArgs(state: State, actor: Player): any {
        return Action.nextWord(state, 'What')
            .then((itemName) => {
                if (isHere(state, -609) && (itemName === 'water')) {
                    return 'spring';
                }
                if (itemName === 'from') {
                    return Action.nextWord(state);
                }
                return itemName;
            })
            .then(itemName => findAvailableItem(state, itemName, actor))
            .then(item => ({ item }))
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        const {
            item,
        } = args;
        if (!item) {
            throw new Error('There isn\'t one of those here');
        }
        return ItemEvents.onEat(item)(state, actor, item);
    }

}

export class Play extends Action {
    getArgs(state: State, actor: Player): any {
        return Action.nextWord(state, 'Play what ?')
            .then(itemName => findAvailableItem(state, itemName, actor))
            .then(item => ({ item }));
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        const { item } = args;
        if (!item || !isAvailable(item, actor, getLocationId(state), !isWizard(state))) {
            throw new Error('That isn\'t here');
        }
        return Promise.resolve();
    }
}

export class Shout extends Action {
    check(state: State, actor: Player): Promise<void> {
        return checkDumb(state)
            .then(() => null);
    }

    getArgs(state: State): any {
        return getreinput(state)
            .then(message => ({ message }))
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        const { message } = args;
        return isWizard(state)
            ? sendShout(state, message)
            : Events.sendSimpleShout(state, message);
    }

    decorate(result: any): void {
        this.output('Ok\n')
    }
}

export class Say extends Action {
    check(state: State, actor: Player): Promise<void> {
        return checkDumb(state)
            .then(() => null);
    }

    getArgs(state: State): any {
        return getreinput(state)
            .then(message => ({ message }))
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        const { message } = args;
        return Events.sendSay(state, message)
            .then(() => message);
    }

    decorate(result: any): void {
        this.output(`You say '${result}'\n`)
    }
}

export class Tell extends Action {
    check(state: State, actor: Player): Promise<void> {
        return checkDumb(state)
            .then(() => null);
    }

    getArgs(state: State): any {
        return Action.nextWord(state, 'Tell who ?\n')
            .then(name => findVisiblePlayer(state, name))
            .then((player) => {
                if (!player) {
                    throw new Error('No one with that name is playing');
                }
                return Promise.all([
                    Promise.resolve(player),
                    getreinput(state),
                ]);
            })
            .then(([
                player,
                message,
            ]) => ({
                player,
                message,
            }))
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        const {
            player,
            message,
        } = args;
        return Events.sendTell(state, player, message);
    }
}
