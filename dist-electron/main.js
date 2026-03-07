import { app as Z, BrowserWindow as At, ipcMain as J } from "electron";
import Ct, { dirname as Ut, join as ae } from "path";
import ee, { fileURLToPath as Bt } from "url";
import De, { existsSync as Dt, readFileSync as Ft, writeFileSync as $t } from "fs";
import V from "events";
import It from "util";
import Gt from "http";
import Qt from "https";
import Wt from "zlib";
import P from "stream";
import te from "net";
import jt from "dns";
import Mt from "os";
import K from "crypto";
import Lt from "tls";
import Kt from "child_process";
function Vt(b) {
  return b && b.__esModule && Object.prototype.hasOwnProperty.call(b, "default") ? b.default : b;
}
var Y = {}, re = { exports: {} }, ie = { exports: {} }, pe, Qe;
function Xt() {
  if (Qe) return pe;
  Qe = 1;
  const b = ee, y = 1800;
  class k {
    constructor(p) {
      this.options = p || {}, this.cookies = [];
    }
    /**
     * Stores a cookie string to the cookie storage
     *
     * @param {String} cookieStr Value from the 'Set-Cookie:' header
     * @param {String} url Current URL
     */
    set(p, n) {
      let r = b.parse(n || ""), o = this.parse(p), m;
      return o.domain ? (m = o.domain.replace(/^\./, ""), // can't be valid if the requested domain is shorter than current hostname
      (r.hostname.length < m.length || // prefix domains with dot to be sure that partial matches are not used
      ("." + r.hostname).substr(-m.length + 1) !== "." + m) && (o.domain = r.hostname)) : o.domain = r.hostname, o.path || (o.path = this.getPath(r.pathname)), o.expires || (o.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || y) || y) * 1e3)), this.add(o);
    }
    /**
     * Returns cookie string for the 'Cookie:' header.
     *
     * @param {String} url URL to check for
     * @returns {String} Cookie header or empty string if no matches were found
     */
    get(p) {
      return this.list(p).map((n) => n.name + "=" + n.value).join("; ");
    }
    /**
     * Lists all valied cookie objects for the specified URL
     *
     * @param {String} url URL to check for
     * @returns {Array} An array of cookie objects
     */
    list(p) {
      let n = [], r, o;
      for (r = this.cookies.length - 1; r >= 0; r--) {
        if (o = this.cookies[r], this.isExpired(o)) {
          this.cookies.splice(r, r);
          continue;
        }
        this.match(o, p) && n.unshift(o);
      }
      return n;
    }
    /**
     * Parses cookie string from the 'Set-Cookie:' header
     *
     * @param {String} cookieStr String from the 'Set-Cookie:' header
     * @returns {Object} Cookie object
     */
    parse(p) {
      let n = {};
      return (p || "").toString().split(";").forEach((r) => {
        let o = r.split("="), m = o.shift().trim().toLowerCase(), e = o.join("=").trim(), l;
        if (m)
          switch (m) {
            case "expires":
              e = new Date(e), e.toString() !== "Invalid Date" && (n.expires = e);
              break;
            case "path":
              n.path = e;
              break;
            case "domain":
              l = e.toLowerCase(), l.length && l.charAt(0) !== "." && (l = "." + l), n.domain = l;
              break;
            case "max-age":
              n.expires = new Date(Date.now() + (Number(e) || 0) * 1e3);
              break;
            case "secure":
              n.secure = !0;
              break;
            case "httponly":
              n.httponly = !0;
              break;
            default:
              n.name || (n.name = m, n.value = e);
          }
      }), n;
    }
    /**
     * Checks if a cookie object is valid for a specified URL
     *
     * @param {Object} cookie Cookie object
     * @param {String} url URL to check for
     * @returns {Boolean} true if cookie is valid for specifiec URL
     */
    match(p, n) {
      let r = b.parse(n || "");
      return !(r.hostname !== p.domain && (p.domain.charAt(0) !== "." || ("." + r.hostname).substr(-p.domain.length) !== p.domain) || this.getPath(r.pathname).substr(0, p.path.length) !== p.path || p.secure && r.protocol !== "https:");
    }
    /**
     * Adds (or updates/removes if needed) a cookie object to the cookie storage
     *
     * @param {Object} cookie Cookie value to be stored
     */
    add(p) {
      let n, r;
      if (!p || !p.name)
        return !1;
      for (n = 0, r = this.cookies.length; n < r; n++)
        if (this.compare(this.cookies[n], p))
          return this.isExpired(p) ? (this.cookies.splice(n, 1), !1) : (this.cookies[n] = p, !0);
      return this.isExpired(p) || this.cookies.push(p), !0;
    }
    /**
     * Checks if two cookie objects are the same
     *
     * @param {Object} a Cookie to check against
     * @param {Object} b Cookie to check against
     * @returns {Boolean} True, if the cookies are the same
     */
    compare(p, n) {
      return p.name === n.name && p.path === n.path && p.domain === n.domain && p.secure === n.secure && p.httponly === p.httponly;
    }
    /**
     * Checks if a cookie is expired
     *
     * @param {Object} cookie Cookie object to check against
     * @returns {Boolean} True, if the cookie is expired
     */
    isExpired(p) {
      return p.expires && p.expires < /* @__PURE__ */ new Date() || !p.value;
    }
    /**
     * Returns normalized cookie path for an URL path argument
     *
     * @param {String} pathname
     * @returns {String} Normalized path
     */
    getPath(p) {
      let n = (p || "/").split("/");
      return n.pop(), n = n.join("/").trim(), n.charAt(0) !== "/" && (n = "/" + n), n.substr(-1) !== "/" && (n += "/"), n;
    }
  }
  return pe = k, pe;
}
const Jt = "nodemailer", Yt = "8.0.1", Zt = "https://nodemailer.com/", D = {
  name: Jt,
  version: Yt,
  homepage: Zt
};
var le, We;
function F() {
  if (We) return le;
  We = 1;
  const b = {
    // Connection errors
    ECONNECTION: "Connection closed unexpectedly",
    ETIMEDOUT: "Connection or operation timed out",
    ESOCKET: "Socket-level error",
    EDNS: "DNS resolution failed",
    // TLS/Security errors
    ETLS: "TLS handshake or STARTTLS failed",
    EREQUIRETLS: "REQUIRETLS not supported by server (RFC 8689)",
    // Protocol errors
    EPROTOCOL: "Invalid SMTP server response",
    EENVELOPE: "Invalid mail envelope (sender or recipients)",
    EMESSAGE: "Message delivery error",
    ESTREAM: "Stream processing error",
    // Authentication errors
    EAUTH: "Authentication failed",
    ENOAUTH: "Authentication credentials not provided",
    EOAUTH2: "OAuth2 token generation or refresh error",
    // Resource errors
    EMAXLIMIT: "Pool resource limit reached (max messages per connection)",
    // Transport-specific errors
    ESENDMAIL: "Sendmail command error",
    ESES: "AWS SES transport error",
    // Configuration and access errors
    ECONFIG: "Invalid configuration",
    EPROXY: "Proxy connection error",
    EFILEACCESS: "File access rejected (disableFileAccess is set)",
    EURLACCESS: "URL access rejected (disableUrlAccess is set)",
    EFETCH: "HTTP fetch error"
  };
  return le = Object.keys(b).reduce(
    (y, k) => (y[k] = k, y),
    { ERROR_CODES: b }
  ), le;
}
var Ke;
function ne() {
  if (Ke) return ie.exports;
  Ke = 1;
  const b = Gt, y = Qt, k = ee, f = Wt, p = P.PassThrough, n = Xt(), r = D, o = te, m = F(), e = 5;
  ie.exports = function(c, s) {
    return l(c, s);
  }, ie.exports.Cookies = n;
  function l(c, s) {
    s = s || {}, s.fetchRes = s.fetchRes || new p(), s.cookies = s.cookies || new n(), s.redirects = s.redirects || 0, s.maxRedirects = isNaN(s.maxRedirects) ? e : s.maxRedirects, s.cookie && ([].concat(s.cookie || []).forEach((w) => {
      s.cookies.set(w, c);
    }), s.cookie = !1);
    let x = s.fetchRes, g = k.parse(c), v = (s.method || "").toString().trim().toUpperCase() || "GET", t = !1, i, d, a = g.protocol === "https:" ? y : b, h = {
      "accept-encoding": "gzip,deflate",
      "user-agent": "nodemailer/" + r.version
    };
    if (Object.keys(s.headers || {}).forEach((w) => {
      h[w.toLowerCase().trim()] = s.headers[w];
    }), s.userAgent && (h["user-agent"] = s.userAgent), g.auth && (h.Authorization = "Basic " + Buffer.from(g.auth).toString("base64")), (i = s.cookies.get(c)) && (h.cookie = i), s.body) {
      if (s.contentType !== !1 && (h["Content-Type"] = s.contentType || "application/x-www-form-urlencoded"), typeof s.body.pipe == "function")
        h["Transfer-Encoding"] = "chunked", d = s.body, d.on("error", (w) => {
          t || (t = !0, w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w));
        });
      else {
        if (s.body instanceof Buffer)
          d = s.body;
        else if (typeof s.body == "object")
          try {
            d = Buffer.from(
              Object.keys(s.body).map((w) => {
                let E = s.body[w].toString().trim();
                return encodeURIComponent(w) + "=" + encodeURIComponent(E);
              }).join("&")
            );
          } catch (w) {
            if (t)
              return;
            t = !0, w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w);
            return;
          }
        else
          d = Buffer.from(s.body.toString().trim());
        h["Content-Type"] = s.contentType || "application/x-www-form-urlencoded", h["Content-Length"] = d.length;
      }
      v = (s.method || "").toString().trim().toUpperCase() || "POST";
    }
    let u, _ = {
      method: v,
      host: g.hostname,
      path: g.path,
      port: g.port ? g.port : g.protocol === "https:" ? 443 : 80,
      headers: h,
      rejectUnauthorized: !1,
      agent: !1
    };
    s.tls && Object.keys(s.tls).forEach((w) => {
      _[w] = s.tls[w];
    }), g.protocol === "https:" && g.hostname && g.hostname !== _.host && !o.isIP(g.hostname) && !_.servername && (_.servername = g.hostname);
    try {
      u = a.request(_);
    } catch (w) {
      return t = !0, setImmediate(() => {
        w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w);
      }), x;
    }
    return s.timeout && u.setTimeout(s.timeout, () => {
      if (t)
        return;
      t = !0, u.abort();
      let w = new Error("Request Timeout");
      w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w);
    }), u.on("error", (w) => {
      t || (t = !0, w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w));
    }), u.on("response", (w) => {
      let E;
      if (!t) {
        switch (w.headers["content-encoding"]) {
          case "gzip":
          case "deflate":
            E = f.createUnzip();
            break;
        }
        if (w.headers["set-cookie"] && [].concat(w.headers["set-cookie"] || []).forEach((S) => {
          s.cookies.set(S, c);
        }), [301, 302, 303, 307, 308].includes(w.statusCode) && w.headers.location) {
          if (s.redirects++, s.redirects > s.maxRedirects) {
            t = !0;
            let S = new Error("Maximum redirect count exceeded");
            S.code = m.EFETCH, S.sourceUrl = c, x.emit("error", S), u.abort();
            return;
          }
          return s.method = "GET", s.body = !1, l(k.resolve(c, w.headers.location), s);
        }
        if (x.statusCode = w.statusCode, x.headers = w.headers, w.statusCode >= 300 && !s.allowErrorResponse) {
          t = !0;
          let S = new Error("Invalid status code " + w.statusCode);
          S.code = m.EFETCH, S.sourceUrl = c, x.emit("error", S), u.abort();
          return;
        }
        w.on("error", (S) => {
          t || (t = !0, S.code = m.EFETCH, S.sourceUrl = c, x.emit("error", S), u.abort());
        }), E ? (w.pipe(E).pipe(x), E.on("error", (S) => {
          t || (t = !0, S.code = m.EFETCH, S.sourceUrl = c, x.emit("error", S), u.abort());
        })) : w.pipe(x);
      }
    }), setImmediate(() => {
      if (d)
        try {
          if (typeof d.pipe == "function")
            return d.pipe(u);
          u.write(d);
        } catch (w) {
          t = !0, w.code = m.EFETCH, w.sourceUrl = c, x.emit("error", w);
          return;
        }
      u.end();
    }), x;
  }
  return ie.exports;
}
var Ve;
function q() {
  return Ve || (Ve = 1, (function(b) {
    const y = ee, k = It, f = De, p = ne(), n = jt, r = te, o = Mt, m = 300 * 1e3, e = 30 * 1e3, l = 1e3;
    let c = 0;
    b.exports._lastCacheCleanup = () => c, b.exports._resetCacheCleanup = () => {
      c = 0;
    };
    let s;
    try {
      s = o.networkInterfaces();
    } catch {
    }
    b.exports.networkInterfaces = s;
    const x = (a, h) => {
      let u = b.exports.networkInterfaces;
      return u ? (
        // crux that replaces Object.values(networkInterfaces) as Object.values is not supported in nodejs v6
        Object.keys(u).map((w) => u[w]).reduce((w, E) => w.concat(E), []).filter((w) => !w.internal || h).filter((w) => w.family === "IPv" + a || w.family === a).length > 0
      ) : !0;
    }, g = (a, h, u, _) => {
      if (u = u || {}, !x(a, u.allowInternalNetworkInterfaces))
        return _(null, []);
      (n.Resolver ? new n.Resolver(u) : n)["resolve" + a](h, (S, A) => {
        if (S) {
          switch (S.code) {
            case n.NODATA:
            case n.NOTFOUND:
            case n.NOTIMP:
            case n.SERVFAIL:
            case n.CONNREFUSED:
            case n.REFUSED:
            case "EAI_AGAIN":
              return _(null, []);
          }
          return _(S);
        }
        return _(null, Array.isArray(A) ? A : [].concat(A || []));
      });
    }, v = b.exports.dnsCache = /* @__PURE__ */ new Map(), t = (a, h) => {
      if (!a)
        return Object.assign({}, h || {});
      let u = a.addresses || [], _ = null;
      return u.length === 1 ? _ = u[0] : u.length > 1 && (_ = u[Math.floor(Math.random() * u.length)]), Object.assign(
        {
          servername: a.servername,
          host: _,
          // Include all addresses for connection fallback support
          _addresses: u
        },
        h || {}
      );
    };
    b.exports.resolveHostname = (a, h) => {
      if (a = a || {}, !a.host && a.servername && (a.host = a.servername), !a.host || r.isIP(a.host)) {
        let A = {
          addresses: [a.host],
          servername: a.servername || !1
        };
        return h(
          null,
          t(A, {
            cached: !1
          })
        );
      }
      let u;
      if (v.has(a.host)) {
        u = v.get(a.host);
        const A = Date.now();
        if (A - c > e) {
          c = A;
          for (const [C, j] of v.entries())
            j.expires && j.expires < A && v.delete(C);
          if (v.size > l) {
            const C = Math.floor(l * 0.1);
            Array.from(v.keys()).slice(0, C).forEach((T) => v.delete(T));
          }
        }
        if (!u.expires || u.expires >= A)
          return h(
            null,
            t(u.value, {
              cached: !0
            })
          );
      }
      let _ = [], w = [], E = null, S = null;
      g(4, a.host, a, (A, C) => {
        A ? E = A : _ = C || [], g(6, a.host, a, (j, T) => {
          j ? S = j : w = T || [];
          let I = _.concat(w);
          if (I.length) {
            let M = {
              addresses: I,
              servername: a.servername || a.host
            };
            return v.set(a.host, {
              value: M,
              expires: Date.now() + (a.dnsTtl || m)
            }), h(
              null,
              t(M, {
                cached: !1
              })
            );
          }
          if (E && S && u)
            return v.set(a.host, {
              value: u.value,
              expires: Date.now() + (a.dnsTtl || m)
            }), h(
              null,
              t(u.value, {
                cached: !0,
                error: E
              })
            );
          try {
            n.lookup(a.host, { all: !0 }, (M, L) => {
              if (M)
                return u ? (v.set(a.host, {
                  value: u.value,
                  expires: Date.now() + (a.dnsTtl || m)
                }), h(
                  null,
                  t(u.value, {
                    cached: !0,
                    error: M
                  })
                )) : h(M);
              let O = L ? L.filter((R) => x(R.family)).map((R) => R.address) : [];
              if (L && L.length && !O.length && console.warn(`Failed to resolve IPv${L[0].family} addresses with current network`), !O.length && u)
                return h(
                  null,
                  t(u.value, {
                    cached: !0
                  })
                );
              let N = {
                addresses: O.length ? O : [a.host],
                servername: a.servername || a.host
              };
              return v.set(a.host, {
                value: N,
                expires: Date.now() + (a.dnsTtl || m)
              }), h(
                null,
                t(N, {
                  cached: !1
                })
              );
            });
          } catch (M) {
            return u ? (v.set(a.host, {
              value: u.value,
              expires: Date.now() + (a.dnsTtl || m)
            }), h(
              null,
              t(u.value, {
                cached: !0,
                error: M
              })
            )) : h(E || S || M);
          }
        });
      });
    }, b.exports.parseConnectionUrl = (a) => {
      a = a || "";
      let h = {};
      return [y.parse(a, !0)].forEach((u) => {
        let _;
        switch (u.protocol) {
          case "smtp:":
            h.secure = !1;
            break;
          case "smtps:":
            h.secure = !0;
            break;
          case "direct:":
            h.direct = !0;
            break;
        }
        !isNaN(u.port) && Number(u.port) && (h.port = Number(u.port)), u.hostname && (h.host = u.hostname), u.auth && (_ = u.auth.split(":"), h.auth || (h.auth = {}), h.auth.user = _.shift(), h.auth.pass = _.join(":")), Object.keys(u.query || {}).forEach((w) => {
          let E = h, S = w, A = u.query[w];
          switch (isNaN(A) || (A = Number(A)), A) {
            case "true":
              A = !0;
              break;
            case "false":
              A = !1;
              break;
          }
          if (w.indexOf("tls.") === 0)
            S = w.substr(4), h.tls || (h.tls = {}), E = h.tls;
          else if (w.indexOf(".") >= 0)
            return;
          S in E || (E[S] = A);
        });
      }), h;
    }, b.exports._logFunc = (a, h, u, _, w, ...E) => {
      let S = {};
      Object.keys(u || {}).forEach((A) => {
        A !== "level" && (S[A] = u[A]);
      }), Object.keys(_ || {}).forEach((A) => {
        A !== "level" && (S[A] = _[A]);
      }), a[h](S, w, ...E);
    }, b.exports.getLogger = (a, h) => {
      a = a || {};
      let u = {}, _ = ["trace", "debug", "info", "warn", "error", "fatal"];
      if (!a.logger)
        return _.forEach((E) => {
          u[E] = () => !1;
        }), u;
      let w = a.logger;
      return a.logger === !0 && (w = d(_)), _.forEach((E) => {
        u[E] = (S, A, ...C) => {
          b.exports._logFunc(w, E, h, S, A, ...C);
        };
      }), u;
    }, b.exports.callbackPromise = (a, h) => function() {
      let u = Array.from(arguments), _ = u.shift();
      _ ? h(_) : a(...u);
    }, b.exports.parseDataURI = (a) => {
      if (typeof a != "string" || !a.startsWith("data:"))
        return null;
      const h = a.indexOf(",");
      if (h === -1)
        return null;
      const u = a.substring(h + 1), _ = a.substring(5, h);
      let w;
      const E = _.split(";");
      if (E.length > 0) {
        const j = E[E.length - 1].toLowerCase().trim();
        ["base64", "utf8", "utf-8"].includes(j) && j.indexOf("=") === -1 && (w = j, E.pop());
      }
      const S = E.length > 0 ? E.shift() : "application/octet-stream", A = {};
      for (let j = 0; j < E.length; j++) {
        const T = E[j], I = T.indexOf("=");
        if (I > 0) {
          const M = T.substring(0, I).trim(), L = T.substring(I + 1).trim();
          M && (A[M] = L);
        }
      }
      let C;
      try {
        if (w === "base64")
          C = Buffer.from(u, "base64");
        else
          try {
            C = Buffer.from(decodeURIComponent(u));
          } catch {
            C = Buffer.from(u);
          }
      } catch {
        C = Buffer.alloc(0);
      }
      return {
        data: C,
        encoding: w || null,
        contentType: S || "application/octet-stream",
        params: A
      };
    }, b.exports.resolveContent = (a, h, u) => {
      let _;
      u || (_ = new Promise((A, C) => {
        u = b.exports.callbackPromise(A, C);
      }));
      let w = a && a[h] && a[h].content || a[h], E, S = (typeof a[h] == "object" && a[h].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
      if (!w)
        return u(null, w);
      if (typeof w == "object") {
        if (typeof w.pipe == "function")
          return i(w, (A, C) => {
            if (A)
              return u(A);
            a[h].content ? a[h].content = C : a[h] = C, u(null, C);
          });
        if (/^https?:\/\//i.test(w.path || w.href))
          return E = p(w.path || w.href), i(E, u);
        if (/^data:/i.test(w.path || w.href)) {
          let A = b.exports.parseDataURI(w.path || w.href);
          return !A || !A.data ? u(null, Buffer.from(0)) : u(null, A.data);
        } else if (w.path)
          return i(f.createReadStream(w.path), u);
      }
      return typeof a[h].content == "string" && !["utf8", "usascii", "ascii"].includes(S) && (w = Buffer.from(a[h].content, S)), setImmediate(() => u(null, w)), _;
    }, b.exports.assign = function() {
      let a = Array.from(arguments), h = a.shift() || {};
      return a.forEach((u) => {
        Object.keys(u || {}).forEach((_) => {
          ["tls", "auth"].includes(_) && u[_] && typeof u[_] == "object" ? (h[_] || (h[_] = {}), Object.keys(u[_]).forEach((w) => {
            h[_][w] = u[_][w];
          })) : h[_] = u[_];
        });
      }), h;
    }, b.exports.encodeXText = (a) => {
      if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(a))
        return a;
      let h = Buffer.from(a), u = "";
      for (let _ = 0, w = h.length; _ < w; _++) {
        let E = h[_];
        E < 33 || E > 126 || E === 43 || E === 61 ? u += "+" + (E < 16 ? "0" : "") + E.toString(16).toUpperCase() : u += String.fromCharCode(E);
      }
      return u;
    };
    function i(a, h) {
      let u = !1, _ = [], w = 0;
      a.on("error", (E) => {
        u || (u = !0, h(E));
      }), a.on("readable", () => {
        let E;
        for (; (E = a.read()) !== null; )
          _.push(E), w += E.length;
      }), a.on("end", () => {
        if (u)
          return;
        u = !0;
        let E;
        try {
          E = Buffer.concat(_, w);
        } catch (S) {
          return h(S);
        }
        h(null, E);
      });
    }
    function d(a) {
      let h = 0, u = /* @__PURE__ */ new Map();
      a.forEach((E) => {
        E.length > h && (h = E.length);
      }), a.forEach((E) => {
        let S = E.toUpperCase();
        S.length < h && (S += " ".repeat(h - S.length)), u.set(E, S);
      });
      let _ = (E, S, A, ...C) => {
        let j = "";
        S && (S.tnx === "server" ? j = "S: " : S.tnx === "client" && (j = "C: "), S.sid && (j = "[" + S.sid + "] " + j), S.cid && (j = "[#" + S.cid + "] " + j)), A = k.format(A, ...C), A.split(/\r?\n/).forEach((T) => {
          console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), u.get(E), j + T);
        });
      }, w = {};
      return a.forEach((E) => {
        w[E] = _.bind(null, E);
      }), w;
    }
  })(re)), re.exports;
}
var ce, Xe;
function Ot() {
  if (Xe) return ce;
  Xe = 1;
  const b = Ct, y = "application/octet-stream", k = "bin", f = /* @__PURE__ */ new Map([
    ["application/acad", "dwg"],
    ["application/applixware", "aw"],
    ["application/arj", "arj"],
    ["application/atom+xml", "xml"],
    ["application/atomcat+xml", "atomcat"],
    ["application/atomsvc+xml", "atomsvc"],
    ["application/base64", ["mm", "mme"]],
    ["application/binhex", "hqx"],
    ["application/binhex4", "hqx"],
    ["application/book", ["book", "boo"]],
    ["application/ccxml+xml,", "ccxml"],
    ["application/cdf", "cdf"],
    ["application/cdmi-capability", "cdmia"],
    ["application/cdmi-container", "cdmic"],
    ["application/cdmi-domain", "cdmid"],
    ["application/cdmi-object", "cdmio"],
    ["application/cdmi-queue", "cdmiq"],
    ["application/clariscad", "ccad"],
    ["application/commonground", "dp"],
    ["application/cu-seeme", "cu"],
    ["application/davmount+xml", "davmount"],
    ["application/drafting", "drw"],
    ["application/dsptype", "tsp"],
    ["application/dssc+der", "dssc"],
    ["application/dssc+xml", "xdssc"],
    ["application/dxf", "dxf"],
    ["application/ecmascript", ["js", "es"]],
    ["application/emma+xml", "emma"],
    ["application/envoy", "evy"],
    ["application/epub+zip", "epub"],
    ["application/excel", ["xls", "xl", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
    ["application/exi", "exi"],
    ["application/font-tdpfr", "pfr"],
    ["application/fractals", "fif"],
    ["application/freeloader", "frl"],
    ["application/futuresplash", "spl"],
    ["application/geo+json", "geojson"],
    ["application/gnutar", "tgz"],
    ["application/groupwise", "vew"],
    ["application/hlp", "hlp"],
    ["application/hta", "hta"],
    ["application/hyperstudio", "stk"],
    ["application/i-deas", "unv"],
    ["application/iges", ["iges", "igs"]],
    ["application/inf", "inf"],
    ["application/internet-property-stream", "acx"],
    ["application/ipfix", "ipfix"],
    ["application/java", "class"],
    ["application/java-archive", "jar"],
    ["application/java-byte-code", "class"],
    ["application/java-serialized-object", "ser"],
    ["application/java-vm", "class"],
    ["application/javascript", "js"],
    ["application/json", "json"],
    ["application/lha", "lha"],
    ["application/lzx", "lzx"],
    ["application/mac-binary", "bin"],
    ["application/mac-binhex", "hqx"],
    ["application/mac-binhex40", "hqx"],
    ["application/mac-compactpro", "cpt"],
    ["application/macbinary", "bin"],
    ["application/mads+xml", "mads"],
    ["application/marc", "mrc"],
    ["application/marcxml+xml", "mrcx"],
    ["application/mathematica", "ma"],
    ["application/mathml+xml", "mathml"],
    ["application/mbedlet", "mbd"],
    ["application/mbox", "mbox"],
    ["application/mcad", "mcd"],
    ["application/mediaservercontrol+xml", "mscml"],
    ["application/metalink4+xml", "meta4"],
    ["application/mets+xml", "mets"],
    ["application/mime", "aps"],
    ["application/mods+xml", "mods"],
    ["application/mp21", "m21"],
    ["application/mp4", "mp4"],
    ["application/mspowerpoint", ["ppt", "pot", "pps", "ppz"]],
    ["application/msword", ["doc", "dot", "w6w", "wiz", "word"]],
    ["application/mswrite", "wri"],
    ["application/mxf", "mxf"],
    ["application/netmc", "mcp"],
    ["application/octet-stream", ["*"]],
    ["application/oda", "oda"],
    ["application/oebps-package+xml", "opf"],
    ["application/ogg", "ogx"],
    ["application/olescript", "axs"],
    ["application/onenote", "onetoc"],
    ["application/patch-ops-error+xml", "xer"],
    ["application/pdf", "pdf"],
    ["application/pgp-encrypted", "asc"],
    ["application/pgp-signature", "pgp"],
    ["application/pics-rules", "prf"],
    ["application/pkcs-12", "p12"],
    ["application/pkcs-crl", "crl"],
    ["application/pkcs10", "p10"],
    ["application/pkcs7-mime", ["p7c", "p7m"]],
    ["application/pkcs7-signature", "p7s"],
    ["application/pkcs8", "p8"],
    ["application/pkix-attr-cert", "ac"],
    ["application/pkix-cert", ["cer", "crt"]],
    ["application/pkix-crl", "crl"],
    ["application/pkix-pkipath", "pkipath"],
    ["application/pkixcmp", "pki"],
    ["application/plain", "text"],
    ["application/pls+xml", "pls"],
    ["application/postscript", ["ps", "ai", "eps"]],
    ["application/powerpoint", "ppt"],
    ["application/pro_eng", ["part", "prt"]],
    ["application/prs.cww", "cww"],
    ["application/pskc+xml", "pskcxml"],
    ["application/rdf+xml", "rdf"],
    ["application/reginfo+xml", "rif"],
    ["application/relax-ng-compact-syntax", "rnc"],
    ["application/resource-lists+xml", "rl"],
    ["application/resource-lists-diff+xml", "rld"],
    ["application/ringing-tones", "rng"],
    ["application/rls-services+xml", "rs"],
    ["application/rsd+xml", "rsd"],
    ["application/rss+xml", "xml"],
    ["application/rtf", ["rtf", "rtx"]],
    ["application/sbml+xml", "sbml"],
    ["application/scvp-cv-request", "scq"],
    ["application/scvp-cv-response", "scs"],
    ["application/scvp-vp-request", "spq"],
    ["application/scvp-vp-response", "spp"],
    ["application/sdp", "sdp"],
    ["application/sea", "sea"],
    ["application/set", "set"],
    ["application/set-payment-initiation", "setpay"],
    ["application/set-registration-initiation", "setreg"],
    ["application/shf+xml", "shf"],
    ["application/sla", "stl"],
    ["application/smil", ["smi", "smil"]],
    ["application/smil+xml", "smi"],
    ["application/solids", "sol"],
    ["application/sounder", "sdr"],
    ["application/sparql-query", "rq"],
    ["application/sparql-results+xml", "srx"],
    ["application/srgs", "gram"],
    ["application/srgs+xml", "grxml"],
    ["application/sru+xml", "sru"],
    ["application/ssml+xml", "ssml"],
    ["application/step", ["step", "stp"]],
    ["application/streamingmedia", "ssm"],
    ["application/tei+xml", "tei"],
    ["application/thraud+xml", "tfi"],
    ["application/timestamped-data", "tsd"],
    ["application/toolbook", "tbk"],
    ["application/vda", "vda"],
    ["application/vnd.3gpp.pic-bw-large", "plb"],
    ["application/vnd.3gpp.pic-bw-small", "psb"],
    ["application/vnd.3gpp.pic-bw-var", "pvb"],
    ["application/vnd.3gpp2.tcap", "tcap"],
    ["application/vnd.3m.post-it-notes", "pwn"],
    ["application/vnd.accpac.simply.aso", "aso"],
    ["application/vnd.accpac.simply.imp", "imp"],
    ["application/vnd.acucobol", "acu"],
    ["application/vnd.acucorp", "atc"],
    ["application/vnd.adobe.air-application-installer-package+zip", "air"],
    ["application/vnd.adobe.fxp", "fxp"],
    ["application/vnd.adobe.xdp+xml", "xdp"],
    ["application/vnd.adobe.xfdf", "xfdf"],
    ["application/vnd.ahead.space", "ahead"],
    ["application/vnd.airzip.filesecure.azf", "azf"],
    ["application/vnd.airzip.filesecure.azs", "azs"],
    ["application/vnd.amazon.ebook", "azw"],
    ["application/vnd.americandynamics.acc", "acc"],
    ["application/vnd.amiga.ami", "ami"],
    ["application/vnd.android.package-archive", "apk"],
    ["application/vnd.anser-web-certificate-issue-initiation", "cii"],
    ["application/vnd.anser-web-funds-transfer-initiation", "fti"],
    ["application/vnd.antix.game-component", "atx"],
    ["application/vnd.apple.installer+xml", "mpkg"],
    ["application/vnd.apple.mpegurl", "m3u8"],
    ["application/vnd.aristanetworks.swi", "swi"],
    ["application/vnd.audiograph", "aep"],
    ["application/vnd.blueice.multipass", "mpm"],
    ["application/vnd.bmi", "bmi"],
    ["application/vnd.businessobjects", "rep"],
    ["application/vnd.chemdraw+xml", "cdxml"],
    ["application/vnd.chipnuts.karaoke-mmd", "mmd"],
    ["application/vnd.cinderella", "cdy"],
    ["application/vnd.claymore", "cla"],
    ["application/vnd.cloanto.rp9", "rp9"],
    ["application/vnd.clonk.c4group", "c4g"],
    ["application/vnd.cluetrust.cartomobile-config", "c11amc"],
    ["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
    ["application/vnd.commonspace", "csp"],
    ["application/vnd.contact.cmsg", "cdbcmsg"],
    ["application/vnd.cosmocaller", "cmc"],
    ["application/vnd.crick.clicker", "clkx"],
    ["application/vnd.crick.clicker.keyboard", "clkk"],
    ["application/vnd.crick.clicker.palette", "clkp"],
    ["application/vnd.crick.clicker.template", "clkt"],
    ["application/vnd.crick.clicker.wordbank", "clkw"],
    ["application/vnd.criticaltools.wbs+xml", "wbs"],
    ["application/vnd.ctc-posml", "pml"],
    ["application/vnd.cups-ppd", "ppd"],
    ["application/vnd.curl.car", "car"],
    ["application/vnd.curl.pcurl", "pcurl"],
    ["application/vnd.data-vision.rdz", "rdz"],
    ["application/vnd.denovo.fcselayout-link", "fe_launch"],
    ["application/vnd.dna", "dna"],
    ["application/vnd.dolby.mlp", "mlp"],
    ["application/vnd.dpgraph", "dpg"],
    ["application/vnd.dreamfactory", "dfac"],
    ["application/vnd.dvb.ait", "ait"],
    ["application/vnd.dvb.service", "svc"],
    ["application/vnd.dynageo", "geo"],
    ["application/vnd.ecowin.chart", "mag"],
    ["application/vnd.enliven", "nml"],
    ["application/vnd.epson.esf", "esf"],
    ["application/vnd.epson.msf", "msf"],
    ["application/vnd.epson.quickanime", "qam"],
    ["application/vnd.epson.salt", "slt"],
    ["application/vnd.epson.ssf", "ssf"],
    ["application/vnd.eszigno3+xml", "es3"],
    ["application/vnd.ezpix-album", "ez2"],
    ["application/vnd.ezpix-package", "ez3"],
    ["application/vnd.fdf", "fdf"],
    ["application/vnd.fdsn.seed", "seed"],
    ["application/vnd.flographit", "gph"],
    ["application/vnd.fluxtime.clip", "ftc"],
    ["application/vnd.framemaker", "fm"],
    ["application/vnd.frogans.fnc", "fnc"],
    ["application/vnd.frogans.ltf", "ltf"],
    ["application/vnd.fsc.weblaunch", "fsc"],
    ["application/vnd.fujitsu.oasys", "oas"],
    ["application/vnd.fujitsu.oasys2", "oa2"],
    ["application/vnd.fujitsu.oasys3", "oa3"],
    ["application/vnd.fujitsu.oasysgp", "fg5"],
    ["application/vnd.fujitsu.oasysprs", "bh2"],
    ["application/vnd.fujixerox.ddd", "ddd"],
    ["application/vnd.fujixerox.docuworks", "xdw"],
    ["application/vnd.fujixerox.docuworks.binder", "xbd"],
    ["application/vnd.fuzzysheet", "fzs"],
    ["application/vnd.genomatix.tuxedo", "txd"],
    ["application/vnd.geogebra.file", "ggb"],
    ["application/vnd.geogebra.tool", "ggt"],
    ["application/vnd.geometry-explorer", "gex"],
    ["application/vnd.geonext", "gxt"],
    ["application/vnd.geoplan", "g2w"],
    ["application/vnd.geospace", "g3w"],
    ["application/vnd.gmx", "gmx"],
    ["application/vnd.google-earth.kml+xml", "kml"],
    ["application/vnd.google-earth.kmz", "kmz"],
    ["application/vnd.grafeq", "gqf"],
    ["application/vnd.groove-account", "gac"],
    ["application/vnd.groove-help", "ghf"],
    ["application/vnd.groove-identity-message", "gim"],
    ["application/vnd.groove-injector", "grv"],
    ["application/vnd.groove-tool-message", "gtm"],
    ["application/vnd.groove-tool-template", "tpl"],
    ["application/vnd.groove-vcard", "vcg"],
    ["application/vnd.hal+xml", "hal"],
    ["application/vnd.handheld-entertainment+xml", "zmm"],
    ["application/vnd.hbci", "hbci"],
    ["application/vnd.hhe.lesson-player", "les"],
    ["application/vnd.hp-hpgl", ["hgl", "hpg", "hpgl"]],
    ["application/vnd.hp-hpid", "hpid"],
    ["application/vnd.hp-hps", "hps"],
    ["application/vnd.hp-jlyt", "jlt"],
    ["application/vnd.hp-pcl", "pcl"],
    ["application/vnd.hp-pclxl", "pclxl"],
    ["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
    ["application/vnd.hzn-3d-crossword", "x3d"],
    ["application/vnd.ibm.minipay", "mpy"],
    ["application/vnd.ibm.modcap", "afp"],
    ["application/vnd.ibm.rights-management", "irm"],
    ["application/vnd.ibm.secure-container", "sc"],
    ["application/vnd.iccprofile", "icc"],
    ["application/vnd.igloader", "igl"],
    ["application/vnd.immervision-ivp", "ivp"],
    ["application/vnd.immervision-ivu", "ivu"],
    ["application/vnd.insors.igm", "igm"],
    ["application/vnd.intercon.formnet", "xpw"],
    ["application/vnd.intergeo", "i2g"],
    ["application/vnd.intu.qbo", "qbo"],
    ["application/vnd.intu.qfx", "qfx"],
    ["application/vnd.ipunplugged.rcprofile", "rcprofile"],
    ["application/vnd.irepository.package+xml", "irp"],
    ["application/vnd.is-xpr", "xpr"],
    ["application/vnd.isac.fcs", "fcs"],
    ["application/vnd.jam", "jam"],
    ["application/vnd.jcp.javame.midlet-rms", "rms"],
    ["application/vnd.jisp", "jisp"],
    ["application/vnd.joost.joda-archive", "joda"],
    ["application/vnd.kahootz", "ktz"],
    ["application/vnd.kde.karbon", "karbon"],
    ["application/vnd.kde.kchart", "chrt"],
    ["application/vnd.kde.kformula", "kfo"],
    ["application/vnd.kde.kivio", "flw"],
    ["application/vnd.kde.kontour", "kon"],
    ["application/vnd.kde.kpresenter", "kpr"],
    ["application/vnd.kde.kspread", "ksp"],
    ["application/vnd.kde.kword", "kwd"],
    ["application/vnd.kenameaapp", "htke"],
    ["application/vnd.kidspiration", "kia"],
    ["application/vnd.kinar", "kne"],
    ["application/vnd.koan", "skp"],
    ["application/vnd.kodak-descriptor", "sse"],
    ["application/vnd.las.las+xml", "lasxml"],
    ["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
    ["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
    ["application/vnd.lotus-1-2-3", "123"],
    ["application/vnd.lotus-approach", "apr"],
    ["application/vnd.lotus-freelance", "pre"],
    ["application/vnd.lotus-notes", "nsf"],
    ["application/vnd.lotus-organizer", "org"],
    ["application/vnd.lotus-screencam", "scm"],
    ["application/vnd.lotus-wordpro", "lwp"],
    ["application/vnd.macports.portpkg", "portpkg"],
    ["application/vnd.mcd", "mcd"],
    ["application/vnd.medcalcdata", "mc1"],
    ["application/vnd.mediastation.cdkey", "cdkey"],
    ["application/vnd.mfer", "mwf"],
    ["application/vnd.mfmp", "mfm"],
    ["application/vnd.micrografx.flo", "flo"],
    ["application/vnd.micrografx.igx", "igx"],
    ["application/vnd.mif", "mif"],
    ["application/vnd.mobius.daf", "daf"],
    ["application/vnd.mobius.dis", "dis"],
    ["application/vnd.mobius.mbk", "mbk"],
    ["application/vnd.mobius.mqy", "mqy"],
    ["application/vnd.mobius.msl", "msl"],
    ["application/vnd.mobius.plc", "plc"],
    ["application/vnd.mobius.txf", "txf"],
    ["application/vnd.mophun.application", "mpn"],
    ["application/vnd.mophun.certificate", "mpc"],
    ["application/vnd.mozilla.xul+xml", "xul"],
    ["application/vnd.ms-artgalry", "cil"],
    ["application/vnd.ms-cab-compressed", "cab"],
    ["application/vnd.ms-excel", ["xls", "xla", "xlc", "xlm", "xlt", "xlw", "xlb", "xll"]],
    ["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
    ["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
    ["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
    ["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
    ["application/vnd.ms-fontobject", "eot"],
    ["application/vnd.ms-htmlhelp", "chm"],
    ["application/vnd.ms-ims", "ims"],
    ["application/vnd.ms-lrm", "lrm"],
    ["application/vnd.ms-officetheme", "thmx"],
    ["application/vnd.ms-outlook", "msg"],
    ["application/vnd.ms-pki.certstore", "sst"],
    ["application/vnd.ms-pki.pko", "pko"],
    ["application/vnd.ms-pki.seccat", "cat"],
    ["application/vnd.ms-pki.stl", "stl"],
    ["application/vnd.ms-pkicertstore", "sst"],
    ["application/vnd.ms-pkiseccat", "cat"],
    ["application/vnd.ms-pkistl", "stl"],
    ["application/vnd.ms-powerpoint", ["ppt", "pot", "pps", "ppa", "pwz"]],
    ["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
    ["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
    ["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
    ["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
    ["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
    ["application/vnd.ms-project", "mpp"],
    ["application/vnd.ms-word.document.macroenabled.12", "docm"],
    ["application/vnd.ms-word.template.macroenabled.12", "dotm"],
    ["application/vnd.ms-works", ["wks", "wcm", "wdb", "wps"]],
    ["application/vnd.ms-wpl", "wpl"],
    ["application/vnd.ms-xpsdocument", "xps"],
    ["application/vnd.mseq", "mseq"],
    ["application/vnd.musician", "mus"],
    ["application/vnd.muvee.style", "msty"],
    ["application/vnd.neurolanguage.nlu", "nlu"],
    ["application/vnd.noblenet-directory", "nnd"],
    ["application/vnd.noblenet-sealer", "nns"],
    ["application/vnd.noblenet-web", "nnw"],
    ["application/vnd.nokia.configuration-message", "ncm"],
    ["application/vnd.nokia.n-gage.data", "ngdat"],
    ["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
    ["application/vnd.nokia.radio-preset", "rpst"],
    ["application/vnd.nokia.radio-presets", "rpss"],
    ["application/vnd.nokia.ringing-tone", "rng"],
    ["application/vnd.novadigm.edm", "edm"],
    ["application/vnd.novadigm.edx", "edx"],
    ["application/vnd.novadigm.ext", "ext"],
    ["application/vnd.oasis.opendocument.chart", "odc"],
    ["application/vnd.oasis.opendocument.chart-template", "otc"],
    ["application/vnd.oasis.opendocument.database", "odb"],
    ["application/vnd.oasis.opendocument.formula", "odf"],
    ["application/vnd.oasis.opendocument.formula-template", "odft"],
    ["application/vnd.oasis.opendocument.graphics", "odg"],
    ["application/vnd.oasis.opendocument.graphics-template", "otg"],
    ["application/vnd.oasis.opendocument.image", "odi"],
    ["application/vnd.oasis.opendocument.image-template", "oti"],
    ["application/vnd.oasis.opendocument.presentation", "odp"],
    ["application/vnd.oasis.opendocument.presentation-template", "otp"],
    ["application/vnd.oasis.opendocument.spreadsheet", "ods"],
    ["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
    ["application/vnd.oasis.opendocument.text", "odt"],
    ["application/vnd.oasis.opendocument.text-master", "odm"],
    ["application/vnd.oasis.opendocument.text-template", "ott"],
    ["application/vnd.oasis.opendocument.text-web", "oth"],
    ["application/vnd.olpc-sugar", "xo"],
    ["application/vnd.oma.dd2+xml", "dd2"],
    ["application/vnd.openofficeorg.extension", "oxt"],
    ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
    ["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
    ["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
    ["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
    ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
    ["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
    ["application/vnd.osgeo.mapguide.package", "mgp"],
    ["application/vnd.osgi.dp", "dp"],
    ["application/vnd.palm", "pdb"],
    ["application/vnd.pawaafile", "paw"],
    ["application/vnd.pg.format", "str"],
    ["application/vnd.pg.osasli", "ei6"],
    ["application/vnd.picsel", "efif"],
    ["application/vnd.pmi.widget", "wg"],
    ["application/vnd.pocketlearn", "plf"],
    ["application/vnd.powerbuilder6", "pbd"],
    ["application/vnd.previewsystems.box", "box"],
    ["application/vnd.proteus.magazine", "mgz"],
    ["application/vnd.publishare-delta-tree", "qps"],
    ["application/vnd.pvi.ptid1", "ptid"],
    ["application/vnd.quark.quarkxpress", "qxd"],
    ["application/vnd.realvnc.bed", "bed"],
    ["application/vnd.recordare.musicxml", "mxl"],
    ["application/vnd.recordare.musicxml+xml", "musicxml"],
    ["application/vnd.rig.cryptonote", "cryptonote"],
    ["application/vnd.rim.cod", "cod"],
    ["application/vnd.rn-realmedia", "rm"],
    ["application/vnd.rn-realplayer", "rnx"],
    ["application/vnd.route66.link66+xml", "link66"],
    ["application/vnd.sailingtracker.track", "st"],
    ["application/vnd.seemail", "see"],
    ["application/vnd.sema", "sema"],
    ["application/vnd.semd", "semd"],
    ["application/vnd.semf", "semf"],
    ["application/vnd.shana.informed.formdata", "ifm"],
    ["application/vnd.shana.informed.formtemplate", "itp"],
    ["application/vnd.shana.informed.interchange", "iif"],
    ["application/vnd.shana.informed.package", "ipk"],
    ["application/vnd.simtech-mindmapper", "twd"],
    ["application/vnd.smaf", "mmf"],
    ["application/vnd.smart.teacher", "teacher"],
    ["application/vnd.solent.sdkm+xml", "sdkm"],
    ["application/vnd.spotfire.dxp", "dxp"],
    ["application/vnd.spotfire.sfs", "sfs"],
    ["application/vnd.stardivision.calc", "sdc"],
    ["application/vnd.stardivision.draw", "sda"],
    ["application/vnd.stardivision.impress", "sdd"],
    ["application/vnd.stardivision.math", "smf"],
    ["application/vnd.stardivision.writer", "sdw"],
    ["application/vnd.stardivision.writer-global", "sgl"],
    ["application/vnd.stepmania.stepchart", "sm"],
    ["application/vnd.sun.xml.calc", "sxc"],
    ["application/vnd.sun.xml.calc.template", "stc"],
    ["application/vnd.sun.xml.draw", "sxd"],
    ["application/vnd.sun.xml.draw.template", "std"],
    ["application/vnd.sun.xml.impress", "sxi"],
    ["application/vnd.sun.xml.impress.template", "sti"],
    ["application/vnd.sun.xml.math", "sxm"],
    ["application/vnd.sun.xml.writer", "sxw"],
    ["application/vnd.sun.xml.writer.global", "sxg"],
    ["application/vnd.sun.xml.writer.template", "stw"],
    ["application/vnd.sus-calendar", "sus"],
    ["application/vnd.svd", "svd"],
    ["application/vnd.symbian.install", "sis"],
    ["application/vnd.syncml+xml", "xsm"],
    ["application/vnd.syncml.dm+wbxml", "bdm"],
    ["application/vnd.syncml.dm+xml", "xdm"],
    ["application/vnd.tao.intent-module-archive", "tao"],
    ["application/vnd.tmobile-livetv", "tmo"],
    ["application/vnd.trid.tpt", "tpt"],
    ["application/vnd.triscape.mxs", "mxs"],
    ["application/vnd.trueapp", "tra"],
    ["application/vnd.ufdl", "ufd"],
    ["application/vnd.uiq.theme", "utz"],
    ["application/vnd.umajin", "umj"],
    ["application/vnd.unity", "unityweb"],
    ["application/vnd.uoml+xml", "uoml"],
    ["application/vnd.vcx", "vcx"],
    ["application/vnd.visio", "vsd"],
    ["application/vnd.visionary", "vis"],
    ["application/vnd.vsf", "vsf"],
    ["application/vnd.wap.wbxml", "wbxml"],
    ["application/vnd.wap.wmlc", "wmlc"],
    ["application/vnd.wap.wmlscriptc", "wmlsc"],
    ["application/vnd.webturbo", "wtb"],
    ["application/vnd.wolfram.player", "nbp"],
    ["application/vnd.wordperfect", "wpd"],
    ["application/vnd.wqd", "wqd"],
    ["application/vnd.wt.stf", "stf"],
    ["application/vnd.xara", ["web", "xar"]],
    ["application/vnd.xfdl", "xfdl"],
    ["application/vnd.yamaha.hv-dic", "hvd"],
    ["application/vnd.yamaha.hv-script", "hvs"],
    ["application/vnd.yamaha.hv-voice", "hvp"],
    ["application/vnd.yamaha.openscoreformat", "osf"],
    ["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
    ["application/vnd.yamaha.smaf-audio", "saf"],
    ["application/vnd.yamaha.smaf-phrase", "spf"],
    ["application/vnd.yellowriver-custom-menu", "cmp"],
    ["application/vnd.zul", "zir"],
    ["application/vnd.zzazz.deck+xml", "zaz"],
    ["application/vocaltec-media-desc", "vmd"],
    ["application/vocaltec-media-file", "vmf"],
    ["application/voicexml+xml", "vxml"],
    ["application/widget", "wgt"],
    ["application/winhlp", "hlp"],
    ["application/wordperfect", ["wp", "wp5", "wp6", "wpd"]],
    ["application/wordperfect6.0", ["w60", "wp5"]],
    ["application/wordperfect6.1", "w61"],
    ["application/wsdl+xml", "wsdl"],
    ["application/wspolicy+xml", "wspolicy"],
    ["application/x-123", "wk1"],
    ["application/x-7z-compressed", "7z"],
    ["application/x-abiword", "abw"],
    ["application/x-ace-compressed", "ace"],
    ["application/x-aim", "aim"],
    ["application/x-authorware-bin", "aab"],
    ["application/x-authorware-map", "aam"],
    ["application/x-authorware-seg", "aas"],
    ["application/x-bcpio", "bcpio"],
    ["application/x-binary", "bin"],
    ["application/x-binhex40", "hqx"],
    ["application/x-bittorrent", "torrent"],
    ["application/x-bsh", ["bsh", "sh", "shar"]],
    ["application/x-bytecode.elisp", "elc"],
    ["application/x-bytecode.python", "pyc"],
    ["application/x-bzip", "bz"],
    ["application/x-bzip2", ["boz", "bz2"]],
    ["application/x-cdf", "cdf"],
    ["application/x-cdlink", "vcd"],
    ["application/x-chat", ["cha", "chat"]],
    ["application/x-chess-pgn", "pgn"],
    ["application/x-cmu-raster", "ras"],
    ["application/x-cocoa", "cco"],
    ["application/x-compactpro", "cpt"],
    ["application/x-compress", "z"],
    ["application/x-compressed", ["tgz", "gz", "z", "zip"]],
    ["application/x-conference", "nsc"],
    ["application/x-cpio", "cpio"],
    ["application/x-cpt", "cpt"],
    ["application/x-csh", "csh"],
    ["application/x-debian-package", "deb"],
    ["application/x-deepv", "deepv"],
    ["application/x-director", ["dir", "dcr", "dxr"]],
    ["application/x-doom", "wad"],
    ["application/x-dtbncx+xml", "ncx"],
    ["application/x-dtbook+xml", "dtb"],
    ["application/x-dtbresource+xml", "res"],
    ["application/x-dvi", "dvi"],
    ["application/x-elc", "elc"],
    ["application/x-envoy", ["env", "evy"]],
    ["application/x-esrehber", "es"],
    ["application/x-excel", ["xls", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
    ["application/x-font-bdf", "bdf"],
    ["application/x-font-ghostscript", "gsf"],
    ["application/x-font-linux-psf", "psf"],
    ["application/x-font-otf", "otf"],
    ["application/x-font-pcf", "pcf"],
    ["application/x-font-snf", "snf"],
    ["application/x-font-ttf", "ttf"],
    ["application/x-font-type1", "pfa"],
    ["application/x-font-woff", "woff"],
    ["application/x-frame", "mif"],
    ["application/x-freelance", "pre"],
    ["application/x-futuresplash", "spl"],
    ["application/x-gnumeric", "gnumeric"],
    ["application/x-gsp", "gsp"],
    ["application/x-gss", "gss"],
    ["application/x-gtar", "gtar"],
    ["application/x-gzip", ["gz", "gzip"]],
    ["application/x-hdf", "hdf"],
    ["application/x-helpfile", ["help", "hlp"]],
    ["application/x-httpd-imap", "imap"],
    ["application/x-ima", "ima"],
    ["application/x-internet-signup", ["ins", "isp"]],
    ["application/x-internett-signup", "ins"],
    ["application/x-inventor", "iv"],
    ["application/x-ip2", "ip"],
    ["application/x-iphone", "iii"],
    ["application/x-java-class", "class"],
    ["application/x-java-commerce", "jcm"],
    ["application/x-java-jnlp-file", "jnlp"],
    ["application/x-javascript", "js"],
    ["application/x-koan", ["skd", "skm", "skp", "skt"]],
    ["application/x-ksh", "ksh"],
    ["application/x-latex", ["latex", "ltx"]],
    ["application/x-lha", "lha"],
    ["application/x-lisp", "lsp"],
    ["application/x-livescreen", "ivy"],
    ["application/x-lotus", "wq1"],
    ["application/x-lotusscreencam", "scm"],
    ["application/x-lzh", "lzh"],
    ["application/x-lzx", "lzx"],
    ["application/x-mac-binhex40", "hqx"],
    ["application/x-macbinary", "bin"],
    ["application/x-magic-cap-package-1.0", "mc$"],
    ["application/x-mathcad", "mcd"],
    ["application/x-meme", "mm"],
    ["application/x-midi", ["mid", "midi"]],
    ["application/x-mif", "mif"],
    ["application/x-mix-transfer", "nix"],
    ["application/x-mobipocket-ebook", "prc"],
    ["application/x-mplayer2", "asx"],
    ["application/x-ms-application", "application"],
    ["application/x-ms-wmd", "wmd"],
    ["application/x-ms-wmz", "wmz"],
    ["application/x-ms-xbap", "xbap"],
    ["application/x-msaccess", "mdb"],
    ["application/x-msbinder", "obd"],
    ["application/x-mscardfile", "crd"],
    ["application/x-msclip", "clp"],
    ["application/x-msdownload", ["exe", "dll"]],
    ["application/x-msexcel", ["xls", "xla", "xlw"]],
    ["application/x-msmediaview", ["mvb", "m13", "m14"]],
    ["application/x-msmetafile", "wmf"],
    ["application/x-msmoney", "mny"],
    ["application/x-mspowerpoint", "ppt"],
    ["application/x-mspublisher", "pub"],
    ["application/x-msschedule", "scd"],
    ["application/x-msterminal", "trm"],
    ["application/x-mswrite", "wri"],
    ["application/x-navi-animation", "ani"],
    ["application/x-navidoc", "nvd"],
    ["application/x-navimap", "map"],
    ["application/x-navistyle", "stl"],
    ["application/x-netcdf", ["cdf", "nc"]],
    ["application/x-newton-compatible-pkg", "pkg"],
    ["application/x-nokia-9000-communicator-add-on-software", "aos"],
    ["application/x-omc", "omc"],
    ["application/x-omcdatamaker", "omcd"],
    ["application/x-omcregerator", "omcr"],
    ["application/x-pagemaker", ["pm4", "pm5"]],
    ["application/x-pcl", "pcl"],
    ["application/x-perfmon", ["pma", "pmc", "pml", "pmr", "pmw"]],
    ["application/x-pixclscript", "plx"],
    ["application/x-pkcs10", "p10"],
    ["application/x-pkcs12", ["p12", "pfx"]],
    ["application/x-pkcs7-certificates", ["p7b", "spc"]],
    ["application/x-pkcs7-certreqresp", "p7r"],
    ["application/x-pkcs7-mime", ["p7m", "p7c"]],
    ["application/x-pkcs7-signature", ["p7s", "p7a"]],
    ["application/x-pointplus", "css"],
    ["application/x-portable-anymap", "pnm"],
    ["application/x-project", ["mpc", "mpt", "mpv", "mpx"]],
    ["application/x-qpro", "wb1"],
    ["application/x-rar-compressed", "rar"],
    ["application/x-rtf", "rtf"],
    ["application/x-sdp", "sdp"],
    ["application/x-sea", "sea"],
    ["application/x-seelogo", "sl"],
    ["application/x-sh", "sh"],
    ["application/x-shar", ["shar", "sh"]],
    ["application/x-shockwave-flash", "swf"],
    ["application/x-silverlight-app", "xap"],
    ["application/x-sit", "sit"],
    ["application/x-sprite", ["spr", "sprite"]],
    ["application/x-stuffit", "sit"],
    ["application/x-stuffitx", "sitx"],
    ["application/x-sv4cpio", "sv4cpio"],
    ["application/x-sv4crc", "sv4crc"],
    ["application/x-tar", "tar"],
    ["application/x-tbook", ["sbk", "tbk"]],
    ["application/x-tcl", "tcl"],
    ["application/x-tex", "tex"],
    ["application/x-tex-tfm", "tfm"],
    ["application/x-texinfo", ["texi", "texinfo"]],
    ["application/x-troff", ["roff", "t", "tr"]],
    ["application/x-troff-man", "man"],
    ["application/x-troff-me", "me"],
    ["application/x-troff-ms", "ms"],
    ["application/x-troff-msvideo", "avi"],
    ["application/x-ustar", "ustar"],
    ["application/x-visio", ["vsd", "vst", "vsw"]],
    ["application/x-vnd.audioexplosion.mzz", "mzz"],
    ["application/x-vnd.ls-xpix", "xpix"],
    ["application/x-vrml", "vrml"],
    ["application/x-wais-source", ["src", "wsrc"]],
    ["application/x-winhelp", "hlp"],
    ["application/x-wintalk", "wtk"],
    ["application/x-world", ["wrl", "svr"]],
    ["application/x-wpwin", "wpd"],
    ["application/x-wri", "wri"],
    ["application/x-x509-ca-cert", ["cer", "crt", "der"]],
    ["application/x-x509-user-cert", "crt"],
    ["application/x-xfig", "fig"],
    ["application/x-xpinstall", "xpi"],
    ["application/x-zip-compressed", "zip"],
    ["application/xcap-diff+xml", "xdf"],
    ["application/xenc+xml", "xenc"],
    ["application/xhtml+xml", "xhtml"],
    ["application/xml", "xml"],
    ["application/xml-dtd", "dtd"],
    ["application/xop+xml", "xop"],
    ["application/xslt+xml", "xslt"],
    ["application/xspf+xml", "xspf"],
    ["application/xv+xml", "mxml"],
    ["application/yang", "yang"],
    ["application/yin+xml", "yin"],
    ["application/ynd.ms-pkipko", "pko"],
    ["application/zip", "zip"],
    ["audio/adpcm", "adp"],
    ["audio/aiff", ["aiff", "aif", "aifc"]],
    ["audio/basic", ["snd", "au"]],
    ["audio/it", "it"],
    ["audio/make", ["funk", "my", "pfunk"]],
    ["audio/make.my.funk", "pfunk"],
    ["audio/mid", ["mid", "rmi"]],
    ["audio/midi", ["midi", "kar", "mid"]],
    ["audio/mod", "mod"],
    ["audio/mp4", "mp4a"],
    ["audio/mpeg", ["mpga", "mp3", "m2a", "mp2", "mpa", "mpg"]],
    ["audio/mpeg3", "mp3"],
    ["audio/nspaudio", ["la", "lma"]],
    ["audio/ogg", "oga"],
    ["audio/s3m", "s3m"],
    ["audio/tsp-audio", "tsi"],
    ["audio/tsplayer", "tsp"],
    ["audio/vnd.dece.audio", "uva"],
    ["audio/vnd.digital-winds", "eol"],
    ["audio/vnd.dra", "dra"],
    ["audio/vnd.dts", "dts"],
    ["audio/vnd.dts.hd", "dtshd"],
    ["audio/vnd.lucent.voice", "lvp"],
    ["audio/vnd.ms-playready.media.pya", "pya"],
    ["audio/vnd.nuera.ecelp4800", "ecelp4800"],
    ["audio/vnd.nuera.ecelp7470", "ecelp7470"],
    ["audio/vnd.nuera.ecelp9600", "ecelp9600"],
    ["audio/vnd.qcelp", "qcp"],
    ["audio/vnd.rip", "rip"],
    ["audio/voc", "voc"],
    ["audio/voxware", "vox"],
    ["audio/wav", "wav"],
    ["audio/webm", "weba"],
    ["audio/x-aac", "aac"],
    ["audio/x-adpcm", "snd"],
    ["audio/x-aiff", ["aiff", "aif", "aifc"]],
    ["audio/x-au", "au"],
    ["audio/x-gsm", ["gsd", "gsm"]],
    ["audio/x-jam", "jam"],
    ["audio/x-liveaudio", "lam"],
    ["audio/x-mid", ["mid", "midi"]],
    ["audio/x-midi", ["midi", "mid"]],
    ["audio/x-mod", "mod"],
    ["audio/x-mpeg", "mp2"],
    ["audio/x-mpeg-3", "mp3"],
    ["audio/x-mpegurl", "m3u"],
    ["audio/x-mpequrl", "m3u"],
    ["audio/x-ms-wax", "wax"],
    ["audio/x-ms-wma", "wma"],
    ["audio/x-nspaudio", ["la", "lma"]],
    ["audio/x-pn-realaudio", ["ra", "ram", "rm", "rmm", "rmp"]],
    ["audio/x-pn-realaudio-plugin", ["ra", "rmp", "rpm"]],
    ["audio/x-psid", "sid"],
    ["audio/x-realaudio", "ra"],
    ["audio/x-twinvq", "vqf"],
    ["audio/x-twinvq-plugin", ["vqe", "vql"]],
    ["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
    ["audio/x-voc", "voc"],
    ["audio/x-wav", "wav"],
    ["audio/xm", "xm"],
    ["chemical/x-cdx", "cdx"],
    ["chemical/x-cif", "cif"],
    ["chemical/x-cmdf", "cmdf"],
    ["chemical/x-cml", "cml"],
    ["chemical/x-csml", "csml"],
    ["chemical/x-pdb", ["pdb", "xyz"]],
    ["chemical/x-xyz", "xyz"],
    ["drawing/x-dwf", "dwf"],
    ["i-world/i-vrml", "ivr"],
    ["image/bmp", ["bmp", "bm"]],
    ["image/cgm", "cgm"],
    ["image/cis-cod", "cod"],
    ["image/cmu-raster", ["ras", "rast"]],
    ["image/fif", "fif"],
    ["image/florian", ["flo", "turbot"]],
    ["image/g3fax", "g3"],
    ["image/gif", "gif"],
    ["image/ief", ["ief", "iefs"]],
    ["image/jpeg", ["jpeg", "jpe", "jpg", "jfif", "jfif-tbnl"]],
    ["image/jutvision", "jut"],
    ["image/ktx", "ktx"],
    ["image/naplps", ["nap", "naplps"]],
    ["image/pict", ["pic", "pict"]],
    ["image/pipeg", "jfif"],
    ["image/pjpeg", ["jfif", "jpe", "jpeg", "jpg"]],
    ["image/png", ["png", "x-png"]],
    ["image/prs.btif", "btif"],
    ["image/svg+xml", "svg"],
    ["image/tiff", ["tif", "tiff"]],
    ["image/vasa", "mcf"],
    ["image/vnd.adobe.photoshop", "psd"],
    ["image/vnd.dece.graphic", "uvi"],
    ["image/vnd.djvu", "djvu"],
    ["image/vnd.dvb.subtitle", "sub"],
    ["image/vnd.dwg", ["dwg", "dxf", "svf"]],
    ["image/vnd.dxf", "dxf"],
    ["image/vnd.fastbidsheet", "fbs"],
    ["image/vnd.fpx", "fpx"],
    ["image/vnd.fst", "fst"],
    ["image/vnd.fujixerox.edmics-mmr", "mmr"],
    ["image/vnd.fujixerox.edmics-rlc", "rlc"],
    ["image/vnd.ms-modi", "mdi"],
    ["image/vnd.net-fpx", ["fpx", "npx"]],
    ["image/vnd.rn-realflash", "rf"],
    ["image/vnd.rn-realpix", "rp"],
    ["image/vnd.wap.wbmp", "wbmp"],
    ["image/vnd.xiff", "xif"],
    ["image/webp", "webp"],
    ["image/x-cmu-raster", "ras"],
    ["image/x-cmx", "cmx"],
    ["image/x-dwg", ["dwg", "dxf", "svf"]],
    ["image/x-freehand", "fh"],
    ["image/x-icon", "ico"],
    ["image/x-jg", "art"],
    ["image/x-jps", "jps"],
    ["image/x-niff", ["niff", "nif"]],
    ["image/x-pcx", "pcx"],
    ["image/x-pict", ["pct", "pic"]],
    ["image/x-portable-anymap", "pnm"],
    ["image/x-portable-bitmap", "pbm"],
    ["image/x-portable-graymap", "pgm"],
    ["image/x-portable-greymap", "pgm"],
    ["image/x-portable-pixmap", "ppm"],
    ["image/x-quicktime", ["qif", "qti", "qtif"]],
    ["image/x-rgb", "rgb"],
    ["image/x-tiff", ["tif", "tiff"]],
    ["image/x-windows-bmp", "bmp"],
    ["image/x-xbitmap", "xbm"],
    ["image/x-xbm", "xbm"],
    ["image/x-xpixmap", ["xpm", "pm"]],
    ["image/x-xwd", "xwd"],
    ["image/x-xwindowdump", "xwd"],
    ["image/xbm", "xbm"],
    ["image/xpm", "xpm"],
    ["message/rfc822", ["eml", "mht", "mhtml", "nws", "mime"]],
    ["model/iges", ["iges", "igs"]],
    ["model/mesh", "msh"],
    ["model/vnd.collada+xml", "dae"],
    ["model/vnd.dwf", "dwf"],
    ["model/vnd.gdl", "gdl"],
    ["model/vnd.gtw", "gtw"],
    ["model/vnd.mts", "mts"],
    ["model/vnd.vtu", "vtu"],
    ["model/vrml", ["vrml", "wrl", "wrz"]],
    ["model/x-pov", "pov"],
    ["multipart/x-gzip", "gzip"],
    ["multipart/x-ustar", "ustar"],
    ["multipart/x-zip", "zip"],
    ["music/crescendo", ["mid", "midi"]],
    ["music/x-karaoke", "kar"],
    ["paleovu/x-pv", "pvu"],
    ["text/asp", "asp"],
    ["text/calendar", "ics"],
    ["text/css", "css"],
    ["text/csv", "csv"],
    ["text/ecmascript", "js"],
    ["text/h323", "323"],
    ["text/html", ["html", "htm", "stm", "acgi", "htmls", "htx", "shtml"]],
    ["text/iuls", "uls"],
    ["text/javascript", "js"],
    ["text/mcf", "mcf"],
    ["text/n3", "n3"],
    ["text/pascal", "pas"],
    [
      "text/plain",
      [
        "txt",
        "bas",
        "c",
        "h",
        "c++",
        "cc",
        "com",
        "conf",
        "cxx",
        "def",
        "f",
        "f90",
        "for",
        "g",
        "hh",
        "idc",
        "jav",
        "java",
        "list",
        "log",
        "lst",
        "m",
        "mar",
        "pl",
        "sdml",
        "text"
      ]
    ],
    ["text/plain-bas", "par"],
    ["text/prs.lines.tag", "dsc"],
    ["text/richtext", ["rtx", "rt", "rtf"]],
    ["text/scriplet", "wsc"],
    ["text/scriptlet", "sct"],
    ["text/sgml", ["sgm", "sgml"]],
    ["text/tab-separated-values", "tsv"],
    ["text/troff", "t"],
    ["text/turtle", "ttl"],
    ["text/uri-list", ["uni", "unis", "uri", "uris"]],
    ["text/vnd.abc", "abc"],
    ["text/vnd.curl", "curl"],
    ["text/vnd.curl.dcurl", "dcurl"],
    ["text/vnd.curl.mcurl", "mcurl"],
    ["text/vnd.curl.scurl", "scurl"],
    ["text/vnd.fly", "fly"],
    ["text/vnd.fmi.flexstor", "flx"],
    ["text/vnd.graphviz", "gv"],
    ["text/vnd.in3d.3dml", "3dml"],
    ["text/vnd.in3d.spot", "spot"],
    ["text/vnd.rn-realtext", "rt"],
    ["text/vnd.sun.j2me.app-descriptor", "jad"],
    ["text/vnd.wap.wml", "wml"],
    ["text/vnd.wap.wmlscript", "wmls"],
    ["text/webviewhtml", "htt"],
    ["text/x-asm", ["asm", "s"]],
    ["text/x-audiosoft-intra", "aip"],
    ["text/x-c", ["c", "cc", "cpp"]],
    ["text/x-component", "htc"],
    ["text/x-fortran", ["for", "f", "f77", "f90"]],
    ["text/x-h", ["h", "hh"]],
    ["text/x-java-source", ["java", "jav"]],
    ["text/x-java-source,java", "java"],
    ["text/x-la-asf", "lsx"],
    ["text/x-m", "m"],
    ["text/x-pascal", "p"],
    ["text/x-script", "hlb"],
    ["text/x-script.csh", "csh"],
    ["text/x-script.elisp", "el"],
    ["text/x-script.guile", "scm"],
    ["text/x-script.ksh", "ksh"],
    ["text/x-script.lisp", "lsp"],
    ["text/x-script.perl", "pl"],
    ["text/x-script.perl-module", "pm"],
    ["text/x-script.phyton", "py"],
    ["text/x-script.rexx", "rexx"],
    ["text/x-script.scheme", "scm"],
    ["text/x-script.sh", "sh"],
    ["text/x-script.tcl", "tcl"],
    ["text/x-script.tcsh", "tcsh"],
    ["text/x-script.zsh", "zsh"],
    ["text/x-server-parsed-html", ["shtml", "ssi"]],
    ["text/x-setext", "etx"],
    ["text/x-sgml", ["sgm", "sgml"]],
    ["text/x-speech", ["spc", "talk"]],
    ["text/x-uil", "uil"],
    ["text/x-uuencode", ["uu", "uue"]],
    ["text/x-vcalendar", "vcs"],
    ["text/x-vcard", "vcf"],
    ["text/xml", "xml"],
    ["video/3gpp", "3gp"],
    ["video/3gpp2", "3g2"],
    ["video/animaflex", "afl"],
    ["video/avi", "avi"],
    ["video/avs-video", "avs"],
    ["video/dl", "dl"],
    ["video/fli", "fli"],
    ["video/gl", "gl"],
    ["video/h261", "h261"],
    ["video/h263", "h263"],
    ["video/h264", "h264"],
    ["video/jpeg", "jpgv"],
    ["video/jpm", "jpm"],
    ["video/mj2", "mj2"],
    ["video/mp4", "mp4"],
    ["video/mpeg", ["mpeg", "mp2", "mpa", "mpe", "mpg", "mpv2", "m1v", "m2v", "mp3"]],
    ["video/msvideo", "avi"],
    ["video/ogg", "ogv"],
    ["video/quicktime", ["mov", "qt", "moov"]],
    ["video/vdo", "vdo"],
    ["video/vivo", ["viv", "vivo"]],
    ["video/vnd.dece.hd", "uvh"],
    ["video/vnd.dece.mobile", "uvm"],
    ["video/vnd.dece.pd", "uvp"],
    ["video/vnd.dece.sd", "uvs"],
    ["video/vnd.dece.video", "uvv"],
    ["video/vnd.fvt", "fvt"],
    ["video/vnd.mpegurl", "mxu"],
    ["video/vnd.ms-playready.media.pyv", "pyv"],
    ["video/vnd.rn-realvideo", "rv"],
    ["video/vnd.uvvu.mp4", "uvu"],
    ["video/vnd.vivo", ["viv", "vivo"]],
    ["video/vosaic", "vos"],
    ["video/webm", "webm"],
    ["video/x-amt-demorun", "xdr"],
    ["video/x-amt-showrun", "xsr"],
    ["video/x-atomic3d-feature", "fmf"],
    ["video/x-dl", "dl"],
    ["video/x-dv", ["dif", "dv"]],
    ["video/x-f4v", "f4v"],
    ["video/x-fli", "fli"],
    ["video/x-flv", "flv"],
    ["video/x-gl", "gl"],
    ["video/x-isvideo", "isu"],
    ["video/x-la-asf", ["lsf", "lsx"]],
    ["video/x-m4v", "m4v"],
    ["video/x-motion-jpeg", "mjpg"],
    ["video/x-mpeg", ["mp3", "mp2"]],
    ["video/x-mpeq2a", "mp2"],
    ["video/x-ms-asf", ["asf", "asr", "asx"]],
    ["video/x-ms-asf-plugin", "asx"],
    ["video/x-ms-wm", "wm"],
    ["video/x-ms-wmv", "wmv"],
    ["video/x-ms-wmx", "wmx"],
    ["video/x-ms-wvx", "wvx"],
    ["video/x-msvideo", "avi"],
    ["video/x-qtc", "qtc"],
    ["video/x-scm", "scm"],
    ["video/x-sgi-movie", ["movie", "mv"]],
    ["windows/metafile", "wmf"],
    ["www/mime", "mime"],
    ["x-conference/x-cooltalk", "ice"],
    ["x-music/x-midi", ["mid", "midi"]],
    ["x-world/x-3dmf", ["3dm", "3dmf", "qd3", "qd3d"]],
    ["x-world/x-svr", "svr"],
    ["x-world/x-vrml", ["flr", "vrml", "wrl", "wrz", "xaf", "xof"]],
    ["x-world/x-vrt", "vrt"],
    ["xgl/drawing", "xgz"],
    ["xgl/movie", "xmz"]
  ]), p = /* @__PURE__ */ new Map([
    ["123", "application/vnd.lotus-1-2-3"],
    ["323", "text/h323"],
    ["*", "application/octet-stream"],
    ["3dm", "x-world/x-3dmf"],
    ["3dmf", "x-world/x-3dmf"],
    ["3dml", "text/vnd.in3d.3dml"],
    ["3g2", "video/3gpp2"],
    ["3gp", "video/3gpp"],
    ["7z", "application/x-7z-compressed"],
    ["a", "application/octet-stream"],
    ["aab", "application/x-authorware-bin"],
    ["aac", "audio/x-aac"],
    ["aam", "application/x-authorware-map"],
    ["aas", "application/x-authorware-seg"],
    ["abc", "text/vnd.abc"],
    ["abw", "application/x-abiword"],
    ["ac", "application/pkix-attr-cert"],
    ["acc", "application/vnd.americandynamics.acc"],
    ["ace", "application/x-ace-compressed"],
    ["acgi", "text/html"],
    ["acu", "application/vnd.acucobol"],
    ["acx", "application/internet-property-stream"],
    ["adp", "audio/adpcm"],
    ["aep", "application/vnd.audiograph"],
    ["afl", "video/animaflex"],
    ["afp", "application/vnd.ibm.modcap"],
    ["ahead", "application/vnd.ahead.space"],
    ["ai", "application/postscript"],
    ["aif", ["audio/aiff", "audio/x-aiff"]],
    ["aifc", ["audio/aiff", "audio/x-aiff"]],
    ["aiff", ["audio/aiff", "audio/x-aiff"]],
    ["aim", "application/x-aim"],
    ["aip", "text/x-audiosoft-intra"],
    ["air", "application/vnd.adobe.air-application-installer-package+zip"],
    ["ait", "application/vnd.dvb.ait"],
    ["ami", "application/vnd.amiga.ami"],
    ["ani", "application/x-navi-animation"],
    ["aos", "application/x-nokia-9000-communicator-add-on-software"],
    ["apk", "application/vnd.android.package-archive"],
    ["application", "application/x-ms-application"],
    ["apr", "application/vnd.lotus-approach"],
    ["aps", "application/mime"],
    ["arc", "application/octet-stream"],
    ["arj", ["application/arj", "application/octet-stream"]],
    ["art", "image/x-jg"],
    ["asf", "video/x-ms-asf"],
    ["asm", "text/x-asm"],
    ["aso", "application/vnd.accpac.simply.aso"],
    ["asp", "text/asp"],
    ["asr", "video/x-ms-asf"],
    ["asx", ["video/x-ms-asf", "application/x-mplayer2", "video/x-ms-asf-plugin"]],
    ["atc", "application/vnd.acucorp"],
    ["atomcat", "application/atomcat+xml"],
    ["atomsvc", "application/atomsvc+xml"],
    ["atx", "application/vnd.antix.game-component"],
    ["au", ["audio/basic", "audio/x-au"]],
    ["avi", ["video/avi", "video/msvideo", "application/x-troff-msvideo", "video/x-msvideo"]],
    ["avs", "video/avs-video"],
    ["aw", "application/applixware"],
    ["axs", "application/olescript"],
    ["azf", "application/vnd.airzip.filesecure.azf"],
    ["azs", "application/vnd.airzip.filesecure.azs"],
    ["azw", "application/vnd.amazon.ebook"],
    ["bas", "text/plain"],
    ["bcpio", "application/x-bcpio"],
    ["bdf", "application/x-font-bdf"],
    ["bdm", "application/vnd.syncml.dm+wbxml"],
    ["bed", "application/vnd.realvnc.bed"],
    ["bh2", "application/vnd.fujitsu.oasysprs"],
    [
      "bin",
      ["application/octet-stream", "application/mac-binary", "application/macbinary", "application/x-macbinary", "application/x-binary"]
    ],
    ["bm", "image/bmp"],
    ["bmi", "application/vnd.bmi"],
    ["bmp", ["image/bmp", "image/x-windows-bmp"]],
    ["boo", "application/book"],
    ["book", "application/book"],
    ["box", "application/vnd.previewsystems.box"],
    ["boz", "application/x-bzip2"],
    ["bsh", "application/x-bsh"],
    ["btif", "image/prs.btif"],
    ["bz", "application/x-bzip"],
    ["bz2", "application/x-bzip2"],
    ["c", ["text/plain", "text/x-c"]],
    ["c++", "text/plain"],
    ["c11amc", "application/vnd.cluetrust.cartomobile-config"],
    ["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
    ["c4g", "application/vnd.clonk.c4group"],
    ["cab", "application/vnd.ms-cab-compressed"],
    ["car", "application/vnd.curl.car"],
    ["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
    ["cc", ["text/plain", "text/x-c"]],
    ["ccad", "application/clariscad"],
    ["cco", "application/x-cocoa"],
    ["ccxml", "application/ccxml+xml,"],
    ["cdbcmsg", "application/vnd.contact.cmsg"],
    ["cdf", ["application/cdf", "application/x-cdf", "application/x-netcdf"]],
    ["cdkey", "application/vnd.mediastation.cdkey"],
    ["cdmia", "application/cdmi-capability"],
    ["cdmic", "application/cdmi-container"],
    ["cdmid", "application/cdmi-domain"],
    ["cdmio", "application/cdmi-object"],
    ["cdmiq", "application/cdmi-queue"],
    ["cdx", "chemical/x-cdx"],
    ["cdxml", "application/vnd.chemdraw+xml"],
    ["cdy", "application/vnd.cinderella"],
    ["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
    ["cgm", "image/cgm"],
    ["cha", "application/x-chat"],
    ["chat", "application/x-chat"],
    ["chm", "application/vnd.ms-htmlhelp"],
    ["chrt", "application/vnd.kde.kchart"],
    ["cif", "chemical/x-cif"],
    ["cii", "application/vnd.anser-web-certificate-issue-initiation"],
    ["cil", "application/vnd.ms-artgalry"],
    ["cla", "application/vnd.claymore"],
    [
      "class",
      ["application/octet-stream", "application/java", "application/java-byte-code", "application/java-vm", "application/x-java-class"]
    ],
    ["clkk", "application/vnd.crick.clicker.keyboard"],
    ["clkp", "application/vnd.crick.clicker.palette"],
    ["clkt", "application/vnd.crick.clicker.template"],
    ["clkw", "application/vnd.crick.clicker.wordbank"],
    ["clkx", "application/vnd.crick.clicker"],
    ["clp", "application/x-msclip"],
    ["cmc", "application/vnd.cosmocaller"],
    ["cmdf", "chemical/x-cmdf"],
    ["cml", "chemical/x-cml"],
    ["cmp", "application/vnd.yellowriver-custom-menu"],
    ["cmx", "image/x-cmx"],
    ["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
    ["com", ["application/octet-stream", "text/plain"]],
    ["conf", "text/plain"],
    ["cpio", "application/x-cpio"],
    ["cpp", "text/x-c"],
    ["cpt", ["application/mac-compactpro", "application/x-compactpro", "application/x-cpt"]],
    ["crd", "application/x-mscardfile"],
    ["crl", ["application/pkix-crl", "application/pkcs-crl"]],
    ["crt", ["application/pkix-cert", "application/x-x509-user-cert", "application/x-x509-ca-cert"]],
    ["cryptonote", "application/vnd.rig.cryptonote"],
    ["csh", ["text/x-script.csh", "application/x-csh"]],
    ["csml", "chemical/x-csml"],
    ["csp", "application/vnd.commonspace"],
    ["css", ["text/css", "application/x-pointplus"]],
    ["csv", "text/csv"],
    ["cu", "application/cu-seeme"],
    ["curl", "text/vnd.curl"],
    ["cww", "application/prs.cww"],
    ["cxx", "text/plain"],
    ["dae", "model/vnd.collada+xml"],
    ["daf", "application/vnd.mobius.daf"],
    ["davmount", "application/davmount+xml"],
    ["dcr", "application/x-director"],
    ["dcurl", "text/vnd.curl.dcurl"],
    ["dd2", "application/vnd.oma.dd2+xml"],
    ["ddd", "application/vnd.fujixerox.ddd"],
    ["deb", "application/x-debian-package"],
    ["deepv", "application/x-deepv"],
    ["def", "text/plain"],
    ["der", "application/x-x509-ca-cert"],
    ["dfac", "application/vnd.dreamfactory"],
    ["dif", "video/x-dv"],
    ["dir", "application/x-director"],
    ["dis", "application/vnd.mobius.dis"],
    ["djvu", "image/vnd.djvu"],
    ["dl", ["video/dl", "video/x-dl"]],
    ["dll", "application/x-msdownload"],
    ["dms", "application/octet-stream"],
    ["dna", "application/vnd.dna"],
    ["doc", "application/msword"],
    ["docm", "application/vnd.ms-word.document.macroenabled.12"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["dot", "application/msword"],
    ["dotm", "application/vnd.ms-word.template.macroenabled.12"],
    ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
    ["dp", ["application/commonground", "application/vnd.osgi.dp"]],
    ["dpg", "application/vnd.dpgraph"],
    ["dra", "audio/vnd.dra"],
    ["drw", "application/drafting"],
    ["dsc", "text/prs.lines.tag"],
    ["dssc", "application/dssc+der"],
    ["dtb", "application/x-dtbook+xml"],
    ["dtd", "application/xml-dtd"],
    ["dts", "audio/vnd.dts"],
    ["dtshd", "audio/vnd.dts.hd"],
    ["dump", "application/octet-stream"],
    ["dv", "video/x-dv"],
    ["dvi", "application/x-dvi"],
    ["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
    ["dwg", ["application/acad", "image/vnd.dwg", "image/x-dwg"]],
    ["dxf", ["application/dxf", "image/vnd.dwg", "image/vnd.dxf", "image/x-dwg"]],
    ["dxp", "application/vnd.spotfire.dxp"],
    ["dxr", "application/x-director"],
    ["ecelp4800", "audio/vnd.nuera.ecelp4800"],
    ["ecelp7470", "audio/vnd.nuera.ecelp7470"],
    ["ecelp9600", "audio/vnd.nuera.ecelp9600"],
    ["edm", "application/vnd.novadigm.edm"],
    ["edx", "application/vnd.novadigm.edx"],
    ["efif", "application/vnd.picsel"],
    ["ei6", "application/vnd.pg.osasli"],
    ["el", "text/x-script.elisp"],
    ["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
    ["eml", "message/rfc822"],
    ["emma", "application/emma+xml"],
    ["env", "application/x-envoy"],
    ["eol", "audio/vnd.digital-winds"],
    ["eot", "application/vnd.ms-fontobject"],
    ["eps", "application/postscript"],
    ["epub", "application/epub+zip"],
    ["es", ["application/ecmascript", "application/x-esrehber"]],
    ["es3", "application/vnd.eszigno3+xml"],
    ["esf", "application/vnd.epson.esf"],
    ["etx", "text/x-setext"],
    ["evy", ["application/envoy", "application/x-envoy"]],
    ["exe", ["application/octet-stream", "application/x-msdownload"]],
    ["exi", "application/exi"],
    ["ext", "application/vnd.novadigm.ext"],
    ["ez2", "application/vnd.ezpix-album"],
    ["ez3", "application/vnd.ezpix-package"],
    ["f", ["text/plain", "text/x-fortran"]],
    ["f4v", "video/x-f4v"],
    ["f77", "text/x-fortran"],
    ["f90", ["text/plain", "text/x-fortran"]],
    ["fbs", "image/vnd.fastbidsheet"],
    ["fcs", "application/vnd.isac.fcs"],
    ["fdf", "application/vnd.fdf"],
    ["fe_launch", "application/vnd.denovo.fcselayout-link"],
    ["fg5", "application/vnd.fujitsu.oasysgp"],
    ["fh", "image/x-freehand"],
    ["fif", ["application/fractals", "image/fif"]],
    ["fig", "application/x-xfig"],
    ["fli", ["video/fli", "video/x-fli"]],
    ["flo", ["image/florian", "application/vnd.micrografx.flo"]],
    ["flr", "x-world/x-vrml"],
    ["flv", "video/x-flv"],
    ["flw", "application/vnd.kde.kivio"],
    ["flx", "text/vnd.fmi.flexstor"],
    ["fly", "text/vnd.fly"],
    ["fm", "application/vnd.framemaker"],
    ["fmf", "video/x-atomic3d-feature"],
    ["fnc", "application/vnd.frogans.fnc"],
    ["for", ["text/plain", "text/x-fortran"]],
    ["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
    ["frl", "application/freeloader"],
    ["fsc", "application/vnd.fsc.weblaunch"],
    ["fst", "image/vnd.fst"],
    ["ftc", "application/vnd.fluxtime.clip"],
    ["fti", "application/vnd.anser-web-funds-transfer-initiation"],
    ["funk", "audio/make"],
    ["fvt", "video/vnd.fvt"],
    ["fxp", "application/vnd.adobe.fxp"],
    ["fzs", "application/vnd.fuzzysheet"],
    ["g", "text/plain"],
    ["g2w", "application/vnd.geoplan"],
    ["g3", "image/g3fax"],
    ["g3w", "application/vnd.geospace"],
    ["gac", "application/vnd.groove-account"],
    ["gdl", "model/vnd.gdl"],
    ["geo", "application/vnd.dynageo"],
    ["geojson", "application/geo+json"],
    ["gex", "application/vnd.geometry-explorer"],
    ["ggb", "application/vnd.geogebra.file"],
    ["ggt", "application/vnd.geogebra.tool"],
    ["ghf", "application/vnd.groove-help"],
    ["gif", "image/gif"],
    ["gim", "application/vnd.groove-identity-message"],
    ["gl", ["video/gl", "video/x-gl"]],
    ["gmx", "application/vnd.gmx"],
    ["gnumeric", "application/x-gnumeric"],
    ["gph", "application/vnd.flographit"],
    ["gqf", "application/vnd.grafeq"],
    ["gram", "application/srgs"],
    ["grv", "application/vnd.groove-injector"],
    ["grxml", "application/srgs+xml"],
    ["gsd", "audio/x-gsm"],
    ["gsf", "application/x-font-ghostscript"],
    ["gsm", "audio/x-gsm"],
    ["gsp", "application/x-gsp"],
    ["gss", "application/x-gss"],
    ["gtar", "application/x-gtar"],
    ["gtm", "application/vnd.groove-tool-message"],
    ["gtw", "model/vnd.gtw"],
    ["gv", "text/vnd.graphviz"],
    ["gxt", "application/vnd.geonext"],
    ["gz", ["application/x-gzip", "application/x-compressed"]],
    ["gzip", ["multipart/x-gzip", "application/x-gzip"]],
    ["h", ["text/plain", "text/x-h"]],
    ["h261", "video/h261"],
    ["h263", "video/h263"],
    ["h264", "video/h264"],
    ["hal", "application/vnd.hal+xml"],
    ["hbci", "application/vnd.hbci"],
    ["hdf", "application/x-hdf"],
    ["help", "application/x-helpfile"],
    ["hgl", "application/vnd.hp-hpgl"],
    ["hh", ["text/plain", "text/x-h"]],
    ["hlb", "text/x-script"],
    ["hlp", ["application/winhlp", "application/hlp", "application/x-helpfile", "application/x-winhelp"]],
    ["hpg", "application/vnd.hp-hpgl"],
    ["hpgl", "application/vnd.hp-hpgl"],
    ["hpid", "application/vnd.hp-hpid"],
    ["hps", "application/vnd.hp-hps"],
    [
      "hqx",
      [
        "application/mac-binhex40",
        "application/binhex",
        "application/binhex4",
        "application/mac-binhex",
        "application/x-binhex40",
        "application/x-mac-binhex40"
      ]
    ],
    ["hta", "application/hta"],
    ["htc", "text/x-component"],
    ["htke", "application/vnd.kenameaapp"],
    ["htm", "text/html"],
    ["html", "text/html"],
    ["htmls", "text/html"],
    ["htt", "text/webviewhtml"],
    ["htx", "text/html"],
    ["hvd", "application/vnd.yamaha.hv-dic"],
    ["hvp", "application/vnd.yamaha.hv-voice"],
    ["hvs", "application/vnd.yamaha.hv-script"],
    ["i2g", "application/vnd.intergeo"],
    ["icc", "application/vnd.iccprofile"],
    ["ice", "x-conference/x-cooltalk"],
    ["ico", "image/x-icon"],
    ["ics", "text/calendar"],
    ["idc", "text/plain"],
    ["ief", "image/ief"],
    ["iefs", "image/ief"],
    ["ifm", "application/vnd.shana.informed.formdata"],
    ["iges", ["application/iges", "model/iges"]],
    ["igl", "application/vnd.igloader"],
    ["igm", "application/vnd.insors.igm"],
    ["igs", ["application/iges", "model/iges"]],
    ["igx", "application/vnd.micrografx.igx"],
    ["iif", "application/vnd.shana.informed.interchange"],
    ["iii", "application/x-iphone"],
    ["ima", "application/x-ima"],
    ["imap", "application/x-httpd-imap"],
    ["imp", "application/vnd.accpac.simply.imp"],
    ["ims", "application/vnd.ms-ims"],
    ["inf", "application/inf"],
    ["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
    ["ip", "application/x-ip2"],
    ["ipfix", "application/ipfix"],
    ["ipk", "application/vnd.shana.informed.package"],
    ["irm", "application/vnd.ibm.rights-management"],
    ["irp", "application/vnd.irepository.package+xml"],
    ["isp", "application/x-internet-signup"],
    ["isu", "video/x-isvideo"],
    ["it", "audio/it"],
    ["itp", "application/vnd.shana.informed.formtemplate"],
    ["iv", "application/x-inventor"],
    ["ivp", "application/vnd.immervision-ivp"],
    ["ivr", "i-world/i-vrml"],
    ["ivu", "application/vnd.immervision-ivu"],
    ["ivy", "application/x-livescreen"],
    ["jad", "text/vnd.sun.j2me.app-descriptor"],
    ["jam", ["application/vnd.jam", "audio/x-jam"]],
    ["jar", "application/java-archive"],
    ["jav", ["text/plain", "text/x-java-source"]],
    ["java", ["text/plain", "text/x-java-source,java", "text/x-java-source"]],
    ["jcm", "application/x-java-commerce"],
    ["jfif", ["image/pipeg", "image/jpeg", "image/pjpeg"]],
    ["jfif-tbnl", "image/jpeg"],
    ["jisp", "application/vnd.jisp"],
    ["jlt", "application/vnd.hp-jlyt"],
    ["jnlp", "application/x-java-jnlp-file"],
    ["joda", "application/vnd.joost.joda-archive"],
    ["jpe", ["image/jpeg", "image/pjpeg"]],
    ["jpeg", ["image/jpeg", "image/pjpeg"]],
    ["jpg", ["image/jpeg", "image/pjpeg"]],
    ["jpgv", "video/jpeg"],
    ["jpm", "video/jpm"],
    ["jps", "image/x-jps"],
    ["js", ["application/javascript", "application/ecmascript", "text/javascript", "text/ecmascript", "application/x-javascript"]],
    ["json", "application/json"],
    ["jut", "image/jutvision"],
    ["kar", ["audio/midi", "music/x-karaoke"]],
    ["karbon", "application/vnd.kde.karbon"],
    ["kfo", "application/vnd.kde.kformula"],
    ["kia", "application/vnd.kidspiration"],
    ["kml", "application/vnd.google-earth.kml+xml"],
    ["kmz", "application/vnd.google-earth.kmz"],
    ["kne", "application/vnd.kinar"],
    ["kon", "application/vnd.kde.kontour"],
    ["kpr", "application/vnd.kde.kpresenter"],
    ["ksh", ["application/x-ksh", "text/x-script.ksh"]],
    ["ksp", "application/vnd.kde.kspread"],
    ["ktx", "image/ktx"],
    ["ktz", "application/vnd.kahootz"],
    ["kwd", "application/vnd.kde.kword"],
    ["la", ["audio/nspaudio", "audio/x-nspaudio"]],
    ["lam", "audio/x-liveaudio"],
    ["lasxml", "application/vnd.las.las+xml"],
    ["latex", "application/x-latex"],
    ["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
    ["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
    ["les", "application/vnd.hhe.lesson-player"],
    ["lha", ["application/octet-stream", "application/lha", "application/x-lha"]],
    ["lhx", "application/octet-stream"],
    ["link66", "application/vnd.route66.link66+xml"],
    ["list", "text/plain"],
    ["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
    ["log", "text/plain"],
    ["lrm", "application/vnd.ms-lrm"],
    ["lsf", "video/x-la-asf"],
    ["lsp", ["application/x-lisp", "text/x-script.lisp"]],
    ["lst", "text/plain"],
    ["lsx", ["video/x-la-asf", "text/x-la-asf"]],
    ["ltf", "application/vnd.frogans.ltf"],
    ["ltx", "application/x-latex"],
    ["lvp", "audio/vnd.lucent.voice"],
    ["lwp", "application/vnd.lotus-wordpro"],
    ["lzh", ["application/octet-stream", "application/x-lzh"]],
    ["lzx", ["application/lzx", "application/octet-stream", "application/x-lzx"]],
    ["m", ["text/plain", "text/x-m"]],
    ["m13", "application/x-msmediaview"],
    ["m14", "application/x-msmediaview"],
    ["m1v", "video/mpeg"],
    ["m21", "application/mp21"],
    ["m2a", "audio/mpeg"],
    ["m2v", "video/mpeg"],
    ["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
    ["m3u8", "application/vnd.apple.mpegurl"],
    ["m4v", "video/x-m4v"],
    ["ma", "application/mathematica"],
    ["mads", "application/mads+xml"],
    ["mag", "application/vnd.ecowin.chart"],
    ["man", "application/x-troff-man"],
    ["map", "application/x-navimap"],
    ["mar", "text/plain"],
    ["mathml", "application/mathml+xml"],
    ["mbd", "application/mbedlet"],
    ["mbk", "application/vnd.mobius.mbk"],
    ["mbox", "application/mbox"],
    ["mc$", "application/x-magic-cap-package-1.0"],
    ["mc1", "application/vnd.medcalcdata"],
    ["mcd", ["application/mcad", "application/vnd.mcd", "application/x-mathcad"]],
    ["mcf", ["image/vasa", "text/mcf"]],
    ["mcp", "application/netmc"],
    ["mcurl", "text/vnd.curl.mcurl"],
    ["mdb", "application/x-msaccess"],
    ["mdi", "image/vnd.ms-modi"],
    ["me", "application/x-troff-me"],
    ["meta4", "application/metalink4+xml"],
    ["mets", "application/mets+xml"],
    ["mfm", "application/vnd.mfmp"],
    ["mgp", "application/vnd.osgeo.mapguide.package"],
    ["mgz", "application/vnd.proteus.magazine"],
    ["mht", "message/rfc822"],
    ["mhtml", "message/rfc822"],
    ["mid", ["audio/mid", "audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
    ["midi", ["audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
    ["mif", ["application/vnd.mif", "application/x-mif", "application/x-frame"]],
    ["mime", ["message/rfc822", "www/mime"]],
    ["mj2", "video/mj2"],
    ["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
    ["mjpg", "video/x-motion-jpeg"],
    ["mlp", "application/vnd.dolby.mlp"],
    ["mm", ["application/base64", "application/x-meme"]],
    ["mmd", "application/vnd.chipnuts.karaoke-mmd"],
    ["mme", "application/base64"],
    ["mmf", "application/vnd.smaf"],
    ["mmr", "image/vnd.fujixerox.edmics-mmr"],
    ["mny", "application/x-msmoney"],
    ["mod", ["audio/mod", "audio/x-mod"]],
    ["mods", "application/mods+xml"],
    ["moov", "video/quicktime"],
    ["mov", "video/quicktime"],
    ["movie", "video/x-sgi-movie"],
    ["mp2", ["video/mpeg", "audio/mpeg", "video/x-mpeg", "audio/x-mpeg", "video/x-mpeq2a"]],
    ["mp3", ["audio/mpeg", "audio/mpeg3", "video/mpeg", "audio/x-mpeg-3", "video/x-mpeg"]],
    ["mp4", ["video/mp4", "application/mp4"]],
    ["mp4a", "audio/mp4"],
    ["mpa", ["video/mpeg", "audio/mpeg"]],
    ["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
    ["mpe", "video/mpeg"],
    ["mpeg", "video/mpeg"],
    ["mpg", ["video/mpeg", "audio/mpeg"]],
    ["mpga", "audio/mpeg"],
    ["mpkg", "application/vnd.apple.installer+xml"],
    ["mpm", "application/vnd.blueice.multipass"],
    ["mpn", "application/vnd.mophun.application"],
    ["mpp", "application/vnd.ms-project"],
    ["mpt", "application/x-project"],
    ["mpv", "application/x-project"],
    ["mpv2", "video/mpeg"],
    ["mpx", "application/x-project"],
    ["mpy", "application/vnd.ibm.minipay"],
    ["mqy", "application/vnd.mobius.mqy"],
    ["mrc", "application/marc"],
    ["mrcx", "application/marcxml+xml"],
    ["ms", "application/x-troff-ms"],
    ["mscml", "application/mediaservercontrol+xml"],
    ["mseq", "application/vnd.mseq"],
    ["msf", "application/vnd.epson.msf"],
    ["msg", "application/vnd.ms-outlook"],
    ["msh", "model/mesh"],
    ["msl", "application/vnd.mobius.msl"],
    ["msty", "application/vnd.muvee.style"],
    ["mts", "model/vnd.mts"],
    ["mus", "application/vnd.musician"],
    ["musicxml", "application/vnd.recordare.musicxml+xml"],
    ["mv", "video/x-sgi-movie"],
    ["mvb", "application/x-msmediaview"],
    ["mwf", "application/vnd.mfer"],
    ["mxf", "application/mxf"],
    ["mxl", "application/vnd.recordare.musicxml"],
    ["mxml", "application/xv+xml"],
    ["mxs", "application/vnd.triscape.mxs"],
    ["mxu", "video/vnd.mpegurl"],
    ["my", "audio/make"],
    ["mzz", "application/x-vnd.audioexplosion.mzz"],
    ["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
    ["n3", "text/n3"],
    ["nap", "image/naplps"],
    ["naplps", "image/naplps"],
    ["nbp", "application/vnd.wolfram.player"],
    ["nc", "application/x-netcdf"],
    ["ncm", "application/vnd.nokia.configuration-message"],
    ["ncx", "application/x-dtbncx+xml"],
    ["ngdat", "application/vnd.nokia.n-gage.data"],
    ["nif", "image/x-niff"],
    ["niff", "image/x-niff"],
    ["nix", "application/x-mix-transfer"],
    ["nlu", "application/vnd.neurolanguage.nlu"],
    ["nml", "application/vnd.enliven"],
    ["nnd", "application/vnd.noblenet-directory"],
    ["nns", "application/vnd.noblenet-sealer"],
    ["nnw", "application/vnd.noblenet-web"],
    ["npx", "image/vnd.net-fpx"],
    ["nsc", "application/x-conference"],
    ["nsf", "application/vnd.lotus-notes"],
    ["nvd", "application/x-navidoc"],
    ["nws", "message/rfc822"],
    ["o", "application/octet-stream"],
    ["oa2", "application/vnd.fujitsu.oasys2"],
    ["oa3", "application/vnd.fujitsu.oasys3"],
    ["oas", "application/vnd.fujitsu.oasys"],
    ["obd", "application/x-msbinder"],
    ["oda", "application/oda"],
    ["odb", "application/vnd.oasis.opendocument.database"],
    ["odc", "application/vnd.oasis.opendocument.chart"],
    ["odf", "application/vnd.oasis.opendocument.formula"],
    ["odft", "application/vnd.oasis.opendocument.formula-template"],
    ["odg", "application/vnd.oasis.opendocument.graphics"],
    ["odi", "application/vnd.oasis.opendocument.image"],
    ["odm", "application/vnd.oasis.opendocument.text-master"],
    ["odp", "application/vnd.oasis.opendocument.presentation"],
    ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
    ["odt", "application/vnd.oasis.opendocument.text"],
    ["oga", "audio/ogg"],
    ["ogv", "video/ogg"],
    ["ogx", "application/ogg"],
    ["omc", "application/x-omc"],
    ["omcd", "application/x-omcdatamaker"],
    ["omcr", "application/x-omcregerator"],
    ["onetoc", "application/onenote"],
    ["opf", "application/oebps-package+xml"],
    ["org", "application/vnd.lotus-organizer"],
    ["osf", "application/vnd.yamaha.openscoreformat"],
    ["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
    ["otc", "application/vnd.oasis.opendocument.chart-template"],
    ["otf", "application/x-font-otf"],
    ["otg", "application/vnd.oasis.opendocument.graphics-template"],
    ["oth", "application/vnd.oasis.opendocument.text-web"],
    ["oti", "application/vnd.oasis.opendocument.image-template"],
    ["otp", "application/vnd.oasis.opendocument.presentation-template"],
    ["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
    ["ott", "application/vnd.oasis.opendocument.text-template"],
    ["oxt", "application/vnd.openofficeorg.extension"],
    ["p", "text/x-pascal"],
    ["p10", ["application/pkcs10", "application/x-pkcs10"]],
    ["p12", ["application/pkcs-12", "application/x-pkcs12"]],
    ["p7a", "application/x-pkcs7-signature"],
    ["p7b", "application/x-pkcs7-certificates"],
    ["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
    ["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
    ["p7r", "application/x-pkcs7-certreqresp"],
    ["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
    ["p8", "application/pkcs8"],
    ["par", "text/plain-bas"],
    ["part", "application/pro_eng"],
    ["pas", "text/pascal"],
    ["paw", "application/vnd.pawaafile"],
    ["pbd", "application/vnd.powerbuilder6"],
    ["pbm", "image/x-portable-bitmap"],
    ["pcf", "application/x-font-pcf"],
    ["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
    ["pclxl", "application/vnd.hp-pclxl"],
    ["pct", "image/x-pict"],
    ["pcurl", "application/vnd.curl.pcurl"],
    ["pcx", "image/x-pcx"],
    ["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
    ["pdf", "application/pdf"],
    ["pfa", "application/x-font-type1"],
    ["pfr", "application/font-tdpfr"],
    ["pfunk", ["audio/make", "audio/make.my.funk"]],
    ["pfx", "application/x-pkcs12"],
    ["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
    ["pgn", "application/x-chess-pgn"],
    ["pgp", "application/pgp-signature"],
    ["pic", ["image/pict", "image/x-pict"]],
    ["pict", "image/pict"],
    ["pkg", "application/x-newton-compatible-pkg"],
    ["pki", "application/pkixcmp"],
    ["pkipath", "application/pkix-pkipath"],
    ["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
    ["pl", ["text/plain", "text/x-script.perl"]],
    ["plb", "application/vnd.3gpp.pic-bw-large"],
    ["plc", "application/vnd.mobius.plc"],
    ["plf", "application/vnd.pocketlearn"],
    ["pls", "application/pls+xml"],
    ["plx", "application/x-pixclscript"],
    ["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
    ["pm4", "application/x-pagemaker"],
    ["pm5", "application/x-pagemaker"],
    ["pma", "application/x-perfmon"],
    ["pmc", "application/x-perfmon"],
    ["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
    ["pmr", "application/x-perfmon"],
    ["pmw", "application/x-perfmon"],
    ["png", "image/png"],
    ["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
    ["portpkg", "application/vnd.macports.portpkg"],
    ["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
    ["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
    ["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
    ["pov", "model/x-pov"],
    ["ppa", "application/vnd.ms-powerpoint"],
    ["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
    ["ppd", "application/vnd.cups-ppd"],
    ["ppm", "image/x-portable-pixmap"],
    ["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
    ["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
    ["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
    ["ppt", ["application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/x-mspowerpoint"]],
    ["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
    ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["ppz", "application/mspowerpoint"],
    ["prc", "application/x-mobipocket-ebook"],
    ["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
    ["prf", "application/pics-rules"],
    ["prt", "application/pro_eng"],
    ["ps", "application/postscript"],
    ["psb", "application/vnd.3gpp.pic-bw-small"],
    ["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
    ["psf", "application/x-font-linux-psf"],
    ["pskcxml", "application/pskc+xml"],
    ["ptid", "application/vnd.pvi.ptid1"],
    ["pub", "application/x-mspublisher"],
    ["pvb", "application/vnd.3gpp.pic-bw-var"],
    ["pvu", "paleovu/x-pv"],
    ["pwn", "application/vnd.3m.post-it-notes"],
    ["pwz", "application/vnd.ms-powerpoint"],
    ["py", "text/x-script.phyton"],
    ["pya", "audio/vnd.ms-playready.media.pya"],
    ["pyc", "application/x-bytecode.python"],
    ["pyv", "video/vnd.ms-playready.media.pyv"],
    ["qam", "application/vnd.epson.quickanime"],
    ["qbo", "application/vnd.intu.qbo"],
    ["qcp", "audio/vnd.qcelp"],
    ["qd3", "x-world/x-3dmf"],
    ["qd3d", "x-world/x-3dmf"],
    ["qfx", "application/vnd.intu.qfx"],
    ["qif", "image/x-quicktime"],
    ["qps", "application/vnd.publishare-delta-tree"],
    ["qt", "video/quicktime"],
    ["qtc", "video/x-qtc"],
    ["qti", "image/x-quicktime"],
    ["qtif", "image/x-quicktime"],
    ["qxd", "application/vnd.quark.quarkxpress"],
    ["ra", ["audio/x-realaudio", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin"]],
    ["ram", "audio/x-pn-realaudio"],
    ["rar", "application/x-rar-compressed"],
    ["ras", ["image/cmu-raster", "application/x-cmu-raster", "image/x-cmu-raster"]],
    ["rast", "image/cmu-raster"],
    ["rcprofile", "application/vnd.ipunplugged.rcprofile"],
    ["rdf", "application/rdf+xml"],
    ["rdz", "application/vnd.data-vision.rdz"],
    ["rep", "application/vnd.businessobjects"],
    ["res", "application/x-dtbresource+xml"],
    ["rexx", "text/x-script.rexx"],
    ["rf", "image/vnd.rn-realflash"],
    ["rgb", "image/x-rgb"],
    ["rif", "application/reginfo+xml"],
    ["rip", "audio/vnd.rip"],
    ["rl", "application/resource-lists+xml"],
    ["rlc", "image/vnd.fujixerox.edmics-rlc"],
    ["rld", "application/resource-lists-diff+xml"],
    ["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
    ["rmi", "audio/mid"],
    ["rmm", "audio/x-pn-realaudio"],
    ["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
    ["rms", "application/vnd.jcp.javame.midlet-rms"],
    ["rnc", "application/relax-ng-compact-syntax"],
    ["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
    ["rnx", "application/vnd.rn-realplayer"],
    ["roff", "application/x-troff"],
    ["rp", "image/vnd.rn-realpix"],
    ["rp9", "application/vnd.cloanto.rp9"],
    ["rpm", "audio/x-pn-realaudio-plugin"],
    ["rpss", "application/vnd.nokia.radio-presets"],
    ["rpst", "application/vnd.nokia.radio-preset"],
    ["rq", "application/sparql-query"],
    ["rs", "application/rls-services+xml"],
    ["rsd", "application/rsd+xml"],
    ["rt", ["text/richtext", "text/vnd.rn-realtext"]],
    ["rtf", ["application/rtf", "text/richtext", "application/x-rtf"]],
    ["rtx", ["text/richtext", "application/rtf"]],
    ["rv", "video/vnd.rn-realvideo"],
    ["s", "text/x-asm"],
    ["s3m", "audio/s3m"],
    ["saf", "application/vnd.yamaha.smaf-audio"],
    ["saveme", "application/octet-stream"],
    ["sbk", "application/x-tbook"],
    ["sbml", "application/sbml+xml"],
    ["sc", "application/vnd.ibm.secure-container"],
    ["scd", "application/x-msschedule"],
    [
      "scm",
      ["application/vnd.lotus-screencam", "video/x-scm", "text/x-script.guile", "application/x-lotusscreencam", "text/x-script.scheme"]
    ],
    ["scq", "application/scvp-cv-request"],
    ["scs", "application/scvp-cv-response"],
    ["sct", "text/scriptlet"],
    ["scurl", "text/vnd.curl.scurl"],
    ["sda", "application/vnd.stardivision.draw"],
    ["sdc", "application/vnd.stardivision.calc"],
    ["sdd", "application/vnd.stardivision.impress"],
    ["sdkm", "application/vnd.solent.sdkm+xml"],
    ["sdml", "text/plain"],
    ["sdp", ["application/sdp", "application/x-sdp"]],
    ["sdr", "application/sounder"],
    ["sdw", "application/vnd.stardivision.writer"],
    ["sea", ["application/sea", "application/x-sea"]],
    ["see", "application/vnd.seemail"],
    ["seed", "application/vnd.fdsn.seed"],
    ["sema", "application/vnd.sema"],
    ["semd", "application/vnd.semd"],
    ["semf", "application/vnd.semf"],
    ["ser", "application/java-serialized-object"],
    ["set", "application/set"],
    ["setpay", "application/set-payment-initiation"],
    ["setreg", "application/set-registration-initiation"],
    ["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
    ["sfs", "application/vnd.spotfire.sfs"],
    ["sgl", "application/vnd.stardivision.writer-global"],
    ["sgm", ["text/sgml", "text/x-sgml"]],
    ["sgml", ["text/sgml", "text/x-sgml"]],
    ["sh", ["application/x-shar", "application/x-bsh", "application/x-sh", "text/x-script.sh"]],
    ["shar", ["application/x-bsh", "application/x-shar"]],
    ["shf", "application/shf+xml"],
    ["shtml", ["text/html", "text/x-server-parsed-html"]],
    ["sid", "audio/x-psid"],
    ["sis", "application/vnd.symbian.install"],
    ["sit", ["application/x-stuffit", "application/x-sit"]],
    ["sitx", "application/x-stuffitx"],
    ["skd", "application/x-koan"],
    ["skm", "application/x-koan"],
    ["skp", ["application/vnd.koan", "application/x-koan"]],
    ["skt", "application/x-koan"],
    ["sl", "application/x-seelogo"],
    ["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
    ["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
    ["slt", "application/vnd.epson.salt"],
    ["sm", "application/vnd.stepmania.stepchart"],
    ["smf", "application/vnd.stardivision.math"],
    ["smi", ["application/smil", "application/smil+xml"]],
    ["smil", "application/smil"],
    ["snd", ["audio/basic", "audio/x-adpcm"]],
    ["snf", "application/x-font-snf"],
    ["sol", "application/solids"],
    ["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
    ["spf", "application/vnd.yamaha.smaf-phrase"],
    ["spl", ["application/futuresplash", "application/x-futuresplash"]],
    ["spot", "text/vnd.in3d.spot"],
    ["spp", "application/scvp-vp-response"],
    ["spq", "application/scvp-vp-request"],
    ["spr", "application/x-sprite"],
    ["sprite", "application/x-sprite"],
    ["src", "application/x-wais-source"],
    ["sru", "application/sru+xml"],
    ["srx", "application/sparql-results+xml"],
    ["sse", "application/vnd.kodak-descriptor"],
    ["ssf", "application/vnd.epson.ssf"],
    ["ssi", "text/x-server-parsed-html"],
    ["ssm", "application/streamingmedia"],
    ["ssml", "application/ssml+xml"],
    ["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
    ["st", "application/vnd.sailingtracker.track"],
    ["stc", "application/vnd.sun.xml.calc.template"],
    ["std", "application/vnd.sun.xml.draw.template"],
    ["step", "application/step"],
    ["stf", "application/vnd.wt.stf"],
    ["sti", "application/vnd.sun.xml.impress.template"],
    ["stk", "application/hyperstudio"],
    ["stl", ["application/vnd.ms-pkistl", "application/sla", "application/vnd.ms-pki.stl", "application/x-navistyle"]],
    ["stm", "text/html"],
    ["stp", "application/step"],
    ["str", "application/vnd.pg.format"],
    ["stw", "application/vnd.sun.xml.writer.template"],
    ["sub", "image/vnd.dvb.subtitle"],
    ["sus", "application/vnd.sus-calendar"],
    ["sv4cpio", "application/x-sv4cpio"],
    ["sv4crc", "application/x-sv4crc"],
    ["svc", "application/vnd.dvb.service"],
    ["svd", "application/vnd.svd"],
    ["svf", ["image/vnd.dwg", "image/x-dwg"]],
    ["svg", "image/svg+xml"],
    ["svr", ["x-world/x-svr", "application/x-world"]],
    ["swf", "application/x-shockwave-flash"],
    ["swi", "application/vnd.aristanetworks.swi"],
    ["sxc", "application/vnd.sun.xml.calc"],
    ["sxd", "application/vnd.sun.xml.draw"],
    ["sxg", "application/vnd.sun.xml.writer.global"],
    ["sxi", "application/vnd.sun.xml.impress"],
    ["sxm", "application/vnd.sun.xml.math"],
    ["sxw", "application/vnd.sun.xml.writer"],
    ["t", ["text/troff", "application/x-troff"]],
    ["talk", "text/x-speech"],
    ["tao", "application/vnd.tao.intent-module-archive"],
    ["tar", "application/x-tar"],
    ["tbk", ["application/toolbook", "application/x-tbook"]],
    ["tcap", "application/vnd.3gpp2.tcap"],
    ["tcl", ["text/x-script.tcl", "application/x-tcl"]],
    ["tcsh", "text/x-script.tcsh"],
    ["teacher", "application/vnd.smart.teacher"],
    ["tei", "application/tei+xml"],
    ["tex", "application/x-tex"],
    ["texi", "application/x-texinfo"],
    ["texinfo", "application/x-texinfo"],
    ["text", ["application/plain", "text/plain"]],
    ["tfi", "application/thraud+xml"],
    ["tfm", "application/x-tex-tfm"],
    ["tgz", ["application/gnutar", "application/x-compressed"]],
    ["thmx", "application/vnd.ms-officetheme"],
    ["tif", ["image/tiff", "image/x-tiff"]],
    ["tiff", ["image/tiff", "image/x-tiff"]],
    ["tmo", "application/vnd.tmobile-livetv"],
    ["torrent", "application/x-bittorrent"],
    ["tpl", "application/vnd.groove-tool-template"],
    ["tpt", "application/vnd.trid.tpt"],
    ["tr", "application/x-troff"],
    ["tra", "application/vnd.trueapp"],
    ["trm", "application/x-msterminal"],
    ["tsd", "application/timestamped-data"],
    ["tsi", "audio/tsp-audio"],
    ["tsp", ["application/dsptype", "audio/tsplayer"]],
    ["tsv", "text/tab-separated-values"],
    ["ttf", "application/x-font-ttf"],
    ["ttl", "text/turtle"],
    ["turbot", "image/florian"],
    ["twd", "application/vnd.simtech-mindmapper"],
    ["txd", "application/vnd.genomatix.tuxedo"],
    ["txf", "application/vnd.mobius.txf"],
    ["txt", "text/plain"],
    ["ufd", "application/vnd.ufdl"],
    ["uil", "text/x-uil"],
    ["uls", "text/iuls"],
    ["umj", "application/vnd.umajin"],
    ["uni", "text/uri-list"],
    ["unis", "text/uri-list"],
    ["unityweb", "application/vnd.unity"],
    ["unv", "application/i-deas"],
    ["uoml", "application/vnd.uoml+xml"],
    ["uri", "text/uri-list"],
    ["uris", "text/uri-list"],
    ["ustar", ["application/x-ustar", "multipart/x-ustar"]],
    ["utz", "application/vnd.uiq.theme"],
    ["uu", ["application/octet-stream", "text/x-uuencode"]],
    ["uue", "text/x-uuencode"],
    ["uva", "audio/vnd.dece.audio"],
    ["uvh", "video/vnd.dece.hd"],
    ["uvi", "image/vnd.dece.graphic"],
    ["uvm", "video/vnd.dece.mobile"],
    ["uvp", "video/vnd.dece.pd"],
    ["uvs", "video/vnd.dece.sd"],
    ["uvu", "video/vnd.uvvu.mp4"],
    ["uvv", "video/vnd.dece.video"],
    ["vcd", "application/x-cdlink"],
    ["vcf", "text/x-vcard"],
    ["vcg", "application/vnd.groove-vcard"],
    ["vcs", "text/x-vcalendar"],
    ["vcx", "application/vnd.vcx"],
    ["vda", "application/vda"],
    ["vdo", "video/vdo"],
    ["vew", "application/groupwise"],
    ["vis", "application/vnd.visionary"],
    ["viv", ["video/vivo", "video/vnd.vivo"]],
    ["vivo", ["video/vivo", "video/vnd.vivo"]],
    ["vmd", "application/vocaltec-media-desc"],
    ["vmf", "application/vocaltec-media-file"],
    ["voc", ["audio/voc", "audio/x-voc"]],
    ["vos", "video/vosaic"],
    ["vox", "audio/voxware"],
    ["vqe", "audio/x-twinvq-plugin"],
    ["vqf", "audio/x-twinvq"],
    ["vql", "audio/x-twinvq-plugin"],
    ["vrml", ["model/vrml", "x-world/x-vrml", "application/x-vrml"]],
    ["vrt", "x-world/x-vrt"],
    ["vsd", ["application/vnd.visio", "application/x-visio"]],
    ["vsf", "application/vnd.vsf"],
    ["vst", "application/x-visio"],
    ["vsw", "application/x-visio"],
    ["vtu", "model/vnd.vtu"],
    ["vxml", "application/voicexml+xml"],
    ["w60", "application/wordperfect6.0"],
    ["w61", "application/wordperfect6.1"],
    ["w6w", "application/msword"],
    ["wad", "application/x-doom"],
    ["wav", ["audio/wav", "audio/x-wav"]],
    ["wax", "audio/x-ms-wax"],
    ["wb1", "application/x-qpro"],
    ["wbmp", "image/vnd.wap.wbmp"],
    ["wbs", "application/vnd.criticaltools.wbs+xml"],
    ["wbxml", "application/vnd.wap.wbxml"],
    ["wcm", "application/vnd.ms-works"],
    ["wdb", "application/vnd.ms-works"],
    ["web", "application/vnd.xara"],
    ["weba", "audio/webm"],
    ["webm", "video/webm"],
    ["webp", "image/webp"],
    ["wg", "application/vnd.pmi.widget"],
    ["wgt", "application/widget"],
    ["wiz", "application/msword"],
    ["wk1", "application/x-123"],
    ["wks", "application/vnd.ms-works"],
    ["wm", "video/x-ms-wm"],
    ["wma", "audio/x-ms-wma"],
    ["wmd", "application/x-ms-wmd"],
    ["wmf", ["windows/metafile", "application/x-msmetafile"]],
    ["wml", "text/vnd.wap.wml"],
    ["wmlc", "application/vnd.wap.wmlc"],
    ["wmls", "text/vnd.wap.wmlscript"],
    ["wmlsc", "application/vnd.wap.wmlscriptc"],
    ["wmv", "video/x-ms-wmv"],
    ["wmx", "video/x-ms-wmx"],
    ["wmz", "application/x-ms-wmz"],
    ["woff", "application/x-font-woff"],
    ["word", "application/msword"],
    ["wp", "application/wordperfect"],
    ["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
    ["wp6", "application/wordperfect"],
    ["wpd", ["application/wordperfect", "application/vnd.wordperfect", "application/x-wpwin"]],
    ["wpl", "application/vnd.ms-wpl"],
    ["wps", "application/vnd.ms-works"],
    ["wq1", "application/x-lotus"],
    ["wqd", "application/vnd.wqd"],
    ["wri", ["application/mswrite", "application/x-wri", "application/x-mswrite"]],
    ["wrl", ["model/vrml", "x-world/x-vrml", "application/x-world"]],
    ["wrz", ["model/vrml", "x-world/x-vrml"]],
    ["wsc", "text/scriplet"],
    ["wsdl", "application/wsdl+xml"],
    ["wspolicy", "application/wspolicy+xml"],
    ["wsrc", "application/x-wais-source"],
    ["wtb", "application/vnd.webturbo"],
    ["wtk", "application/x-wintalk"],
    ["wvx", "video/x-ms-wvx"],
    ["x-png", "image/png"],
    ["x3d", "application/vnd.hzn-3d-crossword"],
    ["xaf", "x-world/x-vrml"],
    ["xap", "application/x-silverlight-app"],
    ["xar", "application/vnd.xara"],
    ["xbap", "application/x-ms-xbap"],
    ["xbd", "application/vnd.fujixerox.docuworks.binder"],
    ["xbm", ["image/xbm", "image/x-xbm", "image/x-xbitmap"]],
    ["xdf", "application/xcap-diff+xml"],
    ["xdm", "application/vnd.syncml.dm+xml"],
    ["xdp", "application/vnd.adobe.xdp+xml"],
    ["xdr", "video/x-amt-demorun"],
    ["xdssc", "application/dssc+xml"],
    ["xdw", "application/vnd.fujixerox.docuworks"],
    ["xenc", "application/xenc+xml"],
    ["xer", "application/patch-ops-error+xml"],
    ["xfdf", "application/vnd.adobe.xfdf"],
    ["xfdl", "application/vnd.xfdl"],
    ["xgz", "xgl/drawing"],
    ["xhtml", "application/xhtml+xml"],
    ["xif", "image/vnd.xiff"],
    ["xl", "application/excel"],
    ["xla", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
    ["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
    ["xlb", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
    ["xlc", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
    ["xld", ["application/excel", "application/x-excel"]],
    ["xlk", ["application/excel", "application/x-excel"]],
    ["xll", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
    ["xlm", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
    ["xls", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
    ["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
    ["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
    ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["xlt", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
    ["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
    ["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
    ["xlv", ["application/excel", "application/x-excel"]],
    ["xlw", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
    ["xm", "audio/xm"],
    ["xml", ["application/xml", "text/xml", "application/atom+xml", "application/rss+xml"]],
    ["xmz", "xgl/movie"],
    ["xo", "application/vnd.olpc-sugar"],
    ["xof", "x-world/x-vrml"],
    ["xop", "application/xop+xml"],
    ["xpi", "application/x-xpinstall"],
    ["xpix", "application/x-vnd.ls-xpix"],
    ["xpm", ["image/xpm", "image/x-xpixmap"]],
    ["xpr", "application/vnd.is-xpr"],
    ["xps", "application/vnd.ms-xpsdocument"],
    ["xpw", "application/vnd.intercon.formnet"],
    ["xslt", "application/xslt+xml"],
    ["xsm", "application/vnd.syncml+xml"],
    ["xspf", "application/xspf+xml"],
    ["xsr", "video/x-amt-showrun"],
    ["xul", "application/vnd.mozilla.xul+xml"],
    ["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
    ["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
    ["yang", "application/yang"],
    ["yin", "application/yin+xml"],
    ["z", ["application/x-compressed", "application/x-compress"]],
    ["zaz", "application/vnd.zzazz.deck+xml"],
    ["zip", ["application/zip", "multipart/x-zip", "application/x-zip-compressed", "application/x-compressed"]],
    ["zir", "application/vnd.zul"],
    ["zmm", "application/vnd.handheld-entertainment+xml"],
    ["zoo", "application/octet-stream"],
    ["zsh", "text/x-script.zsh"]
  ]);
  return ce = {
    detectMimeType(n) {
      if (!n)
        return y;
      let r = b.parse(n), o = (r.ext.substr(1) || r.name || "").split("?").shift().trim().toLowerCase(), m = y;
      return p.has(o) && (m = p.get(o)), Array.isArray(m) ? m[0] : m;
    },
    detectExtension(n) {
      if (!n)
        return k;
      let r = (n || "").toLowerCase().trim().split("/"), o = r.shift().trim(), m = r.join("/").trim();
      if (f.has(o + "/" + m)) {
        let e = f.get(o + "/" + m);
        return Array.isArray(e) ? e[0] : e;
      }
      return o === "text" ? "txt" : "bin";
    }
  }, ce;
}
var de, Je;
function Nt() {
  if (Je) return de;
  Je = 1;
  const b = 2147483647, y = 36, k = 1, f = 26, p = 38, n = 700, r = 72, o = 128, m = "-", e = /^xn--/, l = /[^\0-\x7F]/, c = /[\x2E\u3002\uFF0E\uFF61]/g, s = {
    overflow: "Overflow: input needs wider integers to process",
    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
    "invalid-input": "Invalid input"
  }, x = y - k, g = Math.floor, v = String.fromCharCode;
  function t(T) {
    throw new RangeError(s[T]);
  }
  function i(T, I) {
    const M = [];
    let L = T.length;
    for (; L--; )
      M[L] = I(T[L]);
    return M;
  }
  function d(T, I) {
    const M = T.split("@");
    let L = "";
    M.length > 1 && (L = M[0] + "@", T = M[1]), T = T.replace(c, ".");
    const O = T.split("."), N = i(O, I).join(".");
    return L + N;
  }
  function a(T) {
    const I = [];
    let M = 0;
    const L = T.length;
    for (; M < L; ) {
      const O = T.charCodeAt(M++);
      if (O >= 55296 && O <= 56319 && M < L) {
        const N = T.charCodeAt(M++);
        (N & 64512) == 56320 ? I.push(((O & 1023) << 10) + (N & 1023) + 65536) : (I.push(O), M--);
      } else
        I.push(O);
    }
    return I;
  }
  const h = (T) => String.fromCodePoint(...T), u = function(T) {
    return T >= 48 && T < 58 ? 26 + (T - 48) : T >= 65 && T < 91 ? T - 65 : T >= 97 && T < 123 ? T - 97 : y;
  }, _ = function(T, I) {
    return T + 22 + 75 * (T < 26) - ((I != 0) << 5);
  }, w = function(T, I, M) {
    let L = 0;
    for (
      T = M ? g(T / n) : T >> 1, T += g(T / I);
      /* no initialization */
      T > x * f >> 1;
      L += y
    )
      T = g(T / x);
    return g(L + (x + 1) * T / (T + p));
  }, E = function(T) {
    const I = [], M = T.length;
    let L = 0, O = o, N = r, R = T.lastIndexOf(m);
    R < 0 && (R = 0);
    for (let z = 0; z < R; ++z)
      T.charCodeAt(z) >= 128 && t("not-basic"), I.push(T.charCodeAt(z));
    for (let z = R > 0 ? R + 1 : 0; z < M; ) {
      const U = L;
      for (let B = 1, $ = y; ; $ += y) {
        z >= M && t("invalid-input");
        const G = u(T.charCodeAt(z++));
        G >= y && t("invalid-input"), G > g((b - L) / B) && t("overflow"), L += G * B;
        const W = $ <= N ? k : $ >= N + f ? f : $ - N;
        if (G < W)
          break;
        const X = y - W;
        B > g(b / X) && t("overflow"), B *= X;
      }
      const Q = I.length + 1;
      N = w(L - U, Q, U == 0), g(L / Q) > b - O && t("overflow"), O += g(L / Q), L %= Q, I.splice(L++, 0, O);
    }
    return String.fromCodePoint(...I);
  }, S = function(T) {
    const I = [];
    T = a(T);
    const M = T.length;
    let L = o, O = 0, N = r;
    for (const U of T)
      U < 128 && I.push(v(U));
    const R = I.length;
    let z = R;
    for (R && I.push(m); z < M; ) {
      let U = b;
      for (const B of T)
        B >= L && B < U && (U = B);
      const Q = z + 1;
      U - L > g((b - O) / Q) && t("overflow"), O += (U - L) * Q, L = U;
      for (const B of T)
        if (B < L && ++O > b && t("overflow"), B === L) {
          let $ = O;
          for (let G = y; ; G += y) {
            const W = G <= N ? k : G >= N + f ? f : G - N;
            if ($ < W)
              break;
            const X = $ - W, Ge = y - W;
            I.push(v(_(W + X % Ge, 0))), $ = g(X / Ge);
          }
          I.push(v(_($, 0))), N = w(O, Q, z === R), O = 0, ++z;
        }
      ++O, ++L;
    }
    return I.join("");
  };
  return de = {
    /**
     * A string representing the current Punycode.js version number.
     * @memberOf punycode
     * @type String
     */
    version: "2.3.1",
    /**
     * An object of methods to convert from JavaScript's internal character
     * representation (UCS-2) to Unicode code points, and back.
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode
     * @type Object
     */
    ucs2: {
      decode: a,
      encode: h
    },
    decode: E,
    encode: S,
    toASCII: function(T) {
      return d(T, function(I) {
        return l.test(I) ? "xn--" + S(I) : I;
      });
    },
    toUnicode: function(T) {
      return d(T, function(I) {
        return e.test(I) ? E(I.slice(4).toLowerCase()) : I;
      });
    }
  }, de;
}
var me, Ye;
function Ht() {
  if (Ye) return me;
  Ye = 1;
  const b = P.Transform;
  function y(p) {
    return typeof p == "string" && (p = Buffer.from(p, "utf-8")), p.toString("base64");
  }
  function k(p, n) {
    if (p = (p || "").toString(), n = n || 76, p.length <= n)
      return p;
    let r = [], o = 0, m = n * 1024;
    for (; o < p.length; ) {
      let e = p.substr(o, m).replace(new RegExp(".{" + n + "}", "g"), `$&\r
`);
      r.push(e), o += m;
    }
    return r.join("");
  }
  class f extends b {
    constructor(n) {
      super(), this.options = n || {}, this.options.lineLength !== !1 && (this.options.lineLength = this.options.lineLength || 76), this._curLine = "", this._remainingBytes = !1, this.inputBytes = 0, this.outputBytes = 0;
    }
    _transform(n, r, o) {
      if (r !== "buffer" && (n = Buffer.from(n, r)), !n || !n.length)
        return setImmediate(o);
      this.inputBytes += n.length, this._remainingBytes && this._remainingBytes.length && (n = Buffer.concat([this._remainingBytes, n], this._remainingBytes.length + n.length), this._remainingBytes = !1), n.length % 3 ? (this._remainingBytes = n.slice(n.length - n.length % 3), n = n.slice(0, n.length - n.length % 3)) : this._remainingBytes = !1;
      let m = this._curLine + y(n);
      if (this.options.lineLength) {
        m = k(m, this.options.lineLength);
        let e = m.lastIndexOf(`
`);
        e < 0 ? (this._curLine = m, m = "") : (this._curLine = m.substring(e + 1), m = m.substring(0, e + 1), m && !m.endsWith(`\r
`) && (m += `\r
`));
      } else
        this._curLine = "";
      m && (this.outputBytes += m.length, this.push(Buffer.from(m, "ascii"))), setImmediate(o);
    }
    _flush(n) {
      this._remainingBytes && this._remainingBytes.length && (this._curLine += y(this._remainingBytes)), this._curLine && (this.outputBytes += this._curLine.length, this.push(Buffer.from(this._curLine, "ascii")), this._curLine = ""), n();
    }
  }
  return me = {
    encode: y,
    wrap: k,
    Encoder: f
  }, me;
}
var he, Ze;
function qt() {
  if (Ze) return he;
  Ze = 1;
  const b = P.Transform;
  function y(n) {
    typeof n == "string" && (n = Buffer.from(n, "utf-8"));
    let r = [
      // https://tools.ietf.org/html/rfc2045#section-6.7
      [9],
      // <TAB>
      [10],
      // <LF>
      [13],
      // <CR>
      [32, 60],
      // <SP>!"#$%&'()*+,-./0123456789:;
      [62, 126]
      // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
    ], o = "", m;
    for (let e = 0, l = n.length; e < l; e++) {
      if (m = n[e], f(m, r) && !((m === 32 || m === 9) && (e === l - 1 || n[e + 1] === 10 || n[e + 1] === 13))) {
        o += String.fromCharCode(m);
        continue;
      }
      o += "=" + (m < 16 ? "0" : "") + m.toString(16).toUpperCase();
    }
    return o;
  }
  function k(n, r) {
    if (n = (n || "").toString(), r = r || 76, n.length <= r)
      return n;
    let o = 0, m = n.length, e, l, c, s = Math.floor(r / 3), x = "";
    for (; o < m; ) {
      if (c = n.substr(o, r), e = c.match(/\r\n/)) {
        c = c.substr(0, e.index + e[0].length), x += c, o += c.length;
        continue;
      }
      if (c.substr(-1) === `
`) {
        x += c, o += c.length;
        continue;
      } else if (e = c.substr(-s).match(/\n.*?$/)) {
        c = c.substr(0, c.length - (e[0].length - 1)), x += c, o += c.length;
        continue;
      } else if (c.length > r - s && (e = c.substr(-s).match(/[ \t.,!?][^ \t.,!?]*$/)))
        c = c.substr(0, c.length - (e[0].length - 1));
      else if (c.match(/[=][\da-f]{0,2}$/i))
        for ((e = c.match(/[=][\da-f]{0,1}$/i)) && (c = c.substr(0, c.length - e[0].length)); c.length > 3 && c.length < m - o && !c.match(/^(?:=[\da-f]{2}){1,4}$/i) && (e = c.match(/[=][\da-f]{2}$/gi)) && (l = parseInt(e[0].substr(1, 2), 16), !(l < 128 || (c = c.substr(0, c.length - 3), l >= 192))); )
          ;
      o + c.length < m && c.substr(-1) !== `
` ? (c.length === r && c.match(/[=][\da-f]{2}$/i) ? c = c.substr(0, c.length - 3) : c.length === r && (c = c.substr(0, c.length - 1)), o += c.length, c += `=\r
`) : o += c.length, x += c;
    }
    return x;
  }
  function f(n, r) {
    for (let o = r.length - 1; o >= 0; o--)
      if (r[o].length && (r[o].length === 1 && n === r[o][0] || r[o].length === 2 && n >= r[o][0] && n <= r[o][1]))
        return !0;
    return !1;
  }
  class p extends b {
    constructor(r) {
      super(), this.options = r || {}, this.options.lineLength !== !1 && (this.options.lineLength = this.options.lineLength || 76), this._curLine = "", this.inputBytes = 0, this.outputBytes = 0;
    }
    _transform(r, o, m) {
      let e;
      if (o !== "buffer" && (r = Buffer.from(r, o)), !r || !r.length)
        return m();
      this.inputBytes += r.length, this.options.lineLength ? (e = this._curLine + y(r), e = k(e, this.options.lineLength), e = e.replace(/(^|\n)([^\n]*)$/, (l, c, s) => (this._curLine = s, c)), e && (this.outputBytes += e.length, this.push(e))) : (e = y(r), this.outputBytes += e.length, this.push(e, "ascii")), m();
    }
    _flush(r) {
      this._curLine && (this.outputBytes += this._curLine.length, this.push(this._curLine, "ascii")), r();
    }
  }
  return he = {
    encode: y,
    wrap: k,
    Encoder: p
  }, he;
}
var ue, et;
function oe() {
  if (et) return ue;
  et = 1;
  const b = Ht(), y = qt(), k = Ot();
  return ue = {
    /**
     * Checks if a value is plaintext string (uses only printable 7bit chars)
     *
     * @param {String} value String to be tested
     * @returns {Boolean} true if it is a plaintext string
     */
    isPlainText(f, p) {
      return !(typeof f != "string" || (p ? /[\x00-\x08\x0b\x0c\x0e-\x1f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/).test(f));
    },
    /**
     * Checks if a multi line string containes lines longer than the selected value.
     *
     * Useful when detecting if a mail message needs any processing at all –
     * if only plaintext characters are used and lines are short, then there is
     * no need to encode the values in any way. If the value is plaintext but has
     * longer lines then allowed, then use format=flowed
     *
     * @param {Number} lineLength Max line length to check for
     * @returns {Boolean} Returns true if there is at least one line longer than lineLength chars
     */
    hasLongerLines(f, p) {
      return f.length > 128 * 1024 ? !0 : new RegExp("^.{" + (p + 1) + ",}", "m").test(f);
    },
    /**
     * Encodes a string or an Buffer to an UTF-8 MIME Word (rfc2047)
     *
     * @param {String|Buffer} data String to be encoded
     * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
     * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
     * @return {String} Single or several mime words joined together
     */
    encodeWord(f, p, n) {
      p = (p || "Q").toString().toUpperCase().trim().charAt(0), n = n || 0;
      let r, o = "UTF-8";
      if (n && n > 7 + o.length && (n -= 7 + o.length), p === "Q" ? r = y.encode(f).replace(/[^a-z0-9!*+\-/=]/gi, (m) => {
        let e = m.charCodeAt(0).toString(16).toUpperCase();
        return m === " " ? "_" : "=" + (e.length === 1 ? "0" + e : e);
      }) : p === "B" && (r = typeof f == "string" ? f : b.encode(f), n = n ? Math.max(3, (n - n % 4) / 4 * 3) : 0), n && (p !== "B" ? r : b.encode(f)).length > n)
        if (p === "Q")
          r = this.splitMimeEncodedString(r, n).join("?= =?" + o + "?" + p + "?");
        else {
          let m = [], e = "";
          for (let l = 0, c = r.length; l < c; l++) {
            let s = r.charAt(l);
            /[\ud83c\ud83d\ud83e]/.test(s) && l < c - 1 && (s += r.charAt(++l)), Buffer.byteLength(e + s) <= n || l === 0 ? e += s : (m.push(b.encode(e)), e = s);
          }
          e && m.push(b.encode(e)), m.length > 1 ? r = m.join("?= =?" + o + "?" + p + "?") : r = m.join("");
        }
      else p === "B" && (r = b.encode(f));
      return "=?" + o + "?" + p + "?" + r + (r.substr(-2) === "?=" ? "" : "?=");
    },
    /**
     * Finds word sequences with non ascii text and converts these to mime words
     *
     * @param {String} value String to be encoded
     * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
     * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
     * @param {Boolean} [encodeAll=false] If true and the value needs encoding then encodes entire string, not just the smallest match
     * @return {String} String with possible mime words
     */
    encodeWords(f, p, n, r) {
      n = n || 0;
      let o, m = f.match(/(?:^|\s)([^\s]*["\u0080-\uFFFF])/);
      if (!m)
        return f;
      if (r)
        return this.encodeWord(f, p, n);
      let e = f.match(/(["\u0080-\uFFFF][^\s]*)[^"\u0080-\uFFFF]*$/);
      if (!e)
        return f;
      let l = m.index + (m[0].match(/[^\s]/) || {
        index: 0
      }).index, c = e.index + (e[1] || "").length;
      return o = (l ? f.substr(0, l) : "") + this.encodeWord(f.substring(l, c), p || "Q", n) + (c < f.length ? f.substr(c) : ""), o;
    },
    /**
     * Joins parsed header value together as 'value; param1=value1; param2=value2'
     * PS: We are following RFC 822 for the list of special characters that we need to keep in quotes.
     *      Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
     * @param {Object} structured Parsed header value
     * @return {String} joined header value
     */
    buildHeaderValue(f) {
      let p = [];
      return Object.keys(f.params || {}).forEach((n) => {
        let r = f.params[n];
        !this.isPlainText(r, !0) || r.length >= 75 ? this.buildHeaderParam(n, r, 50).forEach((o) => {
          !/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(o.value) || o.key.substr(-1) === "*" ? p.push(o.key + "=" + o.value) : p.push(o.key + "=" + JSON.stringify(o.value));
        }) : /[\s'"\\;:/=(),<>@[\]?]|^-/.test(r) ? p.push(n + "=" + JSON.stringify(r)) : p.push(n + "=" + r);
      }), f.value + (p.length ? "; " + p.join("; ") : "");
    },
    /**
     * Encodes a string or an Buffer to an UTF-8 Parameter Value Continuation encoding (rfc2231)
     * Useful for splitting long parameter values.
     *
     * For example
     *      title="unicode string"
     * becomes
     *     title*0*=utf-8''unicode
     *     title*1*=%20string
     *
     * @param {String|Buffer} data String to be encoded
     * @param {Number} [maxLength=50] Max length for generated chunks
     * @param {String} [fromCharset='UTF-8'] Source sharacter set
     * @return {Array} A list of encoded keys and headers
     */
    buildHeaderParam(f, p, n) {
      let r = [], o = typeof p == "string" ? p : (p || "").toString(), m, e, l, c, s = 0, x, g;
      if (n = n || 50, this.isPlainText(p, !0)) {
        if (o.length <= n)
          return [
            {
              key: f,
              value: o
            }
          ];
        o = o.replace(new RegExp(".{" + n + "}", "g"), (v) => (r.push({
          line: v
        }), "")), o && r.push({
          line: o
        });
      } else {
        if (/[\uD800-\uDBFF]/.test(o)) {
          for (m = [], x = 0, g = o.length; x < g; x++)
            e = o.charAt(x), l = e.charCodeAt(0), l >= 55296 && l <= 56319 && x < g - 1 ? (e += o.charAt(x + 1), m.push(e), x++) : m.push(e);
          o = m;
        }
        c = "utf-8''";
        let v = !0;
        for (s = 0, x = 0, g = o.length; x < g; x++) {
          if (e = o[x], v)
            e = this.safeEncodeURIComponent(e);
          else if (e = e === " " ? e : this.safeEncodeURIComponent(e), e !== o[x])
            if ((this.safeEncodeURIComponent(c) + e).length >= n)
              r.push({
                line: c,
                encoded: v
              }), c = "", s = x - 1;
            else {
              v = !0, x = s, c = "";
              continue;
            }
          (c + e).length >= n ? (r.push({
            line: c,
            encoded: v
          }), c = e = o[x] === " " ? " " : this.safeEncodeURIComponent(o[x]), e === o[x] ? (v = !1, s = x - 1) : v = !0) : c += e;
        }
        c && r.push({
          line: c,
          encoded: v
        });
      }
      return r.map((v, t) => ({
        // encoded lines: {name}*{part}*
        // unencoded lines: {name}*{part}
        // if any line needs to be encoded then the first line (part==0) is always encoded
        key: f + "*" + t + (v.encoded ? "*" : ""),
        value: v.line
      }));
    },
    /**
     * Parses a header value with key=value arguments into a structured
     * object.
     *
     *   parseHeaderValue('content-type: text/plain; CHARSET='UTF-8'') ->
     *   {
     *     'value': 'text/plain',
     *     'params': {
     *       'charset': 'UTF-8'
     *     }
     *   }
     *
     * @param {String} str Header value
     * @return {Object} Header value as a parsed structure
     */
    parseHeaderValue(f) {
      let p = {
        value: !1,
        params: {}
      }, n = !1, r = "", o = "value", m = !1, e = !1, l;
      for (let c = 0, s = f.length; c < s; c++)
        if (l = f.charAt(c), o === "key") {
          if (l === "=") {
            n = r.trim().toLowerCase(), o = "value", r = "";
            continue;
          }
          r += l;
        } else {
          if (e)
            r += l;
          else if (l === "\\") {
            e = !0;
            continue;
          } else m && l === m ? m = !1 : !m && l === '"' ? m = l : !m && l === ";" ? (n === !1 ? p.value = r.trim() : p.params[n] = r.trim(), o = "key", r = "") : r += l;
          e = !1;
        }
      return o === "value" ? n === !1 ? p.value = r.trim() : p.params[n] = r.trim() : r.trim() && (p.params[r.trim().toLowerCase()] = ""), Object.keys(p.params).forEach((c) => {
        let s, x, g, v;
        (g = c.match(/(\*(\d+)|\*(\d+)\*|\*)$/)) && (s = c.substr(0, g.index), x = Number(g[2] || g[3]) || 0, (!p.params[s] || typeof p.params[s] != "object") && (p.params[s] = {
          charset: !1,
          values: []
        }), v = p.params[c], x === 0 && g[0].substr(-1) === "*" && (g = v.match(/^([^']*)'[^']*'(.*)$/)) && (p.params[s].charset = g[1] || "iso-8859-1", v = g[2]), p.params[s].values[x] = v, delete p.params[c]);
      }), Object.keys(p.params).forEach((c) => {
        let s;
        p.params[c] && Array.isArray(p.params[c].values) && (s = p.params[c].values.map((x) => x || "").join(""), p.params[c].charset ? p.params[c] = "=?" + p.params[c].charset + "?Q?" + s.replace(/[=?_\s]/g, (x) => {
          let g = x.charCodeAt(0).toString(16);
          return x === " " ? "_" : "%" + (g.length < 2 ? "0" : "") + g;
        }).replace(/%/g, "=") + "?=" : p.params[c] = s);
      }), p;
    },
    /**
     * Returns file extension for a content type string. If no suitable extensions
     * are found, 'bin' is used as the default extension
     *
     * @param {String} mimeType Content type to be checked for
     * @return {String} File extension
     */
    detectExtension: (f) => k.detectExtension(f),
    /**
     * Returns content type for a file extension. If no suitable content types
     * are found, 'application/octet-stream' is used as the default content type
     *
     * @param {String} extension Extension to be checked for
     * @return {String} File extension
     */
    detectMimeType: (f) => k.detectMimeType(f),
    /**
     * Folds long lines, useful for folding header lines (afterSpace=false) and
     * flowed text (afterSpace=true)
     *
     * @param {String} str String to be folded
     * @param {Number} [lineLength=76] Maximum length of a line
     * @param {Boolean} afterSpace If true, leave a space in th end of a line
     * @return {String} String with folded lines
     */
    foldLines(f, p, n) {
      f = (f || "").toString(), p = p || 76;
      let r = 0, o = f.length, m = "", e, l;
      for (; r < o; ) {
        if (e = f.substr(r, p), e.length < p) {
          m += e;
          break;
        }
        if (l = e.match(/^[^\n\r]*(\r?\n|\r)/)) {
          e = l[0], m += e, r += e.length;
          continue;
        } else (l = e.match(/(\s+)[^\s]*$/)) && l[0].length - (n ? (l[1] || "").length : 0) < e.length ? e = e.substr(0, e.length - (l[0].length - (n ? (l[1] || "").length : 0))) : (l = f.substr(r + e.length).match(/^[^\s]+(\s*)/)) && (e = e + l[0].substr(0, l[0].length - (n ? 0 : (l[1] || "").length)));
        m += e, r += e.length, r < o && (m += `\r
`);
      }
      return m;
    },
    /**
     * Splits a mime encoded string. Needed for dividing mime words into smaller chunks
     *
     * @param {String} str Mime encoded string to be split up
     * @param {Number} maxlen Maximum length of characters for one part (minimum 12)
     * @return {Array} Split string
     */
    splitMimeEncodedString: (f, p) => {
      let n, r, o, m, e = [];
      for (p = Math.max(p || 0, 12); f.length; ) {
        for (n = f.substr(0, p), (r = n.match(/[=][0-9A-F]?$/i)) && (n = n.substr(0, r.index)), m = !1; !m; )
          m = !0, (r = f.substr(n.length).match(/^[=]([0-9A-F]{2})/i)) && (o = parseInt(r[1], 16), o < 194 && o > 127 && (n = n.substr(0, n.length - 3), m = !1));
        n.length && e.push(n), f = f.substr(n.length);
      }
      return e;
    },
    encodeURICharComponent: (f) => {
      let p = "", n = f.charCodeAt(0).toString(16).toUpperCase();
      if (n.length % 2 && (n = "0" + n), n.length > 2)
        for (let r = 0, o = n.length / 2; r < o; r++)
          p += "%" + n.substr(r, 2);
      else
        p += "%" + n;
      return p;
    },
    safeEncodeURIComponent(f) {
      f = (f || "").toString();
      try {
        f = encodeURIComponent(f);
      } catch {
        return f.replace(/[^\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]+/g, "");
      }
      return f.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (p) => this.encodeURICharComponent(p));
    }
  }, ue;
}
var fe, tt;
function ei() {
  if (tt) return fe;
  tt = 1;
  function b(p, n) {
    let r = !1, o = "text", m, e = [], l = {
      address: [],
      comment: [],
      group: [],
      text: [],
      textWasQuoted: []
      // Track which text tokens came from inside quotes
    }, c, s, x = !1;
    for (c = 0, s = p.length; c < s; c++) {
      let g = p[c], v = c ? p[c - 1] : null;
      if (g.type === "operator")
        switch (g.value) {
          case "<":
            o = "address", x = !1;
            break;
          case "(":
            o = "comment", x = !1;
            break;
          case ":":
            o = "group", r = !0, x = !1;
            break;
          case '"':
            x = !x, o = "text";
            break;
          default:
            o = "text", x = !1;
            break;
        }
      else g.value && (o === "address" && (g.value = g.value.replace(/^[^<]*<\s*/, "")), v && v.noBreak && l[o].length ? (l[o][l[o].length - 1] += g.value, o === "text" && x && (l.textWasQuoted[l.textWasQuoted.length - 1] = !0)) : (l[o].push(g.value), o === "text" && l.textWasQuoted.push(x)));
    }
    if (!l.text.length && l.comment.length && (l.text = l.comment, l.comment = []), r) {
      l.text = l.text.join(" ");
      let g = [];
      l.group.length && f(l.group.join(","), { _depth: n + 1 }).forEach((t) => {
        t.group ? g = g.concat(t.group) : g.push(t);
      }), e.push({
        name: l.text || m && m.name,
        group: g
      });
    } else {
      if (!l.address.length && l.text.length) {
        for (c = l.text.length - 1; c >= 0; c--)
          if (!l.textWasQuoted[c] && l.text[c].match(/^[^@\s]+@[^@\s]+$/)) {
            l.address = l.text.splice(c, 1), l.textWasQuoted.splice(c, 1);
            break;
          }
        let g = function(v) {
          return l.address.length ? v : (l.address = [v.trim()], " ");
        };
        if (!l.address.length)
          for (c = l.text.length - 1; c >= 0 && !(!l.textWasQuoted[c] && (l.text[c] = l.text[c].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, g).trim(), l.address.length)); c--)
            ;
      }
      if (!l.text.length && l.comment.length && (l.text = l.comment, l.comment = []), l.address.length > 1 && (l.text = l.text.concat(l.address.splice(1))), l.text = l.text.join(" "), l.address = l.address.join(" "), !l.address && r)
        return [];
      m = {
        address: l.address || l.text || "",
        name: l.text || l.address || ""
      }, m.address === m.name && ((m.address || "").match(/@/) ? m.name = "" : m.address = ""), e.push(m);
    }
    return e;
  }
  class y {
    constructor(n) {
      this.str = (n || "").toString(), this.operatorCurrent = "", this.operatorExpecting = "", this.node = null, this.escaped = !1, this.list = [], this.operators = {
        '"': '"',
        "(": ")",
        "<": ">",
        ",": "",
        ":": ";",
        // Semicolons are not a legal delimiter per the RFC2822 grammar other
        // than for terminating a group, but they are also not valid for any
        // other use in this context.  Given that some mail clients have
        // historically allowed the semicolon as a delimiter equivalent to the
        // comma in their UI, it makes sense to treat them the same as a comma
        // when used outside of a group.
        ";": ""
      };
    }
    /**
     * Tokenizes the original input string
     *
     * @return {Array} An array of operator|text tokens
     */
    tokenize() {
      let n = [];
      for (let r = 0, o = this.str.length; r < o; r++) {
        let m = this.str.charAt(r), e = r < o - 1 ? this.str.charAt(r + 1) : null;
        this.checkChar(m, e);
      }
      return this.list.forEach((r) => {
        r.value = (r.value || "").toString().trim(), r.value && n.push(r);
      }), n;
    }
    /**
     * Checks if a character is an operator or text and acts accordingly
     *
     * @param {String} chr Character from the address field
     */
    checkChar(n, r) {
      if (!this.escaped) {
        if (n === this.operatorExpecting) {
          this.node = {
            type: "operator",
            value: n
          }, r && ![" ", "	", "\r", `
`, ",", ";"].includes(r) && (this.node.noBreak = !0), this.list.push(this.node), this.node = null, this.operatorExpecting = "", this.escaped = !1;
          return;
        } else if (!this.operatorExpecting && n in this.operators) {
          this.node = {
            type: "operator",
            value: n
          }, this.list.push(this.node), this.node = null, this.operatorExpecting = this.operators[n], this.escaped = !1;
          return;
        } else if (['"', "'"].includes(this.operatorExpecting) && n === "\\") {
          this.escaped = !0;
          return;
        }
      }
      this.node || (this.node = {
        type: "text",
        value: ""
      }, this.list.push(this.node)), n === `
` && (n = " "), (n.charCodeAt(0) >= 33 || [" ", "	"].includes(n)) && (this.node.value += n), this.escaped = !1;
    }
  }
  const k = 50;
  function f(p, n) {
    n = n || {};
    let r = n._depth || 0;
    if (r > k)
      return [];
    let m = new y(p).tokenize(), e = [], l = [], c = [];
    if (m.forEach((s) => {
      s.type === "operator" && (s.value === "," || s.value === ";") ? (l.length && e.push(l), l = []) : l.push(s);
    }), l.length && e.push(l), e.forEach((s) => {
      s = b(s, r), s.length && (c = c.concat(s));
    }), n.flatten) {
      let s = [], x = (g) => {
        g.forEach((v) => {
          if (v.group)
            return x(v.group);
          s.push(v);
        });
      };
      return x(c), s;
    }
    return c;
  }
  return fe = f, fe;
}
var xe, it;
function ti() {
  if (it) return xe;
  it = 1;
  const b = P.Transform;
  class y extends b {
    constructor() {
      super(), this.lastByte = !1;
    }
    _transform(f, p, n) {
      f.length && (this.lastByte = f[f.length - 1]), this.push(f), n();
    }
    _flush(f) {
      return this.lastByte === 10 ? f() : this.lastByte === 13 ? (this.push(Buffer.from(`
`)), f()) : (this.push(Buffer.from(`\r
`)), f());
    }
  }
  return xe = y, xe;
}
var ge, st;
function Rt() {
  if (st) return ge;
  st = 1;
  const y = P.Transform;
  class k extends y {
    constructor(p) {
      super(p), this.options = p || {}, this.lastByte = !1;
    }
    /**
     * Escapes dots
     */
    _transform(p, n, r) {
      let o, m = 0;
      for (let e = 0, l = p.length; e < l; e++)
        p[e] === 10 && (e && p[e - 1] !== 13 || !e && this.lastByte !== 13) && (e > m && (o = p.slice(m, e), this.push(o)), this.push(Buffer.from(`\r
`)), m = e + 1);
      m && m < p.length ? (o = p.slice(m), this.push(o)) : m || this.push(p), this.lastByte = p[p.length - 1], r();
    }
  }
  return ge = k, ge;
}
var ve, at;
function ii() {
  if (at) return ve;
  at = 1;
  const y = P.Transform;
  class k extends y {
    constructor(p) {
      super(p), this.options = p || {};
    }
    /**
     * Escapes dots
     */
    _transform(p, n, r) {
      let o, m = 0;
      for (let e = 0, l = p.length; e < l; e++)
        p[e] === 13 && (o = p.slice(m, e), m = e + 1, this.push(o));
      m && m < p.length ? (o = p.slice(m), this.push(o)) : m || this.push(p), r();
    }
  }
  return ve = k, ve;
}
var we, nt;
function Fe() {
  if (nt) return we;
  nt = 1;
  const b = K, y = De, k = Nt(), f = P.PassThrough, p = q(), n = oe(), r = qt(), o = Ht(), m = ei(), e = ne(), l = F(), c = ti(), s = Rt(), x = ii();
  class g {
    constructor(t, i) {
      this.nodeCounter = 0, i = i || {}, this.baseBoundary = i.baseBoundary || b.randomBytes(8).toString("hex"), this.boundaryPrefix = i.boundaryPrefix || "--_NmP", this.disableFileAccess = !!i.disableFileAccess, this.disableUrlAccess = !!i.disableUrlAccess, this.normalizeHeaderKey = i.normalizeHeaderKey, this.date = /* @__PURE__ */ new Date(), this.rootNode = i.rootNode || this, this.keepBcc = !!i.keepBcc, i.filename && (this.filename = i.filename, t || (t = n.detectMimeType(this.filename.split(".").pop()))), this.textEncoding = (i.textEncoding || "").toString().trim().charAt(0).toUpperCase(), this.parentNode = i.parentNode, this.hostname = i.hostname, this.newline = i.newline, this.childNodes = [], this._nodeId = ++this.rootNode.nodeCounter, this._headers = [], this._isPlainText = !1, this._hasLongLines = !1, this._envelope = !1, this._raw = !1, this._transforms = [], this._processFuncs = [], t && this.setHeader("Content-Type", t);
    }
    /////// PUBLIC METHODS
    /**
     * Creates and appends a child node.Arguments provided are passed to MimeNode constructor
     *
     * @param {String} [contentType] Optional content type
     * @param {Object} [options] Optional options object
     * @return {Object} Created node object
     */
    createChild(t, i) {
      !i && typeof t == "object" && (i = t, t = void 0);
      let d = new g(t, i);
      return this.appendChild(d), d;
    }
    /**
     * Appends an existing node to the mime tree. Removes the node from an existing
     * tree if needed
     *
     * @param {Object} childNode node to be appended
     * @return {Object} Appended node object
     */
    appendChild(t) {
      return t.rootNode !== this.rootNode && (t.rootNode = this.rootNode, t._nodeId = ++this.rootNode.nodeCounter), t.parentNode = this, this.childNodes.push(t), t;
    }
    /**
     * Replaces current node with another node
     *
     * @param {Object} node Replacement node
     * @return {Object} Replacement node
     */
    replace(t) {
      return t === this ? this : (this.parentNode.childNodes.forEach((i, d) => {
        i === this && (t.rootNode = this.rootNode, t.parentNode = this.parentNode, t._nodeId = this._nodeId, this.rootNode = this, this.parentNode = void 0, t.parentNode.childNodes[d] = t);
      }), t);
    }
    /**
     * Removes current node from the mime tree
     *
     * @return {Object} removed node
     */
    remove() {
      if (!this.parentNode)
        return this;
      for (let t = this.parentNode.childNodes.length - 1; t >= 0; t--)
        if (this.parentNode.childNodes[t] === this)
          return this.parentNode.childNodes.splice(t, 1), this.parentNode = void 0, this.rootNode = this, this;
    }
    /**
     * Sets a header value. If the value for selected key exists, it is overwritten.
     * You can set multiple values as well by using [{key:'', value:''}] or
     * {key: 'value'} as the first argument.
     *
     * @param {String|Array|Object} key Header key or a list of key value pairs
     * @param {String} value Header value
     * @return {Object} current node
     */
    setHeader(t, i) {
      let d = !1, a;
      if (!i && t && typeof t == "object")
        return t.key && "value" in t ? this.setHeader(t.key, t.value) : Array.isArray(t) ? t.forEach((h) => {
          this.setHeader(h.key, h.value);
        }) : Object.keys(t).forEach((h) => {
          this.setHeader(h, t[h]);
        }), this;
      t = this._normalizeHeaderKey(t), a = {
        key: t,
        value: i
      };
      for (let h = 0, u = this._headers.length; h < u; h++)
        this._headers[h].key === t && (d ? (this._headers.splice(h, 1), h--, u--) : (this._headers[h] = a, d = !0));
      return d || this._headers.push(a), this;
    }
    /**
     * Adds a header value. If the value for selected key exists, the value is appended
     * as a new field and old one is not touched.
     * You can set multiple values as well by using [{key:'', value:''}] or
     * {key: 'value'} as the first argument.
     *
     * @param {String|Array|Object} key Header key or a list of key value pairs
     * @param {String} value Header value
     * @return {Object} current node
     */
    addHeader(t, i) {
      return !i && t && typeof t == "object" ? (t.key && t.value ? this.addHeader(t.key, t.value) : Array.isArray(t) ? t.forEach((d) => {
        this.addHeader(d.key, d.value);
      }) : Object.keys(t).forEach((d) => {
        this.addHeader(d, t[d]);
      }), this) : Array.isArray(i) ? (i.forEach((d) => {
        this.addHeader(t, d);
      }), this) : (this._headers.push({
        key: this._normalizeHeaderKey(t),
        value: i
      }), this);
    }
    /**
     * Retrieves the first mathcing value of a selected key
     *
     * @param {String} key Key to search for
     * @retun {String} Value for the key
     */
    getHeader(t) {
      t = this._normalizeHeaderKey(t);
      for (let i = 0, d = this._headers.length; i < d; i++)
        if (this._headers[i].key === t)
          return this._headers[i].value;
    }
    /**
     * Sets body content for current node. If the value is a string, charset is added automatically
     * to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
     * the charset yourself
     *
     * @param (String|Buffer) content Body content
     * @return {Object} current node
     */
    setContent(t) {
      return this.content = t, typeof this.content.pipe == "function" ? (this._contentErrorHandler = (i) => {
        this.content.removeListener("error", this._contentErrorHandler), this.content = i;
      }, this.content.once("error", this._contentErrorHandler)) : typeof this.content == "string" && (this._isPlainText = n.isPlainText(this.content), this._isPlainText && n.hasLongerLines(this.content, 76) && (this._hasLongLines = !0)), this;
    }
    build(t) {
      let i;
      t || (i = new Promise((_, w) => {
        t = p.callbackPromise(_, w);
      }));
      let d = this.createReadStream(), a = [], h = 0, u = !1;
      return d.on("readable", () => {
        let _;
        for (; (_ = d.read()) !== null; )
          a.push(_), h += _.length;
      }), d.once("error", (_) => {
        if (!u)
          return u = !0, t(_);
      }), d.once("end", (_) => {
        if (!u)
          return u = !0, _ && _.length && (a.push(_), h += _.length), t(null, Buffer.concat(a, h));
      }), i;
    }
    getTransferEncoding() {
      let t = !1, i = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
      return this.content && (t = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim(), (!t || !["base64", "quoted-printable"].includes(t)) && (/^text\//i.test(i) ? this._isPlainText && !this._hasLongLines ? t = "7bit" : typeof this.content == "string" || this.content instanceof Buffer ? t = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64" : t = this.textEncoding === "B" ? "base64" : "quoted-printable" : /^(multipart|message)\//i.test(i) || (t = t || "base64"))), t;
    }
    /**
     * Builds the header block for the mime node. Append \r\n\r\n before writing the content
     *
     * @returns {String} Headers
     */
    buildHeaders() {
      let t = this.getTransferEncoding(), i = [];
      if (t && this.setHeader("Content-Transfer-Encoding", t), this.filename && !this.getHeader("Content-Disposition") && this.setHeader("Content-Disposition", "attachment"), this.rootNode === this) {
        this.getHeader("Date") || this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000")), this.messageId(), this.getHeader("MIME-Version") || this.setHeader("MIME-Version", "1.0");
        for (let d = this._headers.length - 2; d >= 0; d--) {
          let a = this._headers[d];
          a.key === "Content-Type" && (this._headers.splice(d, 1), this._headers.push(a));
        }
      }
      return this._headers.forEach((d) => {
        let a = d.key, h = d.value, u, _, w = {};
        if (!(h && typeof h == "object" && !["From", "Sender", "To", "Cc", "Bcc", "Reply-To", "Date", "References"].includes(a) && (Object.keys(h).forEach((S) => {
          S !== "value" && (w[S] = h[S]);
        }), h = (h.value || "").toString(), !h.trim()))) {
          if (w.prepared) {
            w.foldLines ? i.push(n.foldLines(a + ": " + h)) : i.push(a + ": " + h);
            return;
          }
          switch (d.key) {
            case "Content-Disposition":
              u = n.parseHeaderValue(h), this.filename && (u.params.filename = this.filename), h = n.buildHeaderValue(u);
              break;
            case "Content-Type":
              u = n.parseHeaderValue(h), this._handleContentType(u), u.value.match(/^text\/plain\b/) && typeof this.content == "string" && /[\u0080-\uFFFF]/.test(this.content) && (u.params.charset = "utf-8"), h = n.buildHeaderValue(u), this.filename && (_ = this._encodeWords(this.filename), (_ !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(_)) && (_ = '"' + _ + '"'), h += "; name=" + _);
              break;
            case "Bcc":
              if (!this.keepBcc)
                return;
              break;
          }
          if (h = this._encodeHeaderValue(a, h), !!(h || "").toString().trim()) {
            if (typeof this.normalizeHeaderKey == "function") {
              let S = this.normalizeHeaderKey(a, h);
              S && typeof S == "string" && S.length && (a = S);
            }
            i.push(n.foldLines(a + ": " + h, 76));
          }
        }
      }), i.join(`\r
`);
    }
    /**
     * Streams the rfc2822 message from the current node. If this is a root node,
     * mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
     *
     * @return {String} Compiled message
     */
    createReadStream(t) {
      t = t || {};
      let i = new f(t), d = i, a;
      this.stream(i, t, (h) => {
        if (h) {
          d.emit("error", h);
          return;
        }
        i.end();
      });
      for (let h = 0, u = this._transforms.length; h < u; h++)
        a = typeof this._transforms[h] == "function" ? this._transforms[h]() : this._transforms[h], d.once("error", (_) => {
          a.emit("error", _);
        }), d = d.pipe(a);
      a = new c(), d.once("error", (h) => {
        a.emit("error", h);
      }), d = d.pipe(a);
      for (let h = 0, u = this._processFuncs.length; h < u; h++)
        a = this._processFuncs[h], d = a(d);
      if (this.newline) {
        const u = ["win", "windows", "dos", `\r
`].includes(this.newline.toString().toLowerCase()) ? new s() : new x(), _ = d.pipe(u);
        return d.on("error", (w) => _.emit("error", w)), _;
      }
      return d;
    }
    /**
     * Appends a transform stream object to the transforms list. Final output
     * is passed through this stream before exposing
     *
     * @param {Object} transform Read-Write stream
     */
    transform(t) {
      this._transforms.push(t);
    }
    /**
     * Appends a post process function. The functon is run after transforms and
     * uses the following syntax
     *
     *   processFunc(input) -> outputStream
     *
     * @param {Object} processFunc Read-Write stream
     */
    processFunc(t) {
      this._processFuncs.push(t);
    }
    stream(t, i, d) {
      let a = this.getTransferEncoding(), h, u, _ = !1, w = (A) => {
        _ || (_ = !0, d(A));
      }, E = () => {
        let A = 0, C = () => {
          if (A >= this.childNodes.length)
            return t.write(`\r
--` + this.boundary + `--\r
`), w();
          let j = this.childNodes[A++];
          t.write((A > 1 ? `\r
` : "") + "--" + this.boundary + `\r
`), j.stream(t, i, (T) => {
            if (T)
              return w(T);
            setImmediate(C);
          });
        };
        if (this.multipart)
          setImmediate(C);
        else
          return w();
      }, S = () => {
        if (this.content) {
          if (Object.prototype.toString.call(this.content) === "[object Error]")
            return w(this.content);
          typeof this.content.pipe == "function" && (this.content.removeListener("error", this._contentErrorHandler), this._contentErrorHandler = (C) => w(C), this.content.once("error", this._contentErrorHandler));
          let A = () => {
            ["quoted-printable", "base64"].includes(a) ? (h = new (a === "base64" ? o : r).Encoder(i), h.pipe(t, {
              end: !1
            }), h.once("end", E), h.once("error", (C) => w(C)), u = this._getStream(this.content), u.pipe(h)) : (u = this._getStream(this.content), u.pipe(t, {
              end: !1
            }), u.once("end", E)), u.once("error", (C) => w(C));
          };
          if (this.content._resolve) {
            let C = [], j = 0, T = !1, I = this._getStream(this.content);
            I.on("error", (M) => {
              T || (T = !0, w(M));
            }), I.on("readable", () => {
              let M;
              for (; (M = I.read()) !== null; )
                C.push(M), j += M.length;
            }), I.on("end", () => {
              T || (T = !0, this.content._resolve = !1, this.content._resolvedValue = Buffer.concat(C, j), setImmediate(A));
            });
          } else
            setImmediate(A);
          return;
        } else
          return setImmediate(E);
      };
      this._raw ? setImmediate(() => {
        if (Object.prototype.toString.call(this._raw) === "[object Error]")
          return w(this._raw);
        typeof this._raw.pipe == "function" && this._raw.removeListener("error", this._contentErrorHandler);
        let A = this._getStream(this._raw);
        A.pipe(t, {
          end: !1
        }), A.on("error", (C) => t.emit("error", C)), A.on("end", E);
      }) : (t.write(this.buildHeaders() + `\r
\r
`), setImmediate(S));
    }
    /**
     * Sets envelope to be used instead of the generated one
     *
     * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
     */
    setEnvelope(t) {
      let i;
      this._envelope = {
        from: !1,
        to: []
      }, t.from && (i = [], this._convertAddresses(this._parseAddresses(t.from), i), i = i.filter((a) => a && a.address), i.length && i[0] && (this._envelope.from = i[0].address)), ["to", "cc", "bcc"].forEach((a) => {
        t[a] && this._convertAddresses(this._parseAddresses(t[a]), this._envelope.to);
      }), this._envelope.to = this._envelope.to.map((a) => a.address).filter((a) => a);
      let d = ["to", "cc", "bcc", "from"];
      return Object.keys(t).forEach((a) => {
        d.includes(a) || (this._envelope[a] = t[a]);
      }), this;
    }
    /**
     * Generates and returns an object with parsed address fields
     *
     * @return {Object} Address object
     */
    getAddresses() {
      let t = {};
      return this._headers.forEach((i) => {
        let d = i.key.toLowerCase();
        ["from", "sender", "reply-to", "to", "cc", "bcc"].includes(d) && (Array.isArray(t[d]) || (t[d] = []), this._convertAddresses(this._parseAddresses(i.value), t[d]));
      }), t;
    }
    /**
     * Generates and returns SMTP envelope with the sender address and a list of recipients addresses
     *
     * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
     */
    getEnvelope() {
      if (this._envelope)
        return this._envelope;
      let t = {
        from: !1,
        to: []
      };
      return this._headers.forEach((i) => {
        let d = [];
        i.key === "From" || !t.from && ["Reply-To", "Sender"].includes(i.key) ? (this._convertAddresses(this._parseAddresses(i.value), d), d.length && d[0] && (t.from = d[0].address)) : ["To", "Cc", "Bcc"].includes(i.key) && this._convertAddresses(this._parseAddresses(i.value), t.to);
      }), t.to = t.to.map((i) => i.address), t;
    }
    /**
     * Returns Message-Id value. If it does not exist, then creates one
     *
     * @return {String} Message-Id value
     */
    messageId() {
      let t = this.getHeader("Message-ID");
      return t || (t = this._generateMessageId(), this.setHeader("Message-ID", t)), t;
    }
    /**
     * Sets pregenerated content that will be used as the output of this node
     *
     * @param {String|Buffer|Stream} Raw MIME contents
     */
    setRaw(t) {
      return this._raw = t, this._raw && typeof this._raw.pipe == "function" && (this._contentErrorHandler = (i) => {
        this._raw.removeListener("error", this._contentErrorHandler), this._raw = i;
      }, this._raw.once("error", this._contentErrorHandler)), this;
    }
    /////// PRIVATE METHODS
    /**
     * Detects and returns handle to a stream related with the content.
     *
     * @param {Mixed} content Node content
     * @returns {Object} Stream object
     */
    _getStream(t) {
      let i;
      return t._resolvedValue ? (i = new f(), setImmediate(() => {
        try {
          i.end(t._resolvedValue);
        } catch (d) {
          i.emit("error", d);
        }
      }), i) : typeof t.pipe == "function" ? t : t && typeof t.path == "string" && !t.href ? this.disableFileAccess ? (i = new f(), setImmediate(() => {
        let d = new Error("File access rejected for " + t.path);
        d.code = l.EFILEACCESS, i.emit("error", d);
      }), i) : y.createReadStream(t.path) : t && typeof t.href == "string" ? this.disableUrlAccess ? (i = new f(), setImmediate(() => {
        let d = new Error("Url access rejected for " + t.href);
        d.code = l.EURLACCESS, i.emit("error", d);
      }), i) : e(t.href, { headers: t.httpHeaders }) : (i = new f(), setImmediate(() => {
        try {
          i.end(t || "");
        } catch (d) {
          i.emit("error", d);
        }
      }), i);
    }
    /**
     * Parses addresses. Takes in a single address or an array or an
     * array of address arrays (eg. To: [[first group], [second group],...])
     *
     * @param {Mixed} addresses Addresses to be parsed
     * @return {Array} An array of address objects
     */
    _parseAddresses(t) {
      return [].concat.apply(
        [],
        [].concat(t).map((i) => i && i.address ? (i.address = this._normalizeAddress(i.address), i.name = i.name || "", [i]) : m(i))
      );
    }
    /**
     * Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
     *
     * @param {String} key Key to be normalized
     * @return {String} key in Camel-Case form
     */
    _normalizeHeaderKey(t) {
      return t = (t || "").toString().replace(/\r?\n|\r/g, " ").trim().toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (i) => i.toUpperCase()).replace(/^Content-Features$/i, "Content-features"), t;
    }
    /**
     * Checks if the content type is multipart and defines boundary if needed.
     * Doesn't return anything, modifies object argument instead.
     *
     * @param {Object} structured Parsed header value for 'Content-Type' key
     */
    _handleContentType(t) {
      this.contentType = t.value.trim().toLowerCase(), this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : !1, this.multipart ? this.boundary = t.params.boundary = t.params.boundary || this.boundary || this._generateBoundary() : this.boundary = !1;
    }
    /**
     * Generates a multipart boundary value
     *
     * @return {String} boundary value
     */
    _generateBoundary() {
      return this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary + "-Part_" + this._nodeId;
    }
    /**
     * Encodes a header value for use in the generated rfc2822 email.
     *
     * @param {String} key Header key
     * @param {String} value Header value
     */
    _encodeHeaderValue(t, i) {
      switch (t = this._normalizeHeaderKey(t), t) {
        // Structured headers
        case "From":
        case "Sender":
        case "To":
        case "Cc":
        case "Bcc":
        case "Reply-To":
          return this._convertAddresses(this._parseAddresses(i));
        // values enclosed in <>
        case "Message-ID":
        case "In-Reply-To":
        case "Content-Id":
          return i = (i || "").toString().replace(/\r?\n|\r/g, " "), i.charAt(0) !== "<" && (i = "<" + i), i.charAt(i.length - 1) !== ">" && (i = i + ">"), i;
        // space separated list of values enclosed in <>
        case "References":
          return i = [].concat.apply(
            [],
            [].concat(i || "").map((d) => (d = (d || "").toString().replace(/\r?\n|\r/g, " ").trim(), d.replace(/<[^>]*>/g, (a) => a.replace(/\s/g, "")).split(/\s+/)))
          ).map((d) => (d.charAt(0) !== "<" && (d = "<" + d), d.charAt(d.length - 1) !== ">" && (d = d + ">"), d)), i.join(" ").trim();
        case "Date":
          return Object.prototype.toString.call(i) === "[object Date]" ? i.toUTCString().replace(/GMT/, "+0000") : (i = (i || "").toString().replace(/\r?\n|\r/g, " "), this._encodeWords(i));
        case "Content-Type":
        case "Content-Disposition":
          return (i || "").toString().replace(/\r?\n|\r/g, " ");
        default:
          return i = (i || "").toString().replace(/\r?\n|\r/g, " "), this._encodeWords(i);
      }
    }
    /**
     * Rebuilds address object using punycode and other adjustments
     *
     * @param {Array} addresses An array of address objects
     * @param {Array} [uniqueList] An array to be populated with addresses
     * @return {String} address string
     */
    _convertAddresses(t, i) {
      let d = [];
      return i = i || [], [].concat(t || []).forEach((a) => {
        if (a.address)
          a.address = this._normalizeAddress(a.address), a.name ? a.name && d.push(`${this._encodeAddressName(a.name)} <${a.address}>`) : d.push(a.address.indexOf(" ") >= 0 ? `<${a.address}>` : `${a.address}`), a.address && (i.filter((h) => h.address === a.address).length || i.push(a));
        else if (a.group) {
          let h = (a.group.length ? this._convertAddresses(a.group, i) : "").trim();
          d.push(`${this._encodeAddressName(a.name)}:${h};`);
        }
      }), d.join(", ");
    }
    /**
     * Normalizes an email address
     *
     * @param {Array} address An array of address objects
     * @return {String} address string
     */
    _normalizeAddress(t) {
      t = (t || "").toString().replace(/[\x00-\x1F<>]+/g, " ").trim();
      let i = t.lastIndexOf("@");
      if (i < 0)
        return t;
      let d = t.substr(0, i), a = t.substr(i + 1), h;
      try {
        h = k.toASCII(a.toLowerCase());
      } catch {
      }
      return d.indexOf(" ") >= 0 && (d.charAt(0) !== '"' && (d = '"' + d), d.substr(-1) !== '"' && (d = d + '"')), `${d}@${h}`;
    }
    /**
     * If needed, mime encodes the name part
     *
     * @param {String} name Name part of an address
     * @returns {String} Mime word encoded string if needed
     */
    _encodeAddressName(t) {
      return /^[\w ]*$/.test(t) ? t : /^[\x20-\x7e]*$/.test(t) ? '"' + t.replace(/([\\"])/g, "\\$1") + '"' : n.encodeWord(t, this._getTextEncoding(t), 52);
    }
    /**
     * If needed, mime encodes the name part
     *
     * @param {String} name Name part of an address
     * @returns {String} Mime word encoded string if needed
     */
    _encodeWords(t) {
      return n.encodeWords(t, this._getTextEncoding(t), 52, !0);
    }
    /**
     * Detects best mime encoding for a text value
     *
     * @param {String} value Value to check for
     * @return {String} either 'Q' or 'B'
     */
    _getTextEncoding(t) {
      t = (t || "").toString();
      let i = this.textEncoding, d, a;
      return i || (a = (t.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\u0080-\uFFFF]/g) || []).length, d = (t.match(/[a-z]/gi) || []).length, i = a < d ? "Q" : "B"), i;
    }
    /**
     * Generates a message id
     *
     * @return {String} Random Message-ID value
     */
    _generateMessageId() {
      return "<" + [2, 2, 2, 6].reduce(
        // crux to generate UUID-like random strings
        (t, i) => t + "-" + b.randomBytes(i).toString("hex"),
        b.randomBytes(4).toString("hex")
      ) + "@" + // try to use the domain of the FROM address or fallback to server hostname
      (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
    }
  }
  return we = g, we;
}
var _e, ot;
function si() {
  if (ot) return _e;
  ot = 1;
  const b = Fe(), y = oe(), k = q().parseDataURI;
  class f {
    constructor(n) {
      this.mail = n || {}, this.message = !1;
    }
    /**
     * Builds MimeNode instance
     */
    compile() {
      return this._alternatives = this.getAlternatives(), this._htmlNode = this._alternatives.filter((n) => /^text\/html\b/i.test(n.contentType)).pop(), this._attachments = this.getAttachments(!!this._htmlNode), this._useRelated = !!(this._htmlNode && this._attachments.related.length), this._useAlternative = this._alternatives.length > 1, this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1, this.mail.raw ? this.message = new b("message/rfc822", { newline: this.mail.newline }).setRaw(this.mail.raw) : this._useMixed ? this.message = this._createMixed() : this._useAlternative ? this.message = this._createAlternative() : this._useRelated ? this.message = this._createRelated() : this.message = this._createContentNode(
        !1,
        [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
          contentType: "text/plain",
          content: ""
        }
      ), this.mail.headers && this.message.addHeader(this.mail.headers), ["from", "sender", "to", "cc", "bcc", "reply-to", "in-reply-to", "references", "subject", "message-id", "date"].forEach((n) => {
        let r = n.replace(/-(\w)/g, (o, m) => m.toUpperCase());
        this.mail[r] && this.message.setHeader(n, this.mail[r]);
      }), this.mail.envelope && this.message.setEnvelope(this.mail.envelope), this.message.messageId(), this.message;
    }
    /**
     * List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
     *
     * @param {Boolean} findRelated If true separate related attachments from attached ones
     * @returns {Object} An object of arrays (`related` and `attached`)
     */
    getAttachments(n) {
      let r, o, m = [].concat(this.mail.attachments || []).map((e, l) => {
        let c;
        /^data:/i.test(e.path || e.href) && (e = this._processDataUrl(e));
        let s = e.contentType || y.detectMimeType(e.filename || e.path || e.href || "bin"), x = /^image\//i.test(s), g = /^message\//i.test(s), v = e.contentDisposition || (g || x && e.cid ? "inline" : "attachment"), t;
        return "contentTransferEncoding" in e ? t = e.contentTransferEncoding : g ? t = "8bit" : t = "base64", c = {
          contentType: s,
          contentDisposition: v,
          contentTransferEncoding: t
        }, e.filename ? c.filename = e.filename : !g && e.filename !== !1 && (c.filename = (e.path || e.href || "").split("/").pop().split("?").shift() || "attachment-" + (l + 1), c.filename.indexOf(".") < 0 && (c.filename += "." + y.detectExtension(c.contentType))), /^https?:\/\//i.test(e.path) && (e.href = e.path, e.path = void 0), e.cid && (c.cid = e.cid), e.raw ? c.raw = e.raw : e.path ? c.content = {
          path: e.path
        } : e.href ? c.content = {
          href: e.href,
          httpHeaders: e.httpHeaders
        } : c.content = e.content || "", e.encoding && (c.encoding = e.encoding), e.headers && (c.headers = e.headers), c;
      });
      return this.mail.icalEvent && (typeof this.mail.icalEvent == "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw) ? r = this.mail.icalEvent : r = {
        content: this.mail.icalEvent
      }, o = {}, Object.keys(r).forEach((e) => {
        o[e] = r[e];
      }), o.contentType = "application/ics", o.headers || (o.headers = {}), o.filename = o.filename || "invite.ics", o.headers["Content-Disposition"] = "attachment", o.headers["Content-Transfer-Encoding"] = "base64"), n ? {
        attached: m.filter((e) => !e.cid).concat(o || []),
        related: m.filter((e) => !!e.cid)
      } : {
        attached: m.concat(o || []),
        related: []
      };
    }
    /**
     * List alternatives. Resulting objects can be used as input for MimeNode nodes
     *
     * @returns {Array} An array of alternative elements. Includes the `text` and `html` values as well
     */
    getAlternatives() {
      let n = [], r, o, m, e, l, c;
      return this.mail.text && (typeof this.mail.text == "object" && (this.mail.text.content || this.mail.text.path || this.mail.text.href || this.mail.text.raw) ? r = this.mail.text : r = {
        content: this.mail.text
      }, r.contentType = "text/plain; charset=utf-8"), this.mail.watchHtml && (typeof this.mail.watchHtml == "object" && (this.mail.watchHtml.content || this.mail.watchHtml.path || this.mail.watchHtml.href || this.mail.watchHtml.raw) ? m = this.mail.watchHtml : m = {
        content: this.mail.watchHtml
      }, m.contentType = "text/watch-html; charset=utf-8"), this.mail.amp && (typeof this.mail.amp == "object" && (this.mail.amp.content || this.mail.amp.path || this.mail.amp.href || this.mail.amp.raw) ? e = this.mail.amp : e = {
        content: this.mail.amp
      }, e.contentType = "text/x-amp-html; charset=utf-8"), this.mail.icalEvent && (typeof this.mail.icalEvent == "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw) ? l = this.mail.icalEvent : l = {
        content: this.mail.icalEvent
      }, c = {}, Object.keys(l).forEach((s) => {
        c[s] = l[s];
      }), c.content && typeof c.content == "object" && (c.content._resolve = !0), c.filename = !1, c.contentType = "text/calendar; charset=utf-8; method=" + (c.method || "PUBLISH").toString().trim().toUpperCase(), c.headers || (c.headers = {})), this.mail.html && (typeof this.mail.html == "object" && (this.mail.html.content || this.mail.html.path || this.mail.html.href || this.mail.html.raw) ? o = this.mail.html : o = {
        content: this.mail.html
      }, o.contentType = "text/html; charset=utf-8"), [].concat(r || []).concat(m || []).concat(e || []).concat(o || []).concat(c || []).concat(this.mail.alternatives || []).forEach((s) => {
        let x;
        /^data:/i.test(s.path || s.href) && (s = this._processDataUrl(s)), x = {
          contentType: s.contentType || y.detectMimeType(s.filename || s.path || s.href || "txt"),
          contentTransferEncoding: s.contentTransferEncoding
        }, s.filename && (x.filename = s.filename), /^https?:\/\//i.test(s.path) && (s.href = s.path, s.path = void 0), s.raw ? x.raw = s.raw : s.path ? x.content = {
          path: s.path
        } : s.href ? x.content = {
          href: s.href
        } : x.content = s.content || "", s.encoding && (x.encoding = s.encoding), s.headers && (x.headers = s.headers), n.push(x);
      }), n;
    }
    /**
     * Builds multipart/mixed node. It should always contain different type of elements on the same level
     * eg. text + attachments
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */
    _createMixed(n) {
      let r;
      return n ? r = n.createChild("multipart/mixed", {
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }) : r = new b("multipart/mixed", {
        baseBoundary: this.mail.baseBoundary,
        textEncoding: this.mail.textEncoding,
        boundaryPrefix: this.mail.boundaryPrefix,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }), this._useAlternative ? this._createAlternative(r) : this._useRelated && this._createRelated(r), [].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((o) => {
        (!this._useRelated || o !== this._htmlNode) && this._createContentNode(r, o);
      }), r;
    }
    /**
     * Builds multipart/alternative node. It should always contain same type of elements on the same level
     * eg. text + html view of the same data
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */
    _createAlternative(n) {
      let r;
      return n ? r = n.createChild("multipart/alternative", {
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }) : r = new b("multipart/alternative", {
        baseBoundary: this.mail.baseBoundary,
        textEncoding: this.mail.textEncoding,
        boundaryPrefix: this.mail.boundaryPrefix,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }), this._alternatives.forEach((o) => {
        this._useRelated && this._htmlNode === o ? this._createRelated(r) : this._createContentNode(r, o);
      }), r;
    }
    /**
     * Builds multipart/related node. It should always contain html node with related attachments
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */
    _createRelated(n) {
      let r;
      return n ? r = n.createChild('multipart/related; type="text/html"', {
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }) : r = new b('multipart/related; type="text/html"', {
        baseBoundary: this.mail.baseBoundary,
        textEncoding: this.mail.textEncoding,
        boundaryPrefix: this.mail.boundaryPrefix,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }), this._createContentNode(r, this._htmlNode), this._attachments.related.forEach((o) => this._createContentNode(r, o)), r;
    }
    /**
     * Creates a regular node with contents
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @param {Object} element Node data
     * @returns {Object} MimeNode node element
     */
    _createContentNode(n, r) {
      r = r || {}, r.content = r.content || "";
      let o, m = (r.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
      return n ? o = n.createChild(r.contentType, {
        filename: r.filename,
        textEncoding: this.mail.textEncoding,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }) : o = new b(r.contentType, {
        filename: r.filename,
        baseBoundary: this.mail.baseBoundary,
        textEncoding: this.mail.textEncoding,
        boundaryPrefix: this.mail.boundaryPrefix,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess,
        normalizeHeaderKey: this.mail.normalizeHeaderKey,
        newline: this.mail.newline
      }), r.headers && o.addHeader(r.headers), r.cid && o.setHeader("Content-Id", "<" + r.cid.replace(/[<>]/g, "") + ">"), r.contentTransferEncoding ? o.setHeader("Content-Transfer-Encoding", r.contentTransferEncoding) : this.mail.encoding && /^text\//i.test(r.contentType) && o.setHeader("Content-Transfer-Encoding", this.mail.encoding), (!/^text\//i.test(r.contentType) || r.contentDisposition) && o.setHeader(
        "Content-Disposition",
        r.contentDisposition || (r.cid && /^image\//i.test(r.contentType) ? "inline" : "attachment")
      ), typeof r.content == "string" && !["utf8", "usascii", "ascii"].includes(m) && (r.content = Buffer.from(r.content, m)), r.raw ? o.setRaw(r.raw) : o.setContent(r.content), o;
    }
    /**
     * Parses data uri and converts it to a Buffer
     *
     * @param {Object} element Content element
     * @return {Object} Parsed element
     */
    _processDataUrl(n) {
      const r = n.path || n.href;
      if (!r || typeof r != "string" || !r.startsWith("data:"))
        return n;
      if (r.length > 52428800) {
        let m = "application/octet-stream";
        const e = r.indexOf(",");
        if (e > 0 && e < 200) {
          const c = r.substring(5, e).split(";");
          c[0] && c[0].includes("/") && (m = c[0].trim());
        }
        return Object.assign({}, n, {
          path: !1,
          href: !1,
          content: Buffer.alloc(0),
          contentType: n.contentType || m
        });
      }
      let o;
      try {
        o = k(r);
      } catch {
        return n;
      }
      return o && (n.content = o.data, n.contentType = n.contentType || o.contentType, "path" in n && (n.path = !1), "href" in n && (n.href = !1)), n;
    }
  }
  return _e = f, _e;
}
var be, rt;
function ai() {
  if (rt) return be;
  rt = 1;
  const b = P.Transform;
  class y extends b {
    constructor(f) {
      super(f), this.lastBytes = Buffer.alloc(4), this.headersParsed = !1, this.headerBytes = 0, this.headerChunks = [], this.rawHeaders = !1, this.bodySize = 0;
    }
    /**
     * Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
     *
     * @param {Buffer} data Next data chunk from the stream
     */
    updateLastBytes(f) {
      let p = this.lastBytes.length, n = Math.min(f.length, p);
      for (let r = 0, o = p - n; r < o; r++)
        this.lastBytes[r] = this.lastBytes[r + n];
      for (let r = 1; r <= n; r++)
        this.lastBytes[p - r] = f[f.length - r];
    }
    /**
     * Finds and removes message headers from the remaining body. We want to keep
     * headers separated until final delivery to be able to modify these
     *
     * @param {Buffer} data Next chunk of data
     * @return {Boolean} Returns true if headers are already found or false otherwise
     */
    checkHeaders(f) {
      if (this.headersParsed)
        return !0;
      let p = this.lastBytes.length, n = 0;
      this.curLinePos = 0;
      for (let r = 0, o = this.lastBytes.length + f.length; r < o; r++) {
        let m;
        if (r < p ? m = this.lastBytes[r] : m = f[r - p], m === 10 && r) {
          let e = r - 1 < p ? this.lastBytes[r - 1] : f[r - 1 - p], l = r > 1 ? r - 2 < p ? this.lastBytes[r - 2] : f[r - 2 - p] : !1;
          if (e === 10) {
            this.headersParsed = !0, n = r - p + 1, this.headerBytes += n;
            break;
          } else if (e === 13 && l === 10) {
            this.headersParsed = !0, n = r - p + 1, this.headerBytes += n;
            break;
          }
        }
      }
      if (this.headersParsed) {
        if (this.headerChunks.push(f.slice(0, n)), this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes), this.headerChunks = null, this.emit("headers", this.parseHeaders()), f.length - 1 > n) {
          let r = f.slice(n);
          this.bodySize += r.length, setImmediate(() => this.push(r));
        }
        return !1;
      } else
        this.headerBytes += f.length, this.headerChunks.push(f);
      return this.updateLastBytes(f), !1;
    }
    _transform(f, p, n) {
      if (!f || !f.length)
        return n();
      typeof f == "string" && (f = Buffer.from(f, p));
      let r;
      try {
        r = this.checkHeaders(f);
      } catch (o) {
        return n(o);
      }
      r && (this.bodySize += f.length, this.push(f)), setImmediate(n);
    }
    _flush(f) {
      if (this.headerChunks) {
        let p = Buffer.concat(this.headerChunks, this.headerBytes);
        this.bodySize += p.length, this.push(p), this.headerChunks = null;
      }
      f();
    }
    parseHeaders() {
      let f = (this.rawHeaders || "").toString().split(/\r?\n/);
      for (let p = f.length - 1; p > 0; p--)
        /^\s/.test(f[p]) && (f[p - 1] += `
` + f[p], f.splice(p, 1));
      return f.filter((p) => p.trim()).map((p) => ({
        key: p.substr(0, p.indexOf(":")).trim().toLowerCase(),
        line: p
      }));
    }
  }
  return be = y, be;
}
var Ee, pt;
function ni() {
  if (pt) return Ee;
  pt = 1;
  const b = P.Transform, y = K;
  class k extends b {
    constructor(p) {
      super(), p = p || {}, this.chunkBuffer = [], this.chunkBufferLen = 0, this.bodyHash = y.createHash(p.hashAlgo || "sha1"), this.remainder = "", this.byteLength = 0, this.debug = p.debug, this._debugBody = p.debug ? [] : !1;
    }
    updateHash(p) {
      let n, r = "", o = "file";
      for (let e = p.length - 1; e >= 0; e--) {
        let l = p[e];
        if (!(o === "file" && (l === 10 || l === 13))) {
          if (o === "file" && (l === 9 || l === 32))
            o = "line";
          else if (!(o === "line" && (l === 9 || l === 32))) {
            if ((o === "file" || o === "line") && (o = "body", e === p.length - 1))
              break;
          }
        }
        if (e === 0) {
          if (o === "file" && (!this.remainder || /[\r\n]$/.test(this.remainder)) || o === "line" && (!this.remainder || /[ \t]$/.test(this.remainder))) {
            this.remainder += p.toString("binary");
            return;
          } else if (o === "line" || o === "file") {
            r = p.toString("binary"), p = !1;
            break;
          }
        }
        if (o === "body") {
          r = p.slice(e + 1).toString("binary"), p = p.slice(0, e + 1);
          break;
        }
      }
      let m = !!this.remainder;
      if (p && !m) {
        for (let e = 0, l = p.length; e < l; e++)
          if (e && p[e] === 10 && p[e - 1] !== 13) {
            m = !0;
            break;
          } else if (e && p[e] === 13 && p[e - 1] === 32) {
            m = !0;
            break;
          } else if (e && p[e] === 32 && p[e - 1] === 32) {
            m = !0;
            break;
          } else if (p[e] === 9) {
            m = !0;
            break;
          }
      }
      m ? (n = this.remainder + (p ? p.toString("binary") : ""), this.remainder = r, n = n.replace(/\r?\n/g, `
`).replace(/[ \t]*$/gm, "").replace(/[ \t]+/gm, " ").replace(/\n/g, `\r
`), p = Buffer.from(n, "binary")) : r && (this.remainder = r), this.debug && this._debugBody.push(p), this.bodyHash.update(p);
    }
    _transform(p, n, r) {
      if (!p || !p.length)
        return r();
      typeof p == "string" && (p = Buffer.from(p, n)), this.updateHash(p), this.byteLength += p.length, this.push(p), r();
    }
    _flush(p) {
      /[\r\n]$/.test(this.remainder) && this.byteLength > 2 && this.bodyHash.update(Buffer.from(`\r
`)), this.byteLength || this.push(Buffer.from(`\r
`)), this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : !1), p();
    }
  }
  return Ee = k, Ee;
}
var se = { exports: {} }, lt;
function oi() {
  if (lt) return se.exports;
  lt = 1;
  const b = Nt(), y = oe(), k = K;
  se.exports = (r, o, m, e) => {
    e = e || {};
    let c = e.headerFieldNames || "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:List-Owner:List-Archive", s = p(r, c, e.skipFields), x = f(e.domainName, e.keySelector, s.fieldNames, o, m), g, v;
    s.headers += "dkim-signature:" + n(x), g = k.createSign(("rsa-" + o).toUpperCase()), g.update(s.headers);
    try {
      v = g.sign(e.privateKey, "base64");
    } catch {
      return !1;
    }
    return x + v.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, `$&\r
 `).trim();
  }, se.exports.relaxedHeaders = p;
  function f(r, o, m, e, l) {
    let c = [
      "v=1",
      "a=rsa-" + e,
      "c=relaxed/relaxed",
      "d=" + b.toASCII(r),
      "q=dns/txt",
      "s=" + o,
      "bh=" + l,
      "h=" + m
    ].join("; ");
    return y.foldLines("DKIM-Signature: " + c, 76) + `;\r
 b=`;
  }
  function p(r, o, m) {
    let e = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
    (m || "").toLowerCase().split(":").forEach((g) => {
      l.add(g.trim());
    }), (o || "").toLowerCase().split(":").filter((g) => !l.has(g.trim())).forEach((g) => {
      e.add(g.trim());
    });
    for (let g = r.length - 1; g >= 0; g--) {
      let v = r[g];
      e.has(v.key) && !c.has(v.key) && c.set(v.key, n(v.line));
    }
    let s = [], x = [];
    return e.forEach((g) => {
      c.has(g) && (x.push(g), s.push(g + ":" + c.get(g)));
    }), {
      headers: s.join(`\r
`) + `\r
`,
      fieldNames: x.join(":")
    };
  }
  function n(r) {
    return r.substr(r.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/\s+/g, " ").trim();
  }
  return se.exports;
}
var ye, ct;
function ri() {
  if (ct) return ye;
  ct = 1;
  const b = ai(), y = ni(), k = oi(), f = P.PassThrough, p = De, n = Ct, r = K, o = "sha256", m = 2 * 1024 * 1024;
  class e {
    constructor(s, x, g, v) {
      this.options = s || {}, this.keys = x, this.cacheTreshold = Number(this.options.cacheTreshold) || m, this.hashAlgo = this.options.hashAlgo || o, this.cacheDir = this.options.cacheDir || !1, this.chunks = [], this.chunklen = 0, this.readPos = 0, this.cachePath = this.cacheDir ? n.join(this.cacheDir, "message." + Date.now() + "-" + r.randomBytes(14).toString("hex")) : !1, this.cache = !1, this.headers = !1, this.bodyHash = !1, this.parser = !1, this.relaxedBody = !1, this.input = g, this.output = v, this.output.usingCache = !1, this.hasErrored = !1, this.input.on("error", (t) => {
        this.hasErrored = !0, this.cleanup(), v.emit("error", t);
      });
    }
    cleanup() {
      !this.cache || !this.cachePath || p.unlink(this.cachePath, () => !1);
    }
    createReadCache() {
      this.cache = p.createReadStream(this.cachePath), this.cache.once("error", (s) => {
        this.cleanup(), this.output.emit("error", s);
      }), this.cache.once("close", () => {
        this.cleanup();
      }), this.cache.pipe(this.output);
    }
    sendNextChunk() {
      if (this.hasErrored)
        return;
      if (this.readPos >= this.chunks.length)
        return this.cache ? this.createReadCache() : this.output.end();
      let s = this.chunks[this.readPos++];
      if (this.output.write(s) === !1)
        return this.output.once("drain", () => {
          this.sendNextChunk();
        });
      setImmediate(() => this.sendNextChunk());
    }
    sendSignedOutput() {
      let s = 0, x = () => {
        if (s >= this.keys.length)
          return this.output.write(this.parser.rawHeaders), setImmediate(() => this.sendNextChunk());
        let g = this.keys[s++], v = k(this.headers, this.hashAlgo, this.bodyHash, {
          domainName: g.domainName,
          keySelector: g.keySelector,
          privateKey: g.privateKey,
          headerFieldNames: this.options.headerFieldNames,
          skipFields: this.options.skipFields
        });
        return v && this.output.write(Buffer.from(v + `\r
`)), setImmediate(x);
      };
      if (this.bodyHash && this.headers)
        return x();
      this.output.write(this.parser.rawHeaders), this.sendNextChunk();
    }
    createWriteCache() {
      this.output.usingCache = !0, this.cache = p.createWriteStream(this.cachePath), this.cache.once("error", (s) => {
        this.cleanup(), this.relaxedBody.unpipe(this.cache), this.relaxedBody.on("readable", () => {
          for (; this.relaxedBody.read() !== null; )
            ;
        }), this.hasErrored = !0, this.output.emit("error", s);
      }), this.cache.once("close", () => {
        this.sendSignedOutput();
      }), this.relaxedBody.removeAllListeners("readable"), this.relaxedBody.pipe(this.cache);
    }
    signStream() {
      this.parser = new b(), this.relaxedBody = new y({
        hashAlgo: this.hashAlgo
      }), this.parser.on("headers", (s) => {
        this.headers = s;
      }), this.relaxedBody.on("hash", (s) => {
        this.bodyHash = s;
      }), this.relaxedBody.on("readable", () => {
        let s;
        if (!this.cache) {
          for (; (s = this.relaxedBody.read()) !== null; )
            if (this.chunks.push(s), this.chunklen += s.length, this.chunklen >= this.cacheTreshold && this.cachePath)
              return this.createWriteCache();
        }
      }), this.relaxedBody.on("end", () => {
        this.cache || this.sendSignedOutput();
      }), this.parser.pipe(this.relaxedBody), setImmediate(() => this.input.pipe(this.parser));
    }
  }
  class l {
    constructor(s) {
      this.options = s || {}, this.keys = [].concat(
        this.options.keys || {
          domainName: s.domainName,
          keySelector: s.keySelector,
          privateKey: s.privateKey
        }
      );
    }
    sign(s, x) {
      let g = new f(), v = s, t = !1;
      Buffer.isBuffer(s) ? (t = s, v = new f()) : typeof s == "string" && (t = Buffer.from(s), v = new f());
      let i = this.options;
      x && Object.keys(x).length && (i = {}, Object.keys(this.options || {}).forEach((a) => {
        i[a] = this.options[a];
      }), Object.keys(x || {}).forEach((a) => {
        a in i || (i[a] = x[a]);
      }));
      let d = new e(i, this.keys, v, g);
      return setImmediate(() => {
        d.signStream(), t && setImmediate(() => {
          v.end(t);
        });
      }), g;
    }
  }
  return ye = l, ye;
}
var Se, dt;
function pi() {
  if (dt) return Se;
  dt = 1;
  const b = te, y = Lt, k = ee, f = F();
  function p(n, r, o, m) {
    let e = k.parse(n), l, c, s;
    l = {
      host: e.hostname,
      port: Number(e.port) ? Number(e.port) : e.protocol === "https:" ? 443 : 80
    }, e.protocol === "https:" ? (l.rejectUnauthorized = !1, c = y.connect.bind(y)) : c = b.connect.bind(b);
    let x = !1, g = (t) => {
      if (!x) {
        x = !0;
        try {
          s.destroy();
        } catch {
        }
        m(t);
      }
    }, v = () => {
      let t = new Error("Proxy socket timed out");
      t.code = "ETIMEDOUT", g(t);
    };
    s = c(l, () => {
      if (x)
        return;
      let t = {
        Host: o + ":" + r,
        Connection: "close"
      };
      e.auth && (t["Proxy-Authorization"] = "Basic " + Buffer.from(e.auth).toString("base64")), s.write(
        // HTTP method
        "CONNECT " + o + ":" + r + ` HTTP/1.1\r
` + // HTTP request headers
        Object.keys(t).map((a) => a + ": " + t[a]).join(`\r
`) + // End request
        `\r
\r
`
      );
      let i = "", d = (a) => {
        let h, u;
        if (!x && (i += a.toString("binary"), h = i.match(/\r\n\r\n/))) {
          if (s.removeListener("data", d), u = i.substr(h.index + h[0].length), i = i.substr(0, h.index), u && s.unshift(Buffer.from(u, "binary")), x = !0, h = i.match(/^HTTP\/\d+\.\d+ (\d+)/i), !h || (h[1] || "").charAt(0) !== "2") {
            try {
              s.destroy();
            } catch {
            }
            let _ = new Error("Invalid response from proxy" + (h && ": " + h[1] || ""));
            return _.code = f.EPROXY, m(_);
          }
          return s.removeListener("error", g), s.removeListener("timeout", v), s.setTimeout(0), m(null, s);
        }
      };
      s.on("data", d);
    }), s.setTimeout(p.timeout || 30 * 1e3), s.on("timeout", v), s.once("error", g);
  }
  return Se = p, Se;
}
var Te, mt;
function li() {
  if (mt) return Te;
  mt = 1;
  const b = q(), y = Fe(), k = oe();
  class f {
    constructor(n, r) {
      this.mailer = n, this.data = {}, this.message = null, r = r || {};
      let o = n.options || {}, m = n._defaults || {};
      Object.keys(r).forEach((e) => {
        this.data[e] = r[e];
      }), this.data.headers = this.data.headers || {}, Object.keys(m).forEach((e) => {
        e in this.data ? e === "headers" && Object.keys(m.headers).forEach((l) => {
          l in this.data.headers || (this.data.headers[l] = m.headers[l]);
        }) : this.data[e] = m[e];
      }), ["disableFileAccess", "disableUrlAccess", "normalizeHeaderKey"].forEach((e) => {
        e in o && (this.data[e] = o[e]);
      });
    }
    resolveContent(...n) {
      return b.resolveContent(...n);
    }
    resolveAll(n) {
      let r = [
        [this.data, "html"],
        [this.data, "text"],
        [this.data, "watchHtml"],
        [this.data, "amp"],
        [this.data, "icalEvent"]
      ];
      this.data.alternatives && this.data.alternatives.length && this.data.alternatives.forEach((s, x) => {
        r.push([this.data.alternatives, x]);
      }), this.data.attachments && this.data.attachments.length && this.data.attachments.forEach((s, x) => {
        s.filename || (s.filename = (s.path || s.href || "").split("/").pop().split("?").shift() || "attachment-" + (x + 1), s.filename.indexOf(".") < 0 && (s.filename += "." + k.detectExtension(s.contentType))), s.contentType || (s.contentType = k.detectMimeType(s.filename || s.path || s.href || "bin")), r.push([this.data.attachments, x]);
      });
      let o = new y();
      ["from", "to", "cc", "bcc", "sender", "replyTo"].forEach((s) => {
        let x;
        this.message ? x = [].concat(o._parseAddresses(this.message.getHeader(s === "replyTo" ? "reply-to" : s)) || []) : this.data[s] && (x = [].concat(o._parseAddresses(this.data[s]) || [])), x && x.length ? this.data[s] = x : s in this.data && (this.data[s] = null);
      }), ["from", "sender"].forEach((s) => {
        this.data[s] && (this.data[s] = this.data[s].shift());
      });
      let l = 0, c = () => {
        if (l >= r.length)
          return n(null, this.data);
        let s = r[l++];
        if (!s[0] || !s[0][s[1]])
          return c();
        b.resolveContent(...s, (x, g) => {
          if (x)
            return n(x);
          let v = {
            content: g
          };
          s[0][s[1]] && typeof s[0][s[1]] == "object" && !Buffer.isBuffer(s[0][s[1]]) && Object.keys(s[0][s[1]]).forEach((t) => {
            !(t in v) && !["content", "path", "href", "raw"].includes(t) && (v[t] = s[0][s[1]][t]);
          }), s[0][s[1]] = v, c();
        });
      };
      setImmediate(() => c());
    }
    normalize(n) {
      let r = this.data.envelope || this.message.getEnvelope(), o = this.message.messageId();
      this.resolveAll((m, e) => m ? n(m) : (e.envelope = r, e.messageId = o, ["html", "text", "watchHtml", "amp"].forEach((l) => {
        e[l] && e[l].content && (typeof e[l].content == "string" ? e[l] = e[l].content : Buffer.isBuffer(e[l].content) && (e[l] = e[l].content.toString()));
      }), e.icalEvent && Buffer.isBuffer(e.icalEvent.content) && (e.icalEvent.content = e.icalEvent.content.toString("base64"), e.icalEvent.encoding = "base64"), e.alternatives && e.alternatives.length && e.alternatives.forEach((l) => {
        l && l.content && Buffer.isBuffer(l.content) && (l.content = l.content.toString("base64"), l.encoding = "base64");
      }), e.attachments && e.attachments.length && e.attachments.forEach((l) => {
        l && l.content && Buffer.isBuffer(l.content) && (l.content = l.content.toString("base64"), l.encoding = "base64");
      }), e.normalizedHeaders = {}, Object.keys(e.headers || {}).forEach((l) => {
        let c = [].concat(e.headers[l] || []).shift();
        c = c && c.value || c, c && (["references", "in-reply-to", "message-id", "content-id"].includes(l) && (c = this.message._encodeHeaderValue(l, c)), e.normalizedHeaders[l] = c);
      }), e.list && typeof e.list == "object" && this._getListHeaders(e.list).forEach((c) => {
        e.normalizedHeaders[c.key] = c.value.map((s) => s && s.value || s).join(", ");
      }), e.references && (e.normalizedHeaders.references = this.message._encodeHeaderValue("references", e.references)), e.inReplyTo && (e.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", e.inReplyTo)), n(null, e)));
    }
    setMailerHeader() {
      !this.message || !this.data.xMailer || this.message.setHeader("X-Mailer", this.data.xMailer);
    }
    setPriorityHeaders() {
      if (!(!this.message || !this.data.priority))
        switch ((this.data.priority || "").toString().toLowerCase()) {
          case "high":
            this.message.setHeader("X-Priority", "1 (Highest)"), this.message.setHeader("X-MSMail-Priority", "High"), this.message.setHeader("Importance", "High");
            break;
          case "low":
            this.message.setHeader("X-Priority", "5 (Lowest)"), this.message.setHeader("X-MSMail-Priority", "Low"), this.message.setHeader("Importance", "Low");
            break;
        }
    }
    setListHeaders() {
      !this.message || !this.data.list || typeof this.data.list != "object" || this.data.list && typeof this.data.list == "object" && this._getListHeaders(this.data.list).forEach((n) => {
        n.value.forEach((r) => {
          this.message.addHeader(n.key, r);
        });
      });
    }
    _getListHeaders(n) {
      return Object.keys(n).map((r) => ({
        key: "list-" + r.toLowerCase().trim(),
        value: [].concat(n[r] || []).map((o) => ({
          prepared: !0,
          foldLines: !0,
          value: [].concat(o || []).map((m) => {
            if (typeof m == "string" && (m = {
              url: m
            }), m && m.url) {
              if (r.toLowerCase().trim() === "id") {
                let l = m.comment || "";
                return k.isPlainText(l) ? l = '"' + l + '"' : l = k.encodeWord(l), (m.comment ? l + " " : "") + this._formatListUrl(m.url).replace(/^<[^:]+\/{,2}/, "");
              }
              let e = m.comment || "";
              return k.isPlainText(e) || (e = k.encodeWord(e)), this._formatListUrl(m.url) + (m.comment ? " (" + e + ")" : "");
            }
            return "";
          }).filter((m) => m).join(", ")
        }))
      }));
    }
    _formatListUrl(n) {
      return n = n.replace(/[\s<]+|[\s>]+/g, ""), /^(https?|mailto|ftp):/.test(n) ? "<" + n + ">" : /^[^@]+@[^@]+$/.test(n) ? "<mailto:" + n + ">" : "<http://" + n + ">";
    }
  }
  return Te = f, Te;
}
var ke, ht;
function ci() {
  if (ht) return ke;
  ht = 1;
  const b = V, y = q(), k = Ot(), f = si(), p = ri(), n = pi(), r = F(), o = It, m = ee, e = D, l = li(), c = te, s = jt, x = K;
  class g extends b {
    constructor(t, i, d) {
      super(), this.options = i || {}, this._defaults = d || {}, this._defaultPlugins = {
        compile: [(...a) => this._convertDataImages(...a)],
        stream: []
      }, this._userPlugins = {
        compile: [],
        stream: []
      }, this.meta = /* @__PURE__ */ new Map(), this.dkim = this.options.dkim ? new p(this.options.dkim) : !1, this.transporter = t, this.transporter.mailer = this, this.logger = y.getLogger(this.options, {
        component: this.options.component || "mail"
      }), this.logger.debug(
        {
          tnx: "create"
        },
        "Creating transport: %s",
        this.getVersionString()
      ), typeof this.transporter.on == "function" && (this.transporter.on("log", (a) => {
        this.logger.debug(
          {
            tnx: "transport"
          },
          "%s: %s",
          a.type,
          a.message
        );
      }), this.transporter.on("error", (a) => {
        this.logger.error(
          {
            err: a,
            tnx: "transport"
          },
          "Transport Error: %s",
          a.message
        ), this.emit("error", a);
      }), this.transporter.on("idle", (...a) => {
        this.emit("idle", ...a);
      }), this.transporter.on("clear", (...a) => {
        this.emit("clear", ...a);
      })), ["close", "isIdle", "verify"].forEach((a) => {
        this[a] = (...h) => typeof this.transporter[a] == "function" ? (a === "verify" && typeof this.getSocket == "function" && (this.transporter.getSocket = this.getSocket, this.getSocket = !1), this.transporter[a](...h)) : (this.logger.warn(
          {
            tnx: "transport",
            methodName: a
          },
          "Non existing method %s called for transport",
          a
        ), !1);
      }), this.options.proxy && typeof this.options.proxy == "string" && this.setupProxy(this.options.proxy);
    }
    use(t, i) {
      return t = (t || "").toString(), this._userPlugins.hasOwnProperty(t) ? this._userPlugins[t].push(i) : this._userPlugins[t] = [i], this;
    }
    /**
     * Sends an email using the preselected transport object
     *
     * @param {Object} data E-data description
     * @param {Function?} callback Callback to run once the sending succeeded or failed
     */
    sendMail(t, i = null) {
      let d;
      i || (d = new Promise((h, u) => {
        i = y.callbackPromise(h, u);
      })), typeof this.getSocket == "function" && (this.transporter.getSocket = this.getSocket, this.getSocket = !1);
      let a = new l(this, t);
      return this.logger.debug(
        {
          tnx: "transport",
          name: this.transporter.name,
          version: this.transporter.version,
          action: "send"
        },
        "Sending mail using %s/%s",
        this.transporter.name,
        this.transporter.version
      ), this._processPlugins("compile", a, (h) => {
        if (h)
          return this.logger.error(
            {
              err: h,
              tnx: "plugin",
              action: "compile"
            },
            "PluginCompile Error: %s",
            h.message
          ), i(h);
        a.message = new f(a.data).compile(), a.setMailerHeader(), a.setPriorityHeaders(), a.setListHeaders(), this._processPlugins("stream", a, (u) => {
          if (u)
            return this.logger.error(
              {
                err: u,
                tnx: "plugin",
                action: "stream"
              },
              "PluginStream Error: %s",
              u.message
            ), i(u);
          (a.data.dkim || this.dkim) && a.message.processFunc((_) => {
            let w = a.data.dkim ? new p(a.data.dkim) : this.dkim;
            return this.logger.debug(
              {
                tnx: "DKIM",
                messageId: a.message.messageId(),
                dkimDomains: w.keys.map((E) => E.keySelector + "." + E.domainName).join(", ")
              },
              "Signing outgoing message with %s keys",
              w.keys.length
            ), w.sign(_, a.data._dkim);
          }), this.transporter.send(a, (..._) => {
            _[0] && this.logger.error(
              {
                err: _[0],
                tnx: "transport",
                action: "send"
              },
              "Send Error: %s",
              _[0].message
            ), i(..._);
          });
        });
      }), d;
    }
    getVersionString() {
      return o.format(
        "%s (%s; +%s; %s/%s)",
        e.name,
        e.version,
        e.homepage,
        this.transporter.name,
        this.transporter.version
      );
    }
    _processPlugins(t, i, d) {
      if (t = (t || "").toString(), !this._userPlugins.hasOwnProperty(t))
        return d();
      let a = this._userPlugins[t] || [], h = this._defaultPlugins[t] || [];
      if (a.length && this.logger.debug(
        {
          tnx: "transaction",
          pluginCount: a.length,
          step: t
        },
        "Using %s plugins for %s",
        a.length,
        t
      ), a.length + h.length === 0)
        return d();
      let u = 0, _ = "default", w = () => {
        let E = _ === "default" ? h : a;
        if (u >= E.length)
          if (_ === "default" && a.length)
            _ = "user", u = 0, E = a;
          else
            return d();
        let S = E[u++];
        S(i, (A) => {
          if (A)
            return d(A);
          w();
        });
      };
      w();
    }
    /**
     * Sets up proxy handler for a Nodemailer object
     *
     * @param {String} proxyUrl Proxy configuration url
     */
    setupProxy(t) {
      let i = m.parse(t);
      this.getSocket = (d, a) => {
        let h = i.protocol.replace(/:$/, "").toLowerCase();
        if (this.meta.has("proxy_handler_" + h))
          return this.meta.get("proxy_handler_" + h)(i, d, a);
        switch (h) {
          // Connect using a HTTP CONNECT method
          case "http":
          case "https":
            n(i.href, d.port, d.host, (_, w) => _ ? a(_) : a(null, {
              connection: w
            }));
            return;
          case "socks":
          case "socks5":
          case "socks4":
          case "socks4a": {
            if (!this.meta.has("proxy_socks_module")) {
              let w = new Error("Socks module not loaded");
              return w.code = r.EPROXY, a(w);
            }
            let _ = (w) => {
              let E = !!this.meta.get("proxy_socks_module").SocksClient, S = E ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module"), A = Number(i.protocol.replace(/\D/g, "")) || 5, C = {
                proxy: {
                  ipaddress: w,
                  port: Number(i.port),
                  type: A
                },
                [E ? "destination" : "target"]: {
                  host: d.host,
                  port: d.port
                },
                command: "connect"
              };
              if (i.auth) {
                let j = decodeURIComponent(i.auth.split(":").shift()), T = decodeURIComponent(i.auth.split(":").pop());
                E ? (C.proxy.userId = j, C.proxy.password = T) : A === 4 ? C.userid = j : C.authentication = {
                  username: j,
                  password: T
                };
              }
              S.createConnection(C, (j, T) => j ? a(j) : a(null, {
                connection: T.socket || T
              }));
            };
            return c.isIP(i.hostname) ? _(i.hostname) : s.resolve(i.hostname, (w, E) => {
              if (w)
                return a(w);
              _(Array.isArray(E) ? E[0] : E);
            });
          }
        }
        let u = new Error("Unknown proxy configuration");
        u.code = r.EPROXY, a(u);
      };
    }
    _convertDataImages(t, i) {
      if (!this.options.attachDataUrls && !t.data.attachDataUrls || !t.data.html)
        return i();
      t.resolveContent(t.data, "html", (d, a) => {
        if (d)
          return i(d);
        let h = 0;
        a = (a || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;]+);[^"'>\s]+)/gi, (u, _, w, E) => {
          let S = x.randomBytes(10).toString("hex") + "@localhost";
          return t.data.attachments || (t.data.attachments = []), Array.isArray(t.data.attachments) || (t.data.attachments = [].concat(t.data.attachments || [])), t.data.attachments.push({
            path: w,
            cid: S,
            filename: "image-" + ++h + "." + k.detectExtension(E)
          }), _ + "cid:" + S;
        }), t.data.html = a, i();
      });
    }
    set(t, i) {
      return this.meta.set(t, i);
    }
    get(t) {
      return this.meta.get(t);
    }
  }
  return ke = g, ke;
}
var Ae, ut;
function di() {
  if (ut) return Ae;
  ut = 1;
  const y = P.Transform;
  class k extends y {
    constructor(p) {
      super(p), this.options = p || {}, this._curLine = "", this.inByteCount = 0, this.outByteCount = 0, this.lastByte = !1;
    }
    /**
     * Escapes dots
     */
    _transform(p, n, r) {
      let o = [], m = 0, e, l, c = 0, s;
      if (!p || !p.length)
        return r();
      for (typeof p == "string" && (p = Buffer.from(p)), this.inByteCount += p.length, e = 0, l = p.length; e < l; e++)
        p[e] === 46 ? (e && p[e - 1] === 10 || !e && (!this.lastByte || this.lastByte === 10)) && (s = p.slice(c, e + 1), o.push(s), o.push(Buffer.from(".")), m += s.length + 1, c = e + 1) : p[e] === 10 && (e && p[e - 1] !== 13 || !e && this.lastByte !== 13) && (e > c ? (s = p.slice(c, e), o.push(s), m += s.length + 2) : m += 2, o.push(Buffer.from(`\r
`)), c = e + 1);
      m ? (c < p.length && (s = p.slice(c), o.push(s), m += s.length), this.outByteCount += m, this.push(Buffer.concat(o, m))) : (this.outByteCount += p.length, this.push(p)), this.lastByte = p[p.length - 1], r();
    }
    /**
     * Finalizes the stream with a dot on a single line
     */
    _flush(p) {
      let n;
      this.lastByte === 10 ? n = Buffer.from(`.\r
`) : this.lastByte === 13 ? n = Buffer.from(`
.\r
`) : n = Buffer.from(`\r
.\r
`), this.outByteCount += n.length, this.push(n), p();
    }
  }
  return Ae = k, Ae;
}
var Ce, ft;
function $e() {
  if (ft) return Ce;
  ft = 1;
  const b = D, y = V.EventEmitter, k = te, f = Lt, p = Mt, n = K, r = di(), o = P.PassThrough, m = q(), e = 120 * 1e3, l = 600 * 1e3, c = 30 * 1e3, s = 30 * 1e3, x = () => {
  };
  class g extends y {
    constructor(t) {
      super(t), this.id = n.randomBytes(8).toString("base64").replace(/\W/g, ""), this.stage = "init", this.options = t || {}, this.secureConnection = !!this.options.secure, this.alreadySecured = !!this.options.secured, this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587), this.host = this.options.host || "localhost", this.servername = this.options.servername ? this.options.servername : k.isIP(this.host) ? !1 : this.host, this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || !1, typeof this.options.secure > "u" && this.port === 465 && (this.secureConnection = !0), this.name = this.options.name || this._getHostname(), this.logger = m.getLogger(this.options, {
        component: this.options.component || "smtp-connection",
        sid: this.id
      }), this.customAuth = /* @__PURE__ */ new Map(), Object.keys(this.options.customAuth || {}).forEach((i) => {
        let d = (i || "").toString().trim().toUpperCase();
        d && this.customAuth.set(d, this.options.customAuth[i]);
      }), this.version = b.version, this.authenticated = !1, this.destroyed = !1, this.secure = !!this.secureConnection, this._remainder = "", this._responseQueue = [], this.lastServerResponse = !1, this._socket = !1, this._supportedAuth = [], this.allowsAuth = !1, this._envelope = !1, this._supportedExtensions = [], this._maxAllowedSize = 0, this._responseActions = [], this._recipientQueue = [], this._greetingTimeout = !1, this._connectionTimeout = !1, this._destroyed = !1, this._closing = !1, this._onSocketData = (i) => this._onData(i), this._onSocketError = (i) => this._onError(i, "ESOCKET", !1, "CONN"), this._onSocketClose = () => this._onClose(), this._onSocketEnd = () => this._onEnd(), this._onSocketTimeout = () => this._onTimeout(), this._onConnectionSocketError = (i) => this._onConnectionError(i, "ESOCKET"), this._connectionAttemptId = 0;
    }
    /**
     * Creates a connection to a SMTP server and sets up connection
     * listener
     */
    connect(t) {
      if (typeof t == "function") {
        this.once("connect", () => {
          this.logger.debug(
            {
              tnx: "smtp"
            },
            "SMTP handshake finished"
          ), t();
        });
        const d = this._isDestroyedMessage("connect");
        if (d)
          return t(this._formatError(d, "ECONNECTION", !1, "CONN"));
      }
      let i = {
        port: this.port,
        host: this.host,
        allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
        timeout: this.options.dnsTimeout || s
      };
      if (this.options.localAddress && (i.localAddress = this.options.localAddress), this.options.connection) {
        this._socket = this.options.connection, this._setupConnectionHandlers(), this.secureConnection && !this.alreadySecured ? setImmediate(
          () => this._upgradeConnection((d) => {
            if (d) {
              this._onError(new Error("Error initiating TLS - " + (d.message || d)), "ETLS", !1, "CONN");
              return;
            }
            this._onConnect();
          })
        ) : setImmediate(() => this._onConnect());
        return;
      } else return this.options.socket ? (this._socket = this.options.socket, m.resolveHostname(i, (d, a) => {
        if (d)
          return setImmediate(() => this._onError(d, "EDNS", !1, "CONN"));
        this.logger.debug(
          {
            tnx: "dns",
            source: i.host,
            resolved: a.host,
            cached: !!a.cached
          },
          "Resolved %s as %s [cache %s]",
          i.host,
          a.host,
          a.cached ? "hit" : "miss"
        ), Object.keys(a).forEach((h) => {
          h.charAt(0) !== "_" && a[h] && (i[h] = a[h]);
        });
        try {
          this._socket.connect(this.port, this.host, () => {
            this._socket.setKeepAlive(!0), this._onConnect();
          }), this._setupConnectionHandlers();
        } catch (h) {
          return setImmediate(() => this._onError(h, "ECONNECTION", !1, "CONN"));
        }
      })) : this.secureConnection ? (this.options.tls && Object.keys(this.options.tls).forEach((d) => {
        i[d] = this.options.tls[d];
      }), this.servername && !i.servername && (i.servername = this.servername), m.resolveHostname(i, (d, a) => {
        if (d)
          return setImmediate(() => this._onError(d, "EDNS", !1, "CONN"));
        this.logger.debug(
          {
            tnx: "dns",
            source: i.host,
            resolved: a.host,
            cached: !!a.cached
          },
          "Resolved %s as %s [cache %s]",
          i.host,
          a.host,
          a.cached ? "hit" : "miss"
        ), Object.keys(a).forEach((h) => {
          h.charAt(0) !== "_" && a[h] && (i[h] = a[h]);
        }), this._fallbackAddresses = (a._addresses || []).filter((h) => h !== i.host), this._connectOpts = Object.assign({}, i), this._connectToHost(i, !0);
      })) : m.resolveHostname(i, (d, a) => {
        if (d)
          return setImmediate(() => this._onError(d, "EDNS", !1, "CONN"));
        this.logger.debug(
          {
            tnx: "dns",
            source: i.host,
            resolved: a.host,
            cached: !!a.cached
          },
          "Resolved %s as %s [cache %s]",
          i.host,
          a.host,
          a.cached ? "hit" : "miss"
        ), Object.keys(a).forEach((h) => {
          h.charAt(0) !== "_" && a[h] && (i[h] = a[h]);
        }), this._fallbackAddresses = (a._addresses || []).filter((h) => h !== i.host), this._connectOpts = Object.assign({}, i), this._connectToHost(i, !1);
      });
    }
    /**
     * Attempts to connect to the specified host address
     *
     * @param {Object} opts Connection options
     * @param {Boolean} secure Whether to use TLS
     */
    _connectToHost(t, i) {
      this._connectionAttemptId++;
      const d = this._connectionAttemptId;
      let a = i ? f.connect : k.connect;
      try {
        this._socket = a(t, () => {
          this._connectionAttemptId === d && (this._socket.setKeepAlive(!0), this._onConnect());
        }), this._setupConnectionHandlers();
      } catch (h) {
        return setImmediate(() => this._onError(h, "ECONNECTION", !1, "CONN"));
      }
    }
    /**
     * Sets up connection timeout and error handlers
     */
    _setupConnectionHandlers() {
      this._connectionTimeout = setTimeout(() => {
        this._onConnectionError("Connection timeout", "ETIMEDOUT");
      }, this.options.connectionTimeout || e), this._socket.on("error", this._onConnectionSocketError);
    }
    /**
     * Handles connection errors with fallback to alternative addresses
     *
     * @param {Error|String} err Error object or message
     * @param {String} code Error code
     */
    _onConnectionError(t, i) {
      if (clearTimeout(this._connectionTimeout), !(this._fallbackAddresses && this._fallbackAddresses.length && this.stage === "init" && !this._destroyed)) {
        this._onError(t, i, !1, "CONN");
        return;
      }
      let a = this._fallbackAddresses.shift();
      if (this.logger.info(
        {
          tnx: "network",
          failedHost: this._connectOpts.host,
          nextHost: a,
          error: t.message || t
        },
        "Connection to %s failed, trying %s",
        this._connectOpts.host,
        a
      ), this._socket) {
        try {
          this._socket.removeListener("error", this._onConnectionSocketError), this._socket.destroy();
        } catch {
        }
        this._socket = null;
      }
      this._connectOpts.host = a, this._connectToHost(this._connectOpts, this.secureConnection);
    }
    /**
     * Sends QUIT
     */
    quit() {
      this._sendCommand("QUIT"), this._responseActions.push(this.close);
    }
    /**
     * Closes the connection to the server
     */
    close() {
      if (clearTimeout(this._connectionTimeout), clearTimeout(this._greetingTimeout), this._responseActions = [], this._closing)
        return;
      this._closing = !0;
      let t = "end";
      this.stage === "init" && (t = "destroy"), this.logger.debug(
        {
          tnx: "smtp"
        },
        'Closing connection to the server using "%s"',
        t
      );
      let i = this._socket && this._socket.socket || this._socket;
      if (i && !i.destroyed)
        try {
          i.setTimeout(0), i.removeListener("data", this._onSocketData), i.removeListener("timeout", this._onSocketTimeout), i.removeListener("close", this._onSocketClose), i.removeListener("end", this._onSocketEnd), i.removeListener("error", this._onSocketError), i.removeListener("error", this._onConnectionSocketError), i.on("error", x), i[t]();
        } catch {
        }
      this._destroy();
    }
    /**
     * Authenticate user
     */
    login(t, i) {
      const d = this._isDestroyedMessage("login");
      if (d)
        return i(this._formatError(d, "ECONNECTION", !1, "API"));
      if (this._auth = t || {}, this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || !1, !this._authMethod && this._auth.oauth2 && !this._auth.credentials ? this._authMethod = "XOAUTH2" : (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) && (this._authMethod = (this._supportedAuth[0] || "PLAIN").toUpperCase().trim()), this._authMethod !== "XOAUTH2" && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass))
        if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod))
          this._auth.credentials = {
            user: this._auth.user,
            pass: this._auth.pass,
            options: this._auth.options
          };
        else
          return i(this._formatError('Missing credentials for "' + this._authMethod + '"', "EAUTH", !1, "API"));
      if (this.customAuth.has(this._authMethod)) {
        let a = this.customAuth.get(this._authMethod), h, u = !1, _ = () => {
          u || (u = !0, this.logger.info(
            {
              tnx: "smtp",
              username: this._auth.user,
              action: "authenticated",
              method: this._authMethod
            },
            "User %s authenticated",
            JSON.stringify(this._auth.user)
          ), this.authenticated = !0, i(null, !0));
        }, w = (S) => {
          u || (u = !0, i(this._formatError(S, "EAUTH", h, "AUTH " + this._authMethod)));
        }, E = a({
          auth: this._auth,
          method: this._authMethod,
          extensions: [].concat(this._supportedExtensions),
          authMethods: [].concat(this._supportedAuth),
          maxAllowedSize: this._maxAllowedSize || !1,
          sendCommand: (S, A) => {
            let C;
            return A || (C = new Promise((j, T) => {
              A = m.callbackPromise(j, T);
            })), this._responseActions.push((j) => {
              h = j;
              let T = j.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/), I = {
                command: S,
                response: j
              };
              T ? (I.status = Number(T[1]) || 0, T[2] && (I.code = T[2]), I.text = j.substr(T[0].length)) : (I.text = j, I.status = 0), A(null, I);
            }), setImmediate(() => this._sendCommand(S)), C;
          },
          resolve: _,
          reject: w
        });
        E && typeof E.catch == "function" && E.then(_).catch(w);
        return;
      }
      switch (this._authMethod) {
        case "XOAUTH2":
          this._handleXOauth2Token(!1, i);
          return;
        case "LOGIN":
          this._responseActions.push((a) => {
            this._actionAUTH_LOGIN_USER(a, i);
          }), this._sendCommand("AUTH LOGIN");
          return;
        case "PLAIN":
          this._responseActions.push((a) => {
            this._actionAUTHComplete(a, i);
          }), this._sendCommand(
            "AUTH PLAIN " + Buffer.from(
              //this._auth.user+'\u0000'+
              "\0" + // skip authorization identity as it causes problems with some servers
              this._auth.credentials.user + "\0" + this._auth.credentials.pass,
              "utf-8"
            ).toString("base64"),
            // log entry without passwords
            "AUTH PLAIN " + Buffer.from(
              //this._auth.user+'\u0000'+
              "\0" + // skip authorization identity as it causes problems with some servers
              this._auth.credentials.user + "\0/* secret */",
              "utf-8"
            ).toString("base64")
          );
          return;
        case "CRAM-MD5":
          this._responseActions.push((a) => {
            this._actionAUTH_CRAM_MD5(a, i);
          }), this._sendCommand("AUTH CRAM-MD5");
          return;
      }
      return i(this._formatError('Unknown authentication method "' + this._authMethod + '"', "EAUTH", !1, "API"));
    }
    /**
     * Sends a message
     *
     * @param {Object} envelope Envelope object, {from: addr, to: [addr]}
     * @param {Object} message String, Buffer or a Stream
     * @param {Function} callback Callback to return once sending is completed
     */
    send(t, i, d) {
      if (!i)
        return d(this._formatError("Empty message", "EMESSAGE", !1, "API"));
      const a = this._isDestroyedMessage("send message");
      if (a)
        return d(this._formatError(a, "ECONNECTION", !1, "API"));
      if (this._maxAllowedSize && t.size > this._maxAllowedSize)
        return setImmediate(() => {
          d(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", !1, "MAIL FROM"));
        });
      let h = !1, u = function() {
        h || (h = !0, d(...arguments));
      };
      typeof i.on == "function" && i.on("error", (w) => u(this._formatError(w, "ESTREAM", !1, "API")));
      let _ = Date.now();
      this._setEnvelope(t, (w, E) => {
        if (w) {
          let C = new o();
          return typeof i.pipe == "function" ? i.pipe(C) : (C.write(i), C.end()), u(w);
        }
        let S = Date.now(), A = this._createSendStream((C, j) => C ? u(C) : (E.envelopeTime = S - _, E.messageTime = Date.now() - S, E.messageSize = A.outByteCount, E.response = j, u(null, E)));
        typeof i.pipe == "function" ? i.pipe(A) : (A.write(i), A.end());
      });
    }
    /**
     * Resets connection state
     *
     * @param {Function} callback Callback to return once connection is reset
     */
    reset(t) {
      this._sendCommand("RSET"), this._responseActions.push((i) => i.charAt(0) !== "2" ? t(this._formatError("Could not reset session state. response=" + i, "EPROTOCOL", i, "RSET")) : (this._envelope = !1, t(null, !0)));
    }
    /**
     * Connection listener that is run when the connection to
     * the server is opened
     *
     * @event
     */
    _onConnect() {
      if (clearTimeout(this._connectionTimeout), this.logger.info(
        {
          tnx: "network",
          localAddress: this._socket.localAddress,
          localPort: this._socket.localPort,
          remoteAddress: this._socket.remoteAddress,
          remotePort: this._socket.remotePort
        },
        "%s established to %s:%s",
        this.secure ? "Secure connection" : "Connection",
        this._socket.remoteAddress,
        this._socket.remotePort
      ), this._destroyed) {
        this.close();
        return;
      }
      this.stage = "connected", this._socket.removeListener("data", this._onSocketData), this._socket.removeListener("timeout", this._onSocketTimeout), this._socket.removeListener("close", this._onSocketClose), this._socket.removeListener("end", this._onSocketEnd), this._socket.removeListener("error", this._onConnectionSocketError), this._socket.on("error", this._onSocketError), this._socket.on("data", this._onSocketData), this._socket.once("close", this._onSocketClose), this._socket.once("end", this._onSocketEnd), this._socket.setTimeout(this.options.socketTimeout || l), this._socket.on("timeout", this._onSocketTimeout), this._greetingTimeout = setTimeout(() => {
        this._socket && !this._destroyed && this._responseActions[0] === this._actionGreeting && this._onError("Greeting never received", "ETIMEDOUT", !1, "CONN");
      }, this.options.greetingTimeout || c), this._responseActions.push(this._actionGreeting), this._socket.resume();
    }
    /**
     * 'data' listener for data coming from the server
     *
     * @event
     * @param {Buffer} chunk Data chunk coming from the server
     */
    _onData(t) {
      if (this._destroyed || !t || !t.length)
        return;
      let i = (t || "").toString("binary"), d = (this._remainder + i).split(/\r?\n/), a;
      this._remainder = d.pop();
      for (let h = 0, u = d.length; h < u; h++) {
        if (this._responseQueue.length && (a = this._responseQueue[this._responseQueue.length - 1], /^\d+-/.test(a.split(`
`).pop()))) {
          this._responseQueue[this._responseQueue.length - 1] += `
` + d[h];
          continue;
        }
        this._responseQueue.push(d[h]);
      }
      this._responseQueue.length && (a = this._responseQueue[this._responseQueue.length - 1], /^\d+-/.test(a.split(`
`).pop())) || this._processResponse();
    }
    /**
     * 'error' listener for the socket
     *
     * @event
     * @param {Error} err Error object
     * @param {String} type Error name
     */
    _onError(t, i, d, a) {
      if (clearTimeout(this._connectionTimeout), clearTimeout(this._greetingTimeout), this._destroyed)
        return;
      t = this._formatError(t, i, d, a), ["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(t.code) ? this.logger.warn(d, t.message) : this.logger.error(d, t.message), this.emit("error", t), this.close();
    }
    _formatError(t, i, d, a) {
      let h;
      /Error\]$/i.test(Object.prototype.toString.call(t)) ? h = t : h = new Error(t), i && i !== "Error" && (h.code = i), d && (h.response = d, h.message += ": " + d);
      let u = typeof d == "string" && Number((d.match(/^\d+/) || [])[0]) || !1;
      return u && (h.responseCode = u), a && (h.command = a), h;
    }
    /**
     * 'close' listener for the socket
     *
     * @event
     */
    _onClose() {
      let t = !1;
      if (this._remainder && this._remainder.trim() && ((this.options.debug || this.options.transactionLog) && this.logger.debug(
        {
          tnx: "server"
        },
        this._remainder.replace(/\r?\n$/, "")
      ), this.lastServerResponse = t = this._remainder.trim()), this.logger.info(
        {
          tnx: "network"
        },
        "Connection closed"
      ), this.upgrading && !this._destroyed)
        return this._onError(new Error("Connection closed unexpectedly"), "ETLS", t, "CONN");
      if (![this._actionGreeting, this.close].includes(this._responseActions[0]) && !this._destroyed)
        return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", t, "CONN");
      if (/^[45]\d{2}\b/.test(t))
        return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", t, "CONN");
      this._destroy();
    }
    /**
     * 'end' listener for the socket
     *
     * @event
     */
    _onEnd() {
      this._socket && !this._socket.destroyed && this._socket.destroy();
    }
    /**
     * 'timeout' listener for the socket
     *
     * @event
     */
    _onTimeout() {
      return this._onError(new Error("Timeout"), "ETIMEDOUT", !1, "CONN");
    }
    /**
     * Destroys the client, emits 'end'
     */
    _destroy() {
      this._destroyed || (this._destroyed = !0, this.emit("end"));
    }
    /**
     * Upgrades the connection to TLS
     *
     * @param {Function} callback Callback function to run when the connection
     *        has been secured
     */
    _upgradeConnection(t) {
      this._socket.removeListener("data", this._onSocketData), this._socket.removeListener("timeout", this._onSocketTimeout);
      let i = this._socket, d = {
        socket: this._socket,
        host: this.host
      };
      Object.keys(this.options.tls || {}).forEach((a) => {
        d[a] = this.options.tls[a];
      }), this.servername && !d.servername && (d.servername = this.servername), this.upgrading = !0;
      try {
        this._socket = f.connect(d, () => (this.secure = !0, this.upgrading = !1, this._socket.on("data", this._onSocketData), i.removeListener("close", this._onSocketClose), i.removeListener("end", this._onSocketEnd), i.removeListener("error", this._onSocketError), t(null, !0)));
      } catch (a) {
        return t(a);
      }
      this._socket.on("error", this._onSocketError), this._socket.once("close", this._onSocketClose), this._socket.once("end", this._onSocketEnd), this._socket.setTimeout(this.options.socketTimeout || l), this._socket.on("timeout", this._onSocketTimeout), i.resume();
    }
    /**
     * Processes queued responses from the server
     *
     * @param {Boolean} force If true, ignores _processing flag
     */
    _processResponse() {
      if (!this._responseQueue.length)
        return !1;
      let t = this.lastServerResponse = (this._responseQueue.shift() || "").toString();
      if (/^\d+-/.test(t.split(`
`).pop()))
        return;
      (this.options.debug || this.options.transactionLog) && this.logger.debug(
        {
          tnx: "server"
        },
        t.replace(/\r?\n$/, "")
      ), t.trim() || setImmediate(() => this._processResponse());
      let i = this._responseActions.shift();
      if (typeof i == "function")
        i.call(this, t), setImmediate(() => this._processResponse());
      else
        return this._onError(new Error("Unexpected Response"), "EPROTOCOL", t, "CONN");
    }
    /**
     * Send a command to the server, append \r\n
     *
     * @param {String} str String to be sent to the server
     * @param {String} logStr Optional string to be used for logging instead of the actual string
     */
    _sendCommand(t, i) {
      if (!this._destroyed) {
        if (this._socket.destroyed)
          return this.close();
        (this.options.debug || this.options.transactionLog) && this.logger.debug(
          {
            tnx: "client"
          },
          (i || t || "").toString().replace(/\r?\n$/, "")
        ), this._socket.write(Buffer.from(t + `\r
`, "utf-8"));
      }
    }
    /**
     * Initiates a new message by submitting envelope data, starting with
     * MAIL FROM: command
     *
     * @param {Object} envelope Envelope object in the form of
     *        {from:'...', to:['...']}
     *        or
     *        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
     */
    _setEnvelope(t, i) {
      let d = [], a = !1;
      if (this._envelope = t || {}, this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim(), this._envelope.to = [].concat(this._envelope.to || []).map((h) => (h && h.address || h || "").toString().trim()), !this._envelope.to.length)
        return i(this._formatError("No recipients defined", "EENVELOPE", !1, "API"));
      if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from))
        return i(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", !1, "API"));
      /[\x80-\uFFFF]/.test(this._envelope.from) && (a = !0);
      for (let h = 0, u = this._envelope.to.length; h < u; h++) {
        if (!this._envelope.to[h] || /[\r\n<>]/.test(this._envelope.to[h]))
          return i(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[h]), "EENVELOPE", !1, "API"));
        /[\x80-\uFFFF]/.test(this._envelope.to[h]) && (a = !0);
      }
      if (this._envelope.rcptQueue = JSON.parse(JSON.stringify(this._envelope.to || [])), this._envelope.rejected = [], this._envelope.rejectedErrors = [], this._envelope.accepted = [], this._envelope.dsn)
        try {
          this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
        } catch (h) {
          return i(this._formatError("Invalid DSN " + h.message, "EENVELOPE", !1, "API"));
        }
      if (this._responseActions.push((h) => {
        this._actionMAIL(h, i);
      }), a && this._supportedExtensions.includes("SMTPUTF8") && (d.push("SMTPUTF8"), this._usingSmtpUtf8 = !0), this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME") && (d.push("BODY=8BITMIME"), this._using8BitMime = !0), this._envelope.size && this._supportedExtensions.includes("SIZE") && d.push("SIZE=" + this._envelope.size), this._envelope.dsn && this._supportedExtensions.includes("DSN") && (this._envelope.dsn.ret && d.push("RET=" + m.encodeXText(this._envelope.dsn.ret)), this._envelope.dsn.envid && d.push("ENVID=" + m.encodeXText(this._envelope.dsn.envid))), this._envelope.requireTLSExtensionEnabled) {
        if (!this.secure)
          return i(
            this._formatError("REQUIRETLS can only be used over TLS connections (RFC 8689)", "EREQUIRETLS", !1, "MAIL FROM")
          );
        if (!this._supportedExtensions.includes("REQUIRETLS"))
          return i(
            this._formatError("Server does not support REQUIRETLS extension (RFC 8689)", "EREQUIRETLS", !1, "MAIL FROM")
          );
        d.push("REQUIRETLS");
      }
      this._sendCommand("MAIL FROM:<" + this._envelope.from + ">" + (d.length ? " " + d.join(" ") : ""));
    }
    _setDsnEnvelope(t) {
      let i = (t.ret || t.return || "").toString().toUpperCase() || null;
      if (i)
        switch (i) {
          case "HDRS":
          case "HEADERS":
            i = "HDRS";
            break;
          case "FULL":
          case "BODY":
            i = "FULL";
            break;
        }
      if (i && !["FULL", "HDRS"].includes(i))
        throw new Error("ret: " + JSON.stringify(i));
      let d = (t.envid || t.id || "").toString() || null, a = t.notify || null;
      if (a) {
        typeof a == "string" && (a = a.split(",")), a = a.map((w) => w.trim().toUpperCase());
        let u = ["NEVER", "SUCCESS", "FAILURE", "DELAY"];
        if (a.filter((w) => !u.includes(w)).length || a.length > 1 && a.includes("NEVER"))
          throw new Error("notify: " + JSON.stringify(a.join(",")));
        a = a.join(",");
      }
      let h = (t.recipient || t.orcpt || "").toString() || null;
      return h && h.indexOf(";") < 0 && (h = "rfc822;" + h), {
        ret: i,
        envid: d,
        notify: a,
        orcpt: h
      };
    }
    _getDsnRcptToArgs() {
      let t = [];
      return this._envelope.dsn && this._supportedExtensions.includes("DSN") && (this._envelope.dsn.notify && t.push("NOTIFY=" + m.encodeXText(this._envelope.dsn.notify)), this._envelope.dsn.orcpt && t.push("ORCPT=" + m.encodeXText(this._envelope.dsn.orcpt))), t.length ? " " + t.join(" ") : "";
    }
    _createSendStream(t) {
      let i = new r(), d;
      return this.options.lmtp ? this._envelope.accepted.forEach((a, h) => {
        let u = h === this._envelope.accepted.length - 1;
        this._responseActions.push((_) => {
          this._actionLMTPStream(a, u, _, t);
        });
      }) : this._responseActions.push((a) => {
        this._actionSMTPStream(a, t);
      }), i.pipe(this._socket, {
        end: !1
      }), this.options.debug && (d = new o(), d.on("readable", () => {
        let a;
        for (; a = d.read(); )
          this.logger.debug(
            {
              tnx: "message"
            },
            a.toString("binary").replace(/\r?\n$/, "")
          );
      }), i.pipe(d)), i.once("end", () => {
        this.logger.info(
          {
            tnx: "message",
            inByteCount: i.inByteCount,
            outByteCount: i.outByteCount
          },
          "<%s bytes encoded mime message (source size %s bytes)>",
          i.outByteCount,
          i.inByteCount
        );
      }), i;
    }
    /** ACTIONS **/
    /**
     * Will be run after the connection is created and the server sends
     * a greeting. If the incoming message starts with 220 initiate
     * SMTP session by sending EHLO command
     *
     * @param {String} str Message from the server
     */
    _actionGreeting(t) {
      if (clearTimeout(this._greetingTimeout), t.substr(0, 3) !== "220") {
        this._onError(new Error("Invalid greeting. response=" + t), "EPROTOCOL", t, "CONN");
        return;
      }
      this.options.lmtp ? (this._responseActions.push(this._actionLHLO), this._sendCommand("LHLO " + this.name)) : (this._responseActions.push(this._actionEHLO), this._sendCommand("EHLO " + this.name));
    }
    /**
     * Handles server response for LHLO command. If it yielded in
     * error, emit 'error', otherwise treat this as an EHLO response
     *
     * @param {String} str Message from the server
     */
    _actionLHLO(t) {
      if (t.charAt(0) !== "2") {
        this._onError(new Error("Invalid LHLO. response=" + t), "EPROTOCOL", t, "LHLO");
        return;
      }
      this._actionEHLO(t);
    }
    /**
     * Handles server response for EHLO command. If it yielded in
     * error, try HELO instead, otherwise initiate TLS negotiation
     * if STARTTLS is supported by the server or move into the
     * authentication phase.
     *
     * @param {String} str Message from the server
     */
    _actionEHLO(t) {
      let i;
      if (t.substr(0, 3) === "421") {
        this._onError(new Error("Server terminates connection. response=" + t), "ECONNECTION", t, "EHLO");
        return;
      }
      if (t.charAt(0) !== "2") {
        if (this.options.requireTLS) {
          this._onError(
            new Error("EHLO failed but HELO does not support required STARTTLS. response=" + t),
            "ECONNECTION",
            t,
            "EHLO"
          );
          return;
        }
        this._responseActions.push(this._actionHELO), this._sendCommand("HELO " + this.name);
        return;
      }
      if (this._ehloLines = t.split(/\r?\n/).map((d) => d.replace(/^\d+[ -]/, "").trim()).filter((d) => d).slice(1), !this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(t) || this.options.requireTLS)) {
        this._sendCommand("STARTTLS"), this._responseActions.push(this._actionSTARTTLS);
        return;
      }
      /[ -]SMTPUTF8\b/im.test(t) && this._supportedExtensions.push("SMTPUTF8"), /[ -]DSN\b/im.test(t) && this._supportedExtensions.push("DSN"), /[ -]8BITMIME\b/im.test(t) && this._supportedExtensions.push("8BITMIME"), /[ -]REQUIRETLS\b/im.test(t) && this._supportedExtensions.push("REQUIRETLS"), /[ -]PIPELINING\b/im.test(t) && this._supportedExtensions.push("PIPELINING"), /[ -]AUTH\b/i.test(t) && (this.allowsAuth = !0), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)PLAIN/i.test(t) && this._supportedAuth.push("PLAIN"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)LOGIN/i.test(t) && this._supportedAuth.push("LOGIN"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)CRAM-MD5/i.test(t) && this._supportedAuth.push("CRAM-MD5"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)XOAUTH2/i.test(t) && this._supportedAuth.push("XOAUTH2"), (i = t.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) && (this._supportedExtensions.push("SIZE"), this._maxAllowedSize = Number(i[1]) || 0), this.emit("connect");
    }
    /**
     * Handles server response for HELO command. If it yielded in
     * error, emit 'error', otherwise move into the authentication phase.
     *
     * @param {String} str Message from the server
     */
    _actionHELO(t) {
      if (t.charAt(0) !== "2") {
        this._onError(new Error("Invalid HELO. response=" + t), "EPROTOCOL", t, "HELO");
        return;
      }
      this.allowsAuth = !0, this.emit("connect");
    }
    /**
     * Handles server response for STARTTLS command. If there's an error
     * try HELO instead, otherwise initiate TLS upgrade. If the upgrade
     * succeedes restart the EHLO
     *
     * @param {String} str Message from the server
     */
    _actionSTARTTLS(t) {
      if (t.charAt(0) !== "2") {
        if (this.options.opportunisticTLS)
          return this.logger.info(
            {
              tnx: "smtp"
            },
            "Failed STARTTLS upgrade, continuing unencrypted"
          ), this.emit("connect");
        this._onError(new Error("Error upgrading connection with STARTTLS"), "ETLS", t, "STARTTLS");
        return;
      }
      this._upgradeConnection((i, d) => {
        if (i) {
          this._onError(new Error("Error initiating TLS - " + (i.message || i)), "ETLS", !1, "STARTTLS");
          return;
        }
        this.logger.info(
          {
            tnx: "smtp"
          },
          "Connection upgraded with STARTTLS"
        ), d ? this.options.lmtp ? (this._responseActions.push(this._actionLHLO), this._sendCommand("LHLO " + this.name)) : (this._responseActions.push(this._actionEHLO), this._sendCommand("EHLO " + this.name)) : this.emit("connect");
      });
    }
    /**
     * Handle the response for AUTH LOGIN command. We are expecting
     * '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
     * response needs to be base64 encoded username. We do not need
     * exact match but settle with 334 response in general as some
     * hosts invalidly use a longer message than VXNlcm5hbWU6
     *
     * @param {String} str Message from the server
     */
    _actionAUTH_LOGIN_USER(t, i) {
      if (!/^334[ -]/.test(t)) {
        i(this._formatError('Invalid login sequence while waiting for "334 VXNlcm5hbWU6"', "EAUTH", t, "AUTH LOGIN"));
        return;
      }
      this._responseActions.push((d) => {
        this._actionAUTH_LOGIN_PASS(d, i);
      }), this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
    }
    /**
     * Handle the response for AUTH CRAM-MD5 command. We are expecting
     * '334 <challenge string>'. Data to be sent as response needs to be
     * base64 decoded challenge string, MD5 hashed using the password as
     * a HMAC key, prefixed by the username and a space, and finally all
     * base64 encoded again.
     *
     * @param {String} str Message from the server
     */
    _actionAUTH_CRAM_MD5(t, i) {
      let d = t.match(/^334\s+(.+)$/), a = "";
      if (d)
        a = d[1];
      else
        return i(
          this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", t, "AUTH CRAM-MD5")
        );
      let h = Buffer.from(a, "base64").toString("ascii"), u = n.createHmac("md5", this._auth.credentials.pass);
      u.update(h);
      let _ = this._auth.credentials.user + " " + u.digest("hex");
      this._responseActions.push((w) => {
        this._actionAUTH_CRAM_MD5_PASS(w, i);
      }), this._sendCommand(
        Buffer.from(_).toString("base64"),
        // hidden hash for logs
        Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64")
      );
    }
    /**
     * Handles the response to CRAM-MD5 authentication, if there's no error,
     * the user can be considered logged in. Start waiting for a message to send
     *
     * @param {String} str Message from the server
     */
    _actionAUTH_CRAM_MD5_PASS(t, i) {
      if (!t.match(/^235\s+/))
        return i(this._formatError('Invalid login sequence while waiting for "235"', "EAUTH", t, "AUTH CRAM-MD5"));
      this.logger.info(
        {
          tnx: "smtp",
          username: this._auth.user,
          action: "authenticated",
          method: this._authMethod
        },
        "User %s authenticated",
        JSON.stringify(this._auth.user)
      ), this.authenticated = !0, i(null, !0);
    }
    /**
     * Handle the response for AUTH LOGIN command. We are expecting
     * '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
     * response needs to be base64 encoded password.
     *
     * @param {String} str Message from the server
     */
    _actionAUTH_LOGIN_PASS(t, i) {
      if (!/^334[ -]/.test(t))
        return i(this._formatError('Invalid login sequence while waiting for "334 UGFzc3dvcmQ6"', "EAUTH", t, "AUTH LOGIN"));
      this._responseActions.push((d) => {
        this._actionAUTHComplete(d, i);
      }), this._sendCommand(
        Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"),
        // Hidden pass for logs
        Buffer.from("/* secret */", "utf-8").toString("base64")
      );
    }
    /**
     * Handles the response for authentication, if there's no error,
     * the user can be considered logged in. Start waiting for a message to send
     *
     * @param {String} str Message from the server
     */
    _actionAUTHComplete(t, i, d) {
      if (!d && typeof i == "function" && (d = i, i = !1), t.substr(0, 3) === "334") {
        this._responseActions.push((a) => {
          i || this._authMethod !== "XOAUTH2" ? this._actionAUTHComplete(a, !0, d) : setImmediate(() => this._handleXOauth2Token(!0, d));
        }), this._sendCommand("");
        return;
      }
      if (t.charAt(0) !== "2")
        return this.logger.info(
          {
            tnx: "smtp",
            username: this._auth.user,
            action: "authfail",
            method: this._authMethod
          },
          "User %s failed to authenticate",
          JSON.stringify(this._auth.user)
        ), d(this._formatError("Invalid login", "EAUTH", t, "AUTH " + this._authMethod));
      this.logger.info(
        {
          tnx: "smtp",
          username: this._auth.user,
          action: "authenticated",
          method: this._authMethod
        },
        "User %s authenticated",
        JSON.stringify(this._auth.user)
      ), this.authenticated = !0, d(null, !0);
    }
    /**
     * Handle response for a MAIL FROM: command
     *
     * @param {String} str Message from the server
     */
    _actionMAIL(t, i) {
      let d, a;
      if (Number(t.charAt(0)) !== 2)
        return this._usingSmtpUtf8 && /^550 /.test(t) && /[\x80-\uFFFF]/.test(this._envelope.from) ? d = "Internationalized mailbox name not allowed" : d = "Mail command failed", i(this._formatError(d, "EENVELOPE", t, "MAIL FROM"));
      if (this._envelope.rcptQueue.length)
        if (this._recipientQueue = [], this._supportedExtensions.includes("PIPELINING"))
          for (; this._envelope.rcptQueue.length; )
            a = this._envelope.rcptQueue.shift(), this._recipientQueue.push(a), this._responseActions.push((h) => {
              this._actionRCPT(h, i);
            }), this._sendCommand("RCPT TO:<" + a + ">" + this._getDsnRcptToArgs());
        else
          a = this._envelope.rcptQueue.shift(), this._recipientQueue.push(a), this._responseActions.push((h) => {
            this._actionRCPT(h, i);
          }), this._sendCommand("RCPT TO:<" + a + ">" + this._getDsnRcptToArgs());
      else
        return i(this._formatError("Can't send mail - no recipients defined", "EENVELOPE", !1, "API"));
    }
    /**
     * Handle response for a RCPT TO: command
     *
     * @param {String} str Message from the server
     */
    _actionRCPT(t, i) {
      let d, a, h = this._recipientQueue.shift();
      if (Number(t.charAt(0)) !== 2 ? (this._usingSmtpUtf8 && /^553 /.test(t) && /[\x80-\uFFFF]/.test(h) ? d = "Internationalized mailbox name not allowed" : d = "Recipient command failed", this._envelope.rejected.push(h), a = this._formatError(d, "EENVELOPE", t, "RCPT TO"), a.recipient = h, this._envelope.rejectedErrors.push(a)) : this._envelope.accepted.push(h), !this._envelope.rcptQueue.length && !this._recipientQueue.length)
        if (this._envelope.rejected.length < this._envelope.to.length)
          this._responseActions.push((u) => {
            this._actionDATA(u, i);
          }), this._sendCommand("DATA");
        else
          return a = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", t, "RCPT TO"), a.rejected = this._envelope.rejected, a.rejectedErrors = this._envelope.rejectedErrors, i(a);
      else this._envelope.rcptQueue.length && (h = this._envelope.rcptQueue.shift(), this._recipientQueue.push(h), this._responseActions.push((u) => {
        this._actionRCPT(u, i);
      }), this._sendCommand("RCPT TO:<" + h + ">" + this._getDsnRcptToArgs()));
    }
    /**
     * Handle response for a DATA command
     *
     * @param {String} str Message from the server
     */
    _actionDATA(t, i) {
      if (!/^[23]/.test(t))
        return i(this._formatError("Data command failed", "EENVELOPE", t, "DATA"));
      let d = {
        accepted: this._envelope.accepted,
        rejected: this._envelope.rejected
      };
      this._ehloLines && this._ehloLines.length && (d.ehlo = this._ehloLines), this._envelope.rejectedErrors.length && (d.rejectedErrors = this._envelope.rejectedErrors), i(null, d);
    }
    /**
     * Handle response for a DATA stream when using SMTP
     * We expect a single response that defines if the sending succeeded or failed
     *
     * @param {String} str Message from the server
     */
    _actionSMTPStream(t, i) {
      return Number(t.charAt(0)) !== 2 ? i(this._formatError("Message failed", "EMESSAGE", t, "DATA")) : i(null, t);
    }
    /**
     * Handle response for a DATA stream
     * We expect a separate response for every recipient. All recipients can either
     * succeed or fail separately
     *
     * @param {String} recipient The recipient this response applies to
     * @param {Boolean} final Is this the final recipient?
     * @param {String} str Message from the server
     */
    _actionLMTPStream(t, i, d, a) {
      let h;
      if (Number(d.charAt(0)) !== 2) {
        h = this._formatError("Message failed for recipient " + t, "EMESSAGE", d, "DATA"), h.recipient = t, this._envelope.rejected.push(t), this._envelope.rejectedErrors.push(h);
        for (let u = 0, _ = this._envelope.accepted.length; u < _; u++)
          this._envelope.accepted[u] === t && this._envelope.accepted.splice(u, 1);
      }
      if (i)
        return a(null, d);
    }
    _handleXOauth2Token(t, i) {
      this._auth.oauth2.getToken(t, (d, a) => {
        if (d)
          return this.logger.info(
            {
              tnx: "smtp",
              username: this._auth.user,
              action: "authfail",
              method: this._authMethod
            },
            "User %s failed to authenticate",
            JSON.stringify(this._auth.user)
          ), i(this._formatError(d, "EAUTH", !1, "AUTH XOAUTH2"));
        this._responseActions.push((h) => {
          this._actionAUTHComplete(h, t, i);
        }), this._sendCommand(
          "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(a),
          //  Hidden for logs
          "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */")
        );
      });
    }
    /**
     *
     * @param {string} command
     * @private
     */
    _isDestroyedMessage(t) {
      if (this._destroyed)
        return "Cannot " + t + " - smtp connection is already destroyed.";
      if (this._socket) {
        if (this._socket.destroyed)
          return "Cannot " + t + " - smtp connection socket is already destroyed.";
        if (!this._socket.writable)
          return "Cannot " + t + " - smtp connection socket is already half-closed.";
      }
    }
    _getHostname() {
      let t;
      try {
        t = p.hostname() || "";
      } catch {
        t = "localhost";
      }
      return (!t || t.indexOf(".") < 0) && (t = "[127.0.0.1]"), t.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && (t = "[" + t + "]"), t;
    }
  }
  return Ce = g, Ce;
}
var Ie, xt;
function zt() {
  if (xt) return Ie;
  xt = 1;
  const b = P.Stream, y = ne(), k = K, f = q(), p = F();
  class n extends b {
    constructor(o, m) {
      if (super(), this.options = o || {}, o && o.serviceClient) {
        if (!o.privateKey || !o.user) {
          let l = new Error('Options "privateKey" and "user" are required for service account!');
          l.code = p.EOAUTH2, setImmediate(() => this.emit("error", l));
          return;
        }
        let e = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
        this.options.serviceRequestTimeout = e || 300;
      }
      if (this.logger = f.getLogger(
        {
          logger: m
        },
        {
          component: this.options.component || "OAuth2"
        }
      ), this.provisionCallback = typeof this.options.provisionCallback == "function" ? this.options.provisionCallback : !1, this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token", this.options.customHeaders = this.options.customHeaders || {}, this.options.customParams = this.options.customParams || {}, this.accessToken = this.options.accessToken || !1, this.options.expires && Number(this.options.expires))
        this.expires = this.options.expires;
      else {
        let e = Math.max(Number(this.options.timeout) || 0, 0);
        this.expires = e && Date.now() + e * 1e3 || 0;
      }
      this.renewing = !1, this.renewalQueue = [];
    }
    /**
     * Returns or generates (if previous has expired) a XOAuth2 token
     *
     * @param {Boolean} renew If false then use cached access token (if available)
     * @param {Function} callback Callback function with error object and token string
     */
    getToken(o, m) {
      if (!o && this.accessToken && (!this.expires || this.expires > Date.now()))
        return this.logger.debug(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "reuse"
          },
          "Reusing existing access token for %s",
          this.options.user
        ), m(null, this.accessToken);
      if (!this.provisionCallback && !this.options.refreshToken && !this.options.serviceClient) {
        if (this.accessToken)
          return this.logger.debug(
            {
              tnx: "OAUTH2",
              user: this.options.user,
              action: "reuse"
            },
            "Reusing existing access token (no refresh capability) for %s",
            this.options.user
          ), m(null, this.accessToken);
        this.logger.error(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "renew"
          },
          "Cannot renew access token for %s: No refresh mechanism available",
          this.options.user
        );
        let l = new Error("Can't create new access token for user");
        return l.code = p.EOAUTH2, m(l);
      }
      if (this.renewing)
        return this.renewalQueue.push({ renew: o, callback: m });
      this.renewing = !0;
      const e = (l, c) => {
        this.renewalQueue.forEach((s) => s.callback(l, c)), this.renewalQueue = [], this.renewing = !1, l ? this.logger.error(
          {
            err: l,
            tnx: "OAUTH2",
            user: this.options.user,
            action: "renew"
          },
          "Failed generating new Access Token for %s",
          this.options.user
        ) : this.logger.info(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "renew"
          },
          "Generated new Access Token for %s",
          this.options.user
        ), m(l, c);
      };
      this.provisionCallback ? this.provisionCallback(this.options.user, !!o, (l, c, s) => {
        !l && c && (this.accessToken = c, this.expires = s || 0), e(l, c);
      }) : this.generateToken(e);
    }
    /**
     * Updates token values
     *
     * @param {String} accessToken New access token
     * @param {Number} timeout Access token lifetime in seconds
     *
     * Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
     */
    updateToken(o, m) {
      this.accessToken = o, m = Math.max(Number(m) || 0, 0), this.expires = m && Date.now() + m * 1e3 || 0, this.emit("token", {
        user: this.options.user,
        accessToken: o || "",
        expires: this.expires
      });
    }
    /**
     * Generates a new XOAuth2 token with the credentials provided at initialization
     *
     * @param {Function} callback Callback function with error object and token string
     */
    generateToken(o) {
      let m, e;
      if (this.options.serviceClient) {
        let l = Math.floor(Date.now() / 1e3), c = {
          iss: this.options.serviceClient,
          scope: this.options.scope || "https://mail.google.com/",
          sub: this.options.user,
          aud: this.options.accessUrl,
          iat: l,
          exp: l + this.options.serviceRequestTimeout
        }, s;
        try {
          s = this.jwtSignRS256(c);
        } catch {
          let g = new Error("Can't generate token. Check your auth options");
          return g.code = p.EOAUTH2, o(g);
        }
        m = {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: s
        }, e = {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: c
        };
      } else {
        if (!this.options.refreshToken) {
          let l = new Error("Can't create new access token for user");
          return l.code = p.EOAUTH2, o(l);
        }
        m = {
          client_id: this.options.clientId || "",
          client_secret: this.options.clientSecret || "",
          refresh_token: this.options.refreshToken,
          grant_type: "refresh_token"
        }, e = {
          client_id: this.options.clientId || "",
          client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
          refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
          grant_type: "refresh_token"
        };
      }
      Object.keys(this.options.customParams).forEach((l) => {
        m[l] = this.options.customParams[l], e[l] = this.options.customParams[l];
      }), this.logger.debug(
        {
          tnx: "OAUTH2",
          user: this.options.user,
          action: "generate"
        },
        "Requesting token using: %s",
        JSON.stringify(e)
      ), this.postRequest(this.options.accessUrl, m, this.options, (l, c) => {
        let s;
        if (l)
          return o(l);
        try {
          s = JSON.parse(c.toString());
        } catch (v) {
          return o(v);
        }
        if (!s || typeof s != "object") {
          this.logger.debug(
            {
              tnx: "OAUTH2",
              user: this.options.user,
              action: "post"
            },
            "Response: %s",
            (c || "").toString()
          );
          let v = new Error("Invalid authentication response");
          return v.code = p.EOAUTH2, o(v);
        }
        let x = {};
        if (Object.keys(s).forEach((v) => {
          v !== "access_token" ? x[v] = s[v] : x[v] = (s[v] || "").toString().substr(0, 6) + "...";
        }), this.logger.debug(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "post"
          },
          "Response: %s",
          JSON.stringify(x)
        ), s.error) {
          let v = s.error;
          s.error_description && (v += ": " + s.error_description), s.error_uri && (v += " (" + s.error_uri + ")");
          let t = new Error(v);
          return t.code = p.EOAUTH2, o(t);
        }
        if (s.access_token)
          return this.updateToken(s.access_token, s.expires_in), o(null, this.accessToken);
        let g = new Error("No access token");
        return g.code = p.EOAUTH2, o(g);
      });
    }
    /**
     * Converts an access_token and user id into a base64 encoded XOAuth2 token
     *
     * @param {String} [accessToken] Access token string
     * @return {String} Base64 encoded token for IMAP or SMTP login
     */
    buildXOAuth2Token(o) {
      let m = ["user=" + (this.options.user || ""), "auth=Bearer " + (o || this.accessToken), "", ""];
      return Buffer.from(m.join(""), "utf-8").toString("base64");
    }
    /**
     * Custom POST request handler.
     * This is only needed to keep paths short in Windows – usually this module
     * is a dependency of a dependency and if it tries to require something
     * like the request module the paths get way too long to handle for Windows.
     * As we do only a simple POST request we do not actually require complicated
     * logic support (no redirects, no nothing) anyway.
     *
     * @param {String} url Url to POST to
     * @param {String|Buffer} payload Payload to POST
     * @param {Function} callback Callback function with (err, buff)
     */
    postRequest(o, m, e, l) {
      let c = !1, s = [], x = 0, g = y(o, {
        method: "post",
        headers: e.customHeaders,
        body: m,
        allowErrorResponse: !0
      });
      g.on("readable", () => {
        let v;
        for (; (v = g.read()) !== null; )
          s.push(v), x += v.length;
      }), g.once("error", (v) => {
        if (!c)
          return c = !0, l(v);
      }), g.once("end", () => {
        if (!c)
          return c = !0, l(null, Buffer.concat(s, x));
      });
    }
    /**
     * Encodes a buffer or a string into Base64url format
     *
     * @param {Buffer|String} data The data to convert
     * @return {String} The encoded string
     */
    toBase64URL(o) {
      return typeof o == "string" && (o = Buffer.from(o)), o.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    /**
     * Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
     *
     * @param {Object} payload The payload to include in the generated token
     * @return {String} The generated and signed token
     */
    jwtSignRS256(o) {
      o = ['{"alg":"RS256","typ":"JWT"}', JSON.stringify(o)].map((e) => this.toBase64URL(e)).join(".");
      let m = k.createSign("RSA-SHA256").update(o).sign(this.options.privateKey);
      return o + "." + this.toBase64URL(m);
    }
  }
  return Ie = n, Ie;
}
var je, gt;
function mi() {
  if (gt) return je;
  gt = 1;
  const b = $e(), y = q().assign, k = zt(), f = F(), p = V;
  class n extends p {
    constructor(o) {
      if (super(), this.pool = o, this.options = o.options, this.logger = this.pool.logger, this.options.auth)
        switch ((this.options.auth.type || "").toString().toUpperCase()) {
          case "OAUTH2": {
            let m = new k(this.options.auth, this.logger);
            m.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || m.provisionCallback, this.auth = {
              type: "OAUTH2",
              user: this.options.auth.user,
              oauth2: m,
              method: "XOAUTH2"
            }, m.on("token", (e) => this.pool.mailer.emit("token", e)), m.on("error", (e) => this.emit("error", e));
            break;
          }
          default:
            if (!this.options.auth.user && !this.options.auth.pass)
              break;
            this.auth = {
              type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
              user: this.options.auth.user,
              credentials: {
                user: this.options.auth.user || "",
                pass: this.options.auth.pass,
                options: this.options.auth.options
              },
              method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || !1
            };
        }
      this._connection = !1, this._connected = !1, this.messages = 0, this.available = !0;
    }
    /**
     * Initiates a connection to the SMTP server
     *
     * @param {Function} callback Callback function to run once the connection is established or failed
     */
    connect(o) {
      this.pool.getSocket(this.options, (m, e) => {
        if (m)
          return o(m);
        let l = !1, c = this.options;
        e && e.connection && (this.logger.info(
          {
            tnx: "proxy",
            remoteAddress: e.connection.remoteAddress,
            remotePort: e.connection.remotePort,
            destHost: c.host || "",
            destPort: c.port || "",
            action: "connected"
          },
          "Using proxied socket from %s:%s to %s:%s",
          e.connection.remoteAddress,
          e.connection.remotePort,
          c.host || "",
          c.port || ""
        ), c = y(!1, c), Object.keys(e).forEach((s) => {
          c[s] = e[s];
        })), this.connection = new b(c), this.connection.once("error", (s) => {
          if (this.emit("error", s), !l)
            return l = !0, o(s);
        }), this.connection.once("end", () => {
          if (this.close(), l)
            return;
          l = !0;
          let s = setTimeout(() => {
            if (l)
              return;
            let x = new Error("Unexpected socket close");
            this.connection && this.connection._socket && this.connection._socket.upgrading && (x.code = f.ETLS), o(x);
          }, 1e3);
          try {
            s.unref();
          } catch {
          }
        }), this.connection.connect(() => {
          if (!l)
            if (this.auth && (this.connection.allowsAuth || c.forceAuth))
              this.connection.login(this.auth, (s) => {
                if (!l) {
                  if (l = !0, s)
                    return this.connection.close(), this.emit("error", s), o(s);
                  this._connected = !0, o(null, !0);
                }
              });
            else
              return l = !0, this._connected = !0, o(null, !0);
        });
      });
    }
    /**
     * Sends an e-mail to be sent using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */
    send(o, m) {
      if (!this._connected)
        return this.connect((s) => s ? m(s) : this.send(o, m));
      let e = o.message.getEnvelope(), l = o.message.messageId(), c = [].concat(e.to || []);
      c.length > 3 && c.push("...and " + c.splice(2).length + " more"), this.logger.info(
        {
          tnx: "send",
          messageId: l,
          cid: this.id
        },
        "Sending message %s using #%s to <%s>",
        l,
        this.id,
        c.join(", ")
      ), o.data.dsn && (e.dsn = o.data.dsn), o.data.requireTLSExtensionEnabled && (e.requireTLSExtensionEnabled = o.data.requireTLSExtensionEnabled), this.connection.send(e, o.message.createReadStream(), (s, x) => {
        if (this.messages++, s)
          return this.connection.close(), this.emit("error", s), m(s);
        x.envelope = {
          from: e.from,
          to: e.to
        }, x.messageId = l, setImmediate(() => {
          let g;
          this.messages >= this.options.maxMessages ? (g = new Error("Resource exhausted"), g.code = f.EMAXLIMIT, this.connection.close(), this.emit("error", g)) : this.pool._checkRateLimit(() => {
            this.available = !0, this.emit("available");
          });
        }), m(null, x);
      });
    }
    /**
     * Closes the connection
     */
    close() {
      this._connected = !1, this.auth && this.auth.oauth2 && this.auth.oauth2.removeAllListeners(), this.connection && this.connection.close(), this.emit("close");
    }
  }
  return je = n, je;
}
const hi = { description: "Alibaba Cloud Mail", domains: ["aliyun.com"], host: "smtp.aliyun.com", port: 465, secure: !0 }, ui = { description: "Alibaba Cloud Enterprise Mail", host: "smtp.qiye.aliyun.com", port: 465, secure: !0 }, fi = { description: "AOL Mail", domains: ["aol.com"], host: "smtp.aol.com", port: 587 }, xi = { description: "Aruba PEC (Italian email provider)", domains: ["aruba.it", "pec.aruba.it"], aliases: ["Aruba PEC"], host: "smtps.aruba.it", port: 465, secure: !0, authMethod: "LOGIN" }, gi = { description: "Bluewin (Swiss email provider)", host: "smtpauths.bluewin.ch", domains: ["bluewin.ch"], port: 465 }, vi = { description: "BOL Mail (Brazilian provider)", domains: ["bol.com.br"], host: "smtp.bol.com.br", port: 587, requireTLS: !0 }, wi = { description: "DebugMail (email testing service)", host: "debugmail.io", port: 25 }, _i = { description: "Disroot (privacy-focused provider)", domains: ["disroot.org"], host: "disroot.org", port: 587, secure: !1, authMethod: "LOGIN" }, bi = { description: "Dyn Email Delivery", aliases: ["Dynect"], host: "smtp.dynect.net", port: 25 }, Ei = { description: "Elastic Email", aliases: ["Elastic Email"], host: "smtp.elasticemail.com", port: 465, secure: !0 }, yi = { description: "Ethereal Email (email testing service)", aliases: ["ethereal.email"], host: "smtp.ethereal.email", port: 587 }, Si = { description: "FastMail", domains: ["fastmail.fm"], host: "smtp.fastmail.com", port: 465, secure: !0 }, Ti = { description: "Gandi Mail", aliases: ["Gandi", "Gandi Mail"], host: "mail.gandi.net", port: 587 }, ki = { description: "Gmail", aliases: ["Google Mail"], domains: ["gmail.com", "googlemail.com"], host: "smtp.gmail.com", port: 465, secure: !0 }, Ai = { description: "Gmail Workspace", aliases: ["Google Workspace Mail"], host: "smtp-relay.gmail.com", port: 465, secure: !0 }, Ci = { description: "GMX Mail", domains: ["gmx.com", "gmx.net", "gmx.de"], host: "mail.gmx.com", port: 587 }, Ii = { description: "GoDaddy Email (US)", host: "smtpout.secureserver.net", port: 25 }, ji = { description: "GoDaddy Email (Asia)", host: "smtp.asia.secureserver.net", port: 25 }, Mi = { description: "GoDaddy Email (Europe)", host: "smtp.europe.secureserver.net", port: 25 }, Li = { description: "Outlook.com / Hotmail", aliases: ["Outlook", "Outlook.com", "Hotmail.com"], domains: ["hotmail.com", "outlook.com"], host: "smtp-mail.outlook.com", port: 587 }, Oi = { description: "iCloud Mail", aliases: ["Me", "Mac"], domains: ["me.com", "mac.com"], host: "smtp.mail.me.com", port: 587 }, Ni = { description: "Infomaniak Mail (Swiss hosting provider)", host: "mail.infomaniak.com", domains: ["ik.me", "ikmail.com", "etik.com"], port: 587 }, Hi = { description: "KolabNow (secure email service)", domains: ["kolabnow.com"], aliases: ["Kolab"], host: "smtp.kolabnow.com", port: 465, secure: !0, authMethod: "LOGIN" }, qi = { description: "Loopia (Swedish hosting provider)", host: "mailcluster.loopia.se", port: 465 }, Ri = { description: "Loops", host: "smtp.loops.so", port: 587 }, zi = { description: "MailDev (local email testing)", port: 1025, ignoreTLS: !0 }, Pi = { description: "MailerSend", host: "smtp.mailersend.net", port: 587 }, Ui = { description: "Mailgun", host: "smtp.mailgun.org", port: 465, secure: !0 }, Bi = { description: "Mailjet", host: "in.mailjet.com", port: 587 }, Di = { description: "Mailosaur (email testing service)", host: "mailosaur.io", port: 25 }, Fi = { description: "Mailtrap", host: "live.smtp.mailtrap.io", port: 587 }, $i = { description: "Mandrill (by Mailchimp)", host: "smtp.mandrillapp.com", port: 587 }, Gi = { description: "Naver Mail (Korean email provider)", host: "smtp.naver.com", port: 587 }, Qi = { description: "OhMySMTP (email delivery service)", host: "smtp.ohmysmtp.com", port: 587, secure: !1 }, Wi = { description: "One.com Email", host: "send.one.com", port: 465, secure: !0 }, Ki = { description: "OpenMailBox", aliases: ["OMB", "openmailbox.org"], host: "smtp.openmailbox.org", port: 465, secure: !0 }, Vi = { description: "Microsoft 365 / Office 365", host: "smtp.office365.com", port: 587, secure: !1 }, Xi = { description: "Postmark", aliases: ["PostmarkApp"], host: "smtp.postmarkapp.com", port: 2525 }, Ji = { description: "Proton Mail", aliases: ["ProtonMail", "Proton.me", "Protonmail.com", "Protonmail.ch"], domains: ["proton.me", "protonmail.com", "pm.me", "protonmail.ch"], host: "smtp.protonmail.ch", port: 587, requireTLS: !0 }, Yi = { description: "QQ Mail", domains: ["qq.com"], host: "smtp.qq.com", port: 465, secure: !0 }, Zi = { description: "QQ Enterprise Mail", aliases: ["QQ Enterprise"], domains: ["exmail.qq.com"], host: "smtp.exmail.qq.com", port: 465, secure: !0 }, es = { description: "Resend", host: "smtp.resend.com", port: 465, secure: !0 }, ts = { description: "Runbox (Norwegian email provider)", domains: ["runbox.com"], host: "smtp.runbox.com", port: 465, secure: !0 }, is = { description: "SendCloud (Chinese email delivery)", host: "smtp.sendcloud.net", port: 2525 }, ss = { description: "SendGrid", host: "smtp.sendgrid.net", port: 587 }, as = { description: "Brevo (formerly Sendinblue)", aliases: ["Brevo"], host: "smtp-relay.brevo.com", port: 587 }, ns = { description: "SendPulse", host: "smtp-pulse.com", port: 465, secure: !0 }, os = { description: "AWS SES US East (N. Virginia)", host: "email-smtp.us-east-1.amazonaws.com", port: 465, secure: !0 }, rs = { description: "Seznam Email (Czech email provider)", aliases: ["Seznam Email"], domains: ["seznam.cz", "email.cz", "post.cz", "spoluzaci.cz"], host: "smtp.seznam.cz", port: 465, secure: !0 }, ps = { description: "SMTP2GO", host: "mail.smtp2go.com", port: 2525 }, ls = { description: "SparkPost", aliases: ["SparkPost", "SparkPost Mail"], domains: ["sparkpost.com"], host: "smtp.sparkpostmail.com", port: 587, secure: !1 }, cs = { description: "Tipimail (email delivery service)", host: "smtp.tipimail.com", port: 587 }, ds = { description: "Tutanota (Tuta Mail)", domains: ["tutanota.com", "tuta.com", "tutanota.de", "tuta.io"], host: "smtp.tutanota.com", port: 465, secure: !0 }, ms = { description: "Yahoo Mail", domains: ["yahoo.com"], host: "smtp.mail.yahoo.com", port: 465, secure: !0 }, hs = { description: "Yandex Mail", domains: ["yandex.ru"], host: "smtp.yandex.ru", port: 465, secure: !0 }, us = { description: "Zimbra Mail Server", aliases: ["Zimbra Collaboration"], host: "smtp.zimbra.com", port: 587, requireTLS: !0 }, fs = { description: "Zoho Mail", host: "smtp.zoho.com", port: 465, secure: !0, authMethod: "LOGIN" }, xs = {
  126: { description: "126 Mail (NetEase)", host: "smtp.126.com", port: 465, secure: !0 },
  163: { description: "163 Mail (NetEase)", host: "smtp.163.com", port: 465, secure: !0 },
  "1und1": { description: "1&1 Mail (German hosting provider)", host: "smtp.1und1.de", port: 465, secure: !0, authMethod: "LOGIN" },
  Aliyun: hi,
  AliyunQiye: ui,
  AOL: fi,
  Aruba: xi,
  Bluewin: gi,
  BOL: vi,
  DebugMail: wi,
  Disroot: _i,
  DynectEmail: bi,
  ElasticEmail: Ei,
  Ethereal: yi,
  FastMail: Si,
  "Feishu Mail": { description: "Feishu Mail (Lark)", aliases: ["Feishu", "FeishuMail"], domains: ["www.feishu.cn"], host: "smtp.feishu.cn", port: 465, secure: !0 },
  "Forward Email": { description: "Forward Email (email forwarding service)", aliases: ["FE", "ForwardEmail"], domains: ["forwardemail.net"], host: "smtp.forwardemail.net", port: 465, secure: !0 },
  GandiMail: Ti,
  Gmail: ki,
  GmailWorkspace: Ai,
  GMX: Ci,
  Godaddy: Ii,
  GodaddyAsia: ji,
  GodaddyEurope: Mi,
  "hot.ee": { description: "Hot.ee (Estonian email provider)", host: "mail.hot.ee" },
  Hotmail: Li,
  iCloud: Oi,
  Infomaniak: Ni,
  KolabNow: Hi,
  Loopia: qi,
  Loops: Ri,
  "mail.ee": { description: "Mail.ee (Estonian email provider)", host: "smtp.mail.ee" },
  "Mail.ru": { description: "Mail.ru", host: "smtp.mail.ru", port: 465, secure: !0 },
  "Mailcatch.app": { description: "Mailcatch (email testing service)", host: "sandbox-smtp.mailcatch.app", port: 2525 },
  Maildev: zi,
  MailerSend: Pi,
  Mailgun: Ui,
  Mailjet: Bi,
  Mailosaur: Di,
  Mailtrap: Fi,
  Mandrill: $i,
  Naver: Gi,
  OhMySMTP: Qi,
  One: Wi,
  OpenMailBox: Ki,
  Outlook365: Vi,
  Postmark: Xi,
  Proton: Ji,
  "qiye.aliyun": { description: "Alibaba Mail Enterprise Edition", host: "smtp.mxhichina.com", port: "465", secure: !0 },
  QQ: Yi,
  QQex: Zi,
  Resend: es,
  Runbox: ts,
  SendCloud: is,
  SendGrid: ss,
  SendinBlue: as,
  SendPulse: ns,
  SES: os,
  "SES-AP-NORTHEAST-1": { description: "AWS SES Asia Pacific (Tokyo)", host: "email-smtp.ap-northeast-1.amazonaws.com", port: 465, secure: !0 },
  "SES-AP-NORTHEAST-2": { description: "AWS SES Asia Pacific (Seoul)", host: "email-smtp.ap-northeast-2.amazonaws.com", port: 465, secure: !0 },
  "SES-AP-NORTHEAST-3": { description: "AWS SES Asia Pacific (Osaka)", host: "email-smtp.ap-northeast-3.amazonaws.com", port: 465, secure: !0 },
  "SES-AP-SOUTH-1": { description: "AWS SES Asia Pacific (Mumbai)", host: "email-smtp.ap-south-1.amazonaws.com", port: 465, secure: !0 },
  "SES-AP-SOUTHEAST-1": { description: "AWS SES Asia Pacific (Singapore)", host: "email-smtp.ap-southeast-1.amazonaws.com", port: 465, secure: !0 },
  "SES-AP-SOUTHEAST-2": { description: "AWS SES Asia Pacific (Sydney)", host: "email-smtp.ap-southeast-2.amazonaws.com", port: 465, secure: !0 },
  "SES-CA-CENTRAL-1": { description: "AWS SES Canada (Central)", host: "email-smtp.ca-central-1.amazonaws.com", port: 465, secure: !0 },
  "SES-EU-CENTRAL-1": { description: "AWS SES Europe (Frankfurt)", host: "email-smtp.eu-central-1.amazonaws.com", port: 465, secure: !0 },
  "SES-EU-NORTH-1": { description: "AWS SES Europe (Stockholm)", host: "email-smtp.eu-north-1.amazonaws.com", port: 465, secure: !0 },
  "SES-EU-WEST-1": { description: "AWS SES Europe (Ireland)", host: "email-smtp.eu-west-1.amazonaws.com", port: 465, secure: !0 },
  "SES-EU-WEST-2": { description: "AWS SES Europe (London)", host: "email-smtp.eu-west-2.amazonaws.com", port: 465, secure: !0 },
  "SES-EU-WEST-3": { description: "AWS SES Europe (Paris)", host: "email-smtp.eu-west-3.amazonaws.com", port: 465, secure: !0 },
  "SES-SA-EAST-1": { description: "AWS SES South America (São Paulo)", host: "email-smtp.sa-east-1.amazonaws.com", port: 465, secure: !0 },
  "SES-US-EAST-1": { description: "AWS SES US East (N. Virginia)", host: "email-smtp.us-east-1.amazonaws.com", port: 465, secure: !0 },
  "SES-US-EAST-2": { description: "AWS SES US East (Ohio)", host: "email-smtp.us-east-2.amazonaws.com", port: 465, secure: !0 },
  "SES-US-GOV-EAST-1": { description: "AWS SES GovCloud (US-East)", host: "email-smtp.us-gov-east-1.amazonaws.com", port: 465, secure: !0 },
  "SES-US-GOV-WEST-1": { description: "AWS SES GovCloud (US-West)", host: "email-smtp.us-gov-west-1.amazonaws.com", port: 465, secure: !0 },
  "SES-US-WEST-1": { description: "AWS SES US West (N. California)", host: "email-smtp.us-west-1.amazonaws.com", port: 465, secure: !0 },
  "SES-US-WEST-2": { description: "AWS SES US West (Oregon)", host: "email-smtp.us-west-2.amazonaws.com", port: 465, secure: !0 },
  Seznam: rs,
  SMTP2GO: ps,
  Sparkpost: ls,
  Tipimail: cs,
  Tutanota: ds,
  Yahoo: ms,
  Yandex: hs,
  Zimbra: us,
  Zoho: fs
};
var Me, vt;
function Pt() {
  if (vt) return Me;
  vt = 1;
  const b = xs, y = {};
  Object.keys(b).forEach((p) => {
    let n = b[p];
    y[k(p)] = f(n), [].concat(n.aliases || []).forEach((r) => {
      y[k(r)] = f(n);
    }), [].concat(n.domains || []).forEach((r) => {
      y[k(r)] = f(n);
    });
  });
  function k(p) {
    return p.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
  }
  function f(p) {
    let n = ["domains", "aliases"], r = {};
    return Object.keys(p).forEach((o) => {
      n.indexOf(o) < 0 && (r[o] = p[o]);
    }), r;
  }
  return Me = function(p) {
    return p = k(p.split("@").pop()), y[p] || !1;
  }, Me;
}
var Le, wt;
function gs() {
  if (wt) return Le;
  wt = 1;
  const b = V, y = mi(), k = $e(), f = Pt(), p = q(), n = F(), r = D;
  class o extends b {
    constructor(e) {
      super(), e = e || {}, typeof e == "string" && (e = {
        url: e
      });
      let l, c = e.service;
      typeof e.getSocket == "function" && (this.getSocket = e.getSocket), e.url && (l = p.parseConnectionUrl(e.url), c = c || l.service), this.options = p.assign(
        !1,
        // create new object
        e,
        // regular options
        l,
        // url options
        c && f(c)
        // wellknown options
      ), this.options.maxConnections = this.options.maxConnections || 5, this.options.maxMessages = this.options.maxMessages || 100, this.logger = p.getLogger(this.options, {
        component: this.options.component || "smtp-pool"
      });
      let s = new k(this.options);
      this.name = "SMTP (pool)", this.version = r.version + "[client:" + s.version + "]", this._rateLimit = {
        counter: 0,
        timeout: null,
        waiting: [],
        checkpoint: !1,
        delta: Number(this.options.rateDelta) || 1e3,
        limit: Number(this.options.rateLimit) || 0
      }, this._closed = !1, this._queue = [], this._connections = [], this._connectionCounter = 0, this.idling = !0, setImmediate(() => {
        this.idling && this.emit("idle");
      });
    }
    /**
     * Placeholder function for creating proxy sockets. This method immediatelly returns
     * without a socket
     *
     * @param {Object} options Connection options
     * @param {Function} callback Callback function to run with the socket keys
     */
    getSocket(e, l) {
      return setImmediate(() => l(null, !1));
    }
    /**
     * Queues an e-mail to be sent using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */
    send(e, l) {
      return this._closed ? !1 : (this._queue.push({
        mail: e,
        requeueAttempts: 0,
        callback: l
      }), this.idling && this._queue.length >= this.options.maxConnections && (this.idling = !1), setImmediate(() => this._processMessages()), !0);
    }
    /**
     * Closes all connections in the pool. If there is a message being sent, the connection
     * is closed later
     */
    close() {
      let e, l = this._connections.length;
      if (this._closed = !0, clearTimeout(this._rateLimit.timeout), !l && !this._queue.length)
        return;
      for (let s = l - 1; s >= 0; s--)
        this._connections[s] && this._connections[s].available && (e = this._connections[s], e.close(), this.logger.info(
          {
            tnx: "connection",
            cid: e.id,
            action: "removed"
          },
          "Connection #%s removed",
          e.id
        ));
      if (l && !this._connections.length && this.logger.debug(
        {
          tnx: "connection"
        },
        "All connections removed"
      ), !this._queue.length)
        return;
      let c = () => {
        if (!this._queue.length) {
          this.logger.debug(
            {
              tnx: "connection"
            },
            "Pending queue entries cleared"
          );
          return;
        }
        let s = this._queue.shift();
        if (s && typeof s.callback == "function")
          try {
            s.callback(new Error("Connection pool was closed"));
          } catch (x) {
            this.logger.error(
              {
                err: x,
                tnx: "callback",
                cid: e.id
              },
              "Callback error for #%s: %s",
              e.id,
              x.message
            );
          }
        setImmediate(c);
      };
      setImmediate(c);
    }
    /**
     * Check the queue and available connections. If there is a message to be sent and there is
     * an available connection, then use this connection to send the mail
     */
    _processMessages() {
      let e, l, c;
      if (this._closed)
        return;
      if (!this._queue.length) {
        this.idling || (this.idling = !0, this.emit("idle"));
        return;
      }
      for (l = 0, c = this._connections.length; l < c; l++)
        if (this._connections[l].available) {
          e = this._connections[l];
          break;
        }
      if (!e && this._connections.length < this.options.maxConnections && (e = this._createConnection()), !e) {
        this.idling = !1;
        return;
      }
      !this.idling && this._queue.length < this.options.maxConnections && (this.idling = !0, this.emit("idle"));
      let s = e.queueEntry = this._queue.shift();
      s.messageId = (e.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, ""), e.available = !1, this.logger.debug(
        {
          tnx: "pool",
          cid: e.id,
          messageId: s.messageId,
          action: "assign"
        },
        "Assigned message <%s> to #%s (%s)",
        s.messageId,
        e.id,
        e.messages + 1
      ), this._rateLimit.limit && (this._rateLimit.counter++, this._rateLimit.checkpoint || (this._rateLimit.checkpoint = Date.now())), e.send(s.mail, (x, g) => {
        if (s === e.queueEntry) {
          try {
            s.callback(x, g);
          } catch (v) {
            this.logger.error(
              {
                err: v,
                tnx: "callback",
                cid: e.id
              },
              "Callback error for #%s: %s",
              e.id,
              v.message
            );
          }
          e.queueEntry = !1;
        }
      });
    }
    /**
     * Creates a new pool resource
     */
    _createConnection() {
      let e = new y(this);
      return e.id = ++this._connectionCounter, this.logger.info(
        {
          tnx: "pool",
          cid: e.id,
          action: "conection"
        },
        "Created new pool resource #%s",
        e.id
      ), e.on("available", () => {
        this.logger.debug(
          {
            tnx: "connection",
            cid: e.id,
            action: "available"
          },
          "Connection #%s became available",
          e.id
        ), this._closed ? this.close() : this._processMessages();
      }), e.once("error", (l) => {
        if (l.code !== "EMAXLIMIT" ? this.logger.warn(
          {
            err: l,
            tnx: "pool",
            cid: e.id
          },
          "Pool Error for #%s: %s",
          e.id,
          l.message
        ) : this.logger.debug(
          {
            tnx: "pool",
            cid: e.id,
            action: "maxlimit"
          },
          "Max messages limit exchausted for #%s",
          e.id
        ), e.queueEntry) {
          try {
            e.queueEntry.callback(l);
          } catch (c) {
            this.logger.error(
              {
                err: c,
                tnx: "callback",
                cid: e.id
              },
              "Callback error for #%s: %s",
              e.id,
              c.message
            );
          }
          e.queueEntry = !1;
        }
        this._removeConnection(e), this._continueProcessing();
      }), e.once("close", () => {
        this.logger.info(
          {
            tnx: "connection",
            cid: e.id,
            action: "closed"
          },
          "Connection #%s was closed",
          e.id
        ), this._removeConnection(e), e.queueEntry ? setTimeout(() => {
          e.queueEntry && (this._shouldRequeuOnConnectionClose(e.queueEntry) ? this._requeueEntryOnConnectionClose(e) : this._failDeliveryOnConnectionClose(e)), this._continueProcessing();
        }, 50) : (!this._closed && this.idling && !this._connections.length && this.emit("clear"), this._continueProcessing());
      }), this._connections.push(e), e;
    }
    _shouldRequeuOnConnectionClose(e) {
      return this.options.maxRequeues === void 0 || this.options.maxRequeues < 0 ? !0 : e.requeueAttempts < this.options.maxRequeues;
    }
    _failDeliveryOnConnectionClose(e) {
      if (e.queueEntry && e.queueEntry.callback) {
        try {
          e.queueEntry.callback(new Error("Reached maximum number of retries after connection was closed"));
        } catch (l) {
          this.logger.error(
            {
              err: l,
              tnx: "callback",
              messageId: e.queueEntry.messageId,
              cid: e.id
            },
            "Callback error for #%s: %s",
            e.id,
            l.message
          );
        }
        e.queueEntry = !1;
      }
    }
    _requeueEntryOnConnectionClose(e) {
      e.queueEntry.requeueAttempts = e.queueEntry.requeueAttempts + 1, this.logger.debug(
        {
          tnx: "pool",
          cid: e.id,
          messageId: e.queueEntry.messageId,
          action: "requeue"
        },
        "Re-queued message <%s> for #%s. Attempt: #%s",
        e.queueEntry.messageId,
        e.id,
        e.queueEntry.requeueAttempts
      ), this._queue.unshift(e.queueEntry), e.queueEntry = !1;
    }
    /**
     * Continue to process message if the pool hasn't closed
     */
    _continueProcessing() {
      this._closed ? this.close() : setTimeout(() => this._processMessages(), 100);
    }
    /**
     * Remove resource from pool
     *
     * @param {Object} connection The PoolResource to remove
     */
    _removeConnection(e) {
      let l = this._connections.indexOf(e);
      l !== -1 && this._connections.splice(l, 1);
    }
    /**
     * Checks if connections have hit current rate limit and if so, queues the availability callback
     *
     * @param {Function} callback Callback function to run once rate limiter has been cleared
     */
    _checkRateLimit(e) {
      if (!this._rateLimit.limit)
        return e();
      let l = Date.now();
      if (this._rateLimit.counter < this._rateLimit.limit)
        return e();
      if (this._rateLimit.waiting.push(e), this._rateLimit.checkpoint <= l - this._rateLimit.delta)
        return this._clearRateLimit();
      this._rateLimit.timeout || (this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (l - this._rateLimit.checkpoint)), this._rateLimit.checkpoint = l);
    }
    /**
     * Clears current rate limit limitation and runs paused callback
     */
    _clearRateLimit() {
      for (clearTimeout(this._rateLimit.timeout), this._rateLimit.timeout = null, this._rateLimit.counter = 0, this._rateLimit.checkpoint = !1; this._rateLimit.waiting.length; ) {
        let e = this._rateLimit.waiting.shift();
        setImmediate(e);
      }
    }
    /**
     * Returns true if there are free slots in the queue
     */
    isIdle() {
      return this.idling;
    }
    /**
     * Verifies SMTP configuration
     *
     * @param {Function} callback Callback function
     */
    verify(e) {
      let l;
      e || (l = new Promise((s, x) => {
        e = p.callbackPromise(s, x);
      }));
      let c = new y(this).auth;
      return this.getSocket(this.options, (s, x) => {
        if (s)
          return e(s);
        let g = this.options;
        x && x.connection && (this.logger.info(
          {
            tnx: "proxy",
            remoteAddress: x.connection.remoteAddress,
            remotePort: x.connection.remotePort,
            destHost: g.host || "",
            destPort: g.port || "",
            action: "connected"
          },
          "Using proxied socket from %s:%s to %s:%s",
          x.connection.remoteAddress,
          x.connection.remotePort,
          g.host || "",
          g.port || ""
        ), g = p.assign(!1, g), Object.keys(x).forEach((d) => {
          g[d] = x[d];
        }));
        let v = new k(g), t = !1;
        v.once("error", (d) => {
          if (!t)
            return t = !0, v.close(), e(d);
        }), v.once("end", () => {
          if (!t)
            return t = !0, e(new Error("Connection closed"));
        });
        let i = () => {
          if (!t)
            return t = !0, v.quit(), e(null, !0);
        };
        v.connect(() => {
          if (!t)
            if (c && (v.allowsAuth || g.forceAuth))
              v.login(c, (d) => {
                if (!t) {
                  if (d)
                    return t = !0, v.close(), e(d);
                  i();
                }
              });
            else if (!c && v.allowsAuth && g.forceAuth) {
              let d = new Error("Authentication info was not provided");
              return d.code = n.ENOAUTH, t = !0, v.close(), e(d);
            } else
              i();
        });
      }), l;
    }
  }
  return Le = o, Le;
}
var Oe, _t;
function vs() {
  if (_t) return Oe;
  _t = 1;
  const b = V, y = $e(), k = Pt(), f = q(), p = zt(), n = F(), r = D;
  class o extends b {
    constructor(e) {
      super(), e = e || {}, typeof e == "string" && (e = {
        url: e
      });
      let l, c = e.service;
      typeof e.getSocket == "function" && (this.getSocket = e.getSocket), e.url && (l = f.parseConnectionUrl(e.url), c = c || l.service), this.options = f.assign(
        !1,
        // create new object
        e,
        // regular options
        l,
        // url options
        c && k(c)
        // wellknown options
      ), this.logger = f.getLogger(this.options, {
        component: this.options.component || "smtp-transport"
      });
      let s = new y(this.options);
      this.name = "SMTP", this.version = r.version + "[client:" + s.version + "]", this.options.auth && (this.auth = this.getAuth({}));
    }
    /**
     * Placeholder function for creating proxy sockets. This method immediatelly returns
     * without a socket
     *
     * @param {Object} options Connection options
     * @param {Function} callback Callback function to run with the socket keys
     */
    getSocket(e, l) {
      return setImmediate(() => l(null, !1));
    }
    getAuth(e) {
      if (!e)
        return this.auth;
      let l = !1, c = {};
      if (this.options.auth && typeof this.options.auth == "object" && Object.keys(this.options.auth).forEach((s) => {
        l = !0, c[s] = this.options.auth[s];
      }), e && typeof e == "object" && Object.keys(e).forEach((s) => {
        l = !0, c[s] = e[s];
      }), !l)
        return !1;
      switch ((c.type || "").toString().toUpperCase()) {
        case "OAUTH2": {
          if (!c.service && !c.user)
            return !1;
          let s = new p(c, this.logger);
          return s.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || s.provisionCallback, s.on("token", (x) => this.mailer.emit("token", x)), s.on("error", (x) => this.emit("error", x)), {
            type: "OAUTH2",
            user: c.user,
            oauth2: s,
            method: "XOAUTH2"
          };
        }
        default:
          return {
            type: (c.type || "").toString().toUpperCase() || "LOGIN",
            user: c.user,
            credentials: {
              user: c.user || "",
              pass: c.pass,
              options: c.options
            },
            method: (c.method || "").trim().toUpperCase() || this.options.authMethod || !1
          };
      }
    }
    /**
     * Sends an e-mail using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */
    send(e, l) {
      this.getSocket(this.options, (c, s) => {
        if (c)
          return l(c);
        let x = !1, g = this.options;
        s && s.connection && (this.logger.info(
          {
            tnx: "proxy",
            remoteAddress: s.connection.remoteAddress,
            remotePort: s.connection.remotePort,
            destHost: g.host || "",
            destPort: g.port || "",
            action: "connected"
          },
          "Using proxied socket from %s:%s to %s:%s",
          s.connection.remoteAddress,
          s.connection.remotePort,
          g.host || "",
          g.port || ""
        ), g = f.assign(!1, g), Object.keys(s).forEach((i) => {
          g[i] = s[i];
        }));
        let v = new y(g);
        v.once("error", (i) => {
          if (!x)
            return x = !0, v.close(), l(i);
        }), v.once("end", () => {
          if (x)
            return;
          let i = setTimeout(() => {
            if (x)
              return;
            x = !0;
            let d = new Error("Unexpected socket close");
            v && v._socket && v._socket.upgrading && (d.code = n.ETLS), l(d);
          }, 1e3);
          try {
            i.unref();
          } catch {
          }
        });
        let t = () => {
          let i = e.message.getEnvelope(), d = e.message.messageId(), a = [].concat(i.to || []);
          a.length > 3 && a.push("...and " + a.splice(2).length + " more"), e.data.dsn && (i.dsn = e.data.dsn), e.data.requireTLSExtensionEnabled && (i.requireTLSExtensionEnabled = e.data.requireTLSExtensionEnabled), this.logger.info(
            {
              tnx: "send",
              messageId: d
            },
            "Sending message %s to <%s>",
            d,
            a.join(", ")
          ), v.send(i, e.message.createReadStream(), (h, u) => {
            if (x = !0, v.close(), h)
              return this.logger.error(
                {
                  err: h,
                  tnx: "send"
                },
                "Send error for %s: %s",
                d,
                h.message
              ), l(h);
            u.envelope = {
              from: i.from,
              to: i.to
            }, u.messageId = d;
            try {
              return l(null, u);
            } catch (_) {
              this.logger.error(
                {
                  err: _,
                  tnx: "callback"
                },
                "Callback error for %s: %s",
                d,
                _.message
              );
            }
          });
        };
        v.connect(() => {
          if (x)
            return;
          let i = this.getAuth(e.data.auth);
          i && (v.allowsAuth || g.forceAuth) ? v.login(i, (d) => {
            if (i && i !== this.auth && i.oauth2 && i.oauth2.removeAllListeners(), !x) {
              if (d)
                return x = !0, v.close(), l(d);
              t();
            }
          }) : t();
        });
      });
    }
    /**
     * Verifies SMTP configuration
     *
     * @param {Function} callback Callback function
     */
    verify(e) {
      let l;
      return e || (l = new Promise((c, s) => {
        e = f.callbackPromise(c, s);
      })), this.getSocket(this.options, (c, s) => {
        if (c)
          return e(c);
        let x = this.options;
        s && s.connection && (this.logger.info(
          {
            tnx: "proxy",
            remoteAddress: s.connection.remoteAddress,
            remotePort: s.connection.remotePort,
            destHost: x.host || "",
            destPort: x.port || "",
            action: "connected"
          },
          "Using proxied socket from %s:%s to %s:%s",
          s.connection.remoteAddress,
          s.connection.remotePort,
          x.host || "",
          x.port || ""
        ), x = f.assign(!1, x), Object.keys(s).forEach((i) => {
          x[i] = s[i];
        }));
        let g = new y(x), v = !1;
        g.once("error", (i) => {
          if (!v)
            return v = !0, g.close(), e(i);
        }), g.once("end", () => {
          if (!v)
            return v = !0, e(new Error("Connection closed"));
        });
        let t = () => {
          if (!v)
            return v = !0, g.quit(), e(null, !0);
        };
        g.connect(() => {
          if (v)
            return;
          let i = this.getAuth({});
          if (i && (g.allowsAuth || x.forceAuth))
            g.login(i, (d) => {
              if (!v) {
                if (d)
                  return v = !0, g.close(), e(d);
                t();
              }
            });
          else if (!i && g.allowsAuth && x.forceAuth) {
            let d = new Error("Authentication info was not provided");
            return d.code = n.ENOAUTH, v = !0, g.close(), e(d);
          } else
            t();
        });
      }), l;
    }
    /**
     * Releases resources
     */
    close() {
      this.auth && this.auth.oauth2 && this.auth.oauth2.removeAllListeners(), this.emit("close");
    }
  }
  return Oe = o, Oe;
}
var Ne, bt;
function ws() {
  if (bt) return Ne;
  bt = 1;
  const b = Kt.spawn, y = D, k = q(), f = F();
  class p {
    constructor(r) {
      r = r || {}, this._spawn = b, this.options = r || {}, this.name = "Sendmail", this.version = y.version, this.path = "sendmail", this.args = !1, this.winbreak = !1, this.logger = k.getLogger(this.options, {
        component: this.options.component || "sendmail"
      }), r && (typeof r == "string" ? this.path = r : typeof r == "object" && (r.path && (this.path = r.path), Array.isArray(r.args) && (this.args = r.args), this.winbreak = ["win", "windows", "dos", `\r
`].includes((r.newline || "").toString().toLowerCase())));
    }
    /**
     * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */
    send(r, o) {
      r.message.keepBcc = !0;
      let m = r.data.envelope || r.message.getEnvelope(), e = r.message.messageId(), l, c, s;
      if ([].concat(m.from || []).concat(m.to || []).some((v) => /^-/.test(v))) {
        let v = new Error("Can not send mail. Invalid envelope addresses.");
        return v.code = f.ESENDMAIL, o(v);
      }
      this.args ? l = ["-i"].concat(this.args).concat(m.to) : l = ["-i"].concat(m.from ? ["-f", m.from] : []).concat(m.to);
      let g = (v) => {
        if (!s && (s = !0, typeof o == "function"))
          return v ? o(v) : o(null, {
            envelope: r.data.envelope || r.message.getEnvelope(),
            messageId: e,
            response: "Messages queued for delivery"
          });
      };
      try {
        c = this._spawn(this.path, l);
      } catch (v) {
        return this.logger.error(
          {
            err: v,
            tnx: "spawn",
            messageId: e
          },
          "Error occurred while spawning sendmail. %s",
          v.message
        ), g(v);
      }
      if (c) {
        c.on("error", (i) => {
          this.logger.error(
            {
              err: i,
              tnx: "spawn",
              messageId: e
            },
            "Error occurred when sending message %s. %s",
            e,
            i.message
          ), g(i);
        }), c.once("exit", (i) => {
          if (!i)
            return g();
          let d;
          i === 127 ? d = new Error("Sendmail command not found, process exited with code " + i) : d = new Error("Sendmail exited with code " + i), d.code = f.ESENDMAIL, this.logger.error(
            {
              err: d,
              tnx: "stdin",
              messageId: e
            },
            "Error sending message %s to sendmail. %s",
            e,
            d.message
          ), g(d);
        }), c.once("close", g), c.stdin.on("error", (i) => {
          this.logger.error(
            {
              err: i,
              tnx: "stdin",
              messageId: e
            },
            "Error occurred when piping message %s to sendmail. %s",
            e,
            i.message
          ), g(i);
        });
        let v = [].concat(m.to || []);
        v.length > 3 && v.push("...and " + v.splice(2).length + " more"), this.logger.info(
          {
            tnx: "send",
            messageId: e
          },
          "Sending message %s to <%s>",
          e,
          v.join(", ")
        );
        let t = r.message.createReadStream();
        t.once("error", (i) => {
          this.logger.error(
            {
              err: i,
              tnx: "stdin",
              messageId: e
            },
            "Error occurred when generating message %s. %s",
            e,
            i.message
          ), c.kill("SIGINT"), g(i);
        }), t.pipe(c.stdin);
      } else {
        let v = new Error("sendmail was not found");
        return v.code = f.ESENDMAIL, g(v);
      }
    }
  }
  return Ne = p, Ne;
}
var He, Et;
function _s() {
  if (Et) return He;
  Et = 1;
  const b = D, y = q();
  class k {
    constructor(p) {
      p = p || {}, this.options = p || {}, this.name = "StreamTransport", this.version = b.version, this.logger = y.getLogger(this.options, {
        component: this.options.component || "stream-transport"
      }), this.winbreak = ["win", "windows", "dos", `\r
`].includes((p.newline || "").toString().toLowerCase());
    }
    /**
     * Compiles a mailcomposer message and forwards it to handler that sends it
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */
    send(p, n) {
      p.message.keepBcc = !0;
      let r = p.data.envelope || p.message.getEnvelope(), o = p.message.messageId(), m = [].concat(r.to || []);
      m.length > 3 && m.push("...and " + m.splice(2).length + " more"), this.logger.info(
        {
          tnx: "send",
          messageId: o
        },
        "Sending message %s to <%s> using %s line breaks",
        o,
        m.join(", "),
        this.winbreak ? "<CR><LF>" : "<LF>"
      ), setImmediate(() => {
        let e;
        try {
          e = p.message.createReadStream();
        } catch (s) {
          return this.logger.error(
            {
              err: s,
              tnx: "send",
              messageId: o
            },
            "Creating send stream failed for %s. %s",
            o,
            s.message
          ), n(s);
        }
        if (!this.options.buffer)
          return e.once("error", (s) => {
            this.logger.error(
              {
                err: s,
                tnx: "send",
                messageId: o
              },
              "Failed creating message for %s. %s",
              o,
              s.message
            );
          }), n(null, {
            envelope: p.data.envelope || p.message.getEnvelope(),
            messageId: o,
            message: e
          });
        let l = [], c = 0;
        e.on("readable", () => {
          let s;
          for (; (s = e.read()) !== null; )
            l.push(s), c += s.length;
        }), e.once("error", (s) => (this.logger.error(
          {
            err: s,
            tnx: "send",
            messageId: o
          },
          "Failed creating message for %s. %s",
          o,
          s.message
        ), n(s))), e.on(
          "end",
          () => n(null, {
            envelope: p.data.envelope || p.message.getEnvelope(),
            messageId: o,
            message: Buffer.concat(l, c)
          })
        );
      });
    }
  }
  return He = k, He;
}
var qe, yt;
function bs() {
  if (yt) return qe;
  yt = 1;
  const b = D, y = q();
  class k {
    constructor(p) {
      p = p || {}, this.options = p || {}, this.name = "JSONTransport", this.version = b.version, this.logger = y.getLogger(this.options, {
        component: this.options.component || "json-transport"
      });
    }
    /**
     * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */
    send(p, n) {
      p.message.keepBcc = !0;
      let r = p.data.envelope || p.message.getEnvelope(), o = p.message.messageId(), m = [].concat(r.to || []);
      m.length > 3 && m.push("...and " + m.splice(2).length + " more"), this.logger.info(
        {
          tnx: "send",
          messageId: o
        },
        "Composing JSON structure of %s to <%s>",
        o,
        m.join(", ")
      ), setImmediate(() => {
        p.normalize((e, l) => e ? (this.logger.error(
          {
            err: e,
            tnx: "send",
            messageId: o
          },
          "Failed building JSON structure for %s. %s",
          o,
          e.message
        ), n(e)) : (delete l.envelope, delete l.normalizedHeaders, n(null, {
          envelope: r,
          messageId: o,
          message: this.options.skipEncoding ? l : JSON.stringify(l)
        })));
      });
    }
  }
  return qe = k, qe;
}
var Re, St;
function Es() {
  if (St) return Re;
  St = 1;
  const b = V, y = D, k = q(), f = Rt(), p = Fe();
  class n extends b {
    constructor(o) {
      super(), o = o || {}, this.options = o || {}, this.ses = this.options.SES, this.name = "SESTransport", this.version = y.version, this.logger = k.getLogger(this.options, {
        component: this.options.component || "ses-transport"
      });
    }
    getRegion(o) {
      return this.ses.sesClient.config && typeof this.ses.sesClient.config.region == "function" ? this.ses.sesClient.config.region().then((m) => o(null, m)).catch((m) => o(m)) : o(null, !1);
    }
    /**
     * Compiles a mailcomposer message and forwards it to SES
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */
    send(o, m) {
      let e = o.message._headers.find((g) => /^from$/i.test(g.key));
      if (e) {
        let g = new p("text/plain");
        e = g._convertAddresses(g._parseAddresses(e.value));
      }
      let l = o.data.envelope || o.message.getEnvelope(), c = o.message.messageId(), s = [].concat(l.to || []);
      s.length > 3 && s.push("...and " + s.splice(2).length + " more"), this.logger.info(
        {
          tnx: "send",
          messageId: c
        },
        "Sending message %s to <%s>",
        c,
        s.join(", ")
      );
      let x = (g) => {
        o.data._dkim || (o.data._dkim = {}), o.data._dkim.skipFields && typeof o.data._dkim.skipFields == "string" ? o.data._dkim.skipFields += ":date:message-id" : o.data._dkim.skipFields = "date:message-id";
        let v = o.message.createReadStream(), t = v.pipe(new f()), i = [], d = 0;
        t.on("readable", () => {
          let a;
          for (; (a = t.read()) !== null; )
            i.push(a), d += a.length;
        }), v.once("error", (a) => t.emit("error", a)), t.once("error", (a) => {
          g(a);
        }), t.once("end", () => g(null, Buffer.concat(i, d)));
      };
      setImmediate(
        () => x((g, v) => {
          if (g)
            return this.logger.error(
              {
                err: g,
                tnx: "send",
                messageId: c
              },
              "Failed creating message for %s. %s",
              c,
              g.message
            ), m(g);
          let t = {
            Content: {
              Raw: {
                // required
                Data: v
                // required
              }
            },
            FromEmailAddress: e || l.from,
            Destination: {
              ToAddresses: l.to
            }
          };
          Object.keys(o.data.ses || {}).forEach((i) => {
            t[i] = o.data.ses[i];
          }), this.getRegion((i, d) => {
            (i || !d) && (d = "us-east-1");
            const a = new this.ses.SendEmailCommand(t);
            this.ses.sesClient.send(a).then((u) => {
              d === "us-east-1" && (d = "email"), m(null, {
                envelope: {
                  from: l.from,
                  to: l.to
                },
                messageId: "<" + u.MessageId + (/@/.test(u.MessageId) ? "" : "@" + d + ".amazonses.com") + ">",
                response: u.MessageId,
                raw: v
              });
            }).catch((u) => {
              this.logger.error(
                {
                  err: u,
                  tnx: "send"
                },
                "Send error for %s: %s",
                c,
                u.message
              ), m(u);
            });
          });
        })
      );
    }
    /**
     * Verifies SES configuration
     *
     * @param {Function} callback Callback function
     */
    verify(o) {
      let m;
      o || (m = new Promise((c, s) => {
        o = k.callbackPromise(c, s);
      }));
      const e = (c) => c && !["InvalidParameterValue", "MessageRejected"].includes(c.code || c.Code || c.name) ? o(c) : o(null, !0), l = {
        Content: {
          Raw: {
            Data: Buffer.from(`From: <invalid@invalid>\r
To: <invalid@invalid>\r
 Subject: Invalid\r
\r
Invalid`)
          }
        },
        FromEmailAddress: "invalid@invalid",
        Destination: {
          ToAddresses: ["invalid@invalid"]
        }
      };
      return this.getRegion((c, s) => {
        const x = new this.ses.SendEmailCommand(l);
        this.ses.sesClient.send(x).then((v) => e(null)).catch((v) => e(v));
      }), m;
    }
  }
  return Re = n, Re;
}
var Tt;
function ys() {
  if (Tt) return Y;
  Tt = 1;
  const b = ci(), y = q(), k = gs(), f = vs(), p = ws(), n = _s(), r = bs(), o = Es(), m = F(), e = ne(), l = D, c = (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, ""), s = (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, ""), x = (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null, g = ["true", "yes", "y", "1"].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
  let v = !1;
  return Y.createTransport = function(t, i) {
    let d, a, h;
    if (
      // provided transporter is a configuration object, not transporter plugin
      typeof t == "object" && typeof t.send != "function" || // provided transporter looks like a connection url
      typeof t == "string" && /^(smtps?|direct):/i.test(t)
    )
      if ((d = typeof t == "string" ? t : t.url) ? a = y.parseConnectionUrl(d) : a = t, a.pool)
        t = new k(a);
      else if (a.sendmail)
        t = new p(a);
      else if (a.streamTransport)
        t = new n(a);
      else if (a.jsonTransport)
        t = new r(a);
      else if (a.SES) {
        if (a.SES.ses && a.SES.aws) {
          let u = new Error(
            "Using legacy SES configuration, expecting @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/"
          );
          throw u.code = m.ECONFIG, u;
        }
        t = new o(a);
      } else
        t = new f(a);
    return h = new b(t, a, i), h;
  }, Y.createTestAccount = function(t, i) {
    let d;
    if (!i && typeof t == "function" && (i = t, t = !1), i || (d = new Promise((E, S) => {
      i = y.callbackPromise(E, S);
    })), g && v)
      return setImmediate(() => i(null, v)), d;
    t = t || c;
    let a = [], h = 0, u = {}, _ = {
      requestor: l.name,
      version: l.version
    };
    x && (u.Authorization = "Bearer " + x);
    let w = e(t + "/user", {
      contentType: "application/json",
      method: "POST",
      headers: u,
      body: Buffer.from(JSON.stringify(_))
    });
    return w.on("readable", () => {
      let E;
      for (; (E = w.read()) !== null; )
        a.push(E), h += E.length;
    }), w.once("error", (E) => i(E)), w.once("end", () => {
      let E = Buffer.concat(a, h), S, A;
      try {
        S = JSON.parse(E.toString());
      } catch (C) {
        A = C;
      }
      if (A)
        return i(A);
      if (S.status !== "success" || S.error)
        return i(new Error(S.error || "Request failed"));
      delete S.status, v = S, i(null, v);
    }), d;
  }, Y.getTestMessageUrl = function(t) {
    if (!t || !t.response)
      return !1;
    let i = /* @__PURE__ */ new Map();
    return t.response.replace(/\[([^\]]+)\]$/, (d, a) => {
      a.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (h, u, _) => {
        i.set(u, _);
      });
    }), i.has("STATUS") && i.has("MSGID") ? (v.web || s) + "/message/" + i.get("MSGID") : !1;
  }, Y;
}
var Ss = ys();
const Ts = /* @__PURE__ */ Vt(Ss), ks = Bt(import.meta.url), ze = Ut(ks), Ue = process.env.VITE_DEV_SERVER_URL !== void 0, Be = ae(Z.getPath("userData"), "window-state.json");
Ue && (process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true");
let H;
function As() {
  try {
    if (Dt(Be))
      return JSON.parse(Ft(Be, "utf-8"));
  } catch (b) {
    console.error("Failed to read window state", b);
  }
  return { width: 1400, height: 900, x: void 0, y: void 0, isMaximized: !1 };
}
function Pe() {
  if (H)
    try {
      const y = {
        ...H.getBounds(),
        isMaximized: H.isMaximized()
      };
      $t(Be, JSON.stringify(y));
    } catch (b) {
      console.error("Failed to save window state", b);
    }
}
function kt() {
  const b = As();
  H = new At({
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    minWidth: 1024,
    minHeight: 768,
    frame: !1,
    icon: ae(ze, Ue ? "../public/appIcon.ico" : "../dist/appIcon.ico"),
    backgroundColor: "#00000000",
    // Support transparency for glass feel
    webPreferences: {
      preload: ae(ze, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  }), b.isMaximized && H.maximize(), Ue ? (H.loadURL(process.env.VITE_DEV_SERVER_URL), H.webContents.openDevTools()) : H.loadFile(ae(ze, "../dist/index.html")), H.on("close", Pe), H.on("resize", Pe), H.on("move", Pe), J.on("window-minimize", () => H.minimize()), J.on("window-maximize", () => {
    H.isMaximized() ? H.restore() : H.maximize();
  }), J.on("window-close", () => H.close()), J.removeHandler("mail-send"), J.handle("mail-send", async (y, k) => {
    try {
      const f = k?.smtp || {}, p = k?.message || {}, n = Array.isArray(p.to) ? p.to : [p.to].filter(Boolean);
      if (!f.host || !f.port || !f.user || !f.pass)
        return { ok: !1, error: "SMTP configuration is incomplete." };
      if (!n.length)
        return { ok: !1, error: "Recipient email is required." };
      const r = Ts.createTransport({
        host: String(f.host),
        port: Number(f.port),
        secure: Number(f.port) === 465,
        auth: {
          user: String(f.user),
          pass: String(f.pass)
        }
      }), o = String(f.user || "").trim(), m = String(f.fromEmail || "").trim(), e = String(f.fromName || "").trim(), l = String(f.replyTo || m || "").trim(), c = o, s = e ? `"${e}" <${c}>` : c;
      return await r.sendMail({
        from: s,
        replyTo: l || void 0,
        to: n,
        subject: String(p.subject || ""),
        html: String(p.html || ""),
        text: String(p.text || "")
      }), { ok: !0 };
    } catch (f) {
      const p = String(f?.message || "Failed to send email.");
      return p.includes("550") && p.toLowerCase().includes("from address") ? {
        ok: !1,
        error: "SMTP rejected sender address. Use SMTP User as sender mailbox, or authorize the From address at your mail provider."
      } : { ok: !1, error: p };
    }
  });
}
Z.whenReady().then(() => {
  kt(), Z.on("activate", () => {
    At.getAllWindows().length === 0 && kt();
  });
});
Z.on("window-all-closed", () => {
  process.platform !== "darwin" && Z.quit();
});
