import State from "../state";
import {Event} from '../services/world';
import {getLocationId, getName} from "../tk/reducer";
import Events from '../tk/events';
import {findPlayer} from "../objsys";
import {newReceive} from "../new1/events";
import {Player, setPlayer} from "../support";
import {looseGame} from "../tk";
import {setLevel, setScore, setStrength} from "../newuaf/reducer";
import {calibrate} from "./index";
import {sendMessage} from "../bprintf/bprintf";

export const sendMyMessage = (state: State, message: string): Promise<void> => Events.sendLocalMessage(
    state,
    getLocationId(state),
    getName(state),
    message,
);

const onlyMe = (isMe: boolean, callback): Promise<void> => (
    isMe
        ? callback()
        : Promise.resolve()
);

export const receiveEvent = (state: State, actor: Player, event: Event): Promise<void> => {
    const isMe = event.receiver.toLowerCase() === getName(state).toLowerCase();

    const actions = {
        '-599': () => onlyMe(isMe, () => {
            const {
                payload,
            } = event;
            const {
                level,
                score,
                strength,
            } = payload;
            setLevel(state, level);
            setScore(state, score);
            setStrength(state, strength);
            return calibrate(state, actor);
        }),
        '-666': () => sendMessage(state, 'Something Very Evil Has Just Happened...\n')
            .then(() => looseGame(state, actor, 'Bye Bye Cruel World....')),
        '-9900': () => {
            const {
                payload,
            } = event;
            const {
                playerId,
                visibility,
            } = payload;
            return setPlayer(state, playerId, { visibility })
        },
        '-20000': () => {
            state.in_fight = 0;
            state.fighting = -1;
            return Promise.resolve();
        },
    };

    const {
        code,
        receiver,
        sender,
        payload,
    } = event;
    return Promise.all([
        findPlayer(state, receiver),
        findPlayer(state, sender),
    ])
        .then(([
            receiver,
            sender,
        ]) => {
            if ((code === -20000) && (receiver.playerId === state.fighting)) {
                return (receiver.playerId === state.fighting) && actions[code];
            } else if (code < -10099) {
                return newReceive(state, actor, isMe, receiver, sender, event);
            } else {
                return actions[code];
            }
        })
        .then(action => action || (() => Promise.resolve()))
        .then(action => action());
};
