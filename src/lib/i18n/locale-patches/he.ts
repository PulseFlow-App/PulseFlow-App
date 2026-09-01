import type { Dictionary } from "../dictionaries/en";

/** Hebrew demo seed copy + home widgets (API translation does not cover these reliably). */
export const heLocalePatch: Partial<Dictionary> = {
  "home.checkInsOuts": "צ'ק-אין וצ'ק-אאוט",
  "home.noMoves": "אין תנועות ביום זה.",
  "home.due": "עד {date}",
  "home.weekVolumeClosed": "מנפח המשימות השבועי הושלם",
  "home.closedLabel": "הושלמו",
  "home.openedLabel": "נפתחו",
  "home.chartOpened": "נפתחו",
  "home.chartClosed": "הושלמו",

  "demo.readOnlyBanner":
    "תצוגה מקדימה בלבד. חקרו בחופשיות. הירשמו לחשבון אמיתי.",
  "demo.jobTitle.owner": "בעלים",
  "demo.jobTitle.manager": "מנהל באתר",
  "demo.jobTitle.cleaner": "ראש צוות ניקיון",

  "demo.villa.lotus.desc": "דירת 2 חדרים עם נוף לים ובריכה פרטית ליד סריתנו.",
  "demo.villa.lotus.notes": "אורחים ביקשו מגבות נוספות.",
  "demo.villa.palm.desc": "וילה משפחתית ליד חוף האד יאו.",
  "demo.villa.palm.notes": "ניקוי עומק לפני צ'ק-אין מחר.",
  "demo.villa.jungle.desc": "מתחם שקט על הגבעה – מזגן ממתין לתיקון.",
  "demo.villa.jungle.notes": "החלפת מדחס מזגן מתוכננת.",
  "demo.villa.sunset.desc": "וילה עם מרפסת לכיוון שקיעה.",
  "demo.villa.sunset.notes": "צ'ק-אאוט מחר 11:00.",
  "demo.villa.cliff.desc": "סטודיו קומפקטי להזמנות לקוחות צד.",
  "demo.villa.cliff.notes": "לקוח צד – לא במלאי החברה.",

  "demo.contact.nokNotes": "מועדף להחלפות · ב-PulseFlow",
  "demo.contact.somchaiNotes": "חירום 24 שעות",
  "demo.contact.poolNotes": "מדי יום רביעי",
  "demo.contact.coolairNotes": "חלפים בטונג סלה · עדיין לא ב-PulseFlow",
  "demo.contact.roleAc": "תיקון מזגן/מכשירים",

  "demo.task.palmDeepClean": "סיום ניקוי עומק בווילת פאלם",
  "demo.task.meetAc": "פגישה עם טכנאי מיזוג בג'ונגל ריטריט",
  "demo.task.sunsetCheckout": "הכנת רשימת צ'ק-אאוט לסאנסט דק",
  "demo.task.lotusTowels": "משלוח מגבות נוספות ללוטוס האוס",
  "demo.task.coralRestock": "מילוי ציוד בקורל בנגלו",
  "demo.task.poolChemicals": "קניית כימיקלים לבריכה בטונג סלה",
  "demo.task.bambooPump": "בדיקת משאבת מים בבמבו נסט",
  "demo.task.lotusTurnover": "ניקיון החלפה - לוטוס האוס",
  "demo.task.sunsetClean": "ניקוי צ'ק-אאוט - סאנסט דק",

  "demo.order.turnoverCleaning": "ניקיון החלפה",
  "demo.order.turnoverDetails":
    "החלפה מלאה אחרי צ'ק-אאוט. מגבות נוספות בחדר כביסה.",
  "demo.order.deepClean": "ניקוי עומק",
  "demo.order.acRepair": "ביקור תיקון מזגן",
  "demo.order.acRepairDetails": "מקדמה למדחש שולמה. להביא מדים.",

  "demo.bill.cleaningSupplies": "ציוד ניקוי להחלפה",
  "demo.bill.acDeposit": "מקדמת מדחס מזגן",
  "demo.bill.fuel": "דלק לנסיעות באי",

  "demo.notif.newJobTurnover": "עבודה חדשה: ניקיון החלפה",
  "demo.notif.newJobTurnoverBody":
    "לוטוס האוס · מחר 11:00–14:00 – הקישו קראתי ואישרתי",
  "demo.notif.jobConfirmedDeep": "עבודה אושרה: ניקוי עומק",
  "demo.notif.jobConfirmedDeepBody": "פאלם וילה · היום 09:00–12:00",
  "demo.notif.newMessageAlex": "הודעה חדשה מאלכס",
  "demo.notif.newMessageAlexBody": "מישהו יכול לאשר מגבות בפאלם וילה?",
  "demo.notif.billSubmitted": "חשבונית הוגשה",
  "demo.notif.billSubmittedBody": "ציוד ניקוי להחלפה · ฿1,250",

  "demo.msg.morningPalm":
    "בוקר טוב – פאלם וילה צריכה להיות מוכנה לאורחים עד מחר בצהריים.",
  "demo.msg.onIt":
    "בטיפול. צוות הניקיון כבר שם. אעדכן כשיסיימו.",
  "demo.msg.acConfirmed": "טכנאי מיזוג לג'ונגל ריטריט אושר ל-14:00.",
  "demo.msg.orderAgreed":
    "📋 הזמנת שירות לנוק קלינינג\nמה: ניקוי עומק\nאיפה: פאלם וילה\nמתי: היום 09:00–12:00\nפרטים: ניקוי עומק לפני צ'ק-אין מחר.\nמאת: אלכס בעלים\n\nצוות: פתחו והקישו קראתי ואישרתי כדי לאשר שקיבלתם את העבודה.",
  "demo.msg.orderPending":
    "📋 הזמנת שירות לנוק קלינינג\nמה: ניקיון החלפה\nאיפה: לוטוס האוס\nמתי: מחר 11:00–14:00\nפרטים: החלפה מלאה אחרי צ'ק-אאוט. מגבות נוספות בחדר כביסה.\nמאת: אלכס בעלים\n\nצוות: פתחו והקישו קראתי ואישרתי כדי לאשר שקיבלתם את העבודה.",

  "demo.endorse.turnovers": "החלפות בוצעו בצורה חלקה.",
  "demo.endorse.guestComm": "תקשורת מצוינת עם אורחים.",
  "demo.endorse.spotless": "פאלם וילה מבריקה.",
  "demo.endorse.reliable": "אמין בכל הנכסים.",

  "demo.day.today": "היום",
  "demo.day.tomorrow": "מחר",
  "demo.day.yesterday": "אתמול",
  "demo.day.daysAgo": "לפני {count} ימים",

  "demo.sys.appointmentTitle": "פגישה {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "צ'ק-אין {when}",
  "demo.sys.checkOutTitle": "צ'ק-אאוט {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "חשבונית {when}",
  "demo.sys.billOverdue": "באיחור של {count} יום|באיחור של {count} ימים",
  "demo.sys.billDueToday": "מגיע היום",
  "demo.sys.billDueWhen": "מגיע {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "עבודה חדשה: {serviceType}",
  "demo.sys.newJobBody": "{location} · {when} – הקישו קראתי ואישרתי",
  "demo.sys.jobConfirmedTitle": "עבודה אושרה: {serviceType}",
  "demo.sys.completedJobTitle": "{name} סיים עבודה",
  "demo.sys.agreedTitle": "{name} אישר",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ בוצע - {service} ב-{location} ({when})",
  "demo.sys.agreedMsg": "✅ קראתי ואישרתי - {service} ב-{location} ({when})",
  "demo.sys.locationFallback": "מיקום",
  "demo.sys.villaFallback": "וילה",

  "demo.orderChat.header": "📋 הזמנת שירות עבור {name}",
  "demo.orderChat.what": "מה: {serviceType}",
  "demo.orderChat.where": "איפה: {location}",
  "demo.orderChat.when": "מתי: {when}",
  "demo.orderChat.details": "פרטים: {details}",
  "demo.orderChat.from": "מאת: {name}",
  "demo.orderChat.staffHint":
    "צוות: פתחו והקישו קראתי ואישרתי כדי לאשר שקיבלתם את העבודה.",

  "demo.guest.ownerNotices":
    "ברוכים הבאים! מחמם הבריכה פועל מ-16:00. צ'ק-אאוט 11:00 – השאירו מפתחות על דלפק המטבח.",
  "demo.guest.briefing.keysTitle": "שער ומפתחות",
  "demo.guest.briefing.keysBody":
    "קוד השער הצדדי 4821#. השאירו מפתחות על דלפק המטבח בצ'ק-אאוט.",
  "demo.guest.briefing.helpTitle": "איך ליצור קשר",
  "demo.guest.briefing.helpBody":
    "השתמשו בתמיכה באפליקציה לדחוף. אנחנו עונים כצוות המארח בלבד.",
  "demo.guest.support.poolQuestion": "היי - מחמם הבריכה כבר פועל הערב?",
  "demo.guest.support.poolReply":
    "כן, נדלק כל יום ב-16:00. תהנו מהשקיעה!",
  "demo.guest.guide.bins": "פח כחול מחוץ לשער הצד. איסוף ג' / ו' בבוקר.",
  "demo.guest.guide.checkout":
    "סגרו את כל החלונות\nכבו מזגן ואורות\nהשאירו מפתחות על דלפק המטבח\nנעלו את השער הצדדי",
  "demo.guest.guide.extra": "מגבות חוף בארון השמאלי. מים נוספים מתחת לכיור.",
  "demo.guest.depositNote": "פיקדון נשמר בצ'ק-אין.",
  "demo.guest.chargeGlass": "כוס יין שבורה (החלפה)",
};
