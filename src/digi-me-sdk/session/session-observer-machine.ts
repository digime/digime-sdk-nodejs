/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import type { SessionFileList } from "../../schemas/api/session/session-file-list";

/**
 * Read all files machine
 */
export const sessionObserverMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYHkBGKATgG5iECyAhgMYAWaWYAdGhADZgDEOAQgMoBRAEoA1AQG0ADAF1EoAA4Z0AF0xY5IAB6IAtAE4mANgAcAZgCsx43oAst85Mk2ANCACeugIymbTAOyGFuYATKaeep6SJgC+0a4osOjY+ESkFDT0jEwYBGTEDFCcENjMsMqUyqWoail5ZFR0DMw5qQVSskggiipqGtoIOjaS5kwWfjZ+wYY2FnqSeq4eCJ4rnkySnsZD49aewZOx8dXJuST1GU3Zp-lYUEy0lFjsBUJglBBuAGJoHLBFJUwyhUqokatdzo0si08gV7o9nrdXu8vj84O0NN00KpsH1EMFQkwbDZrBEouZtp4XO48ZZ1n45lZiVZgt5DiAEklcOD0pDmtdYQ8nmwXm8Pt9fkwAGYMCAFcVcdGdTHY9Sdfr44yjEzmHx+KKSPx7YKLRB2XzGSbBCaTPwWzx+NkcsGpCGZPmtW5woUi5Hy2BSmVy1GccSeDoKJRY3pqvGmPxag0s4J6cwrA0mhAzTVWYyGPTBYyWRlEx3HLkunluq4eu6ChFQJFi1H++SEDDUaq3eX-LIMYgYADWIM5tTOlcu0JIAvhwsRopREtb7c7UHlCD77YqanaiojPRxMYGNkMTE80wcgTzZ+Ghgzhk8IyiegtRMCxkkLNLoJOFYaVcnNx3JKYDKJChTFL2WD9kOgJlqOaR-hO-KesBoGZFA65QZuKo7jIGKRiquJHsEowFvMwymPmkimHGGZnr49LkuEOrmHokzGF+I7cohULIUBIFgZwZBtoQTDyGwFSShghAALawd+5Z1OOvE1lKAnoZh-bUFu2C4eGXQEdGoD9DoZGnps9hWn4phOMa1KZiRl7mG+yYOEMeicc6Sk8e6MKegA7pQUa3JwmhApUTCUJKlSEAAFA4kgAJScE6P7eRcKl+XcgXBVAu4GfuqrGXiez+IYOq2E+xjeD4GY2I5pjlYW56TPMFieWlY4+dWWVevWjYLnAYlth2oJdsGwnSWJEnKFJsnyVxv4Zb5U6enWs4NvOfrDcuY2rqimnYduMj5cqRlaF4xgkcEH6SNYQw2Dq+J2UshoGExbERG51WmLEcQgFgGAQHAGipYpXXLfhhVEYMzmEpSoR7BsZEBBmOg2b4N0fpErFWKmjUdeDCHLSw7BgFDUYHsVywkY9ereCytg3ZRaMsieeq3UM975tMhPwa6lzUBgMniSB5NKoZVMXQM9oGNRFoGnMPg3XsdF3fGrHJqYOa2GEfPcSTAEFBThGHoMd3w-VYQqyjt72TorFMAWqbOYYgT2iyj360tvI9atQFBRwEAm+dJmNZIluIzb76o-ZZ7xhswwGo4Ti5oY3vpb7RtrTOPpNr8IdSyZoQRzdN33U4T34hmupMDmbt5tMz3BBnENZ3xfUbQN23Sk8QYcIXRXSzo3gnim1F2I4KwpmYdXWHXmzVZEPjNZSrfE+3qnrXng0tiNK7yoPRHhCei+FgaeamME5LGBmrEGGxAR+G9z4OJ468C5l-udzv20QeLe5KZD36MvUYz8zypjPFMC+dULCjCsIYayb9KSGhsB-ZSK1AJqTQsbCW0MzbmBGFsOM2tph2DMG7DMBYnaUiuu+cwfgWKWDQf9MG-MMF+ywTlVQtwj6HnxL4N2z8r74hshYIkdEAh12JIQ+qkQPyGj+tEIAA */
        schema: {
            context: {} as {
                lastResponse?: SessionFileList;
                processedFiles: Set<string>;
                readyFile?: string;
            },
            // events: {} as {},
            services: {} as {
                fetchFileList: { data: SessionFileList };

                processReadyFile: { data: void };
            },
        },
        tsTypes: {} as import("./session-observer-machine.typegen").Typegen0,
        predictableActionArguments: true,
        id: "sessionObserverMachine",

        initial: "idle",

        context: {
            processedFiles: new Set<string>(),
        },

        states: {
            idle: {
                on: {
                    OBSERVE: "observing",
                },
            },

            complete: {
                type: "final",
            },

            observing: {
                states: {
                    failed: {
                        type: "final",
                    },

                    handlingReadyFiles: {
                        states: {
                            findingFile: {
                                always: [
                                    {
                                        target: "processingFile",
                                        cond: "hasReadyFile",
                                    },
                                    "done",
                                ],

                                entry: "findFirstReadyFile",
                            },

                            processingFile: {
                                invoke: {
                                    src: "processReadyFile",

                                    onDone: {
                                        target: "findingFile",
                                        actions: "markFileAsProcessed",
                                    },

                                    onError: {
                                        target: "findingFile",
                                        actions: "markFileAsProcessed",
                                    },
                                },
                            },

                            done: {
                                type: "final",
                            },
                        },

                        initial: "findingFile",
                        onDone: "waiting",
                    },

                    fetching: {
                        invoke: {
                            src: "fetchFileList",
                            onError: "failed",
                            onDone: {
                                target: "handlingReadyFiles",
                                actions: "setFileList",
                            },
                        },
                    },

                    waiting: {
                        after: {
                            "500": "fetching",
                        },
                    },
                },

                onDone: "complete",
                initial: "fetching",
            },
        },
    },
    {
        actions: {
            setFileList: assign({
                lastResponse: (context, event) => event.data,
            }),

            findFirstReadyFile: assign({
                readyFile: (context) => {
                    return context.lastResponse?.fileList?.find((file) => {
                        return !context.processedFiles.has(file.name);
                    })?.name;
                },
            }),

            markFileAsProcessed: assign({
                processedFiles: (context) =>
                    !context.readyFile
                        ? context.processedFiles
                        : new Set([...context.processedFiles, context.readyFile]),
                readyFile: undefined,
            }),
        },

        guards: {
            hasReadyFile: (context) => context.readyFile !== undefined,
        },
    },
);
