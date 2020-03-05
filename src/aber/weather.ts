import State from "./state";
import Events from './tk/events';
import {getItem, getItems, getPlayer, Item, setItem, setPlayer} from "./support";
import {findAvailableItem, findVisiblePlayer, isCarriedBy, isLocatedIn} from "./objsys";
import {sendSound, sendSoundPlayer, sendVisibleName, sendVisiblePlayer} from "./bprintf";
import {roll} from "./magic";
import {checkDumb} from "./new1/reducer";
import {isGod, isWizard} from "./newuaf/reducer";
import {sendLocalMessage, sendMyMessage, sendWeather} from "./parse/events";
import Action from "./action";
import {getLocationId, getName, isHere} from "./tk/reducer";

/*
#include "files.h"
extern FILE *openlock();
extern FILE *openuaf();
extern FILE *openroom();
*/

 /*

 The next part of the universe...


 */

 /*

 Weather Routines

 Current weather defined by state of object 47

 states are

 0   Sunny
 1   Rain
 2   Stormy
 3   Snowing

 */

const setwthr = (state: State, n: number): void => {
    if (!isWizard(state)) {
        bprintf(state, 'What ?\n');
        return;
    }
    adjwthr(state, n);
};

/*
 suncom()
    {
    setwthr(0);
    }

 raincom()
    {
    setwthr(1);
    }

 stormcom()
    {
    setwthr(2);
    }

 snowcom()
    {
    setwthr(3);
    }

 blizzardcom()
    {
    	setwthr(4);
    }
*/

const adjwthr = (state: State, weatherId: number): Promise<void> => getItem(state, 0)
    .then((weather) => {
        const oldState = weather.state;
        return setItem(state, weather.itemId, { state: weatherId })
            .then(() => {
                if (oldState !== weatherId) {
                    return sendWeather(state, weatherId);
                }
            });
    });

const longwthr = (state: State): Promise<void> => roll()
    .then((a) => {
        if (a < 50) {
            return 1;
        } else if (a > 90) {
            return 2;
        } else {
            return 0;
        }
    })
    .then(weatherId => adjwthr(state, weatherId));

const whtrrcv = (state: State, weatherId: number): Promise<void> => {
    if (!outdoors(state)) {
        return Promise.resolve();
    }
    weatherId = modifwthr(state, weatherId);
    if (weatherId === 0) {
        bprintf(state, sendVisibleName('The sun comes out of the clouds\n'));
    } else if (weatherId === 1) {
        bprintf(state, sendVisibleName('It has started to rain\n'));
    } else if (weatherId === 2) {
    } else if (weatherId === 3) {
        bprintf(state, sendVisibleName('It has started to snow\n'));
    } else if (weatherId === 4) {
        bprintf(state, sendVisibleName('You are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n'));
    }
    return Promise.resolve();
};

const showwthr = (state: State): Promise<void> => {
    if (!outdoors(state)) {
        return Promise.resolve();
    }
    getItem(state, 0)
        .then((weather) => {
            const weatherId = modifwthr(state, weather.state);
            if (weatherId === 1) {
                if ((getLocationId(state) > -199) && (getLocationId(state) < -178)) {
                    bprintf(state, 'It is raining, a gentle mist of rain, which sticks to everything around\n');
                    bprintf(state, 'you making it glisten and shine. High in the skies above you is a rainbow\n');
                } else {
                    bprintf(state, sendVisibleName('It is raining\n'));
                }
            } else if (weatherId === 2) {
                bprintf(state, sendVisibleName('The skies are dark and stormy\n'));
            } else if (weatherId === 3) {
                bprintf(state, sendVisibleName('It is snowing\n'));
            } else if (weatherId === 4) {
                bprintf(state, sendVisibleName('A blizzard is howling around you\n'));
            }
        });
};

const outdoors = (state: State): boolean => {
    const channelId = getLocationId(state);
    if ([-100, -101, -102].indexOf(channelId) >= 0) {
        return true;
    } else if ([-183, -170].indexOf(channelId) >= 0) {
        return false;
    } else if ((channelId > -191) && (channelId < -168)) {
        return true;
    } else if ((channelId > -172) && (channelId < -181)) {
        return true;
    } else  {
        return false;
    }
};

 /* Silly Section */

const sillycom = (state: State, text: string): Promise<void> => sendMyMessage(state, text.replace('%s', getName(state)));

const laughcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' falls over laughing\n')}`);
        bprintf(state, 'You start to laugh\n');
    });

const purrcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' starts purring\n')}`);
        bprintf(state, 'MMMMEMEEEEEEEOOOOOOOWWWWWWW!!\n');
    });

const crycom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, sendVisiblePlayer('%s', '%s bursts into tears\n'));
        bprintf(state, 'You burst into tears\n');
    });

const sulkcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, sendVisiblePlayer('%s', '%s sulks\n'));
        bprintf(state, 'You sulk....\n');
    });

const burpcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' burps loudly\n')}`);
        bprintf(state, 'You burp rudely\n');
    });

const hiccupcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' hiccups\n')}`);
        bprintf(state, 'You hiccup\n');
    });

/*
long hasfarted=0;
*/

const fartcom = (state: State): Promise<void> => {
    state.hasfarted = true;
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' lets off a real rip roarer\n')}`);
    bprintf(state, 'Fine...\n');
};

const grincom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s grins evilly\n'));
    bprintf(state, 'You grin evilly\n');
};

const smilecom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s smiles happily\n'));
    bprintf(state, 'You smile happily\n');
};

const winkcom = (state: State): Promise<void> => {
    /* At person later maybe ? */
    sillycom(state, sendVisiblePlayer('%s', '%s winks suggestively\n'));
    bprintf(state, 'You wink\n');
};

const sniggercom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sniggers\n')}`);
        bprintf(state, 'You snigger\n');
    });

const posecom = (state: State): Promise<void> => {
    if (!isWizard(state)) {
        bprintf(state, 'You are just not up to this yet\n');
        return Promise.resolve();
    }
    srnd(time(state));
    return roll()
        .then((poseRoll) => {
            const a = poseRoll % 5;
            bprintf(state, `POSE :${a}\n`);
            if (a === 0) {
                return Promise.resolve()
            } else if (a === 1) {
                sillycom(state, sendVisiblePlayer('%s', '%s throws out one arm and sends a huge bolt of fire high\ninto the sky\n'));
                return Events.broadcast(state, sendVisibleName('A massive ball of fire explodes high up in the sky\n'));
            } else if (a === 2) {
                sillycom(state, sendVisiblePlayer('%s', '%s turns casually into a hamster before resuming normal shape\n'));
                return Promise.resolve()
            } else if (a === 3) {
                sillycom(state, sendVisiblePlayer('%s', '%s starts sizzling with magical energy\n'));
                return Promise.resolve()
            } else if (a === 4) {
                sillycom(state, sendVisiblePlayer('%s', '%s begins to crackle with magical fire\n'));
                return Promise.resolve()
            }
        });
};

const emotecom = (state: State): Promise<void> => {
    /* (C) Jim Finnis */
    if (!isGod(state)) {
        bprintf(state, 'Your emotions are strictly limited!\n');
        return Promise.resolve();
    }
    sillycom(state, `${sendSoundPlayer('%s')} ${getreinput(state)}\n`);
    return Promise.resolve();
};

const praycom = (state: State): Promise<void> => {
    sillycom(state, sendVisiblePlayer('%s', '%s falls down and grovels in the dirt\n'));
    bprintf(state, 'Ok\n');
};

const yawncom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' yawns\n')}`);
};

const groancom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' groans loudly\n')}`);
    bprintf(state, 'You groan\n');
};

const moancom = (state: State): Promise<void> => {
    sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' starts making moaning noises\n')}`);
    bprintf(state, 'You start to moan\n');
};

const cancarry = (state: State, playerId: number): Promise<boolean> => getPlayer(state, playerId)
    .then((player) => {
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

    });

const setcom = (state: State): Promise<void> => {
    const setmobile = (name: string) => findVisiblePlayer(state, name)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'Set what ?\n');
            }
            if (player.playerId < 16) {
                return bprintf(state, 'Mobiles only\n');
            }
            return Action.nextWord(state, 'To what value ?')
                .then(value => setPlayer(state, player.playerId, { strength: Number(value) }));
        });

    const bitset = (item: Item) => Action.nextWord(state, 'Which bit ?')
        .then((bitId) => {
            const b = Number(bitId);
            return Promise.all([
                Promise.resolve(b),
                Action.nextWord(state),
            ]);
        })
        .then(([
            b,
            bitValue,
        ]) => {
            if (!bitValue) {
                return bprintf(state, `The bit is ${item.flags[b] ? 'TRUE' : 'FALSE'}\n`);
            }
            const c = Number(bitValue);

            if ((c < 0) || (c > 1) || (b < 0) || (b > 15)) {
                return bprintf(state, 'Number out of range\n');
            }
            return setItem(state, item.itemId, { flags: { [b]: !!c } });
        });

    const byteset = (item: Item) => Action.nextWord(state, 'Which byte ?')
        .then((byteId) => {
            const b = Number(byteId);
            return Promise.all([
                Promise.resolve(b),
                Action.nextWord(state),
            ]);
        })
        .then(([
            b,
            byteValue,
        ]) => {
            if (!byteValue) {
                return bprintf(state, `Current Value is : ${item.payload[b]}\n`);
            }
            const c = Number(byteValue);
            if ((c < 0) || (c > 255) || (b < 0) || (b > 1)) {
                return bprintf(state, 'Number out of range\n');
            }
            return setItem(state, item.itemId, { payload: { [b]: c } });
        });

    return Action.nextWord(state, 'set what')
        .then((word) => {
            if (!isWizard(state)) {
                bprintf(state, 'Sorry, wizards only\n');
                return Promise.resolve();
            }
            return Promise.all([
                Promise.resolve(word),
                findAvailableItem(state, word),
            ]);
        })
        .then(([
            word,
            item,
        ]) => {
            if (!item) {
                return setmobile(word);
            }
            return Action.nextWord(state, 'Set to what value ?')
                .then((value) => {
                    if (value === 'bit') {
                        return bitset(item);
                    }
                    if (value === 'byte') {
                        return byteset(item);
                    }
                    const b = Number(value);
                    if (b > item.maxState) {
                        return bprintf(state, `Sorry max state for that is ${item.maxState}\n`);
                    }
                    if (b < 0) {
                        return bprintf(state, 'States start at 0\n');
                    }
                    return setItem(state, item.itemId, {state: b});
                });
        });
};

const isdark = (state: State): Promise<boolean> => {
    const idk = () => {
        let found = undefined;
        return getItems(state)
            .then(items => items.forEach((item) => {
                if (found !== undefined) return;
                if ((item.itemId !== 32) && !item.isLit) {
                    return;
                }
                if (isLocatedIn(item, getLocationId(state), !isWizard(state))) {
                    found = false;
                    return;
                }
                if ((item.heldBy === undefined) && (item.wearingBy === undefined)) {
                    return;
                }
                return getPlayer(state, item.locationId)
                    .then((player) => {
                        if (!isHere(state, player.locationId)) {
                            return;
                        }
                        found = false;
                    });
            }))
            .then(() => (found === undefined) ? true : found);
    };

    if (isWizard(state)) {
        return Promise.resolve(false);
    }
    const channelId = getLocationId(state);
    if ((channelId === -1100) || (channelId === -1101)) {
        return Promise.resolve(false);
    }
    if ((channelId <= -1113) || (channelId >= -1123)) {
        return idk();
    }
    if ((channelId < -399) || (channelId > -300)) {
        return Promise.resolve(false);
    }
    return idk();
};

const modifwthr = (state: State, weatherId: number): number => {
    const channelId = getLocationId(state);
    if ((channelId >= -179) && (channelId <= -199)) {
        return (weatherId > 1)
            ? weatherId % 2
            : weatherId;
    } else if ((channelId >= -178) && (channelId <= -100)) {
        return ((weatherId === 1) || (weatherId === 2))
            ? weatherId + 2
            : weatherId;
    } else {
        return weatherId;
    }
};

const setpflags = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (!editor.isDebugger) {
            bprintf(state, 'You can\'t do that\n');
            return Promise.resolve();
        }
        return Action.nextWord(state, 'Whose PFlags ?')
            .then(name => findVisiblePlayer(state, name))
            .then((player) => {
                if (!player) {
                    return bprintf(state, 'Who is that ?\n');
                }
                return Action.nextWord(state, 'Flag number ?')
                    .then(flagId => Promise.all([
                        Number(flagId),
                        Action.nextWord(state),
                    ]))
                    .then(([b, value]) => {
                        if (!value) {
                            return bprintf(state, `Value is ${player.flags[b] ? 'TRUE' : 'FALSE'}\n`);
                        }
                        const c = Number(value);

                        if ((c < 0) || (c > 1) || (b < 0) || (b > 31)) {
                            return bprintf(state, 'Out of range\n');
                        }
                        return setPlayer(state, player.playerId, { flags: {
                                ...player.flags,
                                [b]: c !== 0,
                            }})
                    });
            });
    });
