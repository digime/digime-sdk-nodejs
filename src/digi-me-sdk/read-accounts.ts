/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

const AccountType = z.union([
    z.literal("USER"),
    z.literal("ADMIN"),
    z.literal("EVENT"),
    z.literal("GROUP"),
    z.literal("BANK"),
    z.literal("CREDIT_CARD"),
    z.literal("IMPORTED"),
    z.literal("INVESTMENT"),
    z.literal("INSURANCE"),
    z.literal("LOAN"),
    z.literal("REWARD"),
    z.literal("BILL"),
    z.literal("PUSH"),
]);

const AccessTokenStatus = z
    .object({
        authorized: z.boolean(),
        expiresAt: z.number().optional(),
    })
    .passthrough();

const Account = z
    .object({
        id: z.string(),
        reference: z.string(),
        type: AccountType,
        createdDate: z.number(),
        serviceGroupId: z.number(),
        serviceGroupName: z.string(),
        serviceTypeId: z.number(),
        serviceTypeName: z.string(),
        serviceTypeReference: z.string(),
        sourceId: z.number(),
        updatedDate: z.number(),
        accessTokenStatus: AccessTokenStatus.optional(),
        serviceProviderId: z.number().optional(),
        serviceProviderName: z.string().optional(),
        serviceProviderReference: z.string().optional(),
        username: z.string().optional(),
        providerFavIcon: z.string().optional(),
        providerLogo: z.string().optional(),
    })
    .passthrough();

export const Accounts = z.array(Account);

export type Accounts = z.infer<typeof Accounts>;

/**
 * `<instance>.readAccounts()` input parameters
 */
export const ReadAccountsParameters = z.object({
    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadAccountsParameters = z.infer<typeof ReadAccountsParameters>;
