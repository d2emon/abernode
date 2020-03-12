import Action from '../action';
import State from '../state';
import Battle from './battle';
import {
    Item,
    Player,
} from '../support';
import {
    findAvailableItem,
    findCarriedItem,
    findVisiblePlayer,
} from '../objsys';
import {
    hitPlayer,
} from './index';
import {
    calibrate
} from "../parse";
import * as ItemEvents from "../events/item";
import {setValidWeapon} from "./weapon";

interface WeaponArgs {
    weapon?: Item,
}
interface WeaponResult {
    weaponId?: number,
}

interface KillArgs {
    item?: Item,
    player?: Player,
    weapon?: Item,
}
interface KillPlayerResult {
    playerId?: number,
    weaponId?: number,
}
interface BreakItemResult {
    itemId?: number,
}
type KillResult = KillPlayerResult | BreakItemResult;

export class Weapon extends Action {
    getArgs(state: State, actor: Player): Promise<WeaponArgs> {
        return Action.nextWord(state, 'Which weapon do you wish to select though')
            .then(name => findCarriedItem(state, name, actor))
            .then(weapon => Action.checkItem(weapon, 'What\'s one of those?'))
            .then(weapon => ({ weapon }));
    }

    action(state: State, actor: Player, args: WeaponArgs): Promise<WeaponResult> {
        const weapon = setValidWeapon(state, args.weapon);
        return calibrate(state, actor)
            .then(() => ({ weaponId: weapon && weapon.itemId }));
    }

    decorate(result: any): void {
        this.output('OK...\n');
    }
}

export class Kill extends Action {
    private static breakItem = (
        state: State,
        actor: Player,
        target?: Item,
        weapon?: Item,
    ): Promise<BreakItemResult> => Promise.resolve(ItemEvents.onBreak(target))
        .then(event => event(state, actor, target))
        .then(() => ({
            itemId: target && target.itemId,
            weaponId: weapon && weapon.itemId,
        }));

    private static killPlayer = (
        state: State,
        actor: Player,
        target?: Player,
        weapon?: Item,
    ): Promise<KillPlayerResult> => Promise.all([
        Action.checkPlayer(target, 'You can\'t do that'),
        Action.checkNotMe(state, target, 'Come on, it will look better tomorrow...'),
        Action.checkHere(state, target.locationId, 'They aren\'t here'),
    ])
        .then(() => hitPlayer(state, actor, target, weapon))
        .then(() => ({
            playerId: target && target.playerId,
            weaponId: weapon && weapon.itemId,
        }));

    getArgs(state: State, actor: Player): Promise<KillArgs> {
        const checkDoor = (name: string): Promise<string> => (name === 'door')
            ? Promise.reject(new Error('Who do you think you are , Moog?'))
            : Promise.resolve(name);

        const getWeaponByName = (name: string): Promise<Item> | undefined => name && findCarriedItem(state, name, actor)
            .then(weapon => Action.checkItem(weapon, 'with what ?\n'));

        return Action.nextWord(state, 'Kill who')
            .then(checkDoor)
            .then(targetName => Promise.all([
                targetName,
                Action.nextWord(state),
            ]))
            .then(([
                targetName,
                weaponName,
            ]) => Promise.all([
                findAvailableItem(state, targetName, actor),
                findVisiblePlayer(state, targetName),
                getWeaponByName(weaponName),
            ]))
            .then(([
                item,
                player,
                weapon,
            ]) => ({
                item,
                player,
                weapon,
            }));
    }

    action(state: State, actor: Player, args: KillArgs): Promise<KillResult> {
        return args.item
            ? Kill.breakItem(state, actor, args.item)
            : Kill.killPlayer(state, actor, args.player, args.weapon);
    }
}
