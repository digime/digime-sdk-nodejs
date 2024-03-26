/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { fromPromise, setup, assign } from "xstate";
import type { SessionFileList } from "../../schemas/api/session/session-file-list";
// import { inspect } from "node:util";

type InputFunctions = {
    createSession: () => string | Promise<string>;
    fetchFileList: (sessionKey: string) => SessionFileList | Promise<SessionFileList>;
    processFile: (options: { sessionKey: string; fileName: string }) => void | Promise<void>;
};

/**
 * Machine for fetching data from Digi.me sessions
 */
export const sessionDataFetcherMachine = setup({
    types: {} as {
        input: InputFunctions & {
            sessionKey?: string;
        };

        context: InputFunctions & {
            fileList?: SessionFileList;
            fileListUpdatedAt: number;
            sessionKey?: string;
            readyFile?: { name: string; processedAt: number };
            processedFiles: Record<string, number>;
        };
    },

    actions: {
        setSessionKey: assign({
            sessionKey: (_, sessionKey: string) => sessionKey,
        }),

        setFileList: assign({
            fileList: (_, fileList: SessionFileList) => {
                return fileList;
            },
            fileListUpdatedAt: Date.now(),
        }),

        findReadyFile: assign({
            readyFile: ({ context }) => {
                const name = context.fileList?.fileList?.find((file) => {
                    const lastProcessedAt = context.processedFiles[file.name];
                    if (lastProcessedAt === undefined) {
                        return true;
                    }
                    return lastProcessedAt < file.updatedDate;
                })?.name;

                if (!name) {
                    return undefined;
                }
                return { name, processedAt: Date.now() };
            },
        }),

        markFileProcessed: assign({
            processedFiles: ({ context }) => {
                if (!context.readyFile) {
                    return context.processedFiles;
                }

                return {
                    ...context.processedFiles,
                    [context.readyFile.name]: context.readyFile.processedAt,
                };
            },
            readyFile: undefined,
        }),

        logError: () => {
            // console.log("Error", event.error);
        },
    },

    actors: {
        createSession: fromPromise(async ({ input }: { input: InputFunctions["createSession"] }) => {
            return await input();
        }),

        fetchFileList: fromPromise(
            async ({
                input: { fetchFileList, sessionKey },
            }: {
                input: { fetchFileList: InputFunctions["fetchFileList"]; sessionKey: string };
            }) => {
                return await fetchFileList(sessionKey);
            },
        ),

        processFile: fromPromise(
            async ({
                input: { processFile, sessionKey, fileName },
            }: {
                input: { processFile: InputFunctions["processFile"]; sessionKey: string; fileName: string };
            }) => {
                return await processFile({ sessionKey, fileName });
            },
        ),
    },

    guards: {
        hasSessionKey: ({ context }) => context.sessionKey !== undefined,
        hasReadyFile: ({ context }) => context.readyFile !== undefined,
        isSessionDone: ({ context }) => {
            return context.fileList?.status.state === "completed" || context.fileList?.status.state === "partial";
        },
    },

    delays: {
        fileListDelay: ({ context }) => {
            const sinceLast = Date.now() - context.fileListUpdatedAt;
            const delay = Math.min(Math.max(sinceLast, 0), 1000);
            return delay;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYBECGALngGJgEDGAFmAE4CyeVaWYAdGhADZgDEAygBUAggCUBAbQAMAXUSgADhnQFMWOSAAeiACwB2AEysAnPu0AObdoBsV-QGYrkqwBoQAT0QBaXWda2ArEZ2utqS-v4AjNZWAL4xriiw6Nj4RKQU1PSMlMxsHNz8wmLiEbJIIIrKqupaCLp22qyWZvpGkrqRZv5WEa4eCJ4RRkas9u1mkhEGRi12+nEJqKqpJGRUtAxMLKzkNGCEzFB8S9g8ENh5WABuGADWbInJuISrGRvZuTt7B1hHJ1gIZg3cgHbBSaTg9SVNAqbA1RAhEaTMw9JzaEx9RCSVi6JzdBqREKSJxWXQLECPZYvdLrLJbNi7fYqX7HJKqHi0GgYGiseScQgAM25AFtWJSUtS1plNjltoyfn82dhAdcMCDYVhwZDytCNfCEMMIk07BN9KSIha7BbMQMjI05iYutpArorMMzOTxc80lL3vTWAKpYdiGhuAAZNCwAhnC7sVX3MX-FY06UfbaBjLB0NgCNRlXA0GamTahRKGHVcq1OxhHERBr6Cz2IwRfT6G1mOysST6MI2OzdbRm4KepOSt502VsDNbKAh8OR6Oc7m8-kEIU0UVe5O+iefaey2fZ3MEfNqwtamRQst6ysI8K1nwRCxmIy6EwudyICI14lWt+BGx-HRMl4gpUcfXHGVPgAdzwGEeA0KNCDYPABQIWgAAp-GJABKHgtzHWkoO2WCYRLCprwrUBakiKxjG0Os8WsSZIhtOtOxMIYLVfas7XaEclW9V4iLTKdmAgQ4RH2CA3DnXhyN1KjNEQVpDDtE0HEHO1wl6T8EDsK0-H7DoTUkYZLBAxZBO3SDRIDcTJOk2Tsx4EoylLKo4VvBA9EafQohCfwzXsfRXRtAyjSsYyzRRBj-FxfwBKeGyRP9AUHN+KS8BkuTXP0dyKM8tRvOwzt-BNEwZgaSQGOCG0zUaHogmJKxytaKqkqpCDUsnXkuXIJZfly85tiBO4HnA4TU39eR+sGw9uFPdVVAvArFK86ivA6Jp0X87CenqFpdHC7aTB7WxnV0CIgqMRLQII7rpt62a1Xm3Klx5PlBRFRNrMIp7Phega2SG7MlvPYtLx1SiNuUhBv2xbDytaq7cUkMwrvC9FRkCFtq3i4ldBCOJQKwDAIDgdQHqmv1JyvIr9UGewds4-aphNUKbU8Bs6Pqdp3yiYJ0c6iVHtpz58jAeny1hmj7y6JxW1bDtmyMLnrpGb9TDMCJHG6DG3xFoSU3FuVvmZRUnmlm9NrqftWGw1oJjfXX-O0dWGxxMygK43FXY9e7JpN3d0yDUH5yja2lNqdF7SA7CzIx-RaPdvShiMuZuwMN1HGJAOrOS-7TanODuAgKPZa-bsjUsHj8Z97Q7DYlo-B8IJujrCwrXmQO-rFkO2BGqXoYZkr06iDsdKJ0wehtPQRni1qWkcN1JkssC+5pgfWFIggK+K22gOxMIFaGCYAg-fohhGGx2NU8JbrrI2UoB9MMqgLKcuzff9VC-xjFoqiZ0k9rD1WZrrGqZkEpEw7M-Iu28gZvW-iPGWB84ahRGMMdo5VHw9ifHPe24RAgGWJJIE0QESYxCAA */
    id: "sessionDataFetcherMachine",
    initial: "idle",

    context: ({ input }) => ({
        sessionKey: input.sessionKey,
        processedFiles: {},
        createSession: input.createSession,
        fetchFileList: input.fetchFileList,
        processFile: input.processFile,
        fileListUpdatedAt: 0,
    }),

    states: {
        idle: {
            on: {
                START: [
                    {
                        target: "fetchingFileList",
                        guard: "hasSessionKey",
                    },
                    {
                        target: "creatingSession",
                    },
                ],
            },
        },

        creatingSession: {
            invoke: {
                src: "createSession",
                input: ({ context }) => context.createSession,

                onDone: {
                    target: "fetchingFileList",
                    actions: [
                        {
                            type: "setSessionKey",
                            params: ({ event }) => event.output,
                        },
                    ],
                },
                onError: {
                    target: "failed",
                    actions: "logError",
                },
            },
        },

        fetchingFileList: {
            invoke: {
                src: "fetchFileList",
                input: ({ context }) => {
                    if (!context.sessionKey) {
                        throw new Error("yeah");
                    }
                    return {
                        fetchFileList: context.fetchFileList,
                        sessionKey: context.sessionKey,
                    };
                },

                onDone: {
                    target: "findingReadyFile",
                    actions: [{ type: "setFileList", params: ({ event }) => event.output }],
                },
                onError: {
                    target: "failed",
                    actions: "logError",
                },
            },
        },

        failed: {
            type: "final",
        },

        done: {
            type: "final",
        },

        wait: {
            after: {
                fileListDelay: "fetchingFileList",
            },
        },

        findingReadyFile: {
            entry: "findReadyFile",
            always: [
                {
                    target: "processingFile",
                    guard: "hasReadyFile",
                },
                {
                    target: "done",
                    guard: "isSessionDone",
                },
                "wait",
            ],
        },

        processingFile: {
            invoke: {
                src: "processFile",
                input: ({ context }) => {
                    if (!context.sessionKey || !context.readyFile) {
                        throw new Error("TODO");
                    }
                    return {
                        processFile: context.processFile,
                        sessionKey: context.sessionKey,
                        fileName: context.readyFile.name,
                    };
                },
                onDone: {
                    target: "#sessionDataFetcherMachine.findingReadyFile",
                    actions: "markFileProcessed",
                },
                onError: {
                    target: "#sessionDataFetcherMachine.findingReadyFile",
                    actions: ["markFileProcessed", "logError"],
                },
            },
        },
    },
});
