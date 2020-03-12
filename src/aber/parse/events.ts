import State from "../state";
import Battle from "../blood/battle";
import {Event} from '../services/world';
import {getLocationId, getName, isHere} from "../tk/reducer";
import Events, {PLAYER_MESSAGE} from '../tk/events';
import {findPlayer} from "../objsys";
import {newReceive, sendWizards} from "../new1/events";
import {Player, setPlayer} from "../support";
import {looseGame} from "../tk";
import {isWizard, setLevel, setScore, setStrength} from "../newuaf/reducer";
import {calibrate} from "./index";
import {sendMessage} from "../bprintf/bprintf";
import {saveWorld} from "../opensys";
import {receiveDamage} from "../blood/events";
import {
    actorName,
    playerName,
    sendAudibleMessage,
    sendBaseMessage,
    sendVisibleMessage,
} from "../bprintf";
import {receiveWeather} from "../weather/events";
import {removePerson} from "../newuaf";
import {setIsDamagedBy, setSummoned, setZapped} from "./reducer";

export interface EventData {
    actor: Player,
    sender?: Player,
    receiver?: Player,
    channelId?: number,
    payload?: any,
}

const onlyMe = (state: State, isMe: boolean, data: EventData, callback): Promise<void> => (
    isMe
        ? callback(state, data, isMe)
        : Promise.resolve()
);
const notMe = (state: State, isMe: boolean, data: EventData, callback): Promise<void> => (
    !isMe
        ? callback(state, data, isMe)
        : Promise.resolve()
);

const receiveStopSnoop = (state: State): Promise<void> => {
    state.snoopd = -1;
    return Promise.resolve();
};
const receiveSnoop = (state: State, data: EventData): Promise<void> => {
    const { sender } = data;
    state.snoopd = sender ? sender.playerId : -1;
    return Promise.resolve();
};
const receiveChangePerson = (state: State, data: EventData): Promise<void> => {
    const {
        receiver,
        payload,
    } = data;
    const {
        level,
        score,
        strength,
    } = payload;
    setLevel(state, level);
    setScore(state, score);
    setStrength(state, strength);
    return calibrate(state, receiver);
};
const receiveEvil = (state: State, data: EventData): Promise<void> => sendBaseMessage(
    state,
    'Something Very Evil Has Just Happened...\n',
)
    .then(() => looseGame(state, data.actor, 'Bye Bye Cruel World....'));
const receive750 = (state: State, data: EventData): Promise<void> => {
    const {
        actor,
        sender,
    } = data;
    if (!sender) {
        return looseGame(state, actor, undefined);
    }
    return saveWorld(state)
        .then(() => Promise.reject(new Error('***HALT')));
};
const receiveVisibility = (state: State, data: EventData): Promise<void> => {
    const { payload } = data;
    const {
        playerId,
        visibility,
    } = payload;
    return setPlayer(state, playerId, { visibility })
};
const receiveLocalMessage = (state: State, data: EventData): Promise<void> => {
    if (!isHere(state, data.channelId)) {
        return Promise.resolve();
    }
    return sendMessage(state, data.payload);
};
const receiveExorcise = (state: State, data: EventData, isMe: boolean): Promise<void> => {
    if (isMe) {
        if (isWizard(state)) {
            return sendBaseMessage(state, `${playerName(data.sender)} cast a lightning bolt at you\n`);
        }
        /* You are in the .... */
        return Promise.all([
            Promise.resolve(setZapped(state)),
            sendBaseMessage(state, 'A massive lightning bolt arcs down out of the sky to strike you between\nthe eyes\n'),
            sendWizards(state, `[ ${actorName(state)} has just been zapped by ${playerName(data.sender)} and terminated ]\n`),
        ])
            .then(() => Promise.all([
                removePerson(state, getName(state)),
                Events.sendSocialEvent(
                    state,
                    '[author] has just died.\n\n',
                    PLAYER_MESSAGE,
                ),
                sendBaseMessage(state, `You have been utterly destroyed by ${data.sender.name}\n`)
            ]))
            .then(() => looseGame(state, data.actor, 'Bye Bye.... Slain By Lightning'));
    } else if (isHere(state, data.channelId)) {
        return sendVisibleMessage(state, 'A massive lightning bolt strikes [author]\n', data.sender.name);
    } else {
        return Promise.resolve();
    }
};
const receiveSimpleShout = (state: State, data: EventData): Promise<void> => {
    if (isHere(state, data.channelId) || isWizard(state)) {
        return sendAudibleMessage(state, `[author] shouts '${data.payload}'\n`, data.sender.name);
    } else {
        return sendAudibleMessage(state, `A voice shouts '${data.payload}'\n`);
    }
};
const receiveSay = (state: State, data: EventData): Promise<void> => {
    if (isHere(state, data.channelId)) {
        return sendAudibleMessage(state, `[author] says '${data.payload}'\n`, data.sender.name);
    } else {
        return Promise.resolve();
    }
};
const receiveTell = (state: State, data: EventData): Promise<void> => {
    return sendAudibleMessage(state, `[author] tells you '${data.payload}'\n`, data.sender.name);
};
const receiveKick = (state: State, data: EventData, isMe: boolean): Promise<void> => {
    if (isMe) {
        return looseGame(state, data.actor, 'You have been kicked off');
    } else {
        return sendBaseMessage(state, `${data.receiver.name} has been kicked off\n`);
    }
};
const receivePrivate = (state: State, data: EventData): Promise<void> => {
    return sendMessage(state, data.payload);
};
const receiveSummon = (state: State, data: EventData): Promise<void> => {
    if (isWizard(state)) {
        return sendBaseMessage(state, `${playerName(data.sender)} tried to summon you`);
    }
    setSummoned(state, data.channelId);
    return sendBaseMessage(state, `You drop everything you have as you are summoned by ${playerName(data.sender)}`);
};
const receiveDamageEvent = (state: State, data: EventData, isMe: boolean): Promise<void> => {
    if (!isHere(state, data.channelId)) {
        return Promise.resolve();
    }
    setIsDamagedBy(state, data.sender.playerId);
    return receiveDamage(state, data.payload, isMe, data.actor);
};
const receiveEndFight = (state: State, data: EventData): Promise<void> => Battle.getEnemy(state)
    .then((enemy) => {
        const { receiver } = data;
        if (!enemy) {
            return;
        }
        if (enemy.playerId !== receiver.playerId) {
            return;
        }
        Battle.stopFight(state);
    });

export const receiveEvent = (state: State, actor: Player, event: Event): Promise<void> => {
    const isMe = event.receiver.toLowerCase() === getName(state).toLowerCase();

    const actions = {
        '-400': (data: EventData) => onlyMe(state, isMe, data, receiveStopSnoop),
        '-401': (data: EventData) => onlyMe(state, isMe, data, receiveSnoop),
        '-599': (data: EventData) => onlyMe(state, isMe, data, receiveChangePerson),
        '-666': (data: EventData) => receiveEvil(state, data),
        '-750': (data: EventData) => onlyMe(state, isMe, data, receive750),
        '-9900': (data: EventData) => receiveVisibility(state, data),
        '-10000': (data: EventData) => notMe(state, isMe, data, receiveLocalMessage),
        '-10001': (data: EventData) => receiveExorcise(state, data, isMe),
        '-10002': (data: EventData) => notMe(state, isMe, data, receiveSimpleShout),
        '-10003': (data: EventData) => notMe(state, isMe, data, receiveSay),
        '-10004': (data: EventData) => onlyMe(state, isMe, data, receiveTell),
        '-10010': (data: EventData) => receiveKick(state, data, isMe),
        '-10011': (data: EventData) => onlyMe(state, isMe, data, receivePrivate),
        '-10020': (data: EventData) => onlyMe(state, isMe, data, receiveSummon),
        '-10021': (data: EventData) => onlyMe(state, isMe, data, receiveDamageEvent),
        '-10030': (data: EventData) => receiveWeather(state, data),
        '-20000': (data: EventData) => receiveEndFight(state, data),
    };

    const getAction = (code: number, data: EventData) => {
        if (code === -20000) {
            return actions[code];
        } else if (code < -10099) {
            return newReceive(state, code, isMe);
        } else {
            return actions[code];
        }
    };

    const {
        channelId,
        code,
        payload,
    } = event;
    return Promise.all([
        findPlayer(state, event.receiver),
        findPlayer(state, event.sender),
    ])
        .then(([
            receiver,
            sender,
        ]) => {
            const data: EventData = {
                actor,
                sender,
                receiver,
                channelId,
                payload,
            };
            const action = getAction(code, data) || (() => Promise.resolve());
            return action(data);
        });
};
