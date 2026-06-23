import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createRemoteJWKSet, jwtVerify } from 'jose';

admin.initializeApp();

const twoFactorApiKey = defineSecret('TWOFACTOR_API_KEY');

const TWO_FACTOR_BASE = 'https://2factor.in/API/V1';

function getProjectId(): string {
  return process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? 'my-spray-ad2aa';
}

function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new HttpsError('invalid-argument', 'Enter a valid 10-digit mobile number');
  }
  return digits;
}

function toTwoFactorPhone(digits: string): string {
  return `91${digits}`;
}

async function twoFactorRequest(path: string, apiKey: string): Promise<{ Status: string; Details: string }> {
  const response = await fetch(`${TWO_FACTOR_BASE}/${apiKey}/${path}`);
  const text = await response.text();
  try {
    return JSON.parse(text) as { Status: string; Details: string };
  } catch {
    throw new HttpsError('internal', text.slice(0, 200) || 'Invalid 2Factor response');
  }
}

function autogenPath(digits: string, channel: 'SMS' | 'VOICE', template?: string): string {
  const base = `${channel}/${toTwoFactorPhone(digits)}/AUTOGEN`;
  return template ? `${base}/${encodeURIComponent(template)}` : base;
}

async function ensurePhoneAuthUser(
  digits: string,
  options: { email?: string; verifiedVia: string },
): Promise<string> {
  const phoneE164 = `+91${digits}`;
  const uid = `phone_${digits}`;

  try {
    const existing = await admin.auth().getUser(uid);
    if (options.email && existing.email !== options.email) {
      await admin.auth().updateUser(uid, { email: options.email });
    }
  } catch {
    await admin.auth().createUser({
      uid,
      phoneNumber: phoneE164,
      ...(options.email ? { email: options.email } : {}),
    });
  }

  const userRef = admin.firestore().doc(`users/${uid}`);
  const snap = await userRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const defaultName = options.email?.split('@')[0] ?? 'Farmer';

  await userRef.set(
    {
      phone: digits,
      phoneE164,
      ...(options.email ? { email: options.email } : {}),
      verifiedVia: options.verifiedVia,
      updatedAt: now,
      ...(!snap.exists
        ? {
            name: defaultName,
            village: '',
            preferredCrops: ['pomegranate'],
            language: 'en',
            createdAt: now,
          }
        : {}),
    },
    { merge: true },
  );

  return uid;
}

async function verifyPnvJwt(pnvToken: string): Promise<string> {
  const projectId = getProjectId();
  const issuer = `https://firebasepnv.googleapis.com/v1beta/projects/${projectId}`;
  const jwks = createRemoteJWKSet(
    new URL(`https://firebasepnv.googleapis.com/v1beta/projects/${projectId}/publicKeys`),
  );

  const { payload } = await jwtVerify(pnvToken, jwks, {
    issuer,
    audience: projectId,
  });

  const phone = String(payload.sub ?? '');
  if (!phone.startsWith('+')) {
    throw new HttpsError('invalid-argument', 'Invalid phone in PNV token');
  }
  return phone;
}

/** Send SMS OTP via 2Factor.in (AUTOGEN). Returns session id for verify step. */
export const sendTwoFactorOtp = onCall(
  { secrets: [twoFactorApiKey], region: 'asia-south1' },
  async (request) => {
    const digits = normalizeIndianPhone(String(request.data?.phone ?? ''));
    const channel = request.data?.channel === 'VOICE' ? 'VOICE' : 'SMS';
    const template = String(request.data?.template ?? '').trim() || undefined;
    const apiKey = twoFactorApiKey.value();
    const result = await twoFactorRequest(autogenPath(digits, channel, template), apiKey);

    if (result.Status !== 'Success') {
      throw new HttpsError('internal', result.Details || 'Failed to send OTP');
    }

    return { sessionId: result.Details, phone: digits, channel };
  },
);

/** Verify OTP with 2Factor.in, create Firebase user + Firestore profile, return custom token. */
export const verifyTwoFactorOtp = onCall(
  { secrets: [twoFactorApiKey], region: 'asia-south1' },
  async (request) => {
    const digits = normalizeIndianPhone(String(request.data?.phone ?? ''));
    const sessionId = String(request.data?.sessionId ?? '').trim();
    const otp = String(request.data?.otp ?? '').trim();
    const emailRaw = String(request.data?.email ?? '').trim();
    const email = emailRaw && emailRaw.includes('@') ? emailRaw : undefined;

    if (!sessionId || !otp) {
      throw new HttpsError('invalid-argument', 'Missing OTP session or code');
    }

    const apiKey = twoFactorApiKey.value();
    const result = await twoFactorRequest(`SMS/VERIFY/${sessionId}/${otp}`, apiKey);

    if (result.Status !== 'Success') {
      throw new HttpsError('permission-denied', result.Details || 'Invalid OTP');
    }

    const uid = await ensurePhoneAuthUser(digits, { email, verifiedVia: '2factor' });
    const token = await admin.auth().createCustomToken(uid);

    return { token, phone: digits, uid };
  },
);

export const verifyPnvToken = onCall({ region: 'asia-south1' }, async (request) => {
  const pnvToken = String(request.data?.pnvToken ?? '');
  if (!pnvToken) {
    throw new HttpsError('invalid-argument', 'Missing pnvToken');
  }

  let phone: string;
  try {
    phone = await verifyPnvJwt(pnvToken);
  } catch {
    throw new HttpsError('permission-denied', 'Invalid PNV token');
  }

  const digits = phone.replace(/\D/g, '').slice(-10);
  const uid = await ensurePhoneAuthUser(digits, { verifiedVia: 'firebase-pnv' });
  const token = await admin.auth().createCustomToken(uid);

  return { token, phone: digits };
});

export const getWeather = onCall({ region: 'asia-south1' }, async (request) => {
  const lat = Number(request.data?.lat);
  const lon = Number(request.data?.lon);
  const language = String(request.data?.language ?? 'en');

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new HttpsError('invalid-argument', 'Invalid coordinates');
  }

  const lang = language === 'hi' || language === 'mr' ? language : 'en';

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code,is_day` +
    `&timezone=auto&forecast_days=1`;

  const geocodeUrl =
    `https://geocoding-api.open-meteo.com/v1/reverse` +
    `?latitude=${lat}&longitude=${lon}&language=${encodeURIComponent(lang)}`;

  const [weatherResponse, geocodeResponse] = await Promise.all([
    fetch(weatherUrl),
    fetch(geocodeUrl),
  ]);

  if (!weatherResponse.ok) {
    throw new HttpsError('internal', 'Open-Meteo weather request failed');
  }

  const payload = (await weatherResponse.json()) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      apparent_temperature?: number;
      precipitation_probability?: number;
      wind_speed_10m?: number;
      weather_code?: number;
      is_day?: number;
    };
  };

  const current = payload.current;
  if (!current) {
    throw new HttpsError('internal', 'Open-Meteo returned no current weather');
  }

  let locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  try {
    const geocode = (await geocodeResponse.json()) as {
      results?: Array<{ name?: string; admin1?: string }>;
    };
    const place = geocode.results?.[0];
    if (place?.name) {
      locationName =
        place.admin1 && place.admin1 !== place.name
          ? `${place.name}, ${place.admin1}`
          : place.name;
    }
  } catch {
    // keep coordinate fallback
  }

  const weatherCode = current.weather_code ?? 3;
  const isDaytime = (current.is_day ?? 1) === 1;
  const suffix = isDaytime ? 'd' : 'n';

  const iconForCode = (code: number): string => {
    if (code === 0) return `01${suffix}`;
    if (code === 1 || code === 2) return `02${suffix}`;
    if (code === 3) return `04${suffix}`;
    if (code === 45 || code === 48) return `50${suffix}`;
    if (code >= 51 && code <= 57) return `09${suffix}`;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return `10${suffix}`;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return `13${suffix}`;
    if (code >= 95) return `11${suffix}`;
    return `03${suffix}`;
  };

  const descriptionForCode = (code: number): string => {
    const map: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Fog',
      61: 'Light rain',
      63: 'Rain',
      65: 'Heavy rain',
      80: 'Rain showers',
      95: 'Thunderstorm',
    };
    return map[code] ?? 'Cloudy';
  };

  const conditionForCode = (code: number): string => {
    if (code === 0) return 'CLEAR';
    if (code === 1) return 'MOSTLY_CLEAR';
    if (code === 2) return 'PARTLY_CLOUDY';
    if (code === 3) return 'OVERCAST';
    if (code === 45 || code === 48) return 'FOG';
    if (code >= 51 && code <= 57) return 'DRIZZLE';
    if (code >= 61 && code <= 67) return 'RAIN';
    if (code >= 71 && code <= 77) return 'SNOW';
    if (code >= 80 && code <= 82) return 'RAIN_SHOWERS';
    if (code >= 85 && code <= 86) return 'SNOW';
    if (code >= 95) return 'THUNDERSTORM';
    return 'CLOUDY';
  };

  const iconCode = iconForCode(weatherCode);

  return {
    temp: Math.round(current.temperature_2m ?? 0),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    rainProbability: Math.round(current.precipitation_probability ?? 0),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    description: descriptionForCode(weatherCode),
    icon: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
    conditionType: conditionForCode(weatherCode),
    isDaytime,
    locationName,
    fetchedAt: new Date().toISOString(),
  };
});
