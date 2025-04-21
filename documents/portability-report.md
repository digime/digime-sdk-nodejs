---
title: Portability Report
---

# Portability Report

Currently, we only provide the option to generate a portability report for the MedMij service.

To generate a portability report, you need to trigger the following:

```typescript
// Initialize the SDK
import {init} from "@worlddataexchange/digime-sdk-nodejs";

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

File {@link Types.GetPortabilityReportResponse | response} will be return as string.
