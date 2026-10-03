import type { Dictionary } from "../dictionaries/en";

/** Turkish demo seed copy and home widgets. */
export const trLocalePatch: Partial<Dictionary> = {
  "home.due": "vade {date}",
  "home.checkInsOuts": "Girişler ve çıkışlar",
  "home.noMoves": "Bu günde hareket yok.",
  "home.weekVolumeClosed": "haftalık görev hacminin tamamlanan kısmı",
  "home.closedLabel": "tamamlanan",
  "home.openedLabel": "açılan",
  "home.chartOpened": "Açılan",
  "home.chartClosed": "Tamamlanan",

  "demo.readOnlyBanner":
    "Yalnızca demo. Serbestçe gezin. Gerçek bir hesap için kaydolun.",
  "demo.jobTitle.owner": "Sahip",
  "demo.jobTitle.manager": "Saha yöneticisi",
  "demo.jobTitle.cleaner": "Temizlik sorumlusu",

  "demo.villa.lotus.desc":
    "Srithanu yakınında deniz manzaralı, özel havuzlu 2 yatak odalı daire.",
  "demo.villa.lotus.notes": "Misafirler ekstra havlu istedi.",
  "demo.villa.palm.desc": "Haad Yao plajına yakın aile villası.",
  "demo.villa.palm.notes": "Yarınki girişten önce derin temizlik.",
  "demo.villa.jungle.desc":
    "Tepede sakin bir kaçış – klima ünitesi onarım bekliyor.",
  "demo.villa.jungle.notes": "Klima kompresör değişimi planlandı.",
  "demo.villa.sunset.desc": "Gün batımına bakan teraslı villa.",
  "demo.villa.sunset.notes": "Yarın 11:00 çıkış.",
  "demo.villa.cliff.desc": "Dış müşteri rezervasyonları için kompakt stüdyo.",
  "demo.villa.cliff.notes": "Dış müşteri – şirket envanteri değil.",

  "demo.contact.nokNotes":
    "Misafir değişimi için tercih edilen · PulseFlow’da",
  "demo.contact.somchaiNotes": "7/24 acil durum",
  "demo.contact.poolNotes": "Her çarşamba",
  "demo.contact.coolairNotes":
    "Yedek parçalar Thong Sala’da · henüz PulseFlow’da değil",
  "demo.contact.roleAc": "Klima / cihaz tamiri",

  "demo.task.palmDeepClean": "Palm Villa derin temizliğini bitir",
  "demo.task.meetAc": "Jungle Retreat’te klima teknisyeniyle buluş",
  "demo.task.sunsetCheckout":
    "Sunset Deck için çıkış listesini hazırla",
  "demo.task.lotusTowels": "Lotus House’a ekstra havlu bırak",
  "demo.task.coralRestock": "Coral Bungalow’da malzemeleri yenile",
  "demo.task.poolChemicals": "Thong Sala’dan havuz kimyasalları al",
  "demo.task.bambooPump": "Bamboo Nest su pompasını kontrol et",
  "demo.task.lotusTurnover": "Değişim temizliği – Lotus House",
  "demo.task.sunsetClean": "Çıkış temizliği – Sunset Deck",

  "demo.order.turnoverCleaning": "Değişim temizliği",
  "demo.order.turnoverDetails":
    "Çıkıştan sonra tam değişiklik. Çamaşır odasında ekstra havlu.",
  "demo.order.deepClean": "Derin temizlik",
  "demo.order.acRepair": "Klima tamir ziyareti",
  "demo.order.acRepairDetails":
    "Kompresör depozitosu ödendi. Manometreleri getirin.",

  "demo.bill.cleaningSupplies": "Değişim temizlik malzemeleri",
  "demo.bill.acDeposit": "Klima kompresör depozitosu",
  "demo.bill.fuel": "Ada içi yakıt",

  "demo.notif.newJobTurnover": "Yeni iş: Değişim temizliği",
  "demo.notif.newJobTurnoverBody":
    "Lotus House · yarın 11:00–14:00 – Okundu ve kabul edildi’ye dokunun",
  "demo.notif.jobConfirmedDeep": "İş onaylandı: Derin temizlik",
  "demo.notif.jobConfirmedDeepBody": "Palm Villa · bugün 09:00–12:00",
  "demo.notif.newMessageAlex": "Alex’ten yeni mesaj",
  "demo.notif.newMessageAlexBody":
    "Palm Villa havlularını biri onaylayabilir mi?",
  "demo.notif.billSubmitted": "Fatura gönderildi",
  "demo.notif.billSubmittedBody":
    "Değişim temizlik malzemeleri · ฿1.250",

  "demo.msg.morningPalm":
    "Günaydın – Palm Villa yarın öğleden önce misafirlere hazır olmalı.",
  "demo.msg.onIt":
    "Üzerindeyim. Temizlik ekibi orada. Bitince haber veririm.",
  "demo.msg.acConfirmed":
    "Jungle Retreat için klima teknisyeni 14:00’e onaylandı.",
  "demo.msg.orderAgreed":
    "📋 Nok Cleaning için hizmet emri\nNe: Derin temizlik\nNerede: Palm Villa\nNe zaman: bugün 09:00–12:00\nAyrıntılar: Yarınki girişten önce derin temizlik.\nKimden: Alex Owner\n\nEkip: işi aldığınızı doğrulamak için açın ve «Okundu ve kabul edildi»ye dokunun.",
  "demo.msg.orderPending":
    "📋 Nok Cleaning için hizmet emri\nNe: Değişim temizliği\nNerede: Lotus House\nNe zaman: yarın 11:00–14:00\nAyrıntılar: Çıkıştan sonra tam değişiklik. Çamaşır odasında ekstra havlu.\nKimden: Alex Owner\n\nEkip: işi aldığınızı doğrulamak için açın ve «Okundu ve kabul edildi»ye dokunun.",

  "demo.endorse.turnovers": "Değişimler sorunsuz yönetildi.",
  "demo.endorse.guestComm": "Misafir iletişimi çok iyi.",
  "demo.endorse.spotless": "Palm Villa tertemiz.",
  "demo.endorse.reliable": "Tüm mülklerde güvenilir.",

  "demo.day.today": "bugün",
  "demo.day.tomorrow": "yarın",
  "demo.day.yesterday": "dün",
  "demo.day.daysAgo": "{count} gün önce",

  "demo.sys.appointmentTitle": "Randevu {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "Giriş {when}",
  "demo.sys.checkOutTitle": "Çıkış {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "Fatura {when}",
  "demo.sys.billOverdue":
    "{count} gün gecikmiş|{count} gün gecikmiş",
  "demo.sys.billDueToday": "bugün vadesi doluyor",
  "demo.sys.billDueWhen": "vade {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "Yeni iş: {serviceType}",
  "demo.sys.newJobBody":
    "{location} · {when} – Okundu ve kabul edildi’ye dokunun",
  "demo.sys.jobConfirmedTitle": "İş onaylandı: {serviceType}",
  "demo.sys.completedJobTitle": "{name} bir işi tamamladı",
  "demo.sys.agreedTitle": "{name} kabul etti",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ Bitti – {location} konumunda {service} ({when})",
  "demo.sys.agreedMsg":
    "✅ Okundu ve kabul edildi – {location} konumunda {service} ({when})",
  "demo.sys.locationFallback": "konum",
  "demo.sys.villaFallback": "Mülk",

  "demo.orderChat.header": "📋 {name} için hizmet emri",
  "demo.orderChat.assignedLine": "{mention}, {job} işine atandı.",
  "demo.orderChat.openLine": "İş: {job}.",
  "demo.sys.cancelledMsg": "İptal edildi – {location} konumunda {service} ({when})",
  "demo.sys.declinedMsg": "Reddedildi – {location} konumunda {service} ({when})",
  "demo.sys.revokeMsg": "↩️ Onay geri alındı – {location} konumunda {service} ({when})",
  "demo.orderChat.what": "Ne: {serviceType}",
  "demo.orderChat.where": "Nerede: {location}",
  "demo.orderChat.when": "Ne zaman: {when}",
  "demo.orderChat.details": "Ayrıntılar: {details}",
  "demo.orderChat.from": "Kimden: {name}",
  "demo.orderChat.staffHint":
    "Ekip: işi aldığınızı doğrulamak için açın ve «Okundu ve kabul edildi»ye dokunun.",

  "demo.guest.ownerNotices":
    "Hoş geldiniz! Havuz ısıtıcısı 16:00’dan itibaren açık. Çıkış 11:00 – anahtarları mutfak tezgâhına bırakın.",
  "demo.guest.briefing.keysTitle": "Kapı ve anahtarlar",
  "demo.guest.briefing.keysBody":
    "Yan kapı kodu 4821#. Çıkışta anahtarları mutfak tezgâhına bırakın.",
  "demo.guest.briefing.helpTitle": "Bize nasıl ulaşılır",
  "demo.guest.briefing.helpBody":
    "Acil durumlar için bu uygulamadaki Destek’i kullanın. Yalnızca ev sahibi ekibi olarak yanıtlarız.",
  "demo.guest.support.poolQuestion":
    "Merhaba – havuz ısıtıcısı bu akşam zaten açık mı?",
  "demo.guest.support.poolReply":
    "Evet, her gün 16:00’da açılıyor. Gün batımının tadını çıkarın!",
  "demo.guest.guide.bins":
    "Mavi çöp kutusu yan kapının yanında. Toplama sal / cum sabah.",
  "demo.guest.guide.checkout":
    "Tüm pencereleri kapatın\nKlimayı ve ışıkları kapatın\nAnahtarları mutfak tezgâhına bırakın\nYan kapıyı kilitleyin",
  "demo.guest.guide.extra":
    "Plaj havluları sol dolapta. Ekstra su lavabonun altında.",
  "demo.guest.depositNote": "Depozito girişte tutuldu.",
  "demo.guest.chargeGlass": "Kırık şarap kadehi (değişim)",
};
