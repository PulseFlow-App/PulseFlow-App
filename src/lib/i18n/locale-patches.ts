import type { Dictionary, MessageKey } from "./dictionaries/en";
import type { Locale } from "./types";
import { deLocalePatch } from "./locale-patches/de";
import { heLocalePatch } from "./locale-patches/he";
import { esLocalePatch } from "./locale-patches/es";
import { itLocalePatch } from "./locale-patches/it";
import { myLocalePatch } from "./locale-patches/my";
import { thLocalePatch } from "./locale-patches/th";
import { frLocalePatch } from "./locale-patches/fr";
import { ruLocalePatch } from "./locale-patches/ru";
import { arLocalePatch } from "./locale-patches/ar";

function mergePatches(
  ...parts: Array<Partial<Dictionary>>
): Partial<Dictionary> {
  return Object.assign({}, ...parts);
}

const heUiPatch: Partial<Dictionary> = {
  "brand.name": "Pulse Flow",
  "common.on": "פעיל",
  "common.off": "כבוי",
  "common.translated": "תורגם",
  "common.saving": "שומר…",
  "nav.guests": "אורחים",
  "nav.menu": "תפריט",
  "nav.reports": "דוחות והעברות",
  "nav.talent": "חיפוש צוות",
  "nav.invites": "הזמנות",
  "nav.company": "חברה",
  "nav.dateRequests": "בקשות תאריכים",
  "settings.translateContent": "תרגום תוכן מהצוות",
  "settings.translateContentHint":
    "משימות, צ'אט, תדריכים והודעות מחברי הצוות יוצגו בשפת האפליקציה שלך.",
  "guest.homeTitle": "השהייה שלך",
  "guest.homeSubtitle": "עדכונים מצוות הנכס שאירח אותך.",
  "guest.hi": "היי {name}",
  "guest.notices": "מהמארח שלך",
  "guest.briefingsTitle": "תדריכי מארח",
  "guest.briefingsHint": "סמן כל פריט לאחר שקראת.",
  "guest.confirmRead": "סמן כנקרא",
  "guest.confirmedRead": "נקרא",
  "guest.nav.stay": "שהייה",
  "guest.nav.villas": "וילות",
  "guest.nav.support": "תמיכה",
  "guest.nav.bills": "חשבונות",
  "guest.supportTitle": "תמיכה",
  "guests.title": "אורחים",
  "guests.sendBriefing": "שלח תדריך",
};

const thUiPatch: Partial<Dictionary> = {
  "brand.name": "Pulse Flow",
  "common.on": "เปิด",
  "common.off": "ปิด",
  "common.translated": "แปลแล้ว",
  "common.saving": "กำลังบันทึก…",
  "nav.guests": "แขก",
  "nav.menu": "เมนู",
  "nav.reports": "รายงานและส่งมอบ",
  "nav.talent": "ค้นหาพนักงาน",
  "nav.invites": "เชิญ",
  "nav.company": "บริษัท",
  "nav.dateRequests": "คำขอวันที่",
  "settings.translateContent": "แปลเนื้อหาจากทีม",
  "settings.translateContentHint":
    "งาน แชท บรีฟ และข้อความจากเพื่อนร่วมทีมจะแสดงเป็นภาษาที่คุณเลือก",
  "guest.homeTitle": "การเข้าพักของคุณ",
  "guest.homeSubtitle": "อัปเดตจากทีมที่ดูแลที่พักของคุณ",
  "guest.hi": "สวัสดี {name}",
  "guest.noStay":
    "ยังไม่มีการเข้าพักที่เชื่อมต่อ ขอลิงก์เชิญจากโฮสต์ หรือเรียกดูวิลล่าเพื่อขอวันที่",
  "guest.browseVillas": "เรียกดูวิลล่าของบริษัท",
  "guest.notices": "จากโฮสต์ของคุณ",
  "guest.briefingsTitle": "บรีฟจากโฮสต์",
  "guest.briefingsHint": "ติ๊กแต่ละรายการเมื่ออ่านแล้ว",
  "guest.confirmRead": "ทำเครื่องหมายว่าอ่านแล้ว",
  "guest.confirmedRead": "อ่านแล้ว",
  "guest.houseGuide": "คู่มือบ้าน",
  "guest.wifi": "Wi-Fi",
  "guest.password": "รหัสผ่าน",
  "guest.gate": "ประตู",
  "guest.quietHours": "ช่วงเงียบ",
  "guest.bins": "ถังขยะ",
  "guest.checkout": "เช็คเอาท์",
  "guest.nav.stay": "พัก",
  "guest.nav.villas": "วิลล่า",
  "guest.nav.support": "ช่วยเหลือ",
  "guest.nav.bills": "บิล",
  "guest.supportTitle": "ช่วยเหลือ",
  "guest.supportHint":
    "ส่งข้อความถึงเจ้าของหรือผู้จัดการเท่านั้น ไม่ใช่แม่บ้านหรือทีมภาคสนาม",
  "guest.supportEmpty": "ทักทายได้เลย โฮสต์จะเห็นที่นี่",
  "guest.supportPlaceholder": "พิมพ์ข้อความ…",
  "guest.send": "ส่ง",
  "guest.host": "โฮสต์",
  "guest.billsTitle": "มัดจำและบิล",
  "guest.deposit": "มัดจำ",
  "guest.deductions": "หักเงิน",
  "guests.title": "แขก",
  "guests.sendBriefing": "ส่งบรีฟ",
  "guests.briefTitle": "หัวข้อ",
  "guests.briefBody": "ข้อความ",
  "guests.send": "ส่งให้แขก",
  "guests.read": "อ่านแล้ว",
  "guests.unread": "รออ่าน",
};

const myUiPatch: Partial<Dictionary> = {
  "brand.name": "Pulse Flow",
  "common.on": "ဖွင့်",
  "common.off": "ပိတ်",
  "common.translated": "ဘာသာပြန်ပြီး",
  "common.saving": "သိမ်းဆည်းနေသည်…",
  "nav.guests": "ဧည့်သည်များ",
  "nav.menu": "မီနူး",
  "nav.reports": "အစီရင်ခံစာများ",
  "nav.talent": "ဝန်ထမ်းရှာရန်",
  "nav.invites": "ဖိတ်ခေါ်မှု",
  "nav.company": "ကုမ္ပဏီ",
  "nav.dateRequests": "ရက်စွဲတောင်းခံမှု",
  "settings.translateContent": "အသင်းမှအကြောင်းအရာဘာသာပြန်",
  "settings.translateContentHint":
    "တာဝန်များ၊ ချတ်များ၊ ညွှန်ကြားချက်များနှင့် အသင်းသားမက်ဆေ့ချ်များကို သင့်အက်ပ်ဘာသာစကားဖြင့် ပြသပါမည်။",
  "guest.homeTitle": "သင့်နေထိုင်မှု",
  "guest.homeSubtitle": "သင့်အိမ်ရှင်အဖွဲ့ထံမှ အပ်ဒိတ်များ။",
  "guest.hi": "မင်္ဂလာပါ {name}",
  "guest.notices": "သင့်အိမ်ရှင်ထံမှ",
  "guest.briefingsTitle": "အိမ်ရှင် ညွှန်ကြားချက်များ",
  "guest.briefingsHint": "ဖတ်ပြီးသည့်အခါ တစ်ခုစီကို အမှန်ခြစ်ပါ။",
  "guest.confirmRead": "ဖတ်ပြီးဟု မှတ်သားပါ",
  "guest.confirmedRead": "ဖတ်ပြီး",
  "guest.nav.stay": "နေထိုင်မှု",
  "guest.nav.villas": "ဗီလာများ",
  "guest.nav.support": "အကူအညီ",
  "guest.nav.bills": "ဘီလ်များ",
  "guest.supportTitle": "အကူအညီ",
  "guests.title": "ဧည့်သည်များ",
  "guests.sendBriefing": "ညွှန်ကြားချက်ပို့ရန်",
};

const arUiPatch: Partial<Dictionary> = {
  "brand.name": "Pulse Flow",
  "common.on": "تشغيل",
  "common.off": "إيقاف",
  "common.translated": "مترجم",
  "common.saving": "جارٍ الحفظ…",
  "nav.guests": "الضيوف",
  "nav.menu": "القائمة",
  "nav.reports": "التقارير والتسليم",
  "nav.talent": "البحث عن موظفين",
  "nav.invites": "الدعوات",
  "nav.company": "الشركة",
  "nav.dateRequests": "طلبات التواريخ",
  "settings.translateContent": "ترجمة محتوى الفريق",
  "settings.translateContentHint":
    "المهام والدردشة والإحاطات ورسائل الزملاء تظهر بلغة التطبيق الخاصة بك.",
  "guest.homeTitle": "إقامتك",
  "guest.homeSubtitle": "تحديثات من فريق المضيف الذي يستضيفك.",
  "guest.hi": "مرحباً {name}",
  "guest.notices": "من مضيفك",
  "guest.briefingsTitle": "إحاطات المضيف",
  "guest.briefingsHint": "ضع علامة على كل عنصر بعد قراءته.",
  "guest.confirmRead": "تعليم كمقروء",
  "guest.confirmedRead": "مقروء",
  "guest.nav.stay": "الإقامة",
  "guest.nav.villas": "الفيلات",
  "guest.nav.support": "الدعم",
  "guest.nav.bills": "الفواتير",
  "guest.supportTitle": "الدعم",
  "guests.title": "الضيوف",
  "guests.sendBriefing": "إرسال إحاطة",
};

/** Overrides where dictionary files still mirror English. */
export const localePatches: Partial<
  Record<Locale, Partial<Record<MessageKey, string>>>
> = {
  de: deLocalePatch,
  he: mergePatches(heLocalePatch, heUiPatch),
  es: esLocalePatch,
  it: itLocalePatch,
  my: mergePatches(myLocalePatch, myUiPatch),
  th: mergePatches(thLocalePatch, thUiPatch),
  fr: frLocalePatch,
  ru: ruLocalePatch,
  ar: mergePatches(arLocalePatch, arUiPatch),
} satisfies Partial<Record<Locale, Partial<Dictionary>>>;
