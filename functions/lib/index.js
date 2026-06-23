"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeather = exports.verifyPnvToken = exports.verifyTwoFactorOtp = exports.sendTwoFactorOtp = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const jose_1 = require("jose");
admin.initializeApp();
const openWeatherApiKey = (0, params_1.defineSecret)('OPENWEATHER_API_KEY');
const twoFactorApiKey = (0, params_1.defineSecret)('TWOFACTOR_API_KEY');
const TWO_FACTOR_BASE = 'https://2factor.in/API/V1';
function getProjectId() {
    var _a, _b;
    return (_b = (_a = process.env.GCLOUD_PROJECT) !== null && _a !== void 0 ? _a : process.env.GCP_PROJECT) !== null && _b !== void 0 ? _b : 'my-spray-ad2aa';
}
function normalizeIndianPhone(raw) {
    const digits = raw.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
        throw new https_1.HttpsError('invalid-argument', 'Enter a valid 10-digit mobile number');
    }
    return digits;
}
function toTwoFactorPhone(digits) {
    return `91${digits}`;
}
async function twoFactorRequest(path, apiKey) {
    const response = await fetch(`${TWO_FACTOR_BASE}/${apiKey}/${path}`);
    const text = await response.text();
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        throw new https_1.HttpsError('internal', text.slice(0, 200) || 'Invalid 2Factor response');
    }
}
function autogenPath(digits, channel, template) {
    const base = `${channel}/${toTwoFactorPhone(digits)}/AUTOGEN`;
    return template ? `${base}/${encodeURIComponent(template)}` : base;
}
async function ensurePhoneAuthUser(digits, options) {
    var _a, _b;
    const phoneE164 = `+91${digits}`;
    const uid = `phone_${digits}`;
    try {
        const existing = await admin.auth().getUser(uid);
        if (options.email && existing.email !== options.email) {
            await admin.auth().updateUser(uid, { email: options.email });
        }
    }
    catch (_c) {
        await admin.auth().createUser(Object.assign({ uid, phoneNumber: phoneE164 }, (options.email ? { email: options.email } : {})));
    }
    const userRef = admin.firestore().doc(`users/${uid}`);
    const snap = await userRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const defaultName = (_b = (_a = options.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) !== null && _b !== void 0 ? _b : 'Farmer';
    await userRef.set(Object.assign(Object.assign(Object.assign({ phone: digits, phoneE164 }, (options.email ? { email: options.email } : {})), { verifiedVia: options.verifiedVia, updatedAt: now }), (!snap.exists
        ? {
            name: defaultName,
            village: '',
            preferredCrops: ['pomegranate'],
            language: 'en',
            createdAt: now,
        }
        : {})), { merge: true });
    return uid;
}
async function verifyPnvJwt(pnvToken) {
    var _a;
    const projectId = getProjectId();
    const issuer = `https://firebasepnv.googleapis.com/v1beta/projects/${projectId}`;
    const jwks = (0, jose_1.createRemoteJWKSet)(new URL(`https://firebasepnv.googleapis.com/v1beta/projects/${projectId}/publicKeys`));
    const { payload } = await (0, jose_1.jwtVerify)(pnvToken, jwks, {
        issuer,
        audience: projectId,
    });
    const phone = String((_a = payload.sub) !== null && _a !== void 0 ? _a : '');
    if (!phone.startsWith('+')) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid phone in PNV token');
    }
    return phone;
}
/** Send SMS OTP via 2Factor.in (AUTOGEN). Returns session id for verify step. */
exports.sendTwoFactorOtp = (0, https_1.onCall)({ secrets: [twoFactorApiKey], region: 'asia-south1' }, async (request) => {
    var _a, _b, _c, _d, _e;
    const digits = normalizeIndianPhone(String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.phone) !== null && _b !== void 0 ? _b : ''));
    const channel = ((_c = request.data) === null || _c === void 0 ? void 0 : _c.channel) === 'VOICE' ? 'VOICE' : 'SMS';
    const template = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.template) !== null && _e !== void 0 ? _e : '').trim() || undefined;
    const apiKey = twoFactorApiKey.value();
    const result = await twoFactorRequest(autogenPath(digits, channel, template), apiKey);
    if (result.Status !== 'Success') {
        throw new https_1.HttpsError('internal', result.Details || 'Failed to send OTP');
    }
    return { sessionId: result.Details, phone: digits, channel };
});
/** Verify OTP with 2Factor.in, create Firebase user + Firestore profile, return custom token. */
exports.verifyTwoFactorOtp = (0, https_1.onCall)({ secrets: [twoFactorApiKey], region: 'asia-south1' }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const digits = normalizeIndianPhone(String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.phone) !== null && _b !== void 0 ? _b : ''));
    const sessionId = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.sessionId) !== null && _d !== void 0 ? _d : '').trim();
    const otp = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.otp) !== null && _f !== void 0 ? _f : '').trim();
    const emailRaw = String((_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.email) !== null && _h !== void 0 ? _h : '').trim();
    const email = emailRaw && emailRaw.includes('@') ? emailRaw : undefined;
    if (!sessionId || !otp) {
        throw new https_1.HttpsError('invalid-argument', 'Missing OTP session or code');
    }
    const apiKey = twoFactorApiKey.value();
    const result = await twoFactorRequest(`SMS/VERIFY/${sessionId}/${otp}`, apiKey);
    if (result.Status !== 'Success') {
        throw new https_1.HttpsError('permission-denied', result.Details || 'Invalid OTP');
    }
    const uid = await ensurePhoneAuthUser(digits, { email, verifiedVia: '2factor' });
    const token = await admin.auth().createCustomToken(uid);
    return { token, phone: digits, uid };
});
exports.verifyPnvToken = (0, https_1.onCall)({ region: 'asia-south1' }, async (request) => {
    var _a, _b;
    const pnvToken = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.pnvToken) !== null && _b !== void 0 ? _b : '');
    if (!pnvToken) {
        throw new https_1.HttpsError('invalid-argument', 'Missing pnvToken');
    }
    let phone;
    try {
        phone = await verifyPnvJwt(pnvToken);
    }
    catch (_c) {
        throw new https_1.HttpsError('permission-denied', 'Invalid PNV token');
    }
    const digits = phone.replace(/\D/g, '').slice(-10);
    const uid = await ensurePhoneAuthUser(digits, { verifiedVia: 'firebase-pnv' });
    const token = await admin.auth().createCustomToken(uid);
    return { token, phone: digits };
});
exports.getWeather = (0, https_1.onCall)({ secrets: [openWeatherApiKey], region: 'asia-south1' }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    const lat = Number((_a = request.data) === null || _a === void 0 ? void 0 : _a.lat);
    const lon = Number((_b = request.data) === null || _b === void 0 ? void 0 : _b.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid coordinates');
    }
    const apiKey = openWeatherApiKey.value();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = (await response.json());
    return {
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        rainProbability: data.clouds.all,
        windSpeed: Math.round(data.wind.speed * 3.6),
        description: (_d = (_c = data.weather[0]) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : '',
        icon: (_f = (_e = data.weather[0]) === null || _e === void 0 ? void 0 : _e.icon) !== null && _f !== void 0 ? _f : '',
        locationName: data.name,
        fetchedAt: new Date().toISOString(),
    };
});
//# sourceMappingURL=index.js.map