import type { Dictionary } from "../dictionaries/en";

/** Thai demo gaps (guest seed + template strings). */
export const thLocalePatch: Partial<Dictionary> = {
  "home.due": "ครบกำหนด {date}",
  "home.checkInsOuts": "เช็คอินและเช็คเอาท์",
  "home.noMoves": "ไม่มีการเคลื่อนไหวในวันนี้",
  "home.weekVolumeClosed": "ของปริมาณงานสัปดาห์นี้ที่ปิดแล้ว",
  "home.closedLabel": "ปิดแล้ว",
  "home.openedLabel": "เปิดใหม่",
  "home.chartOpened": "เปิดใหม่",
  "home.chartClosed": "ปิดแล้ว",

  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",

  "demo.guest.ownerNotices":
    "ยินดีต้อนรับ! เครื่องทำน้ำอุ่นสระเปิด 16:00 น. เช็คเอาท์ 11:00 น. - วางกุญแจบนเคาน์เตอร์ครัว",
  "demo.guest.briefing.keysTitle": "ประตูและกุญแจ",
  "demo.guest.briefing.keysBody":
    "รหัสประตูข้าง 4821# วางกุญแจบนเคาน์เตอร์ครัวตอนเช็คเอาท์",
  "demo.guest.briefing.helpTitle": "ติดต่อเรา",
  "demo.guest.briefing.helpBody":
    "ใช้ช่วยเหลือในแอปนี้สำหรับเรื่องด่วน เราตอบในฐานะทีมโฮสต์เท่านั้น",
  "demo.guest.support.poolQuestion":
    "สวัสดีครับ/ค่ะ - เครื่องทำน้ำอุ่นสระเปิดคืนนี้แล้วหรือยัง?",
  "demo.guest.support.poolReply":
    "เปิดทุกวัน 16:00 น. ขอให้สนุกกับพระอาทิตย์ตก!",
  "demo.guest.guide.bins":
    "ถังสีน้ำเงินนอกประตูข้าง เก็บออกวันอังคาร / ศุกร์เช้า",
  "demo.guest.guide.checkout":
    "ปิดหน้าต่างทั้งหมด\nปิดแอร์และไฟ\nวางกุญแจบนเคาน์เตอร์ครัว\nล็อกประตูข้าง",
  "demo.guest.guide.extra":
    "ผ้าเช็ดตัวชายหาดในตู้ซ้าย น้ำสำรองใต้ซิงก์",
  "demo.guest.depositNote": "มัดจำเก็บไว้ตอนเช็คอิน",
  "demo.guest.chargeGlass": "แก้วไวน์แตก (เปลี่ยนใหม่)",
};
