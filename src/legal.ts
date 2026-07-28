const UPDATED_AT = "2026年7月29日";

export function homeHtml(baseUrl: string): string {
  return page(
    "ヒキヨミ",
    `
      <div class="hero">
        <div class="mark">7</div>
        <div><p class="eyebrow">LINE SLOT FORTUNE</p><h1>ヒキヨミ</h1></div>
      </div>
      <p class="lead">生年月日と任意の出生時刻から、暦・数秘・独自の合議方式を使って、その日のスロット運を1枚に整理する娯楽占いサービスです。</p>
      <div class="cards">
        <a class="card" href="${baseUrl}/help"><strong>使い方</strong><span>登録から鑑定まで</span></a>
        <a class="card" href="${baseUrl}/terms"><strong>利用規約</strong><span>利用条件と非保証</span></a>
        <a class="card" href="${baseUrl}/privacy"><strong>プライバシー</strong><span>保存情報と削除方法</span></a>
      </div>
      <section><h2>重要事項</h2><p>ヒキヨミは18歳以上向けの占い・娯楽サービスです。実際の設定、出玉、勝敗、収支を予測または保証するものではありません。</p></section>
    `
  );
}

export function helpHtml(baseUrl: string): string {
  return page(
    "使い方",
    `
      <h1>ヒキヨミの使い方</h1>
      <ol>
        <li><strong>生年月日を登録</strong><br>日運計算と18歳以上の確認に使用します。</li>
        <li><strong>出生時刻を登録</strong><br>分かる場合だけ登録します。不明でも利用でき、減点はありません。</li>
        <li><strong>「今日のスロ運」を押す</strong><br>総合点、4つの運、ラッキー要素、テーマ、鑑定文が1枚で届きます。</li>
        <li><strong>必要なら根拠を確認</strong><br>主な要因、判定の合議度、矛盾点を確認できます。</li>
      </ol>
      <h2>使える操作</h2>
      <p>LINEのリッチメニューまたはクイックリプライから「今日のスロ運」「登録情報」「使い方」を選べます。文字では「占い」「登録情報」「生年月日変更」「出生時刻変更」「根拠」も利用できます。</p>
      <h2>登録情報の変更・削除</h2>
      <p>LINE内の「登録情報」から変更できます。削除すると、生年月日、出生時刻、保存済み占い結果が削除されます。</p>
      <p><a href="${baseUrl}/terms">利用規約</a> · <a href="${baseUrl}/privacy">プライバシーポリシー</a></p>
    `
  );
}

export function privacyHtml(): string {
  return page(
    "プライバシーポリシー",
    `
      <h1>プライバシーポリシー</h1>
      <p class="meta">最終更新：${UPDATED_AT}</p>
      <p>ヒキヨミ（運営：KiT Works）は、本サービスの提供に必要な範囲で利用者情報を取り扱います。</p>
      <h2>取得・保存する情報</h2>
      <ul>
        <li>LINE Messaging APIから受け取るユーザー識別子</li>
        <li>利用者が登録した生年月日</li>
        <li>任意で登録した出生時刻、または「不明」という選択</li>
        <li>利用日、生成した占い結果、処理済みWebhookイベントID</li>
      </ul>
      <p>氏名、電話番号、LINEの表示名、実際の遊技店舗、機種、投資額、収支は初版では取得しません。</p>
      <h2>利用目的</h2>
      <ul>
        <li>利用者ごとの日運計算と同日結果の固定</li>
        <li>登録情報の確認・変更・削除</li>
        <li>二重処理の防止、不正利用防止、障害調査</li>
      </ul>
      <h2>生成AIへの送信</h2>
      <p>鑑定文の生成時、確定済みの点数、ラッキー要素、主要因、判定の矛盾、内部ルールIDをGemini APIへ送信する場合があります。LINEユーザー識別子、生年月日、出生時刻、サービス秘密値は送信しません。</p>
      <h2>第三者提供</h2>
      <p>法令に基づく場合を除き、保存情報を広告事業者等へ販売または提供しません。サービス提供に必要なクラウド、LINE Messaging API、Gemini APIは、それぞれの処理に必要な範囲で利用します。</p>
      <h2>変更と削除</h2>
      <p>LINE内の「登録情報」から、生年月日・出生時刻の変更と登録情報の削除ができます。削除操作により、生年月日、出生時刻、保存済み占い結果を削除します。二重処理防止などセキュリティ上必要な最小限のログは、合理的な期間保持する場合があります。</p>
      <h2>安全管理</h2>
      <p>秘密情報は公開リポジトリへ保存せず、実行環境のシークレットとして管理します。LINEからのWebhookは署名を検証します。</p>
      <h2>連絡先</h2>
      <p>運営：KiT Works<br>問い合わせはヒキヨミのLINE公式アカウントから受け付けます。</p>
    `
  );
}

export function termsHtml(): string {
  return page(
    "利用規約",
    `
      <h1>利用規約</h1>
      <p class="meta">最終更新：${UPDATED_AT}</p>
      <h2>対象</h2>
      <p>本サービスは18歳以上を対象とした、スロットを題材にする娯楽占いです。生年月日の登録により対象年齢を確認します。</p>
      <h2>サービスの性質</h2>
      <p>暦情報、数秘的計算およびヒキヨミ独自の点数変換を組み合わせて結果を生成します。伝統占術の解釈と独自規則は区別して管理します。</p>
      <h2>非保証</h2>
      <p>表示内容は、実際の設定、出玉、当選、勝敗、収支、店舗状況その他の事実を予測または保証するものではありません。「参考度」や「合議度」は占い内部の判定状態を示すもので、勝率や的中確率ではありません。</p>
      <h2>利用上の注意</h2>
      <p>遊技する場合は、予算と時間を事前に決め、生活に支障のない範囲で利用してください。本サービスを金銭判断、借入、追加投資、損失回収の根拠にしないでください。</p>
      <h2>禁止事項</h2>
      <ul>
        <li>18歳未満による利用</li>
        <li>不正アクセス、解析妨害、過度な自動送信</li>
        <li>第三者へのなりすまし</li>
        <li>法令または公序良俗に反する利用</li>
      </ul>
      <h2>変更・停止</h2>
      <p>品質改善、保守、外部APIの変更その他の理由により、内容の変更または一時停止を行う場合があります。</p>
      <h2>免責</h2>
      <p>利用者の遊技判断およびその結果は利用者自身の責任となります。運営者は、故意または重過失がある場合を除き、本サービスの利用によって生じた損害について責任を負いません。</p>
      <h2>運営</h2>
      <p>KiT Works</p>
    `
  );
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${title} | ヒキヨミ</title><style>:root{--brand:#11153d;--gold:#d6a92f;--muted:#667085;--border:#e5e7eb;--soft:#f7f8fc}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif;max-width:780px;margin:0 auto;padding:32px 20px 64px;color:#171717;line-height:1.8;background:#fff}a{color:var(--brand)}h1{color:var(--brand);font-size:2rem;line-height:1.3}h2{margin-top:2em;font-size:1.18rem;color:var(--brand)}p,li{font-size:1rem}.meta,.eyebrow{color:var(--muted);font-size:.85rem}.lead{font-size:1.1rem}.hero{display:flex;align-items:center;gap:16px;margin-bottom:24px}.mark{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--brand);color:var(--gold);font-size:2rem;font-weight:800;border:3px solid var(--gold)}.hero h1,.hero p{margin:0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:28px 0}.card{display:flex;flex-direction:column;padding:18px;border:1px solid var(--border);border-radius:14px;text-decoration:none;background:var(--soft)}.card span{color:var(--muted);font-size:.85rem}section{padding:18px;border:1px solid var(--border);border-radius:14px}ol li,ul li{margin:.7em 0}footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem}</style></head><body>${body}<footer>© KiT Works / ヒキヨミ</footer></body></html>`;
}
