
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.fetchMachine.fetching:invocation[0]": { type: "done.invoke.fetchMachine.fetching:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.fetchMachine.resolveResponseError:invocation[0]": { type: "done.invoke.fetchMachine.resolveResponseError:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.fetchMachine.waitingToRetry:invocation[0]": { type: "done.invoke.fetchMachine.waitingToRetry:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.fetchMachine.fetching:invocation[0]": { type: "error.platform.fetchMachine.fetching:invocation[0]"; data: unknown };
"error.platform.fetchMachine.resolveResponseError:invocation[0]": { type: "error.platform.fetchMachine.resolveResponseError:invocation[0]"; data: unknown };
"error.platform.fetchMachine.waitingToRetry:invocation[0]": { type: "error.platform.fetchMachine.waitingToRetry:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "delayRetry": "done.invoke.fetchMachine.waitingToRetry:invocation[0]";
"fetch": "done.invoke.fetchMachine.fetching:invocation[0]";
"resolveResponseError": "done.invoke.fetchMachine.resolveResponseError:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "incrementAttempts": "FETCH" | "done.invoke.fetchMachine.waitingToRetry:invocation[0]";
"setLastError": "error.platform.fetchMachine.fetching:invocation[0]" | "error.platform.fetchMachine.resolveResponseError:invocation[0]" | "error.platform.fetchMachine.waitingToRetry:invocation[0]";
"setLastErrorFromResolvedError": "done.invoke.fetchMachine.resolveResponseError:invocation[0]";
"setRequest": "FETCH";
        };
        eventsCausingDelays: {

        };
        eventsCausingGuards: {
          "isResolvedErrorRetryable": "done.invoke.fetchMachine.resolveResponseError:invocation[0]";
"isResponseOk": "done.invoke.fetchMachine.fetching:invocation[0]";
"isRetryableError": "error.platform.fetchMachine.fetching:invocation[0]";
        };
        eventsCausingServices: {
          "delayRetry": "done.invoke.fetchMachine.resolveResponseError:invocation[0]" | "error.platform.fetchMachine.fetching:invocation[0]";
"fetch": "FETCH" | "done.invoke.fetchMachine.waitingToRetry:invocation[0]";
"resolveResponseError": "done.invoke.fetchMachine.fetching:invocation[0]";
        };
        matchesStates: "complete" | "failed" | "fetching" | "idle" | "resolveResponseError" | "waitingToRetry";
        tags: never;
      }
