import Action from '../action';
import State from '../state';
import {
    getLogFile,
    getSnooped,
    setLogFile,
    startSnoop,
    stopSnoop,
} from './reducer';
import {Player} from '../support';
import {
    brkword,
    sendsys,
} from '../__dummies';
import {findVisiblePlayer} from '../objsys';
import {openSnoop} from './snoop';

const fopen = (fileName: string, mode: string): Promise<any> => Promise.resolve({});
const fprintf = (file: any, data: any): Promise<void> => Promise.resolve();
const fclose = (file: any): Promise<void> => Promise.resolve();

const geteuid = (state: State): void => undefined;
const getuid = (state: State): void => undefined;

// Actions

export class Log extends Action {
    openLog(state: State): Promise<void> {
        return fopen('mud_log', 'a')
            .then((logFile) => logFile || fopen('mud_log', 'w'))
            .then((logFile) => {
                setLogFile(state, logFile);
                if (!logFile) {
                    throw new Error('Cannot open log file mud_log')
                }
            });
    }

    closeLog(state: State): Promise<void> {
        const logFile = getLogFile(state);
        return fprintf(logFile, '\nEnd of log....\n\n')
            .then(() => fclose(logFile))
            .then(() => setLogFile(state, undefined));
    }

    action(state: State): Promise<any> {
        if (getuid(state) !== geteuid(state)) {
            throw new Error('Not allowed from this ID');
        }
        if (getLogFile(state)) {
            return this.closeLog(state)
                .then(() => ({ logFile: undefined }));
        }
        return this.openLog(state)
            .then(() => ({ logFile: getLogFile(state) }));
    }

    decorate(result: any): void {
        const {
            logFile,
        } = result;
        if (logFile) {
            this.output('Commencing Logging Of Session\n');
            this.output('The log will be written to the file \'mud_log\'\n');
        } else {
            this.output('End of log\n');
        }
    }

}

export class Snoop extends Action {
    touchSnoopFile = (name: string) => openSnoop(name, 'w')
        .then((snoopFile) => fprintf(snoopFile, '').then(() => fclose(snoopFile)));

    stopSnoop(state: State, snooped: Player): Promise<any> {
        stopSnoop(state);
        sendsys(
            state,
            snooped.name,
            state.globme,
            -400,
            0,
            null,
        );
        return Promise.resolve({
            messages: `Stopped snooping on ${snooped.name}\n`,
        });
    }

    startSnoop(state: State): Promise<any> {
        if (brkword(state) === -1) {
            return Promise.resolve();
        }
        return findVisiblePlayer(state, state.wordbuf)
            .then((snooped) => {
                if (!snooped) {
                    throw new Error('Who is that ?');
                }
                if (((state.my_lev < 10000) && snooped.isWizard) || !snooped.canBeSnooped) {
                    stopSnoop(state);
                    throw new Error('Your magical vision is obscured');
                }
                startSnoop(state, snooped);
                const message = `Started to snoop on ${snooped.name}\n`;
                sendsys(
                    state,
                    snooped.name,
                    state.globme,
                    -401,
                    0,
                    null,
                );
                return state.globme;
            })
            .then(this.touchSnoopFile);

    }

    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('Ho hum, the weather is nice isn\'t it');
        }
        return getSnooped(state)
            .then(snooped => (snooped ? this.stopSnoop(state, snooped) : this.startSnoop(state)));
    }
}