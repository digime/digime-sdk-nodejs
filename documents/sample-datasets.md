---
title: Sample Datasets
---

# Sample Datasets

For development, testing, or demo purposes, there is an option to onboard sample data for services that provide sample datasets.

A dataset is a sample data object containing test data that can be used by developers or for demo/testing purposes, allowing you to avoid the process of onboarding live or real services.

To get a list of available datasets, you need to trigger:

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

{@link Types.GetServiceSampleDataSetsResponse | Response} should look something like this:

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

Methods `getOnboardServiceUrl` and `getAuthorizeUrl` have optional parameter sampleData:

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

Passing this parameter will trigger the sample data flow, and the user will not be asked to onboard a live service.

If the `autoOnboard` parameter is set to true, the user will not be asked for consent. This option is available to additionally speed up the flow and allows you to skip the consent screen for sample data.
