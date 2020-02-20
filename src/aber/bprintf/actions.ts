import Action from "../action";
import State from "../state";

const fopen = (fileName: string, mode: string): Promise<any> => Promise.resolve({});
const fprintf = (file: any, data: any): Promise<void> => Promise.resolve();
const fclose = (file: any): Promise<void> => Promise.resolve();

const geteuid = (state: State): void => undefined;
const getuid = (state: State): void => undefined;

// Getters / Setters

const getLogFile = (state: State): any => state.log_fl;
const setLogFile = (state: State, logFile: any): void => {
    state.log_fl = logFile;
};

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
