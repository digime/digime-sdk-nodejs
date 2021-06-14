/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

interface WriteDataAPIResponse {
    expires: number;
    status: DataStatus;
}

type DataStatus = "delivered" | "pending";

const PushDataStatusCodec: t.Type<DataStatus> = t.keyof({
    delivered: null,
    pending: null,
})

const PushDataToPostboxResponseCodec: t.Type<WriteDataAPIResponse> = t.type({
    status: PushDataStatusCodec,
    expires: t.number,
});

const assertIsPushDataStatusResponse: CodecAssertion<WriteDataAPIResponse> =
    codecAssertion(PushDataToPostboxResponseCodec);

export {
    DataStatus,
    WriteDataAPIResponse,
    assertIsPushDataStatusResponse,
}
