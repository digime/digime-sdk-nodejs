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
