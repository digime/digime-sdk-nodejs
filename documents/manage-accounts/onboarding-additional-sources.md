---
title: Onboarding Additional Sources
---

# Onboarding Additional Sources

Once a user is authorized, you can onboard additional sources to their library before reading all the data at once.

To trigger the onboarding of a new source, follow these steps:

```typescript
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

// callback - The URL to call after user is onboarded.
// contractDetails - The same one used in getAuthorizeUrl().
// serviceId - (Optional) The service to onboard. If serviceId is not passed user will have option to choose service that will be added.
// userAccessToken - The user access token from the authorization step.
// sessionOptions - (Optional) An limits or scopes to set for this session.
// sourceType - (Optional) Use push to filter out only services that are used for push to provider type. Default SourceType is set to pull.
// sampleData - (Optional) Use for testing flow with sample datasets
// locale - (Optional) Send preferred locale for authorization client to be used. Default is en.
// includeSampleDataOnlySources - (Optional) Flag to indicate if we should include sample data only sources. Default is false.
// triggerQuery - (Optional) Flag to indicate if data query will be triggered post service authorisation. Default is true. If this is set to false data for added service will not be returned. You may want to set to false when adding multiple services subsequently and only get data for all services when adding last service.
// state - (Optional) Put anything here to identify the user when authorization completes. This will be passed back in the callback.
// sourcesScope - (Optional) scope is currently used only for pasing data type.

const { url, session, userAccessToken } = await sdk.getOnboardServiceUrl({
    callback,
    contractDetails,
    serviceId,
    userAccessToken,
    sourceType,
    sampleData,
    locale,
    includeSampleDataOnlySources,
    triggerQuery
});

// Redirect the user to the url returned and this will kick start the onboarding process.
```

More details on types that can be passed into getAuthorizeUrl please check {@link Types.GetOnboardServiceUrlOptions | here}.

The `url` returned might look something like this:

```
https://api.digi.me/apps/saas/onboard?code=<code>&callback=<callback>&service=<service-id>
```

Use `session` for getting data after service onboard is done and also have in mind to keep/update `userAccessToken` returned since SDK will do automatic token refresh in case access token expired and refrash token is still valid.

Redirect the user to this URL, and they will be asked to onboard the service and consent to share the requested data.

To test flow using sample data please check more details [here](../sample-datasets.md)

More on limits and scoping of raw and mapped data interface can be found {@link Types.PullSessionOptions | here}.

At the end of the process, the `callback` provided above will be called with the follow extra query parameters:

| Parameter   | Description                                                                                                             | Returned Always |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| `success`   | Whether the call was successful. `true` or `false`                                                                      | Yes             |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes             |
