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

# Establishing a Session
To start requesting or returning data to the user, you will need to first establish a session. You'll need to keep track of this session since it will be needed in most calls to digi.me.

## establishSession

#### Arguments
> [EstablishSessionOptions](#EstablishSessionOptions)

#### Returns
> Promise<[Session](#Session)>

#### Exceptions
> [TypeValidationError](./handling-errors.md)

> [SDKInvalid](./handling-errors.md)

> [SDKVersionInvalid](./handling-errors.md)


#### Example
```typescript
import { establishSession } from "@digime/digime-js-sdk";

const result = await establishSession({
  applicationId: "test-application-id",
  contractId: "test-contract-id"
});

// => result = {sessionKey: "example-session-key"}
```

#### Example with Scoping
In this section, we will give a few examples of how to use scoping to control the amount of data we request from the user.

To only receive Media and Posts from Instagram and Twitter in the last year
```typescript
import { establishSession } from "@digime/digime-js-sdk";

const result = await establishSession({
  applicationId: "test-application-id",
  contractId: "test-contract-id",
  scope: {
    "serviceGroups": [{
      "id": 1,
      "serviceTypes": [{
        "id": 3,
        "serviceObjectTypes": [{
          "id": 1
        }, {
          "id": 2
        }]
      }, {
        "id": 4,
        "serviceObjectTypes": [{
          "id": 1
        }, {
          "id": 2
        }]
      }]
    }],
    "timeRanges": [{
      "last": "1y"
    }]
  }
});

// => result = {sessionKey: "example-session-key"}
```

To only receive Play History from Spotify in the last month
```typescript
import { establishSession } from "@digime/digime-js-sdk";

const result = await establishSession({
  applicationId: "test-application-id",
  contractId: "test-contract-id",
  scope: {
    "serviceGroups": [{
      "id": 5,
      "serviceTypes": [{
        "id": 19,
        "serviceObjectTypes": [{
          "id": 406
        }]
      }]
    }],
    "timeRanges": [{
      "last": "1m"
    }]
  }
});

// => result = {sessionKey: "example-session-key"}
```

# Types

## EstablishSessionOptions
```typescript
interface EstablishSessionOptions {
    applicationId: string;
    contractId: string;
    scope?: CAScope;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |
| `scope` | No | Optional parameter to only return a subset of data the contract asks for. | [CAScope](#CAScope) |

## CAScope
If you only want to retrieve a subset of data that your contract allows, then setting the CAScope parameter when establishing the session will allow you to filter user data by time range, service group, service or object type. Note, the data you request is limited by your contract, so scoping can only allow you to filter on the maximum amount of data your contract allows.

```typescript
interface CAScope {
    timeRanges? : TimeRange[];
    serviceGroups?: ServiceGroup[];
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `timeRanges` | No | Having timeRanges set will allow you to retrieve only a subset of data that the contract has asked for. This might come in handy if you already have data from the existing user and you might only want to retrieve any new data that might have been added to the user's library in the last x months.| [TimeRange](#TimeRange)[] |
| `serviceGroups` | No | To filter user data based on the service group, service or object type, you can set this object. This object is made up of service groups on the top level, followed by service and then the service object. *NOTE*: At the moment, every level must be explicity set in order for the scoping to take effect. For more information on how they are related and what services are on offer, please checkout the developer documentation here: https://developers.digi.me/reference-objects. | [ServiceGroup](#ServiceGroup)[] |

## TimeRange

```typescript
interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `from` | No | This is the unix timestamp in seconds. If this is set, we will return data created after this timestamp. | number |
| `to` | No | This is the unix timestamp in seconds. If this is set, we will return data created before this timestamp. | number |
| `last` | No | You can set a dynamic time range based on the current date. The string is in the format of "{value}{unit}". For units we currently accept: `d` - day, `m` - month, `y` - year. For example to return data for the last six months : "6m". | string |

## ServiceGroup

```typescript
interface ServiceGroup {
    id: number;
    serviceTypes: Service[];
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `id` | Yes | This is id of the service group you wish to filter by. | number |
| `serviceTypes` | No | This contains all the services you want to filter by. | [Service](#Service)[] |

## Service

```typescript
interface Service {
    id: number;
    serviceObjectTypes: ServiceObject[];
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `id` | Yes | This is id of the service you wish to filter by. | number |
| `serviceObjectTypes` | No | This contains all the service objects you want to filter by. | [ServiceObject](#ServiceObject)[] |

## ServiceObject

```typescript
interface ServiceObject {
    id: number;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `id` | Yes | This is id of the service object you wish to filter by. | number |

## Session

```typescript
interface Session {
    expiry: number;
    sessionKey: string;
    sessionExchangeToken: string;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `expiry` | Yes | The time stamp shows what time your session key will expire. | number |
| `sessionKey` | Yes | The session key is a key that binds your contract and your application ID and it is what you'll need to pass up to digi.me whenever you make a call. | string |

-----

[Back to Index](../README.md)
