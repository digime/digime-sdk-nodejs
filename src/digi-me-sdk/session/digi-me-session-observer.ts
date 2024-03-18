/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { interpret } from "xstate";
import { z } from "zod";
import { sessionObserverMachine } from "./session-observer-machine";
import { parseWithSchema } from "../../zod/zod-parse";
import { SessionFileList } from "../../schemas/api/session/session-file-list";
import { DigiMeSessionFile } from "../digi-me-session-file";

const DigiMeSessionObserverConstructorOptions = z.object({
    fetchFileList: z.function().args().returns(z.promise(SessionFileList)),
    fetchFile: z
        .function()
        .args(z.string())
        .returns(z.promise(z.instanceof(DigiMeSessionFile))),
});

type DigiMeSessionObserverConstructorOptions = z.infer<typeof DigiMeSessionObserverConstructorOptions>;

const DigiMeSessionObserverStartOptions = z.object({
    onFileReady: z
        .function()
        .args(z.instanceof(DigiMeSessionFile))
        .returns(z.void().or(z.promise(z.void())))
        .optional(),
});

type DigiMeSessionObserverStartOptions = z.infer<typeof DigiMeSessionObserverStartOptions>;

/**
 * Allows session observing
 */
export class DigiMeSessionObserver {
    #fetchFileList: () => Promise<SessionFileList>;
    #fetchFile: (fileName: string) => Promise<DigiMeSessionFile>;
    #observerActor;
    #onFileReadyHandler: (file: DigiMeSessionFile) => void | Promise<void> = () => {};

    constructor(options: DigiMeSessionObserverConstructorOptions) {
        const { fetchFileList, fetchFile } = parseWithSchema(
            options,
            DigiMeSessionObserverConstructorOptions,
            "`DigiMeSessionObserver` constructor options",
        );

        this.#fetchFileList = fetchFileList;
        this.#fetchFile = fetchFile;

        // initialize the state machine
        this.#observerActor = interpret(
            sessionObserverMachine.withConfig({
                services: {
                    fetchFileList: () => this.#fetchFileList(),
                    processReadyFile: async (context) => {
                        if (!context.readyFile) return;
                        await this.#onFileReadyHandler(await this.#fetchFile(context.readyFile));
                    },
                },
            }),
        );

        this.#observerActor.onTransition((transition) => {
            console.log(`Observer Actor transition:`, transition.value);
        });

        this.#observerActor.start();
    }

    // async #onFileReady(fileName: string) {

    // }

    get rawFileList() {
        return this.#observerActor.getSnapshot().context.lastResponse;
    }

    get files() {
        return this.#observerActor.getSnapshot().context.lastResponse?.fileList;
    }

    get status() {
        return this.#observerActor.getSnapshot().context.lastResponse?.status;
    }

    /**
     * Stops the observer and removes all listeners
     */
    stop() {
        this.#observerActor.stop();
    }

    /**
     * Starts the session observer
     */
    start(options?: DigiMeSessionObserverStartOptions) {
        const { onFileReady } = parseWithSchema(
            options,
            DigiMeSessionObserverStartOptions,
            "`DigiMeSessionObserver` start options",
        );

        if (onFileReady) {
            this.#onFileReadyHandler = onFileReady;
        }

        this.#observerActor.send({ type: "OBSERVE" });
    }
}
