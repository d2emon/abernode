import State from "../state";
import Events from '../tk/events';
import {
    getItem,
    getPlayer, Player,
} from '../support';
import {logger} from '../files';
import {actorName, playerName, sendBaseMessage} from '../bprintf';
import {setFight} from './reducer';
import {sendWizards} from "../new1/events";
import {removePerson} from "../newuaf";
import {getStrength, isWizard, updateScore, updateStrength} from "../newuaf/reducer";
import {loadWorld} from "../opensys";
import {Attack} from "../tk/events";
import {getName} from "../tk/reducer";
import {looseGame} from "../tk";
import {setCalibration} from "../parse/reducer";

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
            return sendBaseMessage(state, 'You feel weaker, as the wraiths icy touch seems to drain your very life force\n');
        };

        const killed = () => loadWorld(state)
            .then(() => Promise.all([
                Events.sendMyMessage(state, `${actorName(state)} has just died.\n`),
                sendWizards(state, `[ ${actorName(state)} has been slain by ${playerName(enemy)}[/p] ]\n`),
                logger.write(`${getName(state)} slain by ${enemy.name}`),
                removePerson(state, getName(state)),
            ]))
            .then(() => looseGame(state, actor, 'Oh dear... you seem to be slightly dead'));

        const missed = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            return sendBaseMessage(state, `${playerName(enemy)} attacks you${weaponMessage}\n`);
        };

        const wounded = () => {
            const weaponMessage = weapon ? ` with the ${weapon.name}` : '';
            return sendBaseMessage(state, `You are wounded by ${playerName(enemy)}${weaponMessage}\n`)
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
                .then(() => (getStrength(state) < 0)
                    ? killed()
                    : setCalibration(state) /* Queue an update when ready */
                );
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
