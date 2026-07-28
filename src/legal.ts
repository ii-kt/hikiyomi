export function privacyHtml(): string {
  return page(
    "プライバシーポリシー",
    `
      <h1>プライバシーポリシー</h1>
      <p>ヒキヨミ（運営：KiT Works）は、本サービスの提供に必要な範囲で、LINEユーザー識別子、生年月日、利用日、生成された占い結果を取り扱います。</p>
      <h2>利用目的</h2>
      <p>本人ごとの占い結果の計算、同一日の結果の固定、不正利用防止、障害調査のために利用します。</p>
      <h2>生成AIへの送信</h2>
      <p>鑑定文の生成時、点数・色・アイテム等の匿名化済み結果のみをGemini APIへ送信します。LINEユーザー識別子と生年月日は送信しません。</p>
      <h2>保存と削除</h2>
      <p>登録情報はサービス提供に必要な期間保存します。削除依頼はLINE公式アカウントから受け付けます。</p>
      <h2>連絡先</h2>
      <p>運営：KiT Works</p>
    `
  );
}

export function termsHtml(): string {
  return page(
    "利用規約",
    `
      <h1>利用規約</h1>
      <p>本サービスは18歳以上を対象とした、スロットを題材にする娯楽占いです。</p>
      <h2>非保証</h2>
      <p>表示内容は、実際の設定、出玉、勝敗、収支その他の結果を予測または保証するものではありません。</p>
      <h2>利用上の注意</h2>
      <p>遊技する場合は、予算と時間を事前に決め、生活に支障のない範囲で利用してください。本サービスを金銭判断の唯一の根拠にしないでください。</p>
      <h2>禁止事項</h2>
      <p>不正アクセス、サービス妨害、未成年者による利用、法令または公序良俗に反する利用を禁止します。</p>
      <h2>運営</h2>
      <p>KiT Works</p>
    `
  );
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | ヒキヨミ</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#171717;line-height:1.8}h1{color:#11153d}h2{margin-top:2em;font-size:1.15rem}p{margin:.6em 0}footer{margin-top:3rem;color:#666;font-size:.85rem}</style></head><body>${body}<footer>© KiT Works / ヒキヨミ</footer></body></html>`;
}
