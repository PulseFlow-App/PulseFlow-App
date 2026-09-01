import type { Dictionary } from "../dictionaries/en";

/** Italian overrides for demo seed copy and home widgets still mirroring English. */
export const itLocalePatch: Partial<Dictionary> = {
  "home.checkInsOuts": "Check-in e check-out",
  "home.noMoves": "Nessun movimento in questo giorno.",
  "home.due": "scadenza {date}",
  "home.weekVolumeClosed": "del volume di attività settimanale completato",
  "home.closedLabel": "completate",
  "home.openedLabel": "aperte",
  "home.chartOpened": "Aperte",
  "home.chartClosed": "Completate",

  "demo.readOnlyBanner":
    "Solo demo. Esplora liberamente. Registrati per un account reale.",
  "demo.jobTitle.owner": "Proprietario",
  "demo.jobTitle.manager": "Manager in loco",
  "demo.jobTitle.cleaner": "Responsabile pulizie",

  "demo.villa.lotus.desc":
    "Appartamento di 2 camere con vista mare e piscina privata vicino a Srithanu.",
  "demo.villa.lotus.notes": "Gli ospiti hanno richiesto asciugamani extra.",
  "demo.villa.palm.desc": "Villa familiare vicino alla spiaggia Haad Yao.",
  "demo.villa.palm.notes": "Pulizia profonda prima del check-in di domani.",
  "demo.villa.jungle.desc":
    "Rifugio tranquillo sulla collina – unità AC in attesa di riparazione.",
  "demo.villa.jungle.notes": "Sostituzione compressore AC programmata.",
  "demo.villa.sunset.desc": "Villa con terrazza rivolta al tramonto.",
  "demo.villa.sunset.notes": "Check-out domani 11:00.",
  "demo.villa.cliff.desc": "Monolocale compatto per prenotazioni clienti esterni.",
  "demo.villa.cliff.notes": "Cliente esterno – non inventario aziendale.",

  "demo.contact.nokNotes":
    "Preferito per i turnover · su PulseFlow",
  "demo.contact.somchaiNotes": "Emergenza 24h",
  "demo.contact.poolNotes": "Settimanalmente il mercoledì",
  "demo.contact.coolairNotes":
    "Ricambi in Thong Sala · ancora non su PulseFlow",
  "demo.contact.roleAc": "Riparazione AC/elettrodomestici",

  "demo.task.palmDeepClean": "Completare pulizia profonda di Palm Villa",
  "demo.task.meetAc": "Incontrare tecnico AC a Jungle Retreat",
  "demo.task.sunsetCheckout":
    "Preparare lista check-out per Sunset Deck",
  "demo.task.lotusTowels": "Consegnare asciugamani extra a Lotus House",
  "demo.task.coralRestock": "Rifornire amenities di Coral Bungalow",
  "demo.task.poolChemicals": "Acquistare prodotti per piscina in Thong Sala",
  "demo.task.bambooPump": "Ispezionare pompa dell'acqua di Bamboo Nest",
  "demo.task.lotusTurnover": "Pulizia turnover – Lotus House",
  "demo.task.sunsetClean": "Pulizia check-out – Sunset Deck",

  "demo.order.turnoverCleaning": "Pulizia turnover",
  "demo.order.turnoverDetails":
    "Turnover completo dopo il check-out. Asciugamani extra nel locale lavanderia.",
  "demo.order.deepClean": "Pulizia profonda",
  "demo.order.acRepair": "Intervento riparazione AC",
  "demo.order.acRepairDetails":
    "Acconto compressore già pagato. Portare manometri.",

  "demo.bill.cleaningSupplies": "Prodotti per pulizia turnover",
  "demo.bill.acDeposit": "Acconto compressore AC",
  "demo.bill.fuel": "Carburante per spostamenti sull'isola",

  "demo.notif.newJobTurnover": "Nuovo lavoro: Pulizia turnover",
  "demo.notif.newJobTurnoverBody":
    "Lotus House · domani 11:00–14:00 – tocca Letto e accettato",
  "demo.notif.jobConfirmedDeep": "Lavoro confermato: Pulizia profonda",
  "demo.notif.jobConfirmedDeepBody": "Palm Villa · oggi 09:00–12:00",
  "demo.notif.newMessageAlex": "Nuovo messaggio da Alex",
  "demo.notif.newMessageAlexBody":
    "Qualcuno può confermare gli asciugamani di Palm Villa?",
  "demo.notif.billSubmitted": "Fattura inviata",
  "demo.notif.billSubmittedBody":
    "Prodotti per pulizia turnover · ฿1.250",

  "demo.msg.morningPalm":
    "Buongiorno – Palm Villa deve essere pronta per gli ospiti entro mezzogiorno di domani.",
  "demo.msg.onIt":
    "Ci sto. Il team di pulizia è già lì. Aggiorno quando finiscono.",
  "demo.msg.acConfirmed":
    "Tecnico AC confermato per Jungle Retreat alle 14:00.",
  "demo.msg.orderAgreed":
    "📋 Ordine di servizio per Nok Cleaning\nCosa: Pulizia profonda\nDove: Palm Villa\nQuando: oggi 09:00–12:00\nDettagli: Pulizia profonda prima del check-in di domani.\nDa: Alex Owner\n\nTeam: apri e tocca «Letto e accettato» per confermare di aver ricevuto il lavoro.",
  "demo.msg.orderPending":
    "📋 Ordine di servizio per Nok Cleaning\nCosa: Pulizia turnover\nDove: Lotus House\nQuando: domani 11:00–14:00\nDettagli: Turnover completo dopo il check-out. Asciugamani extra nel locale lavanderia.\nDa: Alex Owner\n\nTeam: apri e tocca «Letto e accettato» per confermare di aver ricevuto il lavoro.",

  "demo.endorse.turnovers": "Turnover gestiti senza problemi.",
  "demo.endorse.guestComm": "Ottima comunicazione con gli ospiti.",
  "demo.endorse.spotless": "Palm Villa impeccabile.",
  "demo.endorse.reliable": "Affidabile su tutte le proprietà.",

  "demo.day.today": "oggi",
  "demo.day.tomorrow": "domani",
  "demo.day.yesterday": "ieri",
  "demo.day.daysAgo": "{count} giorni fa",

  "demo.sys.appointmentTitle": "Appuntamento {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "Check-in {when}",
  "demo.sys.checkOutTitle": "Check-out {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "Fattura {when}",
  "demo.sys.billOverdue":
    "scaduta da {count} giorno|scaduta da {count} giorni",
  "demo.sys.billDueToday": "scade oggi",
  "demo.sys.billDueWhen": "scade {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "Nuovo lavoro: {serviceType}",
  "demo.sys.newJobBody":
    "{location} · {when} – tocca Letto e accettato",
  "demo.sys.jobConfirmedTitle": "Lavoro confermato: {serviceType}",
  "demo.sys.completedJobTitle": "{name} ha completato un lavoro",
  "demo.sys.agreedTitle": "{name} ha accettato",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ Fatto – {service} a {location} ({when})",
  "demo.sys.agreedMsg":
    "✅ Letto e accettato – {service} a {location} ({when})",
  "demo.sys.locationFallback": "posizione",
  "demo.sys.villaFallback": "Villa",

  "demo.orderChat.header": "📋 Ordine di servizio per {name}",
  "demo.orderChat.what": "Cosa: {serviceType}",
  "demo.orderChat.where": "Dove: {location}",
  "demo.orderChat.when": "Quando: {when}",
  "demo.orderChat.details": "Dettagli: {details}",
  "demo.orderChat.from": "Da: {name}",
  "demo.orderChat.staffHint":
    "Team: apri e tocca «Letto e accettato» per confermare di aver ricevuto il lavoro.",

  "demo.guest.ownerNotices":
    "Benvenuto! Il riscaldatore della piscina è attivo dalle 16:00. Check-out 11:00 – lascia le chiavi sul piano della cucina.",
  "demo.guest.briefing.keysTitle": "Cancello e chiavi",
  "demo.guest.briefing.keysBody":
    "Il codice del cancello laterale è 4821#. Lascia le chiavi sul piano della cucina al check-out.",
  "demo.guest.briefing.helpTitle": "Come contattarci",
  "demo.guest.briefing.helpBody":
    "Usa Supporto in questa app per urgenze. Rispondiamo solo come team dell'host.",
  "demo.guest.support.poolQuestion":
    "Ciao – il riscaldatore della piscina è già acceso stasera?",
  "demo.guest.support.poolReply":
    "Sì, si accende ogni giorno alle 16:00. Goditi il tramonto!",
  "demo.guest.guide.bins":
    "Bidone blu fuori dal cancello laterale. Raccolta mar / ven al mattino.",
  "demo.guest.guide.checkout":
    "Chiudi tutte le finestre\nSpegni aria condizionata e luci\nLascia le chiavi sul piano della cucina\nChiudi il cancello laterale",
  "demo.guest.guide.extra":
    "Asciugamani da spiaggia nell'armadio a sinistra. Acqua extra sotto il lavandino.",
  "demo.guest.depositNote": "Deposito trattenuto al check-in.",
  "demo.guest.chargeGlass": "Bicchiere da vino rotto (sostituzione)",
};
