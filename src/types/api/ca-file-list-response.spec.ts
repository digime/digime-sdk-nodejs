/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { isCAFileListResponse, assertIsCAFileListResponse } from "./ca-file-list-response";
import { loadDefinitions } from "../../../utils/test-utils";
import { TypeValidationError } from "../../errors";

describe("isCAFileListResponse", () => {
    it("Returns true when given a valid CAFileListResponse", async () => {
        const fixtures = [
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-completed.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-partial.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-pending.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-running.json`),
        ];

        for (const fixture of fixtures) {
            expect(isCAFileListResponse(fixture.response)).toBe(true);
        }
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse(value);
            expect(actual).toBe(false);
        });
    });

    it("Returns false when given an empty object", () => {
        expect(isCAFileListResponse({})).toBe(false);
    });

    it("Returns false when the status property of the CAFileListResponse object is an empty object", () => {
        expect(
            isCAFileListResponse({
                status: {},
            })
        ).toBe(false);
    });

    describe("Returns true when the status.state property of the CAFileListResponse object is a valid string literal", () => {
        it.each(["running", "partial", "completed", "pending"])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: value,
                },
            });
            expect(actual).toBe(true);
        });
    });

    it("Returns false when the status.state property of the CAFileListResponse object is not an acceptable string literal", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "test",
                },
            })
        ).toBe(false);
    });

    describe("Returns false when the status.state property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: value,
                },
            });
            expect(actual).toBe(false);
        });
    });

    it("Returns true when the status.details property of the CAFileListResponse object is an object", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "running",
                    details: {},
                },
            })
        ).toBe(true);
    });

    describe("Returns false when the status.details property of the CAFileListResponse object is not an object", () => {
        it.each([true, false, null, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                    details: value,
                },
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns true when the entries in status.details property of the CAFileListResponse object are valid AccountSyncStatusEntry", () => {
        it.each(["running", "partial", "completed"])("%p", (value) => {
            expect(
                isCAFileListResponse({
                    status: {
                        state: "running",
                        details: {
                            testid: {
                                state: value,
                            },
                        },
                    },
                })
            ).toBe(true);
        });
    });

    describe("Returns false when the entries in status.details property of the CAFileListResponse object are not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: value,
                    },
                },
            });
            expect(actual).toBe(false);
        });
    });

    it("Returns false when the entries in status.details property of the CAFileListResponse object are empty objects", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: {},
                    },
                },
            })
        ).toBe(false);
    });

    describe("Returns false when the entries in status.details property of the CAFileListResponse object are not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: value,
                    },
                },
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the entries in status.details property of the CAFileListResponse object have a non-string state", () => {
        it.each([true, false, null, undefined, [], 0, NaN, () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: {
                            state: value,
                        },
                    },
                },
            });
            expect(actual).toBe(false);
        });
    });

    it("Returns false when the entries in status.details property of the CAFileListResponse object have an invalid string state", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: {
                            state: "test",
                        },
                    },
                },
            })
        ).toBe(false);
    });

    it("Returns true when the fileList property of the CAFileListResponse object is an empty array", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [],
            })
        ).toBe(true);
    });

    describe("Returns false when the fileList property of the CAFileListResponse object is not an array", () => {
        it.each([true, false, null, 0, NaN, "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the fileList property of the CAFileListResponse object is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [value],
            });
            expect(actual).toBe(false);
        });
    });

    it("Returns false when the fileList property of the CAFileListResponse object is an array containing an empty object", () => {
        expect(
            isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [{}],
            })
        ).toBe(false);
    });

    describe("Returns false when the fileList.name property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [
                    {
                        name: value,
                        updatedDate: 0,
                    },
                ],
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the fileList.name property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [
                    {
                        name: "test",
                        updatedDate: value,
                    },
                ],
            });
            expect(actual).toBe(false);
        });
    });
});

describe("assertIsCAFileListResponse", () => {
    it("Does not throw when given a minimal valid CAFileListResponse object", async () => {
        const fixtures = [
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-completed.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-partial.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-pending.json`),
            ...loadDefinitions(`fixtures/network/get-file-list/file-list-running.json`),
        ];

        for (const fixture of fixtures) {
            expect(() => assertIsCAFileListResponse(fixture.response)).not.toThrow();
        }
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAFileListResponse(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsCAFileListResponse({})).toThrow(TypeValidationError);
    });

    it("Throws TypeValidationError when the status property of the CAFileListResponse object is an empty object", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {},
            })
        ).toThrow(TypeValidationError);
    });

    describe("Does not throw when the status.state property of the CAFileListResponse object is a valid string literal", () => {
        it.each(["running", "partial", "completed", "pending"])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: value,
                    },
                });
            expect(actual).not.toThrow();
        });
    });

    it("Throws TypeValidationError when the status.state property of the CAFileListResponse object is not an acceptable string literal", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "test",
                },
            })
        ).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the status.state property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Does not throw when the status.details property of the CAFileListResponse object is an object", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "running",
                    details: {},
                },
            })
        ).not.toThrow();
    });

    describe("Throws TypeValidationError when the status.details property of the CAFileListResponse object is not an object", () => {
        it.each([true, false, null, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                        details: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Does not throw when the entries in status.details property of the CAFileListResponse object are valid AccountSyncStatusEntry", () => {
        it.each(["running", "partial", "completed"])("%p", (value) => {
            expect(() =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                        details: {
                            testid: {
                                state: value,
                            },
                        },
                    },
                })
            ).not.toThrow();
        });
    });

    describe("Throws TypeValidationError when the entries in status.details property of the CAFileListResponse object are not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                        details: {
                            testid: value,
                        },
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when the entries in status.details property of the CAFileListResponse object are empty objects", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: {},
                    },
                },
            })
        ).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the entries in status.details property of the CAFileListResponse object are not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                        details: {
                            testid: value,
                        },
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the entries in status.details property of the CAFileListResponse object have a non-string state", () => {
        it.each([true, false, null, undefined, [], 0, NaN, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                        details: {
                            testid: {
                                state: value,
                            },
                        },
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when the entries in status.details property of the CAFileListResponse object have an invalid string state", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "running",
                    details: {
                        testid: {
                            state: "test",
                        },
                    },
                },
            })
        ).toThrow(TypeValidationError);
    });

    it("Does not throw when the fileList property of the CAFileListResponse object is an empty array", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [],
            })
        ).not.toThrow();
    });

    describe("Throws TypeValidationError when the fileList property of the CAFileListResponse object is not an array", () => {
        it.each([true, false, null, 0, NaN, "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                    },
                    fileList: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the fileList property of the CAFileListResponse object is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                    },
                    fileList: [value],
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when the fileList property of the CAFileListResponse object is an array containing an empty object", () => {
        expect(() =>
            assertIsCAFileListResponse({
                status: {
                    state: "running",
                },
                fileList: [{}],
            })
        ).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the fileList.name property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                    },
                    fileList: [
                        {
                            name: value,
                            updatedDate: 0,
                        },
                    ],
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the fileList.name property of the CAFileListResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileListResponse({
                    status: {
                        state: "running",
                    },
                    fileList: [
                        {
                            name: "test",
                            updatedDate: value,
                        },
                    ],
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsCAFileListResponse(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsCAFileListResponse(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
