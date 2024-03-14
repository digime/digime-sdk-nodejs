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

The SDK Provides a function which you can use to determine what sources can be onboarded for your contract.
The Contract you pass in must be a READ contract, which means it's a contract that asks for user's data.

#### Configuration Options
See all possible [configurations](../../../interfaces/Types.SDKConfiguration.html) when initializing the SDK.

#### Returns
The [available sources](../../../interfaces/Types.QuerySourcesResponse.html).

#### Examples
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
    limit: <number of items returned per page, default is 10>,
    offset: <page offset, default is 0>,
    sort: <sort options>,
    query: {
        search: <search options>,
        include: <controle what fileds will be included in response>,
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

More on `sourcesBodyParams` can be checked [here](../../../interfaces/Types.Internal.SourcesBodyParams.html).
