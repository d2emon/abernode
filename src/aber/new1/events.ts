import State from "../state";
import {
    cureAll,
    getForce,
    setBlind,
    setCripple,
    setDeaf,
    setDumb,
    setForce,
} from "./reducer";
import {sendName} from "../bprintf";
import {Player} from "../support";
import {sendMessage} from "../bprintf/bprintf";
import {logger} from "../files";
import {dropMyItems} from "../objsys";
import {endGame} from "../gamego/endGame";
import {removePerson} from "../newuaf";
import {getSexName, getStrength, isWizard, revertSex, updateStrength} from "../newuaf/reducer";
import {loadWorld, saveWorld} from "../opensys";
import {
    sendLocalMessage,
    Event as EventData, sendMyMessage,
} from "../parse/events";
import {getLocationId, getName, isHere} from "../tk/reducer";

const calibme = (state: State): void => undefined;
const loseme = (state: State): void => undefined;
const send2 = (state: State, event: EventData): Promise<void> => Promise.resolve();

interface Event {
    sender: Player,
    receiver?: Player,
    locationId?: number,
    payload: any,
}

const receiveMagicDamage = (state: State, damage: number, message: string): Promise<void> => {
    if (isWizard(state)) {
        return Promise.resolve();
    }
    updateStrength(state, -damage);
    state.me_cal = 1;
    if (getStrength(state) >= 0) {
        return Promise.resolve();
    }
    return saveWorld(state)
        .then(() => loadWorld(state))
        .then(() => {
            state.zapped = true;
            return Promise.all([
                sendMessage(state, message),
                dropMyItems(state),
                Promise.resolve(loseme(state)),
                sendMyMessage(state, `${getName(state)} has just died\n`),
                sendWizards(state, `[ ${getName(state)} has just died ]\n`),
                logger.write(`${getName(state)} slain magically`),
                removePerson(state, getName(state)),
                endGame(state, 'Oh dear you just died'),
            ])
        })
        .then(() => {});
};

const addForce = (state: State, action: string): Promise<void> => {
    const force = getForce(state);
    setForce(state, action);
    return force
        ? sendMessage(state, `The compulsion to ${force} is overridden\n`)
        : Promise.resolve();
};

const iAm = (state: State, name: string): boolean => {
    const name1 = name.toLowerCase();
    const name2 = getName(state).toLowerCase();
    if (name1 === name2) {
        return true;
    }
    return (name2.substr(0, 4) === 'the ') && (name1.substr(4) === name2.substr(4));
};

const onlyMe = (state: State, isMe: boolean, sender: Player, payload: any, callback): Promise<void> => (
    isMe
        ? callback(state, {
            sender,
            receiver: null,
            payload,
            locationId: 0,
        })
        : Promise.resolve()
);
const notMe = (state: State, isMe: boolean, sender: Player, payload: any, callback): Promise<void> => (
    !isMe
        ? callback(state, {
            sender,
            receiver: null,
            payload,
            locationId: 0,
        })
        : Promise.resolve()
);
const notMy = (state: State, event: Event, isMe: boolean, callback): Promise<void> => (
    !iAm(state, event.sender.name)
        ? callback(state, event, isMe)
        : Promise.resolve()
);

const receiveCure = (state: State) => {
    cureAll(state);
    return sendMessage(state, 'All your ailments have been cured\n');
};
const receiveCripple = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setCripple(state);
        return sendMessage(state, 'You have been magically crippled\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to cripple you\n`)
    }
};
const receiveDumb = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setDumb(state);
        return sendMessage(state, 'You have been struck magically dumb\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to dumb you\n`)
    }
};
const receiveForce = (state: State, event: Event) => {
    if (!isWizard(state)) {
        return addForce(state, event.payload)
            .then(() => sendMessage(state, `${sendName(event.sender.name)} has forced you to ${event.payload}\n`));
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to force you to ${event.payload}\n`);
    }
};
const receiveShout = (state: State, event: Event) => sendMessage(state, `${sendName(event.sender.name)} shouts '${event.payload}'\n`);
const receiveBlind = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setBlind(state);
        return sendMessage(state, 'You have been struck magically blind\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to blind you\n`);
    }
};
const receiveMissile = (state: State, event: Event, isMe: boolean) => {
    if (!isHere(state, event.locationId)) {
        return Promise.resolve();
    }
    return sendMessage(state, `Bolts of fire leap from the fingers of ${sendName(event.sender.name)}\n`)
        .then(() => {
            if (isMe) {
                return receiveMagicDamage(state, Number(event.payload), 'You are struck!\n');
            } else {
                return sendMessage(state, `${sendName(event.receiver.name)} is struck\n`);
            }
        });
};
const receiveChange = (state: State, event: Event) => {
    revertSex(state);
    calibme(state);
    return sendMessage(state, `Your sex has been magically changed!\n`
        + `You are now ${getSexName(state)}\n`);
};
const receiveFireball = (state: State, event: Event, isMe: boolean) => {
    if (!isHere(state, event.locationId)) {
        return Promise.resolve();
    }
    return sendMessage(state, `${sendName(event.sender.name)} casts a fireball\n`)
        .then(() => {
            if (isMe) {
                return receiveMagicDamage(state, Number(event.payload), 'You are struck!\n');
            } else {
                return sendMessage(state, `${sendName(event.receiver.name)} is struck\n`);
            }
        });
};
const receiveShock = (state: State, event: Event, isMe: boolean) => {
    if (isMe) {
        return receiveMagicDamage(state, Number(event.payload), `${sendName(event.sender.name)} touches you giving you a sudden electric shock!\n`);
    }
};
const receiveSocial = (state: State, event: Event) => sendMessage(state, `${event.payload}\n`);
const receiveWizard = (state: State, event: Event) => {
    if (!isWizard(state)) {
        return Promise.resolve();
    }
    return sendMessage(state, `${event.payload}\n`);
};
const receiveDeaf = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setDeaf(state);
        return sendMessage(state, 'You have been magically deafened\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to deafen you\n`);
    }
};

export const sendCure = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: undefined,
    code: -10100,
    channelId: undefined,
    payload: undefined,
});
export const sendCripple = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10101,
    channelId: undefined,
    payload: undefined,
});
export const sendDumb = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10102,
    channelId: undefined,
    payload: undefined,
});
export const sendForce = (state: State, target: Player, action: string): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10103,
    channelId: undefined,
    payload: action,
});
export const sendShout = (state: State, message: string): Promise<void> => send2(state, {
    receiver: getName(state),
    sender: getName(state),
    code: -10104,
    channelId: undefined,
    payload: message,
});
export const sendBlind = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10105,
    channelId: undefined,
    payload: undefined,
});
export const sendMissile = (state: State, target: Player, damage: number): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10106,
    channelId: getLocationId(state),
    payload: damage,
});
export const sendChangeSex = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: undefined,
    code: -10107,
    channelId: undefined,
    payload: undefined,
});
export const sendFireball = (state: State, target: Player, damage: number): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10109,
    channelId: getLocationId(state),
    payload: damage,
});
export const sendShock = (state: State, target: Player, damage: number): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10110,
    channelId: undefined,
    payload: damage,
});
export const sendSocial = (state: State, target: Player, message: string): Promise<void> => send2(state, {
    receiver: target.name,
    sender: undefined,
    code: -10111,
    channelId: undefined,
    payload: message,
});
export const sendWizards = (state: State, message: string): Promise<void> => send2(state, {
    receiver: undefined,
    sender: undefined,
    code: -10113,
    channelId: undefined,
    payload: message,
});
export const sendDeaf = (state: State, target: Player): Promise<void> => send2(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10120,
    channelId: undefined,
    payload: undefined,
});

export const newReceive = (state: State, isMe: boolean, locationId: number, receiver: Player, sender: Player, code: number, payload: any): Promise<void> => {
    const actions = {
        '-10100': () => onlyMe(state, isMe, sender, payload, receiveCure),
        '-10101': () => onlyMe(state, isMe, sender, payload, receiveCripple),
        '-10102': () => onlyMe(state, isMe, sender, payload, receiveDumb),
        '-10103': () => onlyMe(state, isMe, sender, payload, receiveForce),
        '-10104': () => notMy(
            state,
            {
                sender,
                payload,
            },
            isMe,
            receiveShout,
        ),
        '-10105': () => onlyMe(state, isMe, sender, payload, receiveBlind),
        '-10106': () => notMy(
            state,
            {
                sender,
                receiver,
                locationId,
                payload,
            },
            isMe,
            receiveMissile,
        ),
        '-10107': () => onlyMe(state, isMe, sender, payload, receiveChange),
        '-10109': () => notMy(
            state,
            {
                sender,
                receiver,
                locationId,
                payload,
            },
            isMe,
            receiveFireball,
        ),
        '-10110': () => notMy(
            state,
            {
                sender,
                receiver,
                locationId,
                payload,
            },
            isMe,
            receiveShock,
        ),
        '-10111': () => onlyMe(state, isMe, sender, payload, receiveSocial),
        '-10113': () => receiveWizard(state, {
            sender,
            receiver,
            locationId,
            payload,
        }),
        '-10120': () => onlyMe(state, isMe, sender, payload, receiveDeaf),
    };
    const action = actions[code] || (() => Promise.resolve());
    return action();
};
