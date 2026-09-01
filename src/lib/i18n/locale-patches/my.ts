import type { Dictionary } from "../dictionaries/en";

/** Burmese overrides for demo seed copy and home widgets still mirroring English. */
export const myLocalePatch: Partial<Dictionary> = {
  "home.checkInsOuts": "Check-in နှင့် Check-out",
  "home.noMoves": "ဤနေ့တွင် လှုပ်ရှားမှုမရှိ။",
  "home.due": "သတ်မှတ်ရက် {date}",
  "home.weekVolumeClosed": "ဤအပတ်၏ အလုပ်ပမာဏ ပြီးစီးပြီး",
  "home.closedLabel": "ပြီးစီး",
  "home.openedLabel": "ဖွင့်ထား",
  "home.chartOpened": "ဖွင့်ထား",
  "home.chartClosed": "ပြီးစီး",

  "demo.readOnlyBanner":
    "Demo အတွက်သာဖြစ်သည်။ လွတ်လပ်စွာ လေ့လာပါ။ အမှန်တကယ် အကောင့်ဖွင့်ရန် မှတ်ပုံတင်ပါ။",
  "demo.jobTitle.owner": "ပိုင်ရှင်",
  "demo.jobTitle.manager": "နေရာတွင်မန်နေဂျာ",
  "demo.jobTitle.cleaner": "သန့်ရှင်းရေးအတွင်းဦးဆောင်မှူး",

  "demo.villa.lotus.desc":
    "Srithanu အနီးရှိ ကိုယ်ပိုင်ရေကူးနှင့် လှေရပ် မြင်ကွင်း ရှိ နှစ်ခန်းသော အခန်းများ။",
  "demo.villa.lotus.notes": "ဧည့်သည်များ ထပ်ဆောင်း ချောမွေ့ရေမျက်နှာဖုံးများ တောင်းခံထားသည်။",
  "demo.villa.palm.desc": "Haad Yao အနီးရှိ မိသားစုဗီလာ။",
  "demo.villa.palm.notes": "မနက်ဖန် check-in မတိုင်မီ လုပ်တပ်ဖွင့်သန့်ရှင်းရေး။",
  "demo.villa.jungle.desc": "တိတ်ဆိတ်သော တောင်ငှက်ကွင်း - AC မပြုပြင်ရသေး။",
  "demo.villa.jungle.notes": "AC compressor အစားထိုးရန် ချိန်းထားသည်။",
  "demo.villa.sunset.desc": "နေဝင်ချက် မျက်နှာကျသော deck ဗီလာ။",
  "demo.villa.sunset.notes": "မနက်ဖန် check-out ၁၁:၀၀။",
  "demo.villa.cliff.desc": "ဘေးဘက်ဖောက်သည်များ အနေဖြင့် ချိန်းဆိုမှု ချုံဖို့ ပညာတိုး။",
  "demo.villa.cliff.notes": "ဘေးဘက်ဖောက်သည် - ကုမ္ပဏီစတော့မှ မဟုတ်။",

  "demo.contact.nokNotes": "လဲလှယ်သန့်ရှင်းရေးအတွက် ဦးစားပေး · PulseFlow တွင်",
  "demo.contact.somchaiNotes": "၂၄ နာရီ အရေးပေါ်",
  "demo.contact.poolNotes": "အပတ်စဉ် ဗုဒ္ဓဟူးနေ့",
  "demo.contact.coolairNotes":
    "Thong Sala တွင် အစိတ်အပိုင်းများ · PulseFlow တွင် မရှိသေး",
  "demo.contact.roleAc": "AC/ကိရိယာပြုပြင်ရေး",

  "demo.task.palmDeepClean": "Palm Villa လုပ်တပ်ဖွင့်သန့်ရှင်းရေး ပြီးမြောက်ရန်",
  "demo.task.meetAc": "Jungle Retreat တွင် AC နည်းပညာရှင်နှင့် တွေ့ရန်",
  "demo.task.sunsetCheckout": "Sunset Deck check-out စာရင်းပြင်ဆင်ရန်",
  "demo.task.lotusTowels": "Lotus House သို့ ထပ်ဆောင်း ချောမွေ့ရေမျက်နှာဖုံးများ ပို့ရန်",
  "demo.task.coralRestock": "Coral Bungalow ပစ္စည်းများ ပြန်ဖြည့်ရန်",
  "demo.task.poolChemicals": "Thong Sala တွင် ရေကူးကွင်းဓာတုပစ္စည်းများ ဝယ်ရန်",
  "demo.task.bambooPump": "Bamboo Nest ရေပမာဏစက်စစ်ဆေးရန်",
  "demo.task.lotusTurnover": "လဲလှယ်သန့်ရှင်းရေး - Lotus House",
  "demo.task.sunsetClean": "Check-out သန့်ရှင်းရေး - Sunset Deck",

  "demo.order.turnoverCleaning": "လဲလှယ်သန့်ရှင်းရေး",
  "demo.order.turnoverDetails":
    "Check-out ပြီးနောက် လဲလှယ်မှု အပြည့်အစုံ။ လျှော်ဖွက်ခန်းတွင် ထပ်ဆောင်း ချောမွေ့ရေမျက်နှာဖုံးများ။",
  "demo.order.deepClean": "လုပ်တပ်ဖွင့်သန့်ရှင်းရေး",
  "demo.order.acRepair": "AC ပြုပြင်ရေး လာရောက်မှု",
  "demo.order.acRepairDetails":
    "Compressor အကြေးငွေ ပေးပြီးပြီ။ Gauge များ ယူလာပါ။",

  "demo.bill.cleaningSupplies": "လဲလှယ်မှုအတွက် သန့်ရှင်းရေးပစ္စည်းများ",
  "demo.bill.acDeposit": "AC compressor အကြေးငွေ",
  "demo.bill.fuel": "ကျွန်းပေါ်သွားလာမှုအတွက် ဆီဖိုး",

  "demo.notif.newJobTurnover": "အလုပ်အသစ်: လဲလှယ်သန့်ရှင်းရေး",
  "demo.notif.newJobTurnoverBody":
    "Lotus House · မနက်ဖန် ၁၁:၀၀–၁၄:၀၀ – Read & agreed နှိပ်ပါ",
  "demo.notif.jobConfirmedDeep": "အလုပ်အတည်ပြုပြီး: လုပ်တပ်ဖွင့်သန့်ရှင်းရေး",
  "demo.notif.jobConfirmedDeepBody": "Palm Villa · ယနေ့ ၀၉:၀၀–၁၂:၀၀",
  "demo.notif.newMessageAlex": "Alex ထံမှ မက်ဆေ့ချ်အသစ်",
  "demo.notif.newMessageAlexBody": "Palm Villa ရေမျက်နှာဖုံးများ အတည်ပြုနိုင်မည်သူ ရှိပါသလား?",
  "demo.notif.billSubmitted": "ဘီလ်တင်ပြီး",
  "demo.notif.billSubmittedBody":
    "လဲလှယ်မှုအတွက် သန့်ရှင်းရေးပစ္စည်းများ · ฿1,250",

  "demo.msg.morningPalm":
    "မင်္ဂလာပါ - Palm Villa မနက်ဖန် နေ့လည်မတိုင်မီ ဧည့်သည်အတွက် အသင့်ဖြစ်ရမည်။",
  "demo.msg.onIt":
    "လုပ်ဆောင်နေသည်။ သန့်ရှင်းရေးအဖွဲ့ ရှိပြီးသား။ ပြီးသည့်အခါ အပ်ဒိတ်ပေးမည်။",
  "demo.msg.acConfirmed":
    "Jungle Retreat အတွက် AC နည်းပညာရှင် ၂ နာရီ အတည်ပြုပြီး။",
  "demo.msg.orderAgreed":
    "📋 Nok Cleaning အတွက် ဝန်ဆောင်မှုအမိန့်\nဘာလဲ: လုပ်တပ်ဖွင့်သန့်ရှင်းရေး\nဘယ်မှာ: Palm Villa\nဘယ်အချိန်: ယနေ့ ၀၉:၀၀–၁၂:၀၀\nအသေးစိတ်: မနက်ဖန် check-in မတိုင်မီ လုပ်တပ်ဖွင့်သန့်ရှင်းရေး။\nမှ: Alex Owner\n\nအဖွဲ့: ဖွင့်ပြီး အလုပ်ရရှိကြောင်း အတည်ပြုရန် “Read and agreed” နှိပ်ပါ။",
  "demo.msg.orderPending":
    "📋 Nok Cleaning အတွက် ဝန်ဆောင်မှုအမိန့်\nဘာလဲ: လဲလှယ်သန့်ရှင်းရေး\nဘယ်မှာ: Lotus House\nဘယ်အချိန်: မနက်ဖန် ၁၁:၀၀–၁၄:၀၀\nအသေးစိတ်: Check-out ပြီးနောက် လဲလှယ်မှု အပြည့်အစုံ။ လျှော်ဖွက်ခန်းတွင် ထပ်ဆောင်း ချောမွေ့ရေမျက်နှာဖုံးများ။\nမှ: Alex Owner\n\nအဖွဲ့: ဖွင့်ပြီး အလုပ်ရရှိကြောင်း အတည်ပြုရန် “Read and agreed” နှိပ်ပါ။",

  "demo.endorse.turnovers": "လဲလှယ်မှုများ ချောမွေ့စွာ လုပ်ဆောင်ခဲ့သည်။",
  "demo.endorse.guestComm": "ဧည့်သည်များနှင့် ထူးချွန်သော ဆက်သွယ်ရေး။",
  "demo.endorse.spotless": "Palm Villa တောက်ပစွာ သန့်ရှင်းသည်။",
  "demo.endorse.reliable": "ပစ္စည်းအားလုံးတွင် ယုံကြည်စိတ်ချရသည်။",

  "demo.day.today": "ယနေ့",
  "demo.day.tomorrow": "မနက်ဖန်",
  "demo.day.yesterday": "မနေ့က",
  "demo.day.daysAgo": "{count} ရက်အကြာက",

  "demo.sys.appointmentTitle": "ချိန်းဆိုမှု {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "Check-in {when}",
  "demo.sys.checkOutTitle": "Check-out {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "ဘီလ် {when}",
  "demo.sys.billOverdue":
    "{count} ရက်ကျော်လွန်|{count} ရက်ကျော်လွန်",
  "demo.sys.billDueToday": "ယနေ့ သတ်မှတ်ရက်",
  "demo.sys.billDueWhen": "သတ်မှတ်ရက် {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "အလုပ်အသစ်: {serviceType}",
  "demo.sys.newJobBody":
    "{location} · {when} – Read & agreed နှိပ်ပါ",
  "demo.sys.jobConfirmedTitle": "အလုပ်အတည်ပြုပြီး: {serviceType}",
  "demo.sys.completedJobTitle": "{name} အလုပ်တစ်ခု ပြီးမြောက်ခဲ့သည်",
  "demo.sys.agreedTitle": "{name} သဘောတူခဲ့သည်",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ ပြီးပြီ – {location} တွင် {service} ({when})",
  "demo.sys.agreedMsg":
    "✅ ဖတ်ပြီး သဘောတူပြီး – {location} တွင် {service} ({when})",
  "demo.sys.locationFallback": "တည်နေရာ",
  "demo.sys.villaFallback": "Villa",

  "demo.orderChat.header": "📋 {name} အတွက် ဝန်ဆောင်မှုအမိန့်",
  "demo.orderChat.what": "ဘာလဲ: {serviceType}",
  "demo.orderChat.where": "ဘယ်မှာ: {location}",
  "demo.orderChat.when": "ဘယ်အချိန်: {when}",
  "demo.orderChat.details": "အသေးစိတ်: {details}",
  "demo.orderChat.from": "မှ: {name}",
  "demo.orderChat.staffHint":
    "အဖွဲ့: ဖွင့်ပြီး အလုပ်ရရှိကြောင်း အတည်ပြုရန် “Read and agreed” နှိပ်ပါ။",

  "demo.guest.ownerNotices":
    "ကြိုဆိုပါတယ်! ရေပူစက်ကို ၁၆:၀၀ မှ ဖွင့်ထားပါသည်။ ထွက်ခွာချိန် ၁၁:၀၀ – သော့များကို မီးဖိုချောင်ကောင်တာပေါ်တွင် ထားပါ။",
  "demo.guest.briefing.keysTitle": "ဂိတ် နှင့် သော့များ",
  "demo.guest.briefing.keysBody":
    "ဘေးဂိတ်ကုဒ် ၄၈၂၁#။ ထွက်ခွာချိန်တွင် သော့များကို မီးဖိုချောင်ကောင်တာပေါ်တွင် ထားပါ။",
  "demo.guest.briefing.helpTitle": "ဆက်သွယ်နည်း",
  "demo.guest.briefing.helpBody":
    "အရေးပေါ်အတွက် ဤအက်ပ်ရှိ အကူအညီကို သုံးပါ။ အိမ်ရှင်အဖွဲ့အနေဖြင့် သာဖြေကြားပါသည်။",
  "demo.guest.support.poolQuestion":
    "မင်္ဂလာပါ – ရေပူစက် ယနေ့ည ဖွင့်ပြီးပြီလား?",
  "demo.guest.support.poolReply":
    "ဟုတ်ကဲ့၊ နေ့တိုင်း ၁၆:၀၀ မှာ ဖွင့်ပါသည်။ နေဝင်ချိန်ကို ခံစားပါ!",
  "demo.guest.guide.bins":
    "ဘေးဂိတ်အပြင်ဘက် အပြာရောင်ပုံး။ အပစ်အခွံယူခြင်း အင်္ဂါ / သောကြာ မနက်ပိုင်း။",
  "demo.guest.guide.checkout":
    "အားလုံးသော ဝင်းဒိုးများ ပိတ်ပါ\nAC နှင့် မီးများ ပိတ်ပါ\nသော့များကို မီးဖိုချောင်ကောင်တာပေါ်တွင် ထားပါ\nဘေးဂိတ် ပိတ်ပါ",
  "demo.guest.guide.extra":
    "လက်ဝါးဘက်အဝတ်များကို ဘေးဘက်အဝတ်အစားခန်းတွင်။ ထပ်ဆောင်း ရေကို ဆိုကြားအောက်တွင်။",
  "demo.guest.depositNote": "စစ်ဆေးဝင်ချိန်တွင် လုံခြုံရေးငွေကြေး ထားရှိသည်။",
  "demo.guest.chargeGlass": "ကျိုးသွားသော ဝိုင်ခွက် (အစားထိုး)",
};
