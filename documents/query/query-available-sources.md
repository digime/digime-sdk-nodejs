---
title: Query Available Sources
---

# Query Available Sources

The SDK Provides a function which you can use to determine what sources can be onboarded for your contract.
The Contract you pass in must be a READ contract, which means it's a contract that asks for user's data.

## Examples and Usage

The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// sourcesBodyParams - Params for searching, paging, filtering, sorting and other options.

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const sourcesBodyParams = {
    limit: <number of items returned per page>,
    offset: <page offset>,
    sort: <sort options>,
    query: {
        search: <search options>,
        /**
         * Posible fields to include are defined in type IncludeFieldList. Please check details for sourcesBodyParams below.
         */
        include: <array of fileds to include>,
        filter: {
            id: <filter response by ID>,
            publishedStatus: <filter by published status  "approved" | "pending" | "deprecated" | "blocked" | "sampledataonly", approved is default>;
            service: {
                id: <filter by array of service IDs>,
            },
            /**
             * Available countries with IDs can be fetched with queryCountries.
             */
            country: {
                id: <filter by array of country IDs>,
            },
            /**
             * Available categories with IDs can be fetched with queryCategories.
             */
            category: {
                id: <filter by array of category IDs>,
            },
            /**
             * Available platforms with IDs can be fetched with queryPlatforms.
             */
            platform: {
                <filter by array of platforms IDs>,
            },
            /**
             * Currently 2 possible types. Pull (1) or push (2). Default type is pull (1)
             */
            type: {
                id: <filter by array of type IDs>,
            },
            sourceId: <filter by source IDs>,
        };
    };
}

const sources = await sdk.querySources({
    contractDetails,
    sourcesBodyParams,
});

```

More on `sourcesBodyParams` can be checked {@link Types.QuerySourcesOptions | here}.

## Returns

The {@link Types.QuerySourcesResponse | available sources}.
