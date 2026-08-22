// api/sendAlimtalk.js — 솔라피 알림톡 Vercel Serverless Function
// Vercel 환경변수 필요: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER, SOLAPI_PFID, SOLAPI_TEMPLATE_ID

import crypto from "crypto";


// 로그에 수신번호가 남지 않게 가린다 (CLAUDE.md 6장: 전화번호는 발송 후 로그에 남기지 않음).
// 솔라피 오류 응답에는 수신번호가 그대로 담겨 오는 경우가 있어, 찍기 전에 반드시 통과시킨다.
function maskPhones(value) {
  let json;
  try { json = JSON.stringify(value); } catch { return "[직렬화 불가]"; }
  if (!json) return String(value);
  return json.replace(
    /(\+?82[-\s]?1[016789]|01[016789])[-\s]?(\d{3,4})[-\s]?(\d{4})/g,
    (_m, head) => `${head}-****-****`,
  );
}

function makeSignature(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const hmac = crypto.createHmac("sha256", apiSecret);
  hmac.update(date + salt);
  const signature = hmac.digest("hex");
  return { date, salt, signature };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    customerName,   // 고객명
    phone,          // 수신 전화번호 (010-XXXX-XXXX)
    sleep,          // 수면 점수
    stress,         // 스트레스 점수
    moisture,       // 수분 점수
    elasticity,     // 탄력 점수
    score,          // 종합 점수
    stylist,        // 스타일리스트명
    reportUrl,      // 리포트 URL
  } = req.body;

  // 필수값 체크
  if (!customerName || !phone) {
    return res.status(400).json({ error: "customerName, phone 필수" });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;       // 발신 번호 (등록된 번호)
  const pfId = process.env.SOLAPI_PFID;           // 카카오 채널 pfId
  const templateId = process.env.SOLAPI_TEMPLATE_ID; // 알림톡 템플릿 ID

  if (!apiKey || !apiSecret || !sender || !pfId || !templateId) {
    return res.status(500).json({ error: "솔라피 환경변수 미설정" });
  }

  const { date, salt, signature } = makeSignature(apiKey, apiSecret);

  // 전화번호 하이픈 제거 (솔라피는 01012345678 형식)
  const toPhone = phone.replace(/-/g, "");

  // 알림톡 템플릿 변수 — 검수 요청한 템플릿 변수명과 반드시 일치시켜야 함
  const templateParams = {
    "#{고객명}": customerName,
    "#{수면}": String(sleep ?? "-"),
    "#{스트레스}": String(stress ?? "-"),
    "#{수분}": String(moisture ?? "-"),
    "#{탄력}": String(elasticity ?? "-"),
    "#{점수}": String(score ?? "-"),
    "#{스타일리스트}": stylist ?? "담당 스타일리스트",
    "#{전화번호}": phone,
    "#{리포트링크}": reportUrl ?? "",
  };

  const payload = {
    message: {
      to: toPhone,
      from: sender,
      kakaoOptions: {
        pfId,
        templateId,
        variables: templateParams,
        // 버튼 (리포트 링크 버튼) — 템플릿에 버튼 등록했다면 아래 주석 해제
        // buttons: [
        //   {
        //     buttonType: "WL",
        //     buttonName: "리포트 확인하기",
        //     linkMo: reportUrl,
        //     linkPc: reportUrl,
        //   },
        // ],
      },
    },
  };

  try {
    const response = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("솔라피 오류:", maskPhones(result));
      return res.status(500).json({ error: "알림톡 발송 실패", detail: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("sendAlimtalk 예외:", err?.name, maskPhones(err?.message));
    return res.status(500).json({ error: "서버 오류", detail: err.message });
  }
}
