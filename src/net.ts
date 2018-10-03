/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import fs from "fs";
import got from "got";
import memoize from "lodash.memoize";
import path from "path";
import pkgDir from "pkg-dir";
import { PeerCertificate } from "tls";

type ExtendedGotJSONOptions = got.GotOptions<string | null> & {
    checkServerIdentity?: (host: string, cert: PeerCertificate) => void;
};

type ExtendableGot = typeof got & {
    extend: (options: ExtendedGotJSONOptions) => typeof got;
};

interface PinnedHosts {
    [key: string]: PinnedHostCertificate[];
}

type PinnedHostCertificate = Buffer;

const getCertificate = (certPath: string): Buffer => {
    const pem = fs.readFileSync(certPath)
        .toString()
        .replace("-----BEGIN CERTIFICATE-----", "")
        .replace("-----END CERTIFICATE-----", "")
        .replace(/\s+|\n\r|\n|\r$/gm, "");

    return Buffer.from(pem, "base64");
};

const getPinningData = memoize((directory: string): PinnedHosts => (
    fs.readdirSync(directory).reduce((acc, hostName) => {
        try {
            return {
                ...acc,
                [hostName]: fs.readdirSync(path.resolve(directory, hostName)).map((cert) => (
                    getCertificate(path.resolve(directory, hostName, cert))
                )),
            };
        } catch {
            return acc;
        }
    }, {})
));

const packageDir = (): string => {
    const packageDirectory = pkgDir.sync(__dirname);

    if (!packageDirectory) {
        throw new Error("Unable to determine digime-js-sdk package root");
    }

    return packageDirectory;
};

const defaultPinningDataPath: string = path.resolve(packageDir(), "certificates");

export const net: typeof got = (got as ExtendableGot).extend({
    checkServerIdentity: (host, cert) => {
        const pinnedHosts: PinnedHosts = getPinningData(defaultPinningDataPath);
        const pinnedHost: Buffer[] | undefined = pinnedHosts[host];

        // Host not pinned
        if (!pinnedHost) {
            return;
        }

        if (pinnedHost.length <= 0) {
            throw new Error("Certificate pinning failed!");
        }

        const hasValidPin = pinnedHost.find((pin) => pin.equals(cert.raw));

        if (!hasValidPin) {
            throw new Error("Certificate pinning failed!");
        }
    },
});
