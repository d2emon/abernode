import State from "../state";
import {Item, Player} from "../support";

export type OnDropEvent = (state: State, actor: Player, item: Item) => Promise<void>;
export type OnEnterEvent = (state: State, actor: Player) => Promise<number>;
export type OnExitEvent = (state: State, actor: Player, directionId: number) => Promise<void>;
export type OnGetEvent = (state: State, actor: Player, item: Item) => Promise<Item>;
