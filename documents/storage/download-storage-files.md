---
title: Download Storage Files
---

# Download Storage Files

File downloads can be performed using the `downloadStorageFile` SDK method.

#### Examples

The most basic initialization:

```
// Initialize the SDK
import {init} from "@worlddataexchange/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// storageId - Storage id returned by method createProvisionalStorage or getUserStorage during storage creation process.
// path - (Optional) Pass file path that can be made for each file based on listStorageFiles response (e.g file.path + file.name)

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const storage = await sdk.downloadStorageFile({
    contractDetails,
    storageId: "some-storage-id",
    path: "/folder-name/test.jpg",
});

```

For more details on what options can be passed please check {@link Types.DownloadStorageFileOptions | DownloadStorageFileOptions}

This method will return:

```
    {
        body: ReadableStream;
        contentLength?: string;
    }
```

Please check return type {@link Types.DownloadStorageFileResponse | DownloadStorageFileResponse} for more details on what is returned.
