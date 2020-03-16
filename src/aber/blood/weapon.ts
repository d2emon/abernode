import State from "../state";
import {getItem, Item, Player} from "../support";
import {checkRoll, roll} from "../magic";
import {Attack} from "../tk/events";
import {getToHit} from "../newuaf/reducer";
import {isWornBy} from "../new1";
import * as BloodReducer from './reducer';
import * as ItemEvents from "../events/item";

const UNARMED_DAMAGE = 4;

export interface WeaponModel {
    item?: Item,
    damage?: number,
    isWeapon: boolean,
    unarmed: boolean,
    weaponId?: number,
    wield: (state: State) => Promise<void>,
    attack: (state: State, actor: Player, target: Player) => Promise<Attack>,
}

const fromState = (state: State) => ({
    getWeapon: (): Promise<Item> => getItem(
        state,
        BloodReducer.getWeaponId(state)
    ),
    setWeapon: (item?: Item): void => BloodReducer.setWeaponId(
        state,
        item
            ? item.itemId
            : undefined
    ),
});

const getArmorBonus = (state: State, player: Player): Promise<number> => Promise.all([
    getItem(state, 89),
    getItem(state, 113),
    getItem(state, 114),
])
    .then(shields => shields.filter(shield => isWornBy(state, shield, player)))
    .then(shields => shields.length
        ? 10
        : 0
    );

/* Chance to hit stuff */
const playerToHit = (state: State, player: Player): Promise<number> => getArmorBonus(state, player)
    .then(armorBonus => getToHit(state) - armorBonus)
    .then(toHit => (toHit >= 0)
        ? toHit
        : 0
    );

export const Weapon = (item?: Item): WeaponModel => {
    const weaponId = item && item.itemId;
    const unarmed = !item;
    const damage = unarmed ? UNARMED_DAMAGE : item.damage;
    const isWeapon = damage !== undefined;
    const hitRoll = (state: State, target: Player): Promise<boolean> => playerToHit(state, target)
        .then(toHit => checkRoll(r => r < toHit));
    const damageRoll = (hit: boolean): Promise<number | undefined> => (hit && isWeapon)
        ? roll().then(result => result % damage)
        : Promise.resolve(undefined);
    const attack = (actor: Player) => (hit: boolean): Promise<Attack> => damageRoll(hit)
        .then(damage => ({
            hit,
            characterId: actor.playerId,
            damage,
            weaponId,
        }));

    return {
        item,
        damage,
        isWeapon,
        unarmed,
        weaponId,
        wield: (state: State): Promise<void> => isWeapon
            ? Promise.resolve(fromState(state).setWeapon(item))
            : Promise.reject(new Error()),
        attack: (state: State, actor: Player, target: Player): Promise<Attack> => ItemEvents
            .onHit(item)(state, actor, target, item)
            .then(() => hitRoll(state, target))
            .then(attack(actor)),
    };
};

export const DefaultWeapon = (state: State) => fromState(state)
    .getWeapon()
    .then(item => Weapon(item));
