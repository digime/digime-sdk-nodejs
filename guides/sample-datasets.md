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

For development, testing or demo purpose there is an option to do onboard sample data for services that provide sample datasets.

Dataset is sample data object with test data that can be used by developers or for demo/testing purpose to avoid process with onboarding live/real service.

To get list of available datasets you need to trigger:
```typescript
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

// contractDetails - The same one used in getAuthorizeUrl().
// sourceId - Send sourceId to get list of sample data sets for that ID
const datasets = await sdk.getServiceSampleDataSets({
    contractDetails,
    sourceId
});

// Each dataset has key (Dataset ID) that can to be passed to getOnboardServiceUrl and getAuthorizeUrl.
```

[Response](../../types/Types.GetServiceSampleDataSetsResponse.html) should look something like this:

```
{
    "default": {
        "description": "",
        "name": "default"
    },
    "test": {
        "description": "",
        "name": "test"
    }
}
```

Methods getOnboardServiceUrl and getAuthorizeUrl have optional parameter sampleData:

```
export interface SampleDataOptions {
    /**
     * Dataset ID to use for sample data onboard returned in getServiceSampleDataSets as key
     */
    dataSet: string;

    /**
     * Skip all steps in authorization proces and do auto onboard flow for sample data. Dafault to false.
     */
    autoOnboard?: boolean;
}
```

Passing this param will trigger sample data flow and user will not be asked to onboard live service.

`autoOnboard` param if passed as true will not ask user for consenting to give data. This option available to additionaly speed up flow and give ability to skip consent screen for sample data.
