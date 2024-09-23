Upload files to storage can be done with uploadFileToStorage SDK method.

#### Examples
The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().
// storageId - Storage id returned by method createProvisionalStorage or getUserStorage during storage creation process.
// fileData - File data to be uploaded (Readable or Buffer)
// fileName - File name that will be used for file saving (e.g. test.json). Spaces in file name are NOT allowed.
// path - (Optional) Upload path where file will be saved (e.g. /folder-name/sub-folder). Spaces in path are NOT allowed.

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const storage = await sdk.uploadFileToStorage({
    contractDetails,
    storageId: "some-storage-id",
    fileData,
    fileName: "test.json",
    path: "/folder-name/sub-folder",
});

```

For more details on what options can be passed please check type [UploadFileToStorageOptions](../../../interfaces/Types.UploadFileToStorageOptions.html)

This method will upload file to storage and return:

```
{
    uploaded: boolean;
    statusCode: number;
    statusMessage?: string;
}

```

Return type can be found [here](../../../interfaces/Types.UploadFileToStorageResponse.html).
