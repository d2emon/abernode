import State from "../state";
import {Player} from "../support";

export type OnEnterEvent = (state: State, actor: Player) => Promise<number>;
export type OnExitEvent = (state: State, actor: Player, directionId: number) => Promise<void>;
