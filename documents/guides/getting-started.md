---
title: Getting Started
---

# Getting Started

## Requirements

- Node 20.0 or above
- (Optional, if using TypeScript) TypeScript 5.0 or above

## Installation

Using npm:

```shell
$ npm i @digime/digime-sdk-nodejs
```

## Obtaining your Contract ID, Application ID & Private Key

To user the SDK, you need to obtain an AppID for your application. You can get yours by filling out the registration form [here](https://worlddataexchange.com/register). However, for demo purposes, we provide example values. You can find these example keys in our [example application](https://github.com/worlddataexchange/digime-sdk-nodejs-example).

## Initializing the SDK

Once you have the above information, you can initiate the SDK.

```typescript
import { init } from "@digime/digime-sdk-nodejs";

const digimeSDK = init({ applicationId: <my-unique-application-id> });
```

To see all the other options for initializing the SDK, please take a look [here](../initializing-the-sdk.md).

## Using the SDK

- Use our SDK to [read data from your users](reading-data.md).
- Use our SDK to [push data to your users](pushing-data.md).
- To see all the available functions in the SDK, please take a look {@link SDK.DigimeSDK | here}.
