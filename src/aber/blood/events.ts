import State from "../state";
import {
    getItem,
    getPlayer, Player,
} from '../support';
import {logger} from '../files';
import {dropMyItems} from '../objsys';
import {sendName} from '../bprintf';
import {setFight} from './reducer';
import {sendMessage} from '../bprintf/bprintf';
import {endGame} from "../gamego/endGame";
import {sendWizards} from "../new1/events";
import {removePerson} from "../newuaf";
import {getStrength, isWizard, updateScore, updateStrength} from "../newuaf/reducer";
import {loadWorld, saveWorld} from "../opensys";
import {Attack} from "../tk/events";
import {sendMyMessage} from "../parse/events";
import {getName} from "../tk/reducer";

const loseme = (state: State): void => undefined;

const WRAITH_ID = 16;

export const receiveDamage = (state: State, attack: Attack, isMe: boolean, actor: Player): Promise<void> => Promise.all([
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
            updateScore(state, -100 * damage);
            return sendMessage(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
        };

        const killed = () => dropMyItems(state, actor)
            .then(() => {
                loseme(state);
                return saveWorld(state);
            })
            .then(() => loadWorld(state))
            .then(newState => Promise.all([
                sendMyMessage(state, `${sendName(getName(state))} has just died.\n`),
                sendWizards(state, `[ ${sendName(getName(state))} has been slain by ${sendName(enemy.name)}[/p] ]\n`),
                logger.write(`${getName(state)} slain by ${enemy.name}`),
                removePerson(state, getName(state)),
                endGame(state, 'Oh dear... you seem to be slightly dead'),
            ]))
           .then(() => {});

        const missed = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            return sendMessage(state, `${sendName(enemy.name)} attacks you${weaponMessage}\n`);
        };

        const wounded = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            return sendMessage(state, `You are wounded by ${sendName(enemy.name)}${weaponMessage}\n`)
                .then(() => {
                    if (isWizard(state)) {
                        return;
                    }
                    // Set Damage
                    updateStrength(state, damage);
                    if (enemy.playerId === WRAITH_ID) {
                        return lifeDrain();
                    }
                })
                .then(() => {
                    if (getStrength(state) < 0) {
                        return killed();
                    }

                    state.me_cal = 1; /* Queue an update when ready */
                });
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
