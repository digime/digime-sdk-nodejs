/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * Configuration options for Digi.me SDK
 */
export const ContractDetails = z.object({
    /** The ID of the contract */
    contractId: z.string(),

    /** Private key in PKCS1 format */
    privateKey: z.string(),
});

export type ContractDetails = z.infer<typeof ContractDetails>;
