---
title: Initializing the SDK
---

# Initializing the SDK

In order to use the JS SDK, you'll first need to initialise it with your unique application ID.
You can get yours by filling out the registration form [here](https://worlddataexchange.com/register).

By default, the SDK will point to the production environment. However, when initializing the SDK, you have the option to override certain default behaviors and specify additional options.

#### Configuration Options

See all possible [configurations](../interfaces/Types.SDKConfiguration.html) when initializing the SDK.

#### Returns

The returned SDK has the following [properties](../interfaces/SDK.DigimeSDK.html)

#### Examples

The most basic initialization:

_Using ES6 modules_

```typescript
import { init } from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <my-unique-application-id> });
```

_Using CommonJS_

```typescript
const { init } = require("@digime/digime-sdk-nodejs");

const sdk = init({ applicationId: <my-unique-application-id> });
```

If you'd like to specify retry options for the SDK:

```typescript
import { init } from "@digime/digime-sdk-nodejs";

const sdk = init({
    applicationId: <my-unique-application-id>,
    retryOptions: {
        limit: 10,
    }
});
```
