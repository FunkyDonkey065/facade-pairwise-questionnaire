"use strict";

// Only this origin/path's consented session is cached. No answers are sent here.
window.SurveyRecovery = class SurveyRecovery {
  constructor({ storage, identity, now = () => Date.now(), ttlMs = 86400000 }) {
    this.storage = storage;
    this.identity = JSON.stringify(identity);
    this.key = "facade-session-v1:" + encodeURIComponent(this.identity);
    this.now = now;
    this.ttlMs = ttlMs;
    this.revision = 0;
    this.error = "";
    this.state = null;
    this.load();
  }

  load() {
    try {
      const value = this.storage.getItem(this.key);
      if (!value) return null;
      const data = JSON.parse(value);
      if (data.identity !== this.identity || data.schema !== 1 || !Array.isArray(data.rows)
          || !Number.isFinite(data.expiresAt) || !Number.isInteger(data.revision)) {
        this.error = "invalid";
        return null;
      }
      if (data.expiresAt <= this.now()) {
        this.storage.removeItem(this.key);
        return null;
      }
      if (!data.consented) return null;
      this.state = data;
      this.revision = data.revision;
      return data;
    } catch {
      this.error = "unavailable";
      return null;
    }
  }

  save(value) {
    if (!value.consented) return false;
    try {
      const existing = JSON.parse(this.storage.getItem(this.key) || "null");
      if (existing && existing.revision > this.revision) {
        this.error = "conflict";
        return false;
      }
      const next = { ...value, schema: 1, identity: this.identity,
        revision: this.revision + 1, updatedAt: this.now(), expiresAt: this.now() + this.ttlMs };
      this.storage.setItem(this.key, JSON.stringify(next));
      this.revision = next.revision;
      this.state = next;
      this.error = "";
      return true;
    } catch {
      this.error = "unavailable";
      return false;
    }
  }

  clear() {
    try { this.storage.removeItem(this.key); } catch { this.error = "unavailable"; return false; }
    this.state = null;
    this.revision = 0;
    return true;
  }

  static purgeExpired(storage, now = Date.now()) {
    try {
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
      for (const key of keys) {
        if (!key?.startsWith("facade-session-v1:")) continue;
        try {
          const data = JSON.parse(storage.getItem(key));
          if (data?.schema === 1 && Number.isFinite(data.expiresAt) && data.expiresAt <= now) storage.removeItem(key);
        } catch { /* Leave unreadable entries untouched; they are never resumed. */ }
      }
    } catch { /* Private browsing can disable local storage entirely. */ }
  }
};
