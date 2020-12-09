/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../codec-assertion";

interface PushDataToPostboxAPIResponse {
    expires: number;
    status: PushDataStatus;
}

type PushDataStatus = "delivered" | "pending";

const PushDataStatusCodec: t.Type<PushDataStatus> = t.keyof({
    delivered: null,
    pending: null,
})

const PushDataToPostboxResponseCodec: t.Type<PushDataToPostboxAPIResponse> = t.type({
    status: PushDataStatusCodec,
    expires: t.number,
});

const assertIsPushDataStatusResponse: CodecAssertion<PushDataToPostboxAPIResponse> =
    codecAssertion(PushDataToPostboxResponseCodec);

export {
    PushDataStatus,
    PushDataToPostboxAPIResponse,
    assertIsPushDataStatusResponse,
}
