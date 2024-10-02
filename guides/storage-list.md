Getting the list of files from storage can be done using the `listStorageFiles` SDK method.

#### Examples
The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// storageId - Storage id returned by method createProvisionalStorage or getUserStorage during storage creation process.
// path - (Optional) Option to get only files from passed folder path (e.g. /folder-name)
// recursive - (Optional) If set to true method will return filse from all child folders

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const storage = await sdk.listStorageFiles({
    contractDetails,
    storageId: "some-storage-id",
    path: "/folder-name",
    recursive: true,
});

```

For more details on what options can be passed please check type [ListStorageFilesOptions](../../../interfaces/Types.ListStorageFilesOptions.html)

This method will return list of files and total number of files. Please check return type [ListStorageFilesResponse](../../../interfaces/Types.ListStorageFilesResponse.html) for more details on what is returned.
