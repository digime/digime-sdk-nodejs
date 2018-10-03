/*
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { createSDK, Session } from "./sdk";

const { getAppURL, getWebURL } = createSDK();

const session: Session = {
    expiry: 0,
    sessionKey: "test-session-key",
};

describe("Test getAppURL function", () => {
    it("Produces correct app url", () => {
        // tslint:disable-next-line:max-line-length
        const expected = "digime://consent-access?sessionKey=test-session-key&callbackURL=callback-url&appId=test-app-id&sdkVersion=0.1.0";
        const actual = getAppURL("test-app-id", session, "callback-url");
        expect(actual).toEqual(expected);
    });
});

describe("Test getWebURL function", () => {
    it("Produces correct web url", () => {
        // tslint:disable-next-line:max-line-length
        const expected = "https://api.digi.me/apps/quark/direct-onboarding?sessionKey=test-session-key&callbackUrl=callback-url";
        const actual = getWebURL(session, "callback-url");
        expect(actual).toEqual(expected);
    });
});
