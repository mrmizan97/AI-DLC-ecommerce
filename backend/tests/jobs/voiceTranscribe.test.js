// Tests for /api/voice/transcribe — uses the deterministic stub provider so
// no API key is required and the result is fully predictable.

const request = require("supertest");
const app = require("../../src/app");

describe("/api/voice/transcribe", () => {
  beforeEach(() => {
    // Force the stub path even if OPENAI_API_KEY happens to be set in the env.
    delete process.env.OPENAI_API_KEY;
  });

  test("returns 400 when no audio field is sent", async () => {
    const res = await request(app).post("/api/voice/transcribe");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/audio/i);
  });

  test("returns transcription text + model when audio is uploaded", async () => {
    const fake = Buffer.from("not really audio but enough to test the route");
    const res = await request(app)
      .post("/api/voice/transcribe")
      .attach("audio", fake, { filename: "clip.webm", contentType: "audio/webm" });

    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe("string");
    expect(res.body.text.length).toBeGreaterThan(0);
    expect(res.body.model).toBe("stub-transcribe-v1");
    expect(res.body.bytesReceived).toBe(fake.length);
  });

  test("returns 400 contract on missing file even with empty multipart", async () => {
    const res = await request(app).post("/api/voice/transcribe").field("note", "no file here");
    expect(res.status).toBe(400);
  });
});
