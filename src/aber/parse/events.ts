import State from "../state";
import {Player} from "../support";

export interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}

export interface Event {
    channelId?: number,
    code: number,
    payload?: any,
    receiver?: string,
    sender?: string,
}

const send2 = (state: State, event: Event): Promise<void> => Promise.resolve();

const emitEvent = (
    state: State,
    receiver: string,
    sender: string,
    code: number,
    channelId: number,
    payload: any,
): Promise<void> => send2(
    state,
    {
        channelId,
        code,
        receiver,
        sender,
        payload,
    },
);

export const sendStopSnoop = (state: State, snooped: Player): Promise<void> => send2(state, {
    receiver: snooped.name,
    sender: undefined,
    code: -400,
    channelId: undefined,
    payload: undefined,
});
export const sendSnoop = (state: State, snooped: Player, snooper: string): Promise<void> => send2(state, {
    receiver: snooped.name,
    sender: snooper,
    code: -401,
    channelId: undefined,
    payload: undefined,
});
export const sendChangePerson = (state: State, person: Player, payload: {}): Promise<void> => send2(state, {
    receiver: person.name,
    sender: undefined,
    code: -599,
    channelId: undefined,
    payload,
});
export const sendEvil = (state: State): Promise<void> => send2(state, {
    receiver: undefined,
    sender: undefined,
    code: -666,
    channelId: undefined,
    payload: undefined,
});
export const sendVisibility = (state: State, payload: {}): Promise<void> => send2(state, {
    receiver: undefined,
    sender: undefined,
    code: -9900,
    channelId: undefined,
    payload,
});
export const sendLocalMessage = (state: State, channelId: number, sender: string, message: string): Promise<void> => send2(state, {
    receiver: sender,
    sender,
    code: -10000,
    channelId,
    payload: message,
});
export const sendExorcise = (state: State, sender: string, receiver: Player, channelId: number): Promise<void> => send2(state, {
    receiver: receiver.name,
    sender,
    code: -10001,
    channelId,
    payload: undefined,
});
export const sendSimpleShout = (state: State, message: string): Promise<void> => send2(state, {
    receiver: state.globme,
    sender: state.globme,
    code: -10002,
    channelId: state.curch,
    payload: message,
});
export const sendSay = (state: State, message: string): Promise<void> => send2(state, {
    receiver: state.globme,
    sender: state.globme,
    code: -10003,
    channelId: state.curch,
    payload: message,
});
export const sendTell = (state: State, receiver: Player, message: string): Promise<void> => send2(state, {
    receiver: receiver.name,
    sender: state.globme,
    code: -10004,
    channelId: undefined,
    payload: message,
});
export const sendKick = (state: State, receiver: Player): Promise<void> => send2(state, {
    receiver: receiver.name,
    sender: undefined,
    code: -10010,
    channelId: undefined,
    payload: undefined,
});
export const sendPrivate = (state: State, receiver: Player, message: string): Promise<void> => send2(state, {
    receiver: receiver.name,
    sender: undefined,
    code: -10011,
    channelId: undefined,
    payload: message,
});
export const sendSummon = (state: State, victim: Player, sender: string, channelId: number): Promise<void> => send2(state, {
    receiver: victim.name,
    sender,
    code: -10020,
    channelId,
    payload: undefined,
});
export const sendDamage = (state: State, victim: Player, attack: Attack): Promise<void> => send2(state, {
    receiver: victim.name,
    sender: undefined,
    code: -10021,
    channelId: state.curch,
    payload: attack,
});
export const sendWeather = (state: State, weatherId: number): Promise<void> => send2(state, {
    receiver: undefined,
    sender: undefined,
    code: -10030,
    channelId: undefined,
    payload: weatherId,
});
export const sendEndFight = (state: State, receiver: string): Promise<void> => send2(state, {
    receiver: receiver,
    sender: undefined,
    code: -20000,
    channelId: undefined,
    payload: undefined,
});

export const sendMyMessage = (state: State, message: string): Promise<void> => sendLocalMessage(
    state,
    state.curch,
    state.globme,
    message,
);
