/*
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { decompress } from "iltorb";
import { createSDK, Session } from "./sdk";
import sdkVersion from "./sdk-version";

const { getAppURL, getWebURL } = createSDK();

const session: Session = {
    expiry: 0,
    sessionKey: "test-session-key",
};

describe("Test getAppURL function", () => {
    it("Produces correct app url", () => {
        // tslint:disable-next-line:max-line-length
        const expected = `digime://consent-access?sessionKey=test-session-key&callbackURL=callback-url&appId=test-app-id&sdkVersion=${sdkVersion}`;
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

describe("Test brotli decompression function", () => {
    it("Decompresses the file correctly - test1", async () => {

        // tslint:disable-next-line:max-line-length
        const compressedData = "G78BAMT3m9N3m/D/RZfY6DngXIlyG687QD74/wvcDnLKslNbYGWBZTkW2Jdu8xFED79NcfxV1W5jAMA3HADozvoXMjTcUw4iE/9x0L1Ud8pBnh+EUZykGe0g75Eph5t8YOO+GvpFLqIXyuFX/swX4fv9Ikw5vCj04yAIEi/zRxXcSyXvPTpOvq+qlvXcishVum37S8eUg7a8CIQXYWmtFomNB0yN8zBV3nmTH7wGzcQIwIEe73qBKAqjNF3oheed0ey/MQ4=";
        const expected = [
            {
                accesstoken: "",
                accountid: "123456789",
                accounttype: 0,
                connectionstatus: 2,
                createddate: 1542633371920,
                entityid: "1_123456789",
                fileurl: "",
                fullname: "Test test",
                jfsid: 1,
                profileurl: "",
                servicegroupid: 1,
                serviceid: 1,
                updateddate: 1542633554588,
                username: "Test test",
            },
        ];

        const data = await decompress(Buffer.from(compressedData, "base64"));
        expect(JSON.parse(data.toString("utf8"))).toEqual(expected);
    });

    it("Decompresses the file correctly - test2", async () => {
        // tslint:disable:max-line-length
        const compressedData = "G3YJAMTKpr6+mX3LIOSun0tPBdKKLIkgjymDLulMXA7oGcas0Maalo61bQ7NOo+zqMt4TLBNES20BCjGbK7ps/VMDARRb2tJS/2HuG9ngYQIeMDBYBQpyMc/KDoqX6i6GhAtUe0PVhP91JYOFnzPhbWF+V2yxiiykFGvNxiL8TDinHMG5b1tzjgD/YHlSdGHh4Suysw1hTVg0I0jp9XR0Q8kZvEmPQWDLcnRjzOQEPw13VN39zG759P+ZdJsP2cf4tC5PO4C5db+Q3xfH67PRvvb2tJdNX1NL/Wtm65ELhZR1LvJuY/TUXY1BQPTuavSWzKKLLnCQkZiKIb9UY8bwNRYvWv/MOQfQkPOhsTZxUW8YCfJYnIOhv3hz2FLbSGRE9VehmFV27LjdGBrp/9oQMhyvYlDVbuL33mepNcivGyUJkeuKm0Tphu6zfLDLKdjxetlPi5/NSVXU7QMZUUW8vGZQVfGQv6B7DdBIlkvTk+Xm2TdmS/izc1ifnIZX8yvZ2kCBl0ZV75DPv7B/3iyBSRyolqGYX4cBlXzHma5a8LSZA2BQVfGQuKcc845Hw5ED0zxEhN51va5ZXgFiy408SMAeimz1VM2pHNXvqN9Vo2tEZ1A75PEfeHkP/aelJ3fjQEs7TPDW0rZcv1O0LKhSuu4x6yQ6Yzr+jTb2f0uO737/RgkdXB639nUn3WRUmSaMH+J3XEv6vM0iTSe3E4XcXzvnQt8fX0F5bEISpcH79Vn2NjooEuFH8XRh813WTWFv44ajUVv5Koxwsq0TMaYzCjv/BHDcct6W5Hej+5H0Q3XDI30XZyUqs5/jurb+dGeoDuT54/Ahk8xWXg8t88MJpiOvqbK9Zmsgw6ZdwYywg/HW5+rxkBiLnjUjyJQBIUhxHOoYKCfeg1UMwRMZX8KsxlSFDKqPVbBGXLlc0iIbjbWvWw44JGyfa4iY7JsrEfKmIE2gwgMvTAASQxcYUEZugJ6SLEMsNuUyo1wovGjNhhnff0e7/WH/e5oNI7YxBpHl7Ut";
        const expected = {
            version: "2.0.0",
            data: [{
                atlasmapversion: "1.0.0",
                objecttypeversion: "2.0.0",
                objects: [{
                    createddate: 1446929710000,
                    asserteddate: 1446929710000,
                    verificationstatus: "confirmed",
                    criticality: "CRITL",
                    entityid: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB_TPcWiBG2h2E114Vh0sRT8fQB",
                    id: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB_TPcWiBG2h2E114Vh0sRT8fQB",
                    onsetdatetime: 1272758400000,
                    recorder: {
                        display: "MOORE, SEAN",
                        reference: "https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Practitioner/TItWfhjChtlo0pFh9nzctSQB",
                    },
                    note: [],
                    code: {
                        text: "SHELLFISH-DERIVED PRODUCTS",
                        coding: [{
                            system: "http://hl7.org/fhir/ndfrt",
                            code: "N0000007624",
                            display: "SHELLFISH-DERIVED PRODUCTS",
                        }],
                    },
                    reaction: [{
                        manifestation: [{
                            text: "Itching",
                        }],
                        note: [{
                            text: "",
                        }],
                        onset: 1272758400000,
                        substance: {
                            text: "SHELLFISH-DERIVED PRODUCTS",
                            coding: [{
                                system: "http://hl7.org/fhir/ndfrt",
                                code: "N0000007624",
                                display: "SHELLFISH-DERIVED PRODUCTS",
                            }],
                        },
                    }],
                    accountentityid: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB",
                },
                {
                    createddate: 1446929794000,
                    asserteddate: 1446929794000,
                    verificationstatus: "confirmed",
                    criticality: "CRITH",
                    entityid: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB_TKebKfLXzu6Sp.LY-IpvpmQB",
                    id: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB_TKebKfLXzu6Sp.LY-IpvpmQB",
                    onsetdatetime: 1394150400000,
                    recorder: {
                        display: "MOORE, SEAN",
                        reference: "https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Practitioner/TItWfhjChtlo0pFh9nzctSQB",
                    },
                    note: [],
                    code: {
                        text: "STRAWBERRY",
                        coding: [{
                            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                            code: "892484",
                            display: "STRAWBERRY",
                        },
                        {
                            system: "http://fdasis.nlm.nih.gov",
                            code: "4J2TY8Y81V",
                            display: "STRAWBERRY",
                        }],
                    },
                    reaction: [{
                        manifestation: [{
                            text: "Anaphylaxis",
                        }],
                        note: [{
                            text: "",
                        }],
                        onset: 1394150400000,
                        substance: {
                            text: "STRAWBERRY",
                            coding: [{
                                system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                                code: "892484",
                                display: "STRAWBERRY",
                            },
                            {
                                system: "http://fdasis.nlm.nih.gov",
                                code: "4J2TY8Y81V",
                                display: "STRAWBERRY",
                        }],
                        },
                    }],
                    accountentityid: "20_Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB",
                }],
            }],
            descriptor: {
                accountjfsid: 1,
                dateshard: "D201511",
                dateshardmode: "D",
                objecttype: 127,
                servicegroup: 2,
                servicetype: 20,
                hash: "23f9c4f7601ae50a1ddff9c8add6cd61",
                atlasmapversions: [{
                    version: "1.0.0",
                    count: 2,
                }],
                objecttypeversions: [{
                    version: "2.0.0",
                    count: 2,
                }],
                updateddate: 1540457538891,
                createddate: 1540457538891,
            },
        };
        // tslint:enable:max-line-length

        const data = await decompress(Buffer.from(compressedData, "base64"));
        expect(JSON.parse(data.toString("utf8"))).toEqual(expected);
    });
});
