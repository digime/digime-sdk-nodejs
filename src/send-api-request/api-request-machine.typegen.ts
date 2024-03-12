
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.apiRequestMachine.creatingRequest:invocation[0]": { type: "done.invoke.apiRequestMachine.creatingRequest:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.apiRequestMachine.fetching:invocation[0]": { type: "done.invoke.apiRequestMachine.fetching:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.apiRequestMachine.resolveResponseError:invocation[0]": { type: "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.apiRequestMachine.waitingToRetry:invocation[0]": { type: "done.invoke.apiRequestMachine.waitingToRetry:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.apiRequestMachine.fetching:invocation[0]": { type: "error.platform.apiRequestMachine.fetching:invocation[0]"; data: unknown };
"error.platform.apiRequestMachine.resolveResponseError:invocation[0]": { type: "error.platform.apiRequestMachine.resolveResponseError:invocation[0]"; data: unknown };
"error.platform.apiRequestMachine.waitingToRetry:invocation[0]": { type: "error.platform.apiRequestMachine.waitingToRetry:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "createRequest": "done.invoke.apiRequestMachine.creatingRequest:invocation[0]";
"delayRetry": "done.invoke.apiRequestMachine.waitingToRetry:invocation[0]";
"fetch": "done.invoke.apiRequestMachine.fetching:invocation[0]";
"resolveResponseError": "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "incrementAttempts": "START" | "done.invoke.apiRequestMachine.waitingToRetry:invocation[0]";
"setLastError": "error.platform.apiRequestMachine.fetching:invocation[0]" | "error.platform.apiRequestMachine.resolveResponseError:invocation[0]" | "error.platform.apiRequestMachine.waitingToRetry:invocation[0]";
"setLastErrorFromResolvedError": "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]";
"setRequest": "done.invoke.apiRequestMachine.creatingRequest:invocation[0]";
"setRequestCreator": "START";
"setRetryOptions": "START";
        };
        eventsCausingDelays: {

        };
        eventsCausingGuards: {
          "isResolvedErrorRetryable": "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]";
"isResponseOk": "done.invoke.apiRequestMachine.fetching:invocation[0]";
"isRetryableError": "error.platform.apiRequestMachine.fetching:invocation[0]";
        };
        eventsCausingServices: {
          "createRequest": "START" | "done.invoke.apiRequestMachine.waitingToRetry:invocation[0]";
"delayRetry": "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]" | "error.platform.apiRequestMachine.fetching:invocation[0]";
"fetch": "done.invoke.apiRequestMachine.creatingRequest:invocation[0]";
"resolveResponseError": "done.invoke.apiRequestMachine.fetching:invocation[0]";
        };
        matchesStates: "complete" | "creatingRequest" | "failed" | "fetching" | "idle" | "resolveResponseError" | "waitingToRetry";
        tags: never;
      }
