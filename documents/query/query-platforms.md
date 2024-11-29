---
title: Query Platforms
---

# Query Platforms

If you need platform list or you need to filter sources by platform this is an example on how you can get it and pass it to `querySources` method.

## Examples and Usage

The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// platformsBodyParams - Additional query options.

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const platformsBodyParams {
    query: {
        /**
         * Posible fields to include are defined in type PlatformsIncludeFieldList.
         */
        include: <array of fileds to include>,
        filter: {
            id: <array of IDs to filter>
        },
    };
}

const platforms = await sdk.queryPlatforms({
    contractDetails,
    platformsBodyParams,
});

```

More details on `platformsBodyParams` can be checked {@link Types.QueryPlatformsOptions | here}.

## Returns

The {@link Types.QueryPlatformsResponse | available platforms}.
