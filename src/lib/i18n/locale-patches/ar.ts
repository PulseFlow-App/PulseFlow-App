import type { Dictionary } from "../dictionaries/en";

/** Arabic demo seed copy + home widgets. */
export const arLocalePatch: Partial<Dictionary> = {
  "home.checkInsOuts": "تسجيل الوصول والمغادرة",
  "home.noMoves": "لا حركة في هذا اليوم.",
  "home.due": "بحلول {date}",
  "home.weekVolumeClosed": "حجم المهام الأسبوعي المكتمل",
  "home.closedLabel": "مكتملة",
  "home.openedLabel": "مفتوحة",
  "home.chartOpened": "مفتوحة",
  "home.chartClosed": "مكتملة",

  "demo.readOnlyBanner":
    "معاينة للقراءة فقط. استكشف بحرية. سجّل للحصول على حساب حقيقي.",
  "demo.jobTitle.owner": "مالك",
  "demo.jobTitle.manager": "مدير في الموقع",
  "demo.jobTitle.cleaner": "قائد فريق التنظيف",

  "demo.villa.lotus.desc": "شقة من غرفتين بإطلالة بحرية ومسبح خاص بالقرب من سريتانو.",
  "demo.villa.lotus.notes": "طلب الضيوف مناشف إضافية.",
  "demo.villa.palm.desc": "فيلا عائلية بالقرب من شاطئ هاد ياو.",
  "demo.villa.palm.notes": "تنظيف عميق قبل تسجيل الوصول غداً.",
  "demo.villa.jungle.desc": "ملاذ هادئ على التل — مكيف الهواء بانتظار الإصلاح.",
  "demo.villa.jungle.notes": "استبدال ضاغط المكيف مجدول.",
  "demo.villa.sunset.desc": "فيلا بشرفة مطلة على الغروب.",
  "demo.villa.sunset.notes": "المغادرة غداً الساعة 11:00.",
  "demo.villa.cliff.desc": "استوديو مدمج لحجوزات العملاء الجانبيين.",
  "demo.villa.cliff.notes": "عميل جانبي — ليس في مخزون الشركة.",

  "demo.contact.nokNotes": "مفضل للتسليمات · على PulseFlow",
  "demo.contact.somchaiNotes": "طوارئ على مدار الساعة",
  "demo.contact.poolNotes": "كل يوم أربعاء",
  "demo.contact.coolairNotes": "قطع غيار في تونغ سالا · ليس على PulseFlow بعد",
  "demo.contact.roleAc": "إصلاح مكيف/أجهزة",

  "demo.task.palmDeepClean": "إنهاء التنظيف العميق لفيلا بالم",
  "demo.task.meetAc": "لقاء فني التكييف في جونغل ريتريت",
  "demo.task.sunsetCheckout": "إعداد قائمة المغادرة لسانست ديك",
  "demo.task.lotusTowels": "توصيل مناشف إضافية إلى لوتس هاوس",
  "demo.task.coralRestock": "إعادة تخزين المستلزمات في كورال بنغالو",
  "demo.task.poolChemicals": "شراء مواد كيميائية للمسبح في تونغ سالا",
  "demo.task.bambooPump": "فحص مضخة المياه في بامبو نست",
  "demo.task.lotusTurnover": "تنظيف التسليم - لوتس هاوس",
  "demo.task.sunsetClean": "تنظيف المغادرة - سانست ديك",

  "demo.order.turnoverCleaning": "تنظيف التسليم",
  "demo.order.turnoverDetails":
    "تسليم كامل بعد المغادرة. مناشف إضافية في غرفة الغسيل.",
  "demo.order.deepClean": "تنظيف عميق",
  "demo.order.acRepair": "زيارة إصلاح المكيف",
  "demo.order.acRepairDetails": "تم دفع عربون الضاغط. أحضر المقاسات.",

  "demo.bill.cleaningSupplies": "مستلزمات تنظيف للتسليم",
  "demo.bill.acDeposit": "عربون ضاغط المكيف",
  "demo.bill.fuel": "وقود لرحلات الجزيرة",

  "demo.notif.newJobTurnover": "مهمة جديدة: تنظيف التسليم",
  "demo.notif.newJobTurnoverBody":
    "لوتس هاوس · غداً 11:00–14:00 – اضغط قرأت ووافقت",
  "demo.notif.jobConfirmedDeep": "تم تأكيد المهمة: تنظيف عميق",
  "demo.notif.jobConfirmedDeepBody": "فيلا بالم · اليوم 09:00–12:00",
  "demo.notif.newMessageAlex": "رسالة جديدة من أليكس",
  "demo.notif.newMessageAlexBody": "هل يمكن لأحد تأكيد المناشف في فيلا بالم؟",
  "demo.notif.billSubmitted": "تم تقديم فاتورة",
  "demo.notif.billSubmittedBody": "مستلزمات تنظيف للتسليم · ฿1,250",

  "demo.msg.morningPalm":
    "صباح الخير — يجب أن تكون فيلا بالم جاهزة للضيوف بحلول ظهر الغد.",
  "demo.msg.onIt":
    "قيد التنفيذ. فريق التنظيف هناك بالفعل. سأحدّثكم عند الانتهاء.",
  "demo.msg.acConfirmed": "تم تأكيد فني التكييف لجونغل ريتريت الساعة 14:00.",
  "demo.msg.orderAgreed":
    "📋 طلب خدمة لفريق التنظيف\nماذا: تنظيف عميق\nأين: فيلا بالم\nمتى: اليوم 09:00–12:00\nالتفاصيل: تنظيف عميق قبل تسجيل الوصول غداً.\nمن: أليكس المالك\n\nالفريق: افتحوا واضغطوا قرأت ووافقت لتأكيد استلام المهمة.",
  "demo.msg.orderPending":
    "📋 طلب خدمة لفريق التنظيف\nماذا: تنظيف التسليم\nأين: لوتس هاوس\nمتى: غداً 11:00–14:00\nالتفاصيل: تسليم كامل بعد المغادرة. مناشف إضافية في غرفة الغسيل.\nمن: أليكس المالك\n\nالفريق: افتحوا واضغطوا قرأت ووافقت لتأكيد استلام المهمة.",

  "demo.endorse.turnovers": "تسليمات سلسة.",
  "demo.endorse.guestComm": "تواصل ممتاز مع الضيوف.",
  "demo.endorse.spotless": "فيلا بالم لامعة.",
  "demo.endorse.reliable": "موثوق في جميع العقارات.",

  "demo.day.today": "اليوم",
  "demo.day.tomorrow": "غداً",
  "demo.day.yesterday": "أمس",
  "demo.day.daysAgo": "منذ {count} يوم|منذ {count} أيام",

  "demo.sys.appointmentTitle": "موعد {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "تسجيل وصول {when}",
  "demo.sys.checkOutTitle": "مغادرة {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "فاتورة {when}",
  "demo.sys.billOverdue": "متأخرة {count} يوم|متأخرة {count} أيام",
  "demo.sys.billDueToday": "مستحقة اليوم",
  "demo.sys.billDueWhen": "مستحقة {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "مهمة جديدة: {serviceType}",
  "demo.sys.newJobBody": "{location} · {when} – اضغط قرأت ووافقت",
  "demo.sys.jobConfirmedTitle": "تم تأكيد المهمة: {serviceType}",
  "demo.sys.completedJobTitle": "{name} أنهى مهمة",
  "demo.sys.agreedTitle": "{name} وافق",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ تم - {service} في {location} ({when})",
  "demo.sys.agreedMsg": "✅ قرأت ووافقت - {service} في {location} ({when})",
  "demo.sys.locationFallback": "الموقع",
  "demo.sys.villaFallback": "فيلا",

  "demo.orderChat.header": "📋 طلب خدمة لـ {name}",
  "demo.orderChat.what": "ماذا: {serviceType}",
  "demo.orderChat.where": "أين: {location}",
  "demo.orderChat.when": "متى: {when}",
  "demo.orderChat.details": "التفاصيل: {details}",
  "demo.orderChat.from": "من: {name}",
  "demo.orderChat.staffHint":
    "الفريق: افتحوا واضغطوا قرأت ووافقت لتأكيد استلام المهمة.",

  "demo.guest.ownerNotices":
    "مرحباً! سخان المسبح يعمل من الساعة 16:00. المغادرة 11:00 — اتركوا المفاتيح على طاولة المطبخ.",
  "demo.guest.briefing.keysTitle": "البوابة والمفاتيح",
  "demo.guest.briefing.keysBody":
    "رمز البوابة الجانبية 4821#. اتركوا المفاتيح على طاولة المطبخ عند المغادرة.",
  "demo.guest.briefing.helpTitle": "كيفية التواصل",
  "demo.guest.briefing.helpBody":
    "استخدموا الدعم في التطبيق للرسائل العاجلة. نرد كفريق المضيف فقط.",
  "demo.guest.support.poolQuestion": "مرحباً - هل سخان المسبح يعمل الليلة؟",
  "demo.guest.support.poolReply":
    "نعم، يُشغّل يومياً الساعة 16:00. استمتعوا بالغروب!",
  "demo.guest.guide.bins": "حاوية زرقاء خارج البوابة الجانبية. جمع ث/خ صباحاً.",
  "demo.guest.guide.checkout":
    "أغلقوا جميع النوافذ\nأطفئوا المكيف والأنوار\nاتركوا المفاتيح على طاولة المطبخ\nأغلقوا البوابة الجانبية",
  "demo.guest.guide.extra": "مناشف الشاطئ في الخزانة اليسرى. ماء إضافي تحت الحوض.",
  "demo.guest.depositNote": "تم الاحتفاظ بالتأمين عند تسجيل الوصول.",
  "demo.guest.chargeGlass": "كأس نبيذ مكسور (استبدال)",
};
