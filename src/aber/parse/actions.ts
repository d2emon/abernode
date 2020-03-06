import Action from "../action";
import State from "../state";
import {
    sendVisiblePlayer,
} from "../bprintf";
import {
    isGod,
    isWizard,
} from "../newuaf/reducer";
import {
    Player,
    getPlayers,
    setPlayer, getItem,
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
import {sendWizards} from "../new1/events";
import {dropMyItems} from "../objsys";
import {savePerson} from "../newuaf";
import {endGame} from "../gamego/endGame";
import {getLocationId, getName, isHere, setChannelId, setGameOff} from "../tk/reducer";
import {processEvents, setLocationId} from "../tk";
import Events from "../tk/events";

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
            : this.goLocation(state, actor, directionId, state.ex_dat[directionId]);
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
        return processEvents(state)
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
