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
import {playerName} from "../bprintf";
import {Player} from "../support";
import {sendMessage} from "../bprintf/bprintf";
import {logger} from "../files";
import {removePerson} from "../newuaf";
import {getSexName, getStrength, isWizard, revertSex, updateStrength} from "../newuaf/reducer";
import {loadWorld, saveWorld} from "../opensys";
import {sendMyMessage} from "../parse/events";
import {getLocationId, getName, isHere} from "../tk/reducer";
import {emitEvent} from "../tk/events";
import {looseGame} from "../tk";
import {calibrate} from "../parse";

interface Event {
    actor?: Player,
    sender?: Player,
    receiver?: Player,
    channelId?: number,
    payload?: any,
}

const receiveMagicDamage = (state: State, damage: number, message: string, actor: Player): Promise<void> => {
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
        })
        .then(() => Promise.all([
            sendMessage(state, message),
            sendMyMessage(state, `${getName(state)} has just died\n`),
            sendWizards(state, `[ ${getName(state)} has just died ]\n`),
            logger.write(`${getName(state)} slain magically`),
            removePerson(state, getName(state)),
        ]))
        .then(() => looseGame(state, actor, 'Oh dear you just died'));
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

const onlyMe = (state: State, isMe: boolean, data: Event, callback): Promise<void> => (
    isMe
        ? callback(state, {
            sender: data.sender,
            receiver: null,
            payload: data.payload,
            locationId: 0,
        }, isMe)
        : Promise.resolve()
);
const notMe = (state: State, isMe: boolean, data: Event, callback): Promise<void> => (
    !isMe
        ? callback(state, {
            sender: data.sender,
            receiver: null,
            payload: data.payload,
            locationId: 0,
        }, isMe)
        : Promise.resolve()
);
const notMy = (state: State, isMe: boolean, data: Event, callback): Promise<void> => (
    !iAm(state, data.sender.name)
        ? callback(state, data, isMe)
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
        return sendMessage(state, `${playerName(event.sender)} tried to cripple you\n`)
    }
};
const receiveDumb = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setDumb(state);
        return sendMessage(state, 'You have been struck magically dumb\n');
    } else {
        return sendMessage(state, `${playerName(event.sender)} tried to dumb you\n`)
    }
};
const receiveForce = (state: State, event: Event) => {
    if (!isWizard(state)) {
        return addForce(state, event.payload)
            .then(() => sendMessage(state, `${playerName(event.sender)} has forced you to ${event.payload}\n`));
    } else {
        return sendMessage(state, `${playerName(event.sender)} tried to force you to ${event.payload}\n`);
    }
};
const receiveShout = (state: State, event: Event) => sendMessage(state, `${playerName(event.sender)} shouts '${event.payload}'\n`);
const receiveBlind = (state: State, event: Event) => {
    if (!isWizard(state)) {
        setBlind(state);
        return sendMessage(state, 'You have been struck magically blind\n');
    } else {
        return sendMessage(state, `${playerName(event.sender)} tried to blind you\n`);
    }
};
const receiveMissile = (state: State, event: Event, isMe: boolean) => {
    if (!isHere(state, event.channelId)) {
        return Promise.resolve();
    }
    return sendMessage(state, `Bolts of fire leap from the fingers of ${playerName(event.sender)}\n`)
        .then(() => {
            if (isMe) {
                return receiveMagicDamage(state, Number(event.payload), 'You are struck!\n', event.actor);
            } else {
                return sendMessage(state, `${playerName(event.receiver)} is struck\n`);
            }
        });
};
const receiveChange = (state: State, event: Event): Promise<void> => {
    revertSex(state);
    return Promise.all([
        calibrate(state, event.sender),
        sendMessage(state, `Your sex has been magically changed!\n`
            + `You are now ${getSexName(state)}\n`)
    ])
        .then(() => null);
};
const receiveFireball = (state: State, event: Event, isMe: boolean) => {
    if (!isHere(state, event.channelId)) {
        return Promise.resolve();
    }
    return sendMessage(state, `${playerName(event.sender)} casts a fireball\n`)
        .then(() => {
            if (isMe) {
                return receiveMagicDamage(state, Number(event.payload), 'You are struck!\n', event.actor);
            } else {
                return sendMessage(state, `${playerName(event.receiver)} is struck\n`);
            }
        });
};
const receiveShock = (state: State, event: Event, isMe: boolean) => {
    if (isMe) {
        return receiveMagicDamage(state, Number(event.payload), `${playerName(event.sender)} touches you giving you a sudden electric shock!\n`, event.actor);
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
        return sendMessage(state, `${playerName(event.sender)} tried to deafen you\n`);
    }
};

export const sendCure = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: undefined,
    code: -10100,
    channelId: undefined,
    payload: undefined,
});
export const sendCripple = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10101,
    channelId: undefined,
    payload: undefined,
});
export const sendDumb = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10102,
    channelId: undefined,
    payload: undefined,
});
export const sendForce = (state: State, target: Player, action: string): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10103,
    channelId: undefined,
    payload: action,
});
export const sendShout = (state: State, message: string): Promise<void> => emitEvent(state, {
    receiver: getName(state),
    sender: getName(state),
    code: -10104,
    channelId: undefined,
    payload: message,
});
export const sendBlind = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10105,
    channelId: undefined,
    payload: undefined,
});
export const sendMissile = (state: State, target: Player, damage: number): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10106,
    channelId: getLocationId(state),
    payload: damage,
});
export const sendChangeSex = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: undefined,
    code: -10107,
    channelId: undefined,
    payload: undefined,
});
export const sendFireball = (state: State, target: Player, damage: number): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10109,
    channelId: getLocationId(state),
    payload: damage,
});
export const sendShock = (state: State, target: Player, damage: number): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10110,
    channelId: undefined,
    payload: damage,
});
export const sendSocial = (state: State, target: Player, message: string): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: undefined,
    code: -10111,
    channelId: undefined,
    payload: message,
});
export const sendWizards = (state: State, message: string, force: boolean = false): Promise<void> => emitEvent(state, {
    receiver: undefined,
    sender: undefined,
    code: -10113,
    channelId: undefined,
    payload: message,
}, force);
export const sendDeaf = (state: State, target: Player): Promise<void> => emitEvent(state, {
    receiver: target.name,
    sender: getName(state),
    code: -10120,
    channelId: undefined,
    payload: undefined,
});

export const newReceive = (state: State, code: number, isMe: boolean) => {
    const actions = {
        '-10100': (data: Event) => onlyMe(state, isMe, data, receiveCure),
        '-10101': (data: Event) => onlyMe(state, isMe, data, receiveCripple),
        '-10102': (data: Event) => onlyMe(state, isMe, data, receiveDumb),
        '-10103': (data: Event) => onlyMe(state, isMe, data, receiveForce),
        '-10104': (data: Event) => notMy(state, isMe, data, receiveShout),
        '-10105': (data: Event) => onlyMe(state, isMe, data, receiveBlind),
        '-10106': (data: Event) => notMy(state, isMe, data, receiveMissile),
        '-10107': (data: Event) => onlyMe(state, isMe, data, receiveChange),
        '-10109': (data: Event) => notMy(state, isMe, data, receiveFireball),
        '-10110': (data: Event) => notMy(state, isMe, data, receiveShock),
        '-10111': (data: Event) => onlyMe(state, isMe, data, receiveSocial),
        '-10113': (data: Event) => receiveWizard(state, data),
        '-10120': (data: Event) => onlyMe(state, isMe, data, receiveDeaf),
    };

    return actions[code] || (() => Promise.resolve());
};
