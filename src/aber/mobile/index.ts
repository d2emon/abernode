import State from '../state';
import {roll} from '../magic';
import {getItem, getPlayer, getPlayers, Item, Player, setPlayer} from "../support";
import {byMask, findPlayer, isCarriedBy} from "../objsys";
import {IS_LIT} from "../object";
import {sendMessage} from "../bprintf/bprintf";
import {sendVisibleName} from '../bprintf';
import {hitPlayer} from "../blood";
import {sendsys} from "../__dummies";
import {endGame} from "../gamego/endGame";

const mhitplayer = (state: State, enemy: Player, victim: Player): Promise<void> => Promise.resolve();
const calibme = (state: State): Promise<void> => Promise.resolve();
const loseme = (state: State): Promise<void> => Promise.resolve();

const moveBot = (state: State, player: Player): Promise<void> => Promise.resolve();

const checkFight = (state: State, player: Player, enemy: Player): Promise<void> => {
    const hitByMonster = (): Promise<void> => Promise.all([
        roll(),
        byMask(state, { [IS_LIT]: true }),
        findPlayer(state, 'yeti'),
    ])
        .then(([
            successRoll,
            found,
            yeti,
        ]) => {
            if (successRoll > 40) {
                return;
            } else if ((enemy.playerId === yeti.playerId) && found) {
                return;
            } else {
                return mhitplayer(state, enemy, player);
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
            if (enemy.locationId !== state.curch) {
                return;
            }
            if (player.visibility) {
                /* Im invis */
                return;
            }
            return hitByMonster();
        });

};

const doRune = (state: State, runeSword: Item): Promise<void> => {
    const getVictim = (): Promise<Player> => getPlayers(state, 32)
        .then(players => players.find((player) => {
            if (player.playerId === state.mynum) {
                return false;
            }
            if (!player.exists) {
                return false;
            }
            if (player.isWizard) {
                return false;
            }
            return (player.locationId === state.curch);
        }))
        .then(player => findPlayer(state, player.name));

    if (state.in_fight) {
        return Promise.resolve();
    }
    return Promise.all([
        getVictim(),
        roll(),
    ])
        .then(([
            victim,
            successRoll,
        ]) => victim && (successRoll < 9 * state.my_lev) && Promise.all([
            sendMessage(state, 'The runesword twists in your hands lashing out savagely\n'),
            hitPlayer(state, victim, runeSword),
        ]))
        .then(() => {});
};

const checkHelp = (state: State, player: Player): Promise<void> => getPlayer(state, player.helping)
    .then((helping) => {
        if (!helping) {
            return;
        }
        if (!state.i_setup) {
            return;
        }
        if (helping.exists && (helping.locationId === state.curch)) {
            return;
        }
        return Promise.all([
            setPlayer(state, state.mynum, { helping: -1 }),
            sendMessage(state, `You can no longer help ${sendVisibleName(helping.name)}\n`),
        ]);
    })
    .then(() => {});

export const onLook = (state: State): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItem(state, 45),
])
    .then(([
        player,
        item45,
    ]) => {
        const checkEnemy = (name: string): Promise<void> => findPlayer(state, name)
            .then(enemy => checkFight(state, player, enemy));
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
        if (!isCarriedBy(item45, player, (state.my_lev < 10))) {
            enemies.push('wraith');
            enemies.push('zombie');
        }
        return Promise.all([
            ...enemies.map(checkEnemy),
            getItem(state, 32)
                .then(runeSword => isCarriedBy(runeSword, player, (state.my_lev < 10)) && doRune(state, runeSword)),
            checkHelp(state, player),
        ]);
    })
    .then(() => {});

export const onTime = (state: State): Promise<void> => roll()
    .then(eventRoll => (eventRoll > 80) && onLook(state));

export const getDragon = (state: State): Promise<Player> => {
    if (state.my_lev > 9) {
        return Promise.resolve(undefined);
    }
    return findPlayer(state, 'dragon')
        .then((dragon) => ((dragon && (dragon.locationId === state.curch)) ? dragon : undefined));
};

const dropPepper = (state: State): Promise<void> => {
    /* Fried dragon */
    const fried = (dragon: Player) => setPlayer(state, dragon.playerId, { exists: false })
        .then(() => {
            /* No dragon */
            state.my_sco += 100;
            return calibme(state);
        });

    /* Whoops !*/
    const dragonSneeze = () => {
        loseme(state);
        return sendMessage(state, 'The dragon sneezes forth a massive ball of flame.....\n'
            + 'Unfortunately you seem to have been fried\n')
            .then(() => endGame(state, 'Whoops.....   Frying tonight'));
    };

    sendsys(
        state,
        null,
        null,
        -10000,
        state.curch,
        'You start sneezing ATISCCHHOOOOOO!!!!\n',
    );
    return Promise.all([
        getPlayer(state, state.mynum),
        getPlayer(state, 32),
        getItem(state, 89),
    ])
        .then(([
            player,
            dragon,
            pepper
        ]) => {
            if (!dragon.exists || (dragon.locationId !== state.curch)) {
                return;
            }
            /* Ok dragon and pepper time */
            return (isCarriedBy(pepper, player, (state.my_lev < 10)) && (pepper.heldBy !== undefined))
                ? fried(dragon)
                : dragonSneeze();
        });
};

