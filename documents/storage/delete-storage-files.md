---
title: Delete Storage Files
---

# Delete Storage Files

File deletion can be performed using the `deleteStorageFiles` SDK method.

#### Examples

The most basic initialization:

```
// Initialize the SDK
import {init} from "@worlddataexchange/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// storageId - Storage id returned by method createProvisionalStorage or getUserStorage during storage creation process.
// path - (Optional) Pass file path that can be made for each file based on listStorageFiles response (e.g file.path + file.name). Path can also be folder path to delete all files in folder (e.g. /folder-name/ or /folder-name/sub-folder/)

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const storage = await sdk.deleteStorageFiles({
    contractDetails,
    storageId: "some-storage-id",
    path: "/folder-name/test.jpg",
});

```

For more details on what options can be passed please check type {@link Types.DeleteStorageFilesOptions | DeleteStorageFilesOptions}

Please check return type {@link Types.DeleteStorageFilesResponse | DeleteStorageFilesResponse} for more details on what is returned.
