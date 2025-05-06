/*!
 * © World Data Exchange. All rights reserved.
 */

import { DigiMeSDKError, TypeValidationError } from "../errors";
import { net } from "../net";
import { isJWKS } from "../types/api/jwks";
import { SDKConfiguration } from "../types/sdk-configuration";
import { isPlainObject, isString } from "./basic-utils";
import { getPayloadFromToken } from "./get-payload-from-token";
import { decode, verify } from "jsonwebtoken";

const mockToken = "mock.jwt.token";
const mockOptions = { retryOptions: {} } as SDKConfiguration;

jest.mock("./basic-utils");
jest.mock("../types/api/jwks");
jest.mock("jsonwebtoken", () => ({
    decode: jest.fn(),
    verify: jest.fn(),
    isJWKS: jest.fn(),
}));

jest.mock("../net");

describe("getPayloadFromToken", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws if token is undefined", async () => {
        await expect(getPayloadFromToken(undefined, mockOptions)).rejects.toThrow(TypeValidationError);
    });

    it("throws if decoded token is not a plain object", async () => {
        (decode as jest.Mock).mockReturnValue("not-an-object");
        (isPlainObject as unknown as jest.Mock).mockReturnValue(false);

        await expect(getPayloadFromToken(mockToken, mockOptions)).rejects.toThrow(TypeValidationError);
    });

    it("throws if jku or kid is not a string", async () => {
        (decode as jest.Mock).mockReturnValue({ header: { jku: 123, kid: null } });
        (isPlainObject as unknown as jest.Mock).mockReturnValue(true);
        (isString as unknown as jest.Mock).mockImplementation((val) => typeof val === "string");

        await expect(getPayloadFromToken(mockToken, mockOptions)).rejects.toThrow(DigiMeSDKError);
    });

    it("throws if JWKS response is invalid", async () => {
        (decode as jest.Mock).mockReturnValue({ header: { jku: "mock-jku", kid: "mock-kid" } });
        (isPlainObject as unknown as jest.Mock).mockReturnValue(true);
        (isString as unknown as jest.Mock).mockReturnValue(true);
        (net.get as jest.Mock).mockResolvedValue({ body: { not: "jwks" } });
        (isJWKS as unknown as jest.Mock).mockReturnValue(false);

        await expect(getPayloadFromToken(mockToken, mockOptions)).rejects.toThrow(DigiMeSDKError);
    });

    it("returns verified payload on success", async () => {
        const mockPayload = { userId: "123" };

        (decode as jest.Mock).mockReturnValue({ header: { jku: "mock-jku", kid: "mock-kid" } });
        (isPlainObject as unknown as jest.Mock).mockReturnValue(true);
        (isString as unknown as jest.Mock).mockReturnValue(true);
        (isJWKS as unknown as jest.Mock).mockReturnValue(true);
        (net.get as jest.Mock).mockResolvedValue({
            body: {
                keys: [{ kid: "mock-kid", pem: "mock-pem" }],
            },
        });
        (verify as jest.Mock).mockReturnValue(mockPayload);

        const result = await getPayloadFromToken(mockToken, mockOptions);
        expect(result).toEqual(mockPayload);
    });
});
