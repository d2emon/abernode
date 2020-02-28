import State from "../state";
import {
    brkword,
    sendsys,
} from "../__dummies";
import {
    findAvailableItem,
    findItem,
    findVisiblePlayer,
    isCarriedBy,
} from "../objsys";
import {
    Item,
    Player,
    getItem,
    getPlayer,
    setPlayer,
    setItem,
    createItem,
    holdItem,
    getItems,
} from "../support";
import {
    sendVisibleName,
    showFile,
} from "../bprintf";
import {
    EXAMINES,
    HELP1,
    HELP2,
    HELP3,
    LEVELS, WIZLIST,
} from "../files";
import {showMessages} from "../bprintf/output";
import Action from "../action";
import {IS_DESTROYED} from "../object";
import {sendVisiblePlayer} from "../bprintf";
import {showLocation} from "./index";
import {endGame} from "../gamego/endGame";
import {checkRoll, roll} from "../magic";
import {teleport} from "../new1";

const fopen = (name: string, permissions: string): Promise<any> => Promise.resolve({});
const fclose = (file: any): Promise<void> => Promise.resolve();
const getstr = (file: any): Promise<string[]> => Promise.resolve([]);

const loseme = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const openworld = (state: State): void => undefined;
const getchar = (state: State): Promise<string> => Promise.resolve('\n');
const showname = (state: State, locationId: number): void => undefined;
const trapch = (state: State, locationId: number): void => undefined;
const roomnum = (state: State, locationId: string, zoneId: string): number => 0;
const getreinput = (state: State): string => '';
const openroom = (state: State, locationId: number, permissions: string): Promise<any> => Promise.resolve({});
const lodex = (state: State, file: any): void => undefined;
const gamecom = (state: State, toPerform: string): void => undefined;

const UMBRELLA_ID = 1;
const CRYSTAL_BALL_ID = 7;
const SCROLL_8_ID = 8;
const LOAF_ID = 83;
const RABBIT_PIE_ID = 84;
const BED_ID = 85;
const AMULET_ID = 90;
const BEDDING_ID = 91;
const ROBE_ID = 101;
const KEY_ID = 107;
const TUBE_ID = 144;
const SCROLL_145_ID = 145;

export class Help extends Action {
    private helpSomeone(state: State) {
        return Promise.all([
            findVisiblePlayer(state, state.wordbuf),
            getPlayer(state, state.mynum),
        ])
            .then(([player, me]) => {
                if (player.playerId === -1) {
                    throw new Error('Help who ?');
                }
                if (player.locationId !== state.curch) {
                    throw new Error('They are not here');
                }
                if (player.playerId === me.playerId) {
                    throw new Error('You can\'t help yourself.');
                }
                if (me.helping !== -1) {
                    sendsys(
                        state,
                        player.name,
                        player.name,
                        -10011,
                        state.curch,
                        `${sendVisibleName(state.globme)} has stopped helping you\n`,
                    );
                    return getPlayer(state, player.helping)
                        .then(helper => this.output(`Stopped helping ${helper.name}\n`));
                } else {
                    sendsys(
                        state,
                        player.name,
                        player.name,
                        -10011,
                        state.curch,
                        `${sendVisibleName(state.globme)} has offered to help you\n`,
                    );
                    return setPlayer(state, me.playerId, {helping: player.playerId})
                        .then(() => this.output('OK...\n'));
                }
            });
    }

    action(state: State): Promise<any> {
        if (brkword(state) !== -1) {
            return this.helpSomeone(state);
        }

        closeworld(state);
        const parts = [showFile(HELP1)];
        if (state.my_lev > 9) {
            parts.push(showFile(HELP2));
        }
        if (state.my_lev > 9999) {
            parts.push(showFile(HELP3));
        }
        return Promise.all([parts.map((text, textId) => new Promise((resolve) => {
            this.output(`${text}\n`);
            if (textId < parts.length - 1) {
                this.output('Hit <Return> For More....\n');
                return showMessages(state)
                    .then(() => getchar(state));
            }
        }))]);
    }
}

export class Levels extends Action {
    action(state: State): Promise<any> {
        closeworld(state);
        return Promise.resolve(showFile(LEVELS));
    }
}

export class Value extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) == -1) {
            throw new Error('Value what ?');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => {
                if (!item) {
                    throw new Error('There isn\'t one of those here.');
                }
                return `${state.wordbuf} : ${item.value} points\n`;
            })
    }
}

export class Stats extends Action {
    private static statItem(state: State, item: Item): Promise<any> {
        if (!item) {
            throw new Error('Whats that ?\n');
        }
        return Promise.resolve()
            .then((): Promise<Item | Player | null> => {
                if (item.containedIn) {
                    return getItem(state, item.containedIn);
                } else if (item.heldBy) {
                    return getPlayer(state, item.heldBy);
                } else {
                    return null;
                }
            })
            .then((result) => ({
                globalState: state,
                item: {
                    name: item.name,
                    container: item.containedIn && result.name,
                    owner: item.heldBy && result.name,
                    locationId: item.locationId,
                    state: item.state,
                    carryFlag: item.carryFlag,
                    spare: item.isDestroyed ? -1 : 0,
                    maxState: item.maxState,
                    baseValue: item.baseValue,
                }
            }));
    };

    private static statPlayer(state: State): Promise<any> {
        return findVisiblePlayer(state, state.wordbuf)
            .then((player) => {
                if (!player) {
                    throw new Error('Whats that ?\n');
                }
                return {
                    globalState: state,
                    player: {
                        name: player.name,
                        level: player.level,
                        strength: player.strength,
                        sex: player.sex ? 'MALE' : 'FEMALE',
                        locationId: player.locationId,
                    }
                };
            });
    }

    action(state: State): Promise<any> {
        if (brkword(state) == -1) {
            throw new Error('STATS what ?');
        }
        if (state.my_lev < 10) {
            throw new Error('Sorry, this is a wizard command buster...');
        }
        return findItem(state, state.wordbuf)
            .then((item: Item) => (item ? Stats.statItem(state, item) : Stats.statPlayer(state)));
    }

    decorate(result: any): void {
        const {
            globalState,
            item,
            player,
        } = result;
        if (item) {
            const {
                name,
                container,
                owner,
                locationId,
                state,
                carryFlag,
                spare,
                maxState,
                baseValue,
            } = item;
            this.output(`\nItem        :${name}`);
            if (container) {
                this.output(`\nContained in:${container}`);
            } else if (owner) {
                this.output(`\nHeld By     :${owner}`);
            } else {
                this.output('\nPosition    :');
                showname(globalState, locationId);
            }
            this.output(`\nState       :${state}`);
            this.output(`\nCarr_Flag   :${carryFlag}`);
            this.output(`\nSpare       :${spare}`);
            this.output(`\nMax State   :${maxState}`);
            this.output(`\nBase Value  :${baseValue}`);
            this.output('\n');
        } else if (player) {
            const {
                name,
                level,
                strength,
                sex,
                locationId,
            } = player;
            this.output(`Name      : ${name}\n`);
            this.output(`Level     : ${level}\n`);
            this.output(`Strength  : ${strength}\n`);
            this.output(`Sex       : ${sex ? 'MALE' : 'FEMALE'}\n`);
            this.output(`Location  : `);
            showname(globalState, locationId);
        }
    }
}

export class Examine extends Action {
    private static examineDefault(state: State, item: Item): Promise<any> {
        return fopen(`${EXAMINES}${item.itemId}`, 'r')
            .then((file) => {
                const messages = [];
                return getstr(file)
                    .then(content => content.forEach(s => messages.push(`${s}\n`)))
                    .then(() => fclose(file))
                    .then(() => ({ description: messages.join('') }))
            })
            .catch(() => ({ description: 'You see nothing special.\n' }));
    }

    private static examineTube(state: State, item: Item): Promise<any> {
        if (item.payload.used) {
            return Examine.examineDefault(state, item);
        }
        return setItem(state, item.itemId, { payload: { used: true } })
            .then(() => createItem(state, SCROLL_145_ID))
            .then((scroll) => holdItem(state, scroll.itemId, state.mynum))
            .then(() => ({ description: 'You take a scroll from the tube.\n' }));
    }

    private static examineScroll145(state: State, item: Item): Promise<any> {
        return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true } })
            .then(() => {
                state.curch = -114;
                trapch(state, state.curch)
            })
            .then(() => ({ description: 'As you read the scroll you are teleported!\n' }));
    }

    private static examineRobe(state: State, item: Item): Promise<any> {
        if (item.payload.used) {
            return Examine.examineDefault(state, item);
        }
        return setItem(state, item.itemId, { payload: { used: true } })
            .then(() => createItem(state, KEY_ID))
            .then((key) => holdItem(state, key.itemId, state.mynum))
            .then(() => ({ description: 'You take a key from one pocket\n' }));
    }

    private static examineCrystalBall(state: State, item: Item): Promise<any> {
        return roll()
            .then(result => (result % 3 + 1))
            .then(itemState => setItem(state, item.itemId, { state: itemState }))
            .then(() => getItem(state, item.itemId))
            .then((item) => {
                if (item.state === 1) {
                    return { description: 'It glows red\n' };
                } else if (item.state === 2) {
                    return { description: 'It glows blue\n' };
                } else if (item.state === 3) {
                    return { description: 'It glows green\n' };
                } else {
                    return { description: '\n' };
                }
            });
    }

    private static examineScroll8(state: State, item: Item): Promise<any> {
        return getItem(state, CRYSTAL_BALL_ID)
            .then(crystalBall => Promise.all([
                getPlayer(state, state.mynum),
                Promise.resolve(crystalBall),
                (crystalBall.state === 0)
                    ? Promise.resolve(undefined)
                    : getItem(state, 3 + crystalBall.state),
            ]))
            .then(([
                me,
                crystalBall,
                candle,
            ]) => {
                if (!candle) {
                    return undefined;
                }
                if (!isCarriedBy(candle, me, (state.my_lev < 10))) {
                    return undefined;
                }
                if (!candle.isLit) {
                    return undefined;
                }
                return item;
            })
            .then((scroll) => {
                if (!scroll) {
                    return Examine.examineDefault(state, item);
                }
                return Promise.all([
                    setItem(state, scroll.itemId, {flags: {[IS_DESTROYED]: true}}),
                    teleport(state, -1074),
                ])
                    .then(() => ({ description: 'Everything shimmers and then solidifies into a different view!\n' }));
            })
    }

    private static examineBed(state: State, item: Item): Promise<any> {
        return getItem(state, LOAF_ID)
            .then((loaf) => {
                if (loaf.payload.used) {
                    return Examine.examineDefault(state, item);
                }
                return Promise.all([
                    createItem(state, loaf.itemId, { payload: { used: true } }),
                    createItem(state, RABBIT_PIE_ID),
                ])
                    .then(() => ({ description: 'Aha. under the bed you find a loaf and a rabbit pie\n' }));
            });
    }

    private static examineBedding(state: State, item: Item): Promise<any> {
        return getItem(state, AMULET_ID)
            .then((amulet) => {
                if (amulet.payload.used) {
                    return Examine.examineDefault(state, item);
                }
                return createItem(state, AMULET_ID, { payload: { used: true } })
                    .then(() => ({ description: 'You pull an amulet from the bedding\n' }));
            });

    }

    action(state: State): Promise<any> {
        if (brkword(state) == -1) {
            throw new Error('Examine what ?\n');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item: Item) => {
                if (!item) {
                    throw new Error( 'You see nothing special at all\n');
                }
                if (item.itemId === TUBE_ID) {
                    return Examine.examineTube(state, item);
                } else if (item.itemId === SCROLL_145_ID) {
                    return Examine.examineScroll145(state, item);
                } else if (item.itemId === ROBE_ID) {
                    return Examine.examineRobe(state, item);
                } else if (item.itemId === CRYSTAL_BALL_ID) {
                    return Examine.examineCrystalBall(state, item);
                } else if (item.itemId === SCROLL_8_ID) {
                    return Examine.examineScroll8(state, item);
                } else if (item.itemId === BED_ID) {
                    return Examine.examineBed(state, item);
                } else if (item.itemId === BEDDING_ID) {
                    return Examine.examineBedding(state, item);
                } else {
                    return Examine.examineDefault(state, item);
                }
            });
    }

    decorate(result: any): void {
        const { description } = result;
        this.output(description);
    }
}

export class Wizlist extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('Huh ?');
        }
        closeworld(state);
        return Promise.resolve(showFile(WIZLIST));
    }
}

export class InLocation extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('Huh');
        }
        const exBk = [...state.ex_dat];
        if (brkword(state) === -1) {
            throw new Error('In where ?');
        }
        const rn = state.wordbuf;
        if (brkword(state) === -1) {
            throw new Error('In where ?');
        }
        const rv = state.wordbuf;
        const oldLocationId = state.curch;
        const locationId = roomnum(state, rn, rv);
        if (locationId === 0) {
            throw new Error('Where is that ?');
        }
        const toPerform = getreinput(state);
        state.curch = locationId;
        closeworld(state);
        return openroom(state, state.curch, 'r')
            .then((unit) => {
                lodex(state, unit);
                return fclose(unit);
            })
            .then(() => {
                openworld(state);
                gamecom(state, toPerform);
                openworld(state);
                if (state.curch === locationId) {
                    state.ex_dat = [...exBk];
                }
                state.curch = oldLocationId;
            })
            .catch(() => {
                state.curch = oldLocationId;
                throw new Error('No such room');
            });
    }
}

export class Jump extends Action {
    private static jumps = {
        '-643': -633,
        '-1050': -662,
        '-1082': -1053,
    };

    private static canJump(state: State, player: Player, umbrella: Item): boolean {
        if (state.my_lev >= 10) {
            return true;
        }
        if (!isCarriedBy(umbrella, player, (state.my_lev < 10))) {
            return false;
        }
        return umbrella.state === 0;
    }

    private noUmbrella(state: State, locationId: number): Promise<any> {
        state.curch = locationId;
        this.output('Wheeeeeeeeeeeeeeeee  <<<<SPLAT>>>>\n');
        this.output('You seem to be splattered all over the place\n');
        loseme(state);
        return endGame(state, 'I suppose you could be scraped up - with a spatula');
    }

    private static withUmbrella(state: State, locationId: number): Promise<any> {
        sendsys(
            state,
            state.globme,
            state.globme,
            -10000,
            state.curch,
            sendVisiblePlayer(state.globme, `${state.globme} has just left\n`),
        );
        state.curch = locationId;
        sendsys(
            state,
            state.globme,
            state.globme,
            -10000,
            state.curch,
            sendVisiblePlayer(state.globme, `${state.globme} has just dropped in\n`),
        );
        trapch(state, locationId);
        return Promise.resolve({});
    }

    action(state: State): Promise<any> {
        const locationId = Jump.jumps[state.curch] || 0;
        if (locationId === 0) {
            return Promise.resolve({ message : 'Wheeeeee....' });
        }
        return Promise.all([
            getPlayer(state, state.mynum),
            getItem(state, UMBRELLA_ID),
        ])
            .then(([
                me,
                umbrella,
            ]) => (
                Jump.canJump(state, me, umbrella)
                    ? Jump.withUmbrella(state, locationId)
                    : this.noUmbrella(state, locationId)
            ));
    }
}

export class Where extends Action {
    private static showPlayer(state: State): Promise<any> {
        return findVisiblePlayer(state, state.wordbuf)
            .then(player => Promise.all([
                Promise.resolve(player),
                showLocation(state, player.locationId, 0),
            ]))
            .then(([
                player,
                location,
            ]) => {
                if (!player) {
                    return undefined;
                }
                return `${player.name} - ${location}\n`;
            });
    }

    private static showItems(state: State): Promise<any> {
        return getItems(state)
            .then(items => items.filter(item => (item.name === state.wordbuf)))
            .then((items) => items.map(item => showLocation(state, item.locationId, item.carryFlag)
                .then((location) => {
                    const itemId = (state.my_lev > 9999) ? `[${item.itemId}]` : '';
                    return `${itemId}${item.name} - ${((state.my_lev < 10) && item.isDestroyed) ? 'Nowhere' : location}\n`;
                })
            ));
    }

    action(state: State): Promise<any> {
        if (state.my_str < 10) {
            throw new Error('You are too weak');
        }
        return Promise.all([
            getPlayer(state, state.mynum),
            Promise.all([
                getItem(state, 111),
                getItem(state, 121),
                getItem(state, 163),
            ]),
        ])
            .then(([
                me,
                items,
            ]) => {
                const chance = items.some(item => isCarriedBy(item, me, (state.my_lev < 10)))
                    ? 100
                    : 10 * state.my_lev;
                return checkRoll(r => r <= chance);
            })
            .then((success) => {
                if (!success) {
                    throw new Error('Your spell fails...');
                }
                if (state.my_lev < 10) {
                    state.my_str -= 2;
                }
                closeworld(state);
                if (brkword(state) === -1) {
                    throw new Error('What is that ?');
                }
                return Promise.all([
                    Where.showItems(state),
                    Where.showPlayer(state),
                ])
            })
            .then(([
                items,
                player,
            ]) => {
                return {
                    items,
                    player,
                };
            });
    }

    decorate(result: any): void {
        const {
            items,
            player,
        } = result;
        if ((!items || !items.length) && !player) {
            throw new Error('I dont know what that is');
        }
        items.forEach(item => this.output(item));
        if (player) {
            this.output(player);
        }
    }
}

export class EditWorld extends Action {
    private static getNumber(state: State, minValue: number = 0, maxValue?: number): number {
        if (brkword(state) === -1) {
            throw new Error('Missing numeric argument');
        }
        const value = Number(state.wordbuf);
        if (value < minValue) {
            throw new Error('Invalid range');
        }
        if (maxValue && (value > maxValue)) {
            throw new Error('Invalid range');
        }
        return value;
    }

    private static editPlayer (state: State): Promise<any> {
        const playerId = EditWorld.getNumber(state, 0, 47);
        if (playerId === -1) {
            return Promise.resolve(false);
        }
        const key = EditWorld.getNumber(state, 0, 15);
        if (key === -1) {
            return Promise.resolve(false);
        }
        const value = EditWorld.getNumber(state);
        if (value === -1) {
            return Promise.resolve(false);
        }
        return setPlayer(state, playerId, { [key]: value })
            .then(() => true);
    }

    private static editItem (state: State): Promise<any> {
        const itemId = EditWorld.getNumber(state, 0, state.numobs - 1);
        if (itemId === -1) {
            return Promise.resolve(false);
        }
        const key = EditWorld.getNumber(state, 0, 3);
        if (key === -1) {
            return Promise.resolve(false);
        }
        const value = EditWorld.getNumber(state);
        if (value === -1) {
            return Promise.resolve(false);
        }
        return setItem(state, itemId, { [key]: value })
            .then(() => true);
    }

    action(state: State): Promise<any> {
        return getPlayer(state, state.mynum)
            .then((editor) => {
                if (!editor.canEditWorld) {
                    throw new Error('Must be Game Administrator');
                }
                if (brkword(state) === -1) {
                    throw new Error('Must Specify Player or Object');
                }
                if (state.wordbuf === 'player') {
                    return EditWorld.editPlayer(state);
                } else if (state.wordbuf !== 'object') {
                    return EditWorld.editItem(state);
                } else {
                    throw new Error('Must Specify Player or Object');
                }
            });
    }

    decorate(result: any): void {
        if (result) {
            this.output('Tis done\n');
        }
    }
}
