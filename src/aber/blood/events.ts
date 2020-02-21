import State from "../state";
import {
    getItem,
    getPlayer,
} from '../support';
import {
    bprintf,
    sendsys,
} from '../__dummies';
import {logger} from '../files';
import {dropMyItems} from '../objsys';
import {sendName} from '../bprintf';
import {setFight} from './reducer';
import {Attack} from './index';

const openworld = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const crapup = (state: State, message: string): void => undefined;
const delpers = (state: State, name: string): void => undefined;
const loseme = (state: State): void => undefined;

const WRAITH_ID = 16;

export const receiveDamage = (state: State, attack: Attack, isMe: boolean): Promise<void> => Promise.all([
    getPlayer(state, attack.characterId),
    Promise.resolve(attack.damage),
    getItem(state, attack.weaponId),
])
    .then(([
        enemy,
        damage,
        weapon,
    ]) => {
        const lifeDrain = () => {
            state.my_sco -= 100 * damage;
            bprintf(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
            if (state.my_sco < 0) {
                state.my_str = -1;
            }
        };

        const killed = () => Promise.all([
            logger.write(`${state.globme} slain by ${enemy.name}`),
            dropMyItems(state),
        ])
            .then(() => {
                loseme(state);
                closeworld(state);
                delpers(state, state.globme);
                openworld(state);
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10000,
                    state.curch,
                    `${sendName(state.globme)} has just died.\n`,
                );
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10113,
                    state.curch,
                    `[ ${sendName(state.globme)} has been slain by ${sendName(enemy.name)}[/p] ]\n`,
                );
                return crapup(state, 'Oh dear... you seem to be slightly dead');
            });

        const missed = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            bprintf(state, `${sendName(enemy.name)} attacks you${weaponMessage}\n`);
        };

        const wounded = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            bprintf(state, `You are wounded by ${sendName(enemy.name)}${weaponMessage}\n`);

            if (state.my_lev < 10) {
                // Set Damage
                state.my_str -= damage;
                if (enemy.playerId === WRAITH_ID) {
                    lifeDrain();
                }
            }

            if (state.my_str < 0) {
                return killed();
            }

            state.me_cal = 1; /* Queue an update when ready */
        };

        if (!isMe) {
            /* for mo */
            return;
        }
        if (!enemy) {
            return;
        }
        if (!enemy.exists) {
            return;
        }

        setFight(state, enemy);
        return (damage === undefined)
            ? missed()
            : wounded();
    });
