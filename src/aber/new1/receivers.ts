import State from "../state";
import {
    cureAll,
    setBlind,
    setCripple,
    setDeaf,
    setDumb,
} from "./reducer";
import {sendName} from "../bprintf";
import {Player} from "../support";
import {sendMessage} from "../bprintf/bprintf";
import {sendsys} from "../__dummies";
import {logger} from "../files";
import {dropMyItems} from "../objsys";
import {endGame} from "../gamego/endGame";

const addforce = (state: State, action: string): void => undefined;
const calibme = (state: State): void => undefined;
const loseme = (state: State): void => undefined;
const delpers = (state: State, name: string): void => undefined;
const openworld = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const iam = (state: State, player: Player): boolean => false;

interface Event {
    sender: Player,
    receiver: Player,
    locationId: number,
    payload: any,
}

const receiveMagicDamage = (state: State, damage: number, message: string): Promise<void> => {
    if (state.my_lev > 9) {
        return Promise.resolve();
    }
    state.my_str -= damage;
    state.me_cal = 1;
    if (state.my_lev >= 0) {
        return Promise.resolve();
    }
    closeworld(state);
    delpers(state, state.globme);
    state.zapped = true;
    openworld(state);
    return Promise.all([
        sendMessage(state, message),
        logger.write(`${state.globme} slain magically`),
        dropMyItems(state),
        Promise.resolve(loseme(state)),
        Promise.resolve(sendsys(
            state,
            state.globme,
            state.globme,
            -10000,
            state.curch,
            `${state.globme} has just died\n`,
        )),
        sendWizards(state, `[ ${state.globme} has just died ]\n`),
        endGame(state, 'Oh dear you just died'),
    ])
        .then(() => {});
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

const receiveCure = (state: State) => {
    cureAll(state);
    return sendMessage(state, 'All your ailments have been cured\n');
};
const receiveCripple = (state: State, event: Event) => {
    if (state.my_lev < 10) {
        setCripple(state);
        return sendMessage(state, 'You have been magically crippled\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to cripple you\n`)
    }
};
const receiveDumb = (state: State, event: Event) => {
    if (state.my_lev < 10) {
        setDumb(state);
        return sendMessage(state, 'You have been struck magically dumb\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to dumb you\n`)
    }
};
const receiveForce = (state: State, event: Event) => {
    if (state.my_lev < 10) {
        addforce(state, event.payload);
        return sendMessage(state, `${sendName(event.sender.name)} has forced you to ${event.payload}\n`);
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to force you to ${event.payload}\n`);
    }
};
const receiveShout = (state: State, event: Event) => sendMessage(state, `${sendName(event.sender.name)} shouts '${event.payload}'\n`);
const receiveBlind = (state: State, event: Event) => {
    if (state.my_lev < 10) {
        setBlind(state);
        return sendMessage(state, 'You have been struck magically blind\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to blind you\n`);
    }
};
const receiveMissile = (state: State, event: Event, isMe: boolean) => {
    if (iam(state, event.sender)) {
        return Promise.resolve();
    }
    if (state.curch !== event.locationId) {
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
    state.my_sex = 1 - state.my_sex;
    calibme(state);
    return sendMessage(state, `Your sex has been magically changed!\n`
        + `You are now ${ !state.my_sex ? 'Male' : 'Female' }\n`);
};
const receiveFireball = (state: State, event: Event, isMe: boolean) => {
    if (iam(state, event.sender)) {
        return Promise.resolve();
    }
    if (state.curch !== event.locationId) {
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
    if (iam(state, event.sender)) {
        return Promise.resolve();
    }
    if (isMe) {
        return receiveMagicDamage(state, Number(event.payload), `${sendName(event.sender.name)} touches you giving you a sudden electric shock!\n`);
    }
};
const receiveSocial = (state: State, event: Event) => sendMessage(state, `${event.payload}\n`);
const receiveWizard = (state: State, event: Event) => {
    if (state.my_lev <= 9) {
        return Promise.resolve();
    }
    return sendMessage(state, `${event.payload}\n`);
};
const receiveDeaf = (state: State, event: Event) => {
    if (state.my_lev < 10) {
        setDeaf(state);
        return sendMessage(state, 'You have been magically deafened\n');
    } else {
        return sendMessage(state, `${sendName(event.sender.name)} tried to deafen you\n`);
    }
};

export const sendCure = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        null,
        -10100,
        null,
        null,
    );
    return Promise.resolve();
};
export const sendCripple = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10101,
        null,
        null,
    );
    return Promise.resolve();
};
export const sendDumb = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10102,
        null,
        null,
    );
    return Promise.resolve();
};
export const sendForce = (state: State, target: Player, action: string): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10103,
        null,
        action,
    );
    return Promise.resolve();
};
export const sendShout = (state: State, message: string): Promise<void> => {
    sendsys(
        state,
        state.globme,
        state.globme,
        -10104,
        null,
        message,
    );
    return Promise.resolve();
};
export const sendBlind = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10105,
        null,
        null,
    );
    return Promise.resolve();
};
export const sendMissile = (state: State, target: Player, damage: number): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10106,
        state.curch,
        damage,
    );
    return Promise.resolve();
};
export const sendChangeSex = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        null,
        -10107,
        null,
        null,
    );
    return Promise.resolve();
};
export const sendFireball = (state: State, target: Player, damage: number): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10109,
        state.curch,
        damage,
    );
    return Promise.resolve();
};
export const sendShock = (state: State, target: Player, damage: number): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10110,
        null,
        damage,
    );
    return Promise.resolve();
};
export const sendSocial = (state: State, target: Player, message: string): Promise<void> => {
    sendsys(
        state,
        target.name,
        null,
        -10111,
        null,
        message,
    );
    return Promise.resolve();
};
export const sendWizards = (state: State, message: string): Promise<void> => {
    sendsys(
        state,
        null,
        null,
        -10113,
        null,
        message,
    );
    return Promise.resolve();
};
export const sendDeaf = (state: State, target: Player): Promise<void> => {
    sendsys(
        state,
        target.name,
        state.globme,
        -10120,
        null,
        null,
    );
    return Promise.resolve();
};

export const newReceive = (state: State, isMe: boolean, locationId: number, receiver: Player, sender: Player, code: number, payload: any): Promise<void> => {
    const actions = {
        '-10100': () => onlyMe(state, isMe, sender, payload, receiveCure),
        '-10101': () => onlyMe(state, isMe, sender, payload, receiveCripple),
        '-10102': () => onlyMe(state, isMe, sender, payload, receiveDumb),
        '-10103': () => onlyMe(state, isMe, sender, payload, receiveForce),
        '-10104': () => notMe(state, isMe, sender, payload, receiveShout),
        '-10105': () => onlyMe(state, isMe, sender, payload, receiveBlind),
        '-10106': () => receiveMissile(state, {
            sender,
            receiver,
            locationId,
            payload,
        }, isMe),
        '-10107': () => onlyMe(state, isMe, sender, payload, receiveChange),
        '-10109': () => receiveFireball(state, {
            sender,
            receiver,
            locationId,
            payload,
        }, isMe),
        '-10110': () => receiveShock(state, {
            sender,
            receiver,
            locationId,
            payload,
        }, isMe),
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
