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

Currently only for service Medmij we provide option to get portability report.

To get portability report you need trigger:

```typescript
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// format - File format to be returned. Currently only XML is supported.
// serviceType - Service type medmij is only supported for now.
// from -  From timestamp in seconds
// to -  To timestamp in seconds
const report = await sdk.getPortabilityReport({
    contractDetails,
    userAccessToken,
    format,
    serviceType,
    from,
    to,
});

//.
```

File [response](../../interfaces/Types.GetPortabilityReportResponse.html) will be return as string.
