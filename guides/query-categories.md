#### Configuration Options
See all possible [configurations](../../../interfaces/Types.SDKConfiguration.html) when initializing the SDK.

#### Returns
The [available categories](../../../interfaces/Types.QueryCategoriesResponse.html).

#### Examples
The most basic initialization:


```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// categoriesBodyParams - Additional query options.

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const categoriesBodyParams {
    query: {
        /**
         * Posible fields to include are defined in type CategoriesIncludeFieldList.
         */
        include: <array of fileds to include>,
        filter: {
            id: <array of IDs to filter>
        },
    };
}

const categories = await sdk.queryCategories({
    contractDetails,
    categoriesBodyParams,
});

```

More details on `categoriesBodyParams` can be checked [here](../../../interfaces/Types.QueryCategoriesOptions.html#categoriesBodyParams)