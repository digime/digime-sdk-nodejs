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

# Establishing a session

To start requesting or returning data to the user, you will need to first establish a session. You'll need to keep track of this session since it will be needed in most calls to digi.me.

## establishSession

To initialise a session with digi.me API you first need to call
```typescript
establishSession = async (
    appId: string,
    contractId: string,
    scope: CAScope
): Promise<Session>;
```
> Returns [Session](#Session)

`appId`: string

Your application ID. You can request this from digi.me.

`contractId`: string

The ID of the contract which you want to make with the user. You can request this from digi.me.

`scope`: [CAScope](#CAScope)

Optional parameter to only return a subset of data the contract asks for. Default: {}

#### Exceptions
[ParameterValidationError](./handling-errors.md)

[SDKInvalid](./handling-errors.md)

[SDKVersionInvalid](./handling-errors.md)

## Session

```typescript
interface Session {
    expiry: number;
    sessionKey: string;
    sessionExchangeToken: string;
}
```

`expiry`: number

The time stamp shows what time your session key will expire.

`sessionKey`: string

The session key is a key that binds your contract and your application ID and it is what you'll need to pass up to digi.me whenever you make a call.

`sessionExchangeToken`: string


## CAScope

```typescript
interface CAScope {
    timeRanges? : TimeRange[];
}
```
`timeRanges`: [TimeRange](#TimeRange)[]

Having timeRanges set will allow you to retrieve only a subset of data that the contract has asked for. This might come in handy if you already have data from the existing user and you might only want to retrieve any new data that might have been added to the user's library in the last x months. The format of ITimeRange is as follows:

## TimeRange

```typescript
interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}
```

`from`: number

This is the unix timestamp in seconds. If this is set, we will return data created after this timestamp.

`to`: number

This is the unix timestamp in seconds. If this is set, we will return data created before this timestamp.

`last`: string

You can set a dynamic time range based on the current date. The string is in the format of "{value}{unit}"
For units we currently accept:

'd' - day
'm' - month
'y' - year

For example to return data for the last six months : "6m"

-----

[Back to Index](./README.md)
