import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import sharp from "sharp";

const WIDTH = 2500;
const HEIGHT = 843;
const NAME_PREFIX = "hikiyomi-main-";
const OUTPUT = ".tmp/rich-menu.png";
const dryRun = process.argv.includes("--dry-run");
const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const defaultVersion = new Date()
  .toISOString()
  .slice(0, 10)
  .replaceAll("-", "");
const version = process.env.RICH_MENU_VERSION?.trim() || defaultVersion;

const definition = {
  size: { width: WIDTH, height: HEIGHT },
  selected: true,
  name: `${NAME_PREFIX}${version}`,
  chatBarText: "ヒキヨミメニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 834, height: HEIGHT },
      action: {
        type: "postback",
        label: "今日のスロ運",
        data: "action=fortune",
        displayText: "今日のスロ運"
      }
    },
    {
      bounds: { x: 834, y: 0, width: 833, height: HEIGHT },
      action: {
        type: "postback",
        label: "登録情報",
        data: "action=settings",
        displayText: "登録情報"
      }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: HEIGHT },
      action: {
        type: "postback",
        label: "使い方",
        data: "action=help",
        displayText: "使い方"
      }
    }
  ]
};

await mkdir(".tmp", { recursive: true });
const image = await sharp(Buffer.from(renderSvg()))
  .png({ compressionLevel: 9, palette: true, quality: 92 })
  .toBuffer();

if (image.byteLength > 1_000_000) {
  throw new Error(`Rich menu image exceeds 1 MB: ${image.byteLength} bytes`);
}

await writeFile(OUTPUT, image);
console.log(
  `Generated ${OUTPUT} (${image.byteLength} bytes, ${WIDTH}x${HEIGHT})`
);

if (dryRun) {
  console.log(JSON.stringify(definition, null, 2));
  process.exit(0);
}

if (!token) {
  throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required");
}

await lineJson("https://api.line.me/v2/bot/richmenu/validate", {
  method: "POST",
  body: definition
});

const previousId = await getDefaultRichMenuId();
const created = await lineJson("https://api.line.me/v2/bot/richmenu", {
  method: "POST",
  body: definition
});
const richMenuId = created.richMenuId;
if (typeof richMenuId !== "string" || !richMenuId) {
  throw new Error("LINE did not return richMenuId");
}

try {
  await lineBinary(
    `https://api-data.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}/content`,
    image
  );
  await lineJson(
    `https://api.line.me/v2/bot/user/all/richmenu/${encodeURIComponent(richMenuId)}`,
    { method: "POST" }
  );
} catch (error) {
  await safeDelete(richMenuId);
  throw error;
}

console.log(`Default rich menu set: ${richMenuId}`);

if (previousId && previousId !== richMenuId) {
  try {
    await deletePreviousIfOwned(previousId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `New rich menu is active, but previous-menu cleanup failed: ${message}`
    );
  }
}

async function getDefaultRichMenuId() {
  const response = await fetch("https://api.line.me/v2/bot/user/all/richmenu", {
    headers: authHeaders()
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await lineError(response);
  const value = await response.json();
  return typeof value.richMenuId === "string" ? value.richMenuId : null;
}

async function deletePreviousIfOwned(richMenuId) {
  const response = await fetch(
    `https://api.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}`,
    { headers: authHeaders() }
  );
  if (response.status === 404) return;
  if (!response.ok) throw await lineError(response);
  const previous = await response.json();
  if (
    typeof previous.name !== "string" ||
    !previous.name.startsWith(NAME_PREFIX)
  ) {
    console.log(
      `Previous default menu was not created by this script; retained: ${richMenuId}`
    );
    return;
  }
  await safeDelete(richMenuId);
  console.log(`Deleted previous rich menu: ${richMenuId}`);
}

async function safeDelete(richMenuId) {
  const response = await fetch(
    `https://api.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}`,
    { method: "DELETE", headers: authHeaders() }
  );
  if (!response.ok && response.status !== 404) {
    console.warn(
      `Could not delete rich menu ${richMenuId}: ${response.status}`
    );
  }
}

async function lineJson(url, options) {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      ...authHeaders(),
      ...(options.body ? { "content-type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) throw await lineError(response);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function lineBinary(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "content-type": "image/png"
    },
    body
  });
  if (!response.ok) throw await lineError(response);
}

function authHeaders() {
  return { authorization: `Bearer ${token}` };
}

async function lineError(response) {
  const body = await response.text();
  return new Error(`LINE API ${response.status}: ${body.slice(0, 500)}`);
}

function renderSvg() {
  const font =
    "'Noto Sans CJK JP','Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif";
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#0d1133"/>
        <stop offset="1" stop-color="#20275a"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#05071a" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="2500" height="843" fill="url(#bg)"/>
    <circle cx="1250" cy="-180" r="690" fill="#d6a92f" opacity="0.07"/>
    <path d="M834 62V781M1667 62V781" stroke="#d6a92f" stroke-opacity="0.48" stroke-width="3"/>

    ${panel(0, "fortune", "今日のスロ運", "本日の鑑定を見る", font)}
    ${panel(834, "profile", "登録情報", "生年月日・出生時刻", font)}
    ${panel(1667, "help", "使い方", "規約・データ方針", font)}

    <text x="1250" y="795" text-anchor="middle" font-family="${font}" font-size="34" font-weight="700" fill="#d6a92f" letter-spacing="8">HIKIYOMI</text>
  </svg>`;
}

function panel(x, icon, title, subtitle, font) {
  const center = x + 416.5;
  return `
    <g filter="url(#shadow)">
      <rect x="${x + 75}" y="80" width="683" height="610" rx="42" fill="#171d4d" stroke="#d6a92f" stroke-opacity="0.32" stroke-width="3"/>
    </g>
    ${iconSvg(icon, center)}
    <text x="${center}" y="500" text-anchor="middle" font-family="${font}" font-size="72" font-weight="800" fill="#ffffff">${title}</text>
    <text x="${center}" y="570" text-anchor="middle" font-family="${font}" font-size="34" font-weight="500" fill="#cbd0e6">${subtitle}</text>
  `;
}

function iconSvg(type, center) {
  if (type === "fortune") {
    return `<g transform="translate(${center - 135} 145)">
      <rect width="270" height="220" rx="28" fill="#0d1133" stroke="#d6a92f" stroke-width="8"/>
      <rect x="28" y="48" width="214" height="105" rx="14" fill="#f4f1e8"/>
      <text x="135" y="128" text-anchor="middle" font-family="Arial,sans-serif" font-size="86" font-weight="900" fill="#a51d2d">7</text>
      <circle cx="55" cy="187" r="15" fill="#d6a92f"/><circle cx="108" cy="187" r="15" fill="#d6a92f"/><circle cx="161" cy="187" r="15" fill="#d6a92f"/>
      <rect x="218" y="163" width="24" height="50" rx="10" fill="#d6a92f"/>
    </g>`;
  }
  if (type === "profile") {
    return `<g transform="translate(${center - 130} 130)" fill="none" stroke="#d6a92f" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="130" cy="82" r="62"/>
      <path d="M30 250c18-70 59-104 100-104s82 34 100 104"/>
      <circle cx="213" cy="206" r="45" fill="#171d4d"/>
      <path d="M213 180v52M187 206h52"/>
    </g>`;
  }
  return `<g transform="translate(${center - 112} 138)" fill="none" stroke="#d6a92f" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="112" cy="112" r="100"/>
    <path d="M78 83c4-35 29-53 60-53 35 0 61 22 61 55 0 28-16 42-41 56-24 13-35 27-35 52"/>
    <circle cx="123" cy="232" r="9" fill="#d6a92f" stroke="none"/>
  </g>`;
}
