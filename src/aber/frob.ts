import State from "./state";
import {bprintf} from "./__dummies";
import {getPlayer} from "./support";
import {findVisiblePlayer} from "./objsys";

const frobnicate = (state: State): Promise<void> => {
    /*
	extern char wordbuf[];
	extern long my_lev;
	int x;
	char ary[128];
	char bf1[8],bf2[8],bf3[8];
	*/
    if (state.my_lev < 10000) {
        bprintf(state, 'No way buster.\n');
        return Promise.resolve();
    }
    if (brkword() === -1) {
        bprintf(state, 'Frobnicate who ?\n');
        return Promise.resolve();
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if ((player.playerId > 15) && (state.my_lev !== 10033)) {
                return bprintf(state, 'Can\'t frob mobiles old bean.\n');
            }
            if (player.isGod && (state.my_lev !== 10033)) {
                return bprintf(state, `You can\'t frobnicate ${player.name}!!!!\n`);
            }
            bprintf(state, 'New Level: ');
            pbfr(state);
            keysetback(state);
            const bf1 = getkbd(state, 6);
            bprintf(state, 'New Score: ');
            pbfr(state);
            const bf2 = getkbd(state, 8);
            bprintf(state, 'New Strength: ');
            pbfr(state);
            const bf3 = getkbd(state, 8);
            keysetup();
            const ary = `${bf1}.${bf2}.${bf3}`;
            openworld(state);
            sendsys(state, player.name, player.name, -599, 0, ary);
            bprintf(state, 'Ok....\n');
        });
};
