---
title: Query Categories
---

# Query Categories

If you need category list or you need to filter sources by categories this is an example on how you can get it and pass it to `querySources` method.

## Examples and Usage

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

More details on `categoriesBodyParams` can be checked {@link Types.QueryCategoriesOptions | here}.

## Returns

The {@link Types.QueryCategoriesResponse | available categories}.
