
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.sessionObserverMachine.observing.fetching:invocation[0]": { type: "done.invoke.sessionObserverMachine.observing.fetching:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]": { type: "done.invoke.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]": { type: "error.platform.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]"; data: unknown };
"xstate.after(500)#sessionObserverMachine.observing.waiting": { type: "xstate.after(500)#sessionObserverMachine.observing.waiting" };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "fetchFileList": "done.invoke.sessionObserverMachine.observing.fetching:invocation[0]";
"processReadyFile": "done.invoke.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: "fetchFileList" | "processReadyFile";
        };
        eventsCausingActions: {
          "findFirstReadyFile": "done.invoke.sessionObserverMachine.observing.fetching:invocation[0]" | "done.invoke.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]" | "error.platform.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]";
"markFileAsProcessed": "done.invoke.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]" | "error.platform.sessionObserverMachine.observing.handlingReadyFiles.processingFile:invocation[0]";
"setFileList": "done.invoke.sessionObserverMachine.observing.fetching:invocation[0]";
        };
        eventsCausingDelays: {

        };
        eventsCausingGuards: {
          "hasReadyFile": "";
        };
        eventsCausingServices: {
          "fetchFileList": "OBSERVE" | "xstate.after(500)#sessionObserverMachine.observing.waiting";
"processReadyFile": "";
        };
        matchesStates: "complete" | "idle" | "observing" | "observing.failed" | "observing.fetching" | "observing.handlingReadyFiles" | "observing.handlingReadyFiles.done" | "observing.handlingReadyFiles.findingFile" | "observing.handlingReadyFiles.processingFile" | "observing.waiting" | { "observing"?: "failed" | "fetching" | "handlingReadyFiles" | "waiting" | { "handlingReadyFiles"?: "done" | "findingFile" | "processingFile"; }; };
        tags: never;
      }
