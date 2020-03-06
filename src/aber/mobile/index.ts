import State from '../state';
import {checkRoll, roll} from '../magic';
import {
    Item,
    Player,
    getItem,
    getPlayer,
    getPlayers,
    setPlayer,
} from "../support";
import {
    byMask,
    findPlayer,
    isCarriedBy,
} from "../objsys";
import {IS_LIT} from "../object";
import {sendMessage} from "../bprintf/bprintf";
import {sendVisibleName} from '../bprintf';
import {hitPlayer} from "../blood";
import {endGame} from "../gamego/endGame";
import {setPlayerDamage} from "../new1";
import {getLevel, isWizard, updateScore} from "../newuaf/reducer";
import {sendLocalMessage} from "../parse/events";
import {getCanCalibrate, getLocationId, isHere, playerIsMe} from "../tk/reducer";

const loseme = (state: State): Promise<void> => Promise.resolve();

const moveBot = (state: State, player: Player): Promise<void> => Promise.resolve();

const checkFight = (state: State, player: Player, enemy: Player): Promise<void> => {
    const hitByMonster = (): Promise<void> => Promise.all([
        checkRoll(r => r > 40),
        byMask(state, player, { [IS_LIT]: true }),
        findPlayer(state, 'yeti'),
    ])
        .then(([
            success,
            found,
            yeti,
        ]) => {
            if (success) {
                return;
            } else if ((enemy.playerId === yeti.playerId) && found) {
                return;
            } else {
                return setPlayerDamage(state, enemy, player);
            }
        });

    if (!enemy) {
        /* No such being */
        return Promise.resolve();
    }
    /* Maybe move it */
    return moveBot(state, enemy)
        .then(() => {
            if (!enemy.exists) {
                return;
            }
            if (!isHere(state, enemy.locationId)) {
                return;
            }
            if (player.visibility) {
                /* Im invis */
                return;
            }
            return hitByMonster();
        });

};

const doRune = (state: State, actor: Player, runeSword: Item): Promise<void> => {
    const getVictim = (): Promise<Player> => getPlayers(state, 32)
        .then(players => players.find((player) => {
            if (playerIsMe(state, player.playerId)) {
                return false;
            }
            if (!player.exists) {
                return false;
            }
            if (player.isWizard) {
                return false;
            }
            return (isHere(state, player.locationId));
        }))
        .then(player => findPlayer(state, player.name));

    if (state.in_fight) {
        return Promise.resolve();
    }
    return Promise.all([
        getVictim(),
        checkRoll(r => r < 9 * getLevel(state)),
    ])
        .then(([
            victim,
            success,
        ]) => victim && success && Promise.all([
            sendMessage(state, 'The runesword twists in your hands lashing out savagely\n'),
            hitPlayer(state, actor, victim, runeSword),
        ]))
        .then(() => {});
};

const checkHelp = (state: State, player: Player): Promise<void> => getPlayer(state, player.helping)
    .then((helping) => {
        if (!helping) {
            return;
        }
        if (!getCanCalibrate(state)) {
            return;
        }
        if (helping.exists && isHere(state, helping.locationId)) {
            return;
        }
        return Promise.all([
            setPlayer(state, player.playerId, { helping: -1 }),
            sendMessage(state, `You can no longer help ${sendVisibleName(helping.name)}\n`),
        ]);
    })
    .then(() => {});

export const onLook = (state: State, actor: Player): Promise<void> => getItem(state, 45)
    .then((item45) => {
        const checkEnemy = (name: string): Promise<void> => findPlayer(state, name)
            .then(enemy => checkFight(state, actor, enemy));
        const enemies = [
            'shazareth',
            'bomber',
            'owin',
            'glowin',
            'smythe',
            'dio',
            'rat',
            'ghoul',
            'ogre',
            'riatha',
            'yeti',
            'guardian',
        ];
        if (!isCarriedBy(item45, actor, !isWizard(state))) {
            enemies.push('wraith');
            enemies.push('zombie');
        }
        return Promise.all([
            ...enemies.map(checkEnemy),
            getItem(state, 32)
                .then(runeSword => isCarriedBy(runeSword, actor, !isWizard(state)) && doRune(state, actor, runeSword)),
            checkHelp(state, actor),
        ]);
    })
    .then(() => {});

export const onTime = (state: State, actor: Player): Promise<void> => checkRoll(r => r > 80)
    .then(eventRoll => eventRoll && onLook(state, actor));

export const getDragon = (state: State): Promise<Player> => {
    if (isWizard(state)) {
        return Promise.resolve(undefined);
    }
    return findPlayer(state, 'dragon')
        .then((dragon) => ((dragon && isHere(state, dragon.locationId)) ? dragon : undefined));
};

const dropPepper = (state: State, actor: Player): Promise<void> => {
    /* Fried dragon */
    const fried = (dragon: Player) => setPlayer(state, dragon.playerId, { exists: false })
        .then(() => updateScore(state, 100, true)); /* No dragon */

    /* Whoops !*/
    const dragonSneeze = () => {
        loseme(state);
        return sendMessage(state, 'The dragon sneezes forth a massive ball of flame.....\n'
            + 'Unfortunately you seem to have been fried\n')
            .then(() => endGame(state, 'Whoops.....   Frying tonight'));
    };

    return Promise.all([
        getPlayer(state, 32),
        getItem(state, 89),
        sendLocalMessage(state, getLocationId(state), undefined, 'You start sneezing ATISCCHHOOOOOO!!!!\n'),
    ])
        .then(([
            dragon,
            pepper
        ]) => {
            if (!dragon.exists || !isHere(state, dragon.locationId)) {
                return;
            }
            /* Ok dragon and pepper time */
            return (isCarriedBy(pepper, actor, !isWizard(state)) && (pepper.heldBy !== undefined))
                ? fried(dragon)
                : dragonSneeze();
        });
};

