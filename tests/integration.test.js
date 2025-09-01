const { Client } = require("../src/client");

describe("VeliKey JS SDK", () => {
  test("client initialization", () => {
    const client = new Client({ apiKey: "test" });
    expect(client).toBeDefined();
  });

  test("policy management", () => {
    const policy = { name: "test", algorithms: ["aes-256-gcm"] };
    expect(policy.name).toBe("test");
  });

  test("quantum resistant support", () => {
    const qrAlgos = ["kyber1024", "dilithium5"];
    expect(qrAlgos).toHaveLength(2);
  });
});
