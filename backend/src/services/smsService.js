const https = require('https');
const http = require('http');
const { URL } = require('url');

const SMS_BASE_URL = 'https://sms.tabaarak.com';
// Credentials are read at call time (not module load time) so dotenv values are always available.

/**
 * Normalizes Somali mobile numbers to 252XXXXXXXXX format.
 */
const normalizePhone = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('252')) cleaned = '252' + cleaned;
  return cleaned;
};

/**
 * Makes an HTTP/HTTPS request and returns parsed JSON response.
 */
const makeRequest = (url, options, body = null) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'POST',
      headers: options.headers || {},
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Request failed: ${err.message}`)));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

/**
 * Authenticates with the Tabaarak SMS Gateway and returns a token.
 */
const getSmsToken = async () => {
  const SMS_USERNAME = process.env.SMS_API_USERNAME || 'sahra';
  const SMS_PASSWORD = process.env.SMS_API_PASSWORD || 'S@hr0382!!';
  console.log('[sms] Authenticating with Tabaarak SMS Gateway...');

  const bodyPayload = JSON.stringify({
    Name: SMS_USERNAME,
    Password: SMS_PASSWORD,
  });

  const response = await makeRequest(`${SMS_BASE_URL}/Auth/SMSLogin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyPayload),
    },
  }, bodyPayload);

  if (response.status !== 200) {
    throw new Error(`[sms] Authentication failed (Status ${response.status}): ${JSON.stringify(response.body)}`);
  }

  const token = response.body?.data?.token || response.body?.token || response.body?.Token;
  if (!token) {
    throw new Error(`[sms] Authentication successful but no token received: ${JSON.stringify(response.body)}`);
  }
  
  console.log(`[sms] Successfully authenticated. Token starts with: ${String(token).substring(0, 10)}...`);

  return token;
};

/**
 * Sends an SMS message to one or more mobile numbers.
 * Numbers are automatically normalised to Somali international format (252XXXXXXXXX).
 * @param {string} message - The SMS message text.
 * @param {string[]} mobileNumbers - Array of raw phone numbers.
 * @returns {Promise<object|undefined>} Gateway response body, or undefined if skipped.
 */
const sendSms = async (message, mobileNumbers) => {
  if (!mobileNumbers || !Array.isArray(mobileNumbers) || mobileNumbers.length === 0) {
    console.warn('[sms] No valid mobile numbers provided, skipping SMS.');
    return;
  }

  const SMS_USERNAME = process.env.SMS_API_USERNAME || 'sahra';
  const SMS_PASSWORD = process.env.SMS_API_PASSWORD || 'S@hr0382!!';

  if (!SMS_USERNAME || !SMS_PASSWORD) {
    console.warn('[sms] SMS_API_USERNAME or SMS_API_PASSWORD not configured. Skipping SMS.');
    return;
  }

  // Normalise and de-duplicate numbers, drop any that could not be cleaned
  const normalizedNumbers = [
    ...new Set(
      mobileNumbers
        .map((p) => normalizePhone(String(p)))
        .filter(Boolean)
    ),
  ];

  if (normalizedNumbers.length === 0) {
    console.warn('[sms] All phone numbers were invalid after normalisation. Skipping SMS.');
    return;
  }

  console.log(`[sms] Sending SMS to ${normalizedNumbers.length} number(s): ${normalizedNumbers.join(', ')}`);

  const token = await getSmsToken();

  console.log(`[sms] Payload being sent to Gateway: ${JSON.stringify({ smsMessage: message, mobile: normalizedNumbers })}`);
  const bodyPayload = JSON.stringify({
    smsMessage: message,
    mobile: normalizedNumbers,
  });

  const response = await makeRequest(`${SMS_BASE_URL}/Sms/sendsms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyPayload),
      'Authorization': `Bearer ${token}`,
    },
  }, bodyPayload);

  if (response.status !== 200) {
    throw new Error(`[sms] Sending failed (HTTP ${response.status}): ${JSON.stringify(response.body)}`);
  }

  console.log(`[sms] SMS sent successfully to ${normalizedNumbers.length} number(s). Response: ${JSON.stringify(response.body)}`);
  return response.body;
};

module.exports = { sendSms, normalizeSomaliPhone: normalizePhone };
