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

More on `categoriesBodyParams` can be checked [here](../../../interfaces/Types.QueryCategoriesOptions.html#categoriesBodyParams)