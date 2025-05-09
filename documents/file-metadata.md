---
title: File Metadata
---

# File Metadata

The type of FileMetadata that is returned depends on the type of data it is.

### MappedFileMetadata

When reading data that was sync'd from an external service, data returned will be of type {@link Types.MappedFileMetadata | MappedFileMetadata}.

```
interface MappedFileMetadata {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
    schema: FileDataSchema;
}

type Schemas = "digime" | "fhir" | "me.digi";

interface FileDataSchema {
    id?: string;
    standard: Schemas; // Current supported schemas
    version: string; // SemVer, ie "1.0.0"
}

```

| Property       | Description                                                                                                                                                                               | Data type |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `objectCount`  | How many data objects are returned in this file.                                                                                                                                          | number    |
| `objectType`   | What data these objects represent. E.g. Media For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs.        | string    |
| `serviceGroup` | What service group the data belongs to. E.g. Social. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string    |
| `serviceName`  | What service the data came from. E.g. Facebook. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs.      | string    |

### RawFileMetadata

If it is a file that you wrote to the user, it will be of type {@link Types.RawFileMetadata | RawFileMetadata}.

```
interface RawFileMetadata {
    mimetype: string;
    accounts: {
        accountid: string,
    }[];
    reference?: string[];
    tags?: string[];
}
```

| Property    | Description                                                | Data type     |
| ----------- | ---------------------------------------------------------- | ------------- |
| `mimetype`  | The mimetype of this data blob.                            | string        |
| `accounts`  | An array of account IDs that was pushed up with this file. | UserAccount[] |
| `tags`      | Any tags linked to this file when it was pushed up.        | string[]      |
| `reference` | Any references linked to this file when it was pushed up.  | string[]      |
