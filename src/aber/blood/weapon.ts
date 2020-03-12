import State from "../state";
import {getItem, Item, Player} from "../support";
import {checkRoll, roll} from "../magic";
import {Attack} from "../tk/events";
import {sendBaseMessage} from "../bprintf";
import {isCarriedBy} from "../objsys";
import {getToHit, isWizard} from "../newuaf/reducer";
import {isWornBy} from "../new1";
import Battle from "./battle";

const UNARMED_DAMAGE = 4;

export interface WeaponModel {
    item?: Item,
    damage?: number,
    isWeapon: boolean,
    unarmed: boolean,
    weaponId?: number,
    wield: (state: State) => void,
    attack: (state: State, actor: Player, target: Player) => Promise<Attack>,
}

const fromState = (state: State) => ({
    getWeapon: (): Promise<Item> => Battle.getWeapon(state),
    setWeapon: (item?: Item): void => Battle.setWeapon(state, item),
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
        wield: (state: State): void => fromState(state).setWeapon(item),
        attack: (state: State, actor: Player, target: Player): Promise<Attack> => hitRoll(state, target)
            .then(attack(actor)),
    };
};

export const DefaultWeapon = (state: State) => fromState(state)
    .getWeapon()
    .then(item => Weapon(item));

export const useWeapon = (state: State, actor: Player, item?: Item): Promise<WeaponModel> => {
    const useGoodWeapon = (state: State): Promise<Item> => Promise.resolve(Weapon(item))
        .then((weapon) => {
            weapon.wield(state);
            /*
            if (weapon.itemId === RUNE_SWORD_ID) {
                return swordVsSceptre(state, target)
            }
             */
            return weapon.item;
        });

    return Promise.resolve(item)
        .then((item) => {
            if (!item) {
                return;
            } else if (!isCarriedBy(item, actor, !isWizard(state))) {
                return Promise.reject(new Error(
                    `You belatedly realise you dont have the ${item.name},\n`
                        + 'and are forced to use your hands instead..',
                ));
            }
            return useGoodWeapon(state);
        })
        .catch(message => sendBaseMessage(state, message))
        .then(item => Weapon(item || undefined))
        .then(weapon => weapon.isWeapon
            ? weapon
            : Promise.reject(new Error('That\'s no good as a weapon'))
        )
        .then((weapon) => {
            weapon.wield(state);
            return weapon;
        });
};

export const setValidWeapon = (state: State, weapon?: Item): Item | undefined => {
    const weaponModel = Weapon(weapon);
    if (!weaponModel.isWeapon) {
        throw new Error('That\'s not a weapon')
    }
    fromState(state).setWeapon(weapon);
    return weapon;
};
