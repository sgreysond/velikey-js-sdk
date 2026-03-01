export type ContactBundle = {
    identityKey: string;
    pqIdentityKey: string;
    suites: string[];
    rv?: {
        urls: string[];
    };
};
export type ContactCode = string;
export declare function encodeContactCode(bundle: ContactBundle): ContactCode;
export declare function decodeContactCode(code: ContactCode): ContactBundle;
export declare function generateContactBundle(): ContactBundle;
//# sourceMappingURL=contact.d.ts.map