import State from "../state";
import {isGod, isWizard} from "../newuaf/reducer";
import {modifyWeather} from "./index";
import Action from "../action";
import {checkDumb} from "../new1/reducer";
import {sendSocialEvent} from "./events";
import {createVisibleMessage, sendBaseMessage} from "../bprintf";
import {setFarted} from "./reducer";
import {roll} from "../magic";
import Events, {AUDIBLE_MESSAGE, PLAYER_MESSAGE} from "../tk/events";
import {Item, Player, setItem, setPlayer} from "../support";
import {findAvailableItem, findVisiblePlayer} from "../objsys";
import {sendMessage} from "../bprintf/bprintf";

const getreinput = (state: State): string => '';

const setWeather = (state: State, weatherId: number): Promise<void> => isWizard(state)
    ? modifyWeather(state, weatherId)
    : Promise.reject(new Error('What ?'));

export class Sun extends Action {
    action(state: State): Promise<any> {
        return setWeather(state, 0);
    }
}

export class Rain extends Action {
    action(state: State): Promise<any> {
        return setWeather(state, 1);
    }
}

export class Storm extends Action {
    action(state: State): Promise<any> {
        return setWeather(state, 2);
    }
}

export class Snow extends Action {
    action(state: State): Promise<any> {
        return setWeather(state, 3);
    }
}

export class Blizzard extends Action {
    action(state: State): Promise<any> {
        return setWeather(state, 4);
    }
}

// Silly Section

export class Laugh extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] falls over laughing\n', AUDIBLE_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('You start to laugh\n');
    }
}

export class Purr extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] starts purring\n', AUDIBLE_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('MMMMEMEEEEEEEOOOOOOOWWWWWWW!!\n');
    }
}

export class Cry extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] bursts into tears\n', PLAYER_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('You burst into tears\n');
    }
}

export class Sulk extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] sulks\n', PLAYER_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('You sulk....\n');
    }
}

export class Burp extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] burps loudly\n', AUDIBLE_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('You burp rudely\n');
    }
}

export class Hiccup extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] hiccups\n', AUDIBLE_MESSAGE));
    }

    decorate(result: any): void {
        return this.output('You hiccup\n');
    }
}

export class Fart extends Action {
    action(state: State): Promise<any> {
        setFarted(state);
        return Events.sendSocialEvent(state, '[author] lets off a real rip roarer\n', AUDIBLE_MESSAGE);
    }

    decorate(result: any): void {
        return this.output('Fine...\n');
    }
}

export class Grin extends Action {
    action(state: State): Promise<any> {
        return Events.sendSocialEvent(state, '[author] grins evilly\n', PLAYER_MESSAGE);
    }

    decorate(result: any): void {
        this.output('You grin evilly\n');
    }
}

export class Smile extends Action {
    action(state: State): Promise<any> {
        return Events.sendSocialEvent(state, '[author] smiles happily\n', PLAYER_MESSAGE);
    }

    decorate(result: any): void {
        this.output('You smile happily\n');
    }
}

export class Wink extends Action {
    action(state: State): Promise<any> {
        /* At person later maybe ? */
        return Events.sendSocialEvent(state, '[author] winks suggestively\n', PLAYER_MESSAGE);
    }

    decorate(result: any): void {
        this.output('You wink\n');
    }
}

export class Snigger extends Action {
    action(state: State): Promise<any> {
        return checkDumb(state)
            .then(() => Events.sendSocialEvent(state, '[author] sniggers\n', PLAYER_MESSAGE));
    }

    decorate(result: any): void {
        this.output('You snigger\n');
    }
}

export class Pose extends Action {
    check(state: State): Promise<void> {
        if (!isWizard(state)) {
            throw new Error('You are just not up to this yet');
        }
        return Promise.resolve();
    }

    private static pose = (state: State, poseId: number): Promise<void> => {
        if (poseId === 1) {
            return Promise.all([
                Events.sendSocialEvent(state, '[author] throws out one arm and sends a huge bolt of fire high\ninto the sky\n', PLAYER_MESSAGE),
                Events.broadcast(state, createVisibleMessage('A massive ball of fire explodes high up in the sky\n')),
            ])
                .then(() => null);
            } else if (poseId === 2) {
                return Events.sendSocialEvent(state, '[author] turns casually into a hamster before resuming normal shape\n', PLAYER_MESSAGE);
            } else if (poseId === 3) {
                return Events.sendSocialEvent(state, '[author] starts sizzling with magical energy\n', PLAYER_MESSAGE);
            } else if (poseId === 4) {
                return Events.sendSocialEvent(state, '[author] begins to crackle with magical fire\n', PLAYER_MESSAGE);
            } else {
                return Promise.resolve();
            }
    };

    action(state: State): Promise<any> {
        return roll()
            .then(poseRoll => poseRoll % 5)
            .then(poseId => Pose.pose(state, poseId)
                .then(() => ({ poseId }))
            );
    }

    decorate(result: any): void {
        const { poseId } = result;
        this.output(`POSE :${poseId}\n`);
    }
}

export class Emote extends Action {
    /* (C) Jim Finnis */
    check(state: State): Promise<void> {
        if (!isGod(state)) {
            throw new Error('Your emotions are strictly limited!');
        }
        return Promise.resolve();
    }

    action(state: State): Promise<any> {
        return sendSocialEvent(state, `[author] ${getreinput(state)}\n`, AUDIBLE_MESSAGE);
    }
}

export class Pray extends Action {
    action(state: State): Promise<any> {
        return sendSocialEvent(state, '[author] falls down and grovels in the dirt\n', PLAYER_MESSAGE);
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Yawn extends Action {
    action(state: State): Promise<any> {
        return sendSocialEvent(state, '[author] yawns\n', AUDIBLE_MESSAGE);
    }
}

export class Groan extends Action {
    action(state: State): Promise<any> {
        return sendSocialEvent(state, '[author] groans loudly\n', AUDIBLE_MESSAGE);
    }

    decorate(result: any): void {
        this.output('You groan\n');
    }
}

export class Moan extends Action {
    action(state: State): Promise<any> {
        return sendSocialEvent(state, '[author] starts making moaning noises\n', AUDIBLE_MESSAGE);
    }

    decorate(result: any): void {
        this.output('You start to moan\n');
    }
}

export class SetAction extends Action {
    private static setBit = (state: State, item: Item) => Action.nextWord(state, 'Which bit ?')
        .then((bitId) => Promise.all([
            Promise.resolve(Number(bitId)),
            Action.nextWord(state),
        ]))
        .then(([
            bitId,
            value,
        ]) => {
            if (!value) {
                return sendBaseMessage(state, `The bit is ${item.flags[bitId] ? 'TRUE' : 'FALSE'}\n`);
            }
            const bitValue = Number(value);
            if ((bitValue < 0) || (bitValue > 1) || (bitId < 0) || (bitId > 15)) {
                throw new Error('Number out of range');
            }
            return setItem(state, item.itemId, { flags: { [bitId]: !!bitValue } });
        });

    private static setByte = (state: State, item: Item) => Action.nextWord(state, 'Which byte ?')
        .then((byteId) => Promise.all([
            Promise.resolve(Number(byteId)),
            Action.nextWord(state),
        ]))
        .then(([
            byteId,
            value,
        ]) => {
            if (!value) {
                return sendBaseMessage(state, `Current Value is : ${item.payload[byteId]}\n`);
            }
            const byteValue = Number(value);
            if ((byteValue < 0) || (byteValue > 255) || (byteId < 0) || (byteId > 1)) {
                throw new Error('Number out of range');
            }
            return setItem(state, item.itemId, { payload: { [byteId]: byteValue } });
        });

    private static setState = (state: State, item: Item, value: number) => {
        if (value > item.maxState) {
            throw new Error(`Sorry max state for that is ${item.maxState}`);
        }
        if (value < 0) {
            throw new Error('States start at 0');
        }
        return setItem(state, item.itemId, { state: value });
    };

    private static doSetItem = (state: State, item: Item) => {
        if (!item) {
            throw new Error('Set what ?');
        }
        return Action.nextWord(state, 'Set to what value ?')
            .then((value) => {
                if (value === 'bit') {
                    return SetAction.setBit(state, item);
                } else if (value === 'byte') {
                    return SetAction.setBit(state, item);
                } else {
                    return SetAction.setState(state, item, Number(value));
                }
            });
    };

    private static doSetBot = (state: State, player: Player) => {
        if (!player) {
            throw new Error('Set what ?');
        }
        if (player.playerId < 16) {
            throw new Error('Mobiles only');
        }
        return Action.nextWord(state, 'To what value ?')
            .then(value => Number(value))
            .then(value => setPlayer(state, player.playerId, { strength: value }));
    };

    action(state: State, actor: Player, args: any): Promise<any> {
        return Action.nextWord(state, 'set what')
            .then((word) => {
                if (!isWizard(state)) {
                    throw new Error('Sorry, wizards only');
                }
                return Promise.all([
                    findAvailableItem(state, word, actor),
                    findVisiblePlayer(state, word),
                ]);
            })
            .then(([
                item,
                player,
            ]) => item
                ? SetAction.doSetItem(state, item)
                : SetAction.doSetBot(state, player)
            );
    }
}

export class SetPlayerFlags extends Action {
    check(state: State, actor: Player): Promise<void> {
        if (!actor.isDebugger) {
            throw new Error('You can\'t do that');
        }
        return Promise.resolve();
    }

    action(state: State, actor: Player, args: any): Promise<any> {
        return Action.nextWord(state, 'Whose PFlags ?')
            .then(name => findVisiblePlayer(state, name))
            .then((player) => {
                if (!player) {
                    throw new Error('Who is that ?');
                }
                return Promise.all([
                    Promise.resolve(player),
                    Action.nextWord(state, 'Flag number ?'),
                ]);
            })
            .then(([
                player,
                flagId,
            ]) => Promise.all([
                Promise.resolve(player),
                Promise.resolve(Number(flagId)),
                Action.nextWord(state),
            ]))
            .then(([
                player,
                flagId,
                value,
            ]) => {
                if (!value) {
                    return sendBaseMessage(state, `Value is ${player.flags[flagId] ? 'TRUE' : 'FALSE'}\n`);
                }
                const flagValue = Number(value);
                if ((flagValue < 0) || (flagValue > 1) || (flagId < 0) || (flagId > 31)) {
                    throw new Error('Out of range');
                }
                return setPlayer(state, player.playerId, { flags: {
                    ...player.flags,
                    [flagId]: flagValue !== 0,
                }});
            });
    }
}
