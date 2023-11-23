![](https://securedownloads.digi.me/partners/digime/SDKReadmeBanner.png)
<p align="center">
    <a href="https://developers.digi.me/slack/join">
        <img src="https://img.shields.io/badge/chat-slack-blueviolet.svg" alt="Developer Chat">
    </a>
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/license-apache 2.0-blue.svg" alt="Apache 2.0 License">
    </a>
    <a href="#">
    	<img src="https://img.shields.io/badge/build-passing-brightgreen.svg">
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/language-typescript-ff69b4.svg" alt="Typescript">
    </a>
    <a href="https://developers.digi.me/">
        <img src="https://img.shields.io/badge/web-digi.me-red.svg" alt="Web">
    </a>
</p>

<br>

Once a user is authorized, you can onboard additional services to their library before reading them all at once.

To trigger a new service onboard, you can do the following:
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
// locale - (Optional) Send prefared locale for authorization client to be used. Default is en.
// includeSampleDataOnlySources - (Optional) Flag to indicate if we should include sample data only sources. Default is false.

const { url } = await sdk.getOnboardServiceUrl({
    callback,
    contractDetails,
    serviceId,
    userAccessToken,
    sourceType,
    sampleData,
    locale,
    includeSampleDataOnlySources
});

// Redirect the user to the url returned and this will kick start the onboarding process.
```

The `url` returned might look something like this:

```
https://api.digi.me/apps/saas/onboard?code=<code>&callback=<callback>&service=<service-id>
```

Redirect the user to this URL, and they will be asked to onboard the service and consent to share the requested data.

To test flow using sample data please check more details [here](../fundamentals/sample-datasets.html)

More on limits and scoping of raw and mapped data interface can be found [here](../../interfaces/Types.PullSessionOptions.html).

At the end of the process, the `callback` provided above will be called with the follow extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `success` | Whether the call was successful. `true` or `false` | Yes |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes |
