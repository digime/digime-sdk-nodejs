---
title: Query Countries
---

# Query Countries

#### Configuration Options

See all possible [configurations](../interfaces/Types.SDKConfiguration.html) when initializing the SDK.

#### Returns

The [available countries](../interfaces/Types.QueryCountriesResponse.html).

#### Examples

The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// countriesBodyParams - Additional query options.

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const countriesBodyParams {
    query: {
        /**
         * Posible fields to include are defined in type CountriesIncludeFieldList.
         */
        include: <array of fileds to include>,
        filter: {
            id: <array of IDs to filter>
        },
    };
}

const countries = await sdk.queryCountries({
    contractDetails,
    countriesBodyParams,
});

```

More details on `countriesBodyParams` can be checked [here](../interfaces/Types.QueryCountriesOptions.html)
