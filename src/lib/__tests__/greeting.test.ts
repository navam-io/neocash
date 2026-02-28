import { getGreeting, getGreetingMessage, getGreetingIcon } from "../greeting";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function setHour(hour: number) {
  vi.setSystemTime(new Date(2026, 0, 15, hour, 0, 0));
}

describe("getGreeting", () => {
  it('returns "Good morning" at 8am', () => {
    setHour(8);
    expect(getGreeting()).toBe("Good morning");
  });

  it('returns "Good afternoon" at 14:00', () => {
    setHour(14);
    expect(getGreeting()).toBe("Good afternoon");
  });

  it('returns "Good evening" at 20:00', () => {
    setHour(20);
    expect(getGreeting()).toBe("Good evening");
  });

  it('returns "Good morning" at 11:59 (boundary)', () => {
    vi.setSystemTime(new Date(2026, 0, 15, 11, 59, 0));
    expect(getGreeting()).toBe("Good morning");
  });

  it('returns "Good afternoon" at 12:00 (boundary)', () => {
    setHour(12);
    expect(getGreeting()).toBe("Good afternoon");
  });
});

describe("getGreetingMessage", () => {
  it('includes greeting and "Ready to build your wealth?"', () => {
    setHour(9);
    const msg = getGreetingMessage();
    expect(msg).toContain("Good morning");
    expect(msg).toContain("Ready to build your wealth?");
  });
});

describe("getGreetingIcon", () => {
  it('returns "moon" before 6am', () => {
    setHour(3);
    expect(getGreetingIcon()).toBe("moon");
  });

  it('returns "sunrise" between 6 and 12', () => {
    setHour(9);
    expect(getGreetingIcon()).toBe("sunrise");
  });

  it('returns "sun" between 12 and 17', () => {
    setHour(14);
    expect(getGreetingIcon()).toBe("sun");
  });

  it('returns "sunset" between 17 and 20', () => {
    setHour(18);
    expect(getGreetingIcon()).toBe("sunset");
  });

  it('returns "moon" at 20 or later', () => {
    setHour(22);
    expect(getGreetingIcon()).toBe("moon");
  });
});
