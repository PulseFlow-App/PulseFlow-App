/**
 * Translate handoff / workspace-switcher app dictionary strings.
 * Run: node scripts/patch-handoff-dict-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictDir = path.join(root, "src/lib/i18n/dictionaries");

const patches = {
  de: {
    "settings.yourCompanies": "Ihre Unternehmen",
    "settings.yourCompaniesHint":
      "Ein Login kann in mehreren Unternehmen plus Ihrer persönlichen Liste arbeiten. Tippen Sie, um den aktiven Workspace zu wechseln.",
    "settings.myPersonal": "Mein persönlicher Bereich",
    "settings.workspaceActive": "Aktiv",
    "settings.workspaceSwitch": "Wechseln",
    "settings.workspaceSwitched": "Workspace gewechselt.",
    "settings.workspaceSwitchError": "Workspace konnte nicht gewechselt werden.",
    "handoff.title": "An einen Besitzer übergeben",
    "handoff.hint":
      "Ausgewählte persönliche Objekte in eine Firma verschieben. Sie bleiben Manager; sie werden Besitzer.",
    "handoff.open": "Besitzer einladen",
    "handoff.pickVillas": "Zu verschiebende Objekte",
    "handoff.pickVillasHint":
      "Nichts anwählen, um jedes persönliche Objekt in dieser Liste zu verschieben.",
    "handoff.ownerEmail": "E-Mail des Besitzers",
    "handoff.ownerName": "Name des Besitzers (optional)",
    "handoff.modeCreate": "Neue Firma erstellen",
    "handoff.modeAttach": "Ihre bestehende Firma",
    "handoff.modeAttachHint":
      "Sie müssen bereits einen Firmen-Workspace besitzen und ihn bei der Annahme wählen.",
    "handoff.companyName": "Name der neuen Firma",
    "handoff.companyNamePh": "z. B. Samui Coastal Villas",
    "handoff.send": "Übergabe-Link erstellen",
    "handoff.createError": "Übergabe konnte nicht erstellt werden.",
    "handoff.linkReady": "Diesen Link mit dem Besitzer teilen:",
    "handoff.loading": "Übergabe wird geladen…",
    "handoff.unavailable": "Dieser Übergabe-Link ist ungültig oder abgelaufen.",
    "handoff.unavailableTitle": "Übergabe nicht verfügbar",
    "handoff.alreadyDoneTitle": "Bereits angenommen",
    "handoff.alreadyDoneHint": "Diese Objekte sind bereits in einer Firma.",
    "handoff.goToVillas": "Zu den Objekten",
    "handoff.acceptTitle": "Eigentum übernehmen",
    "handoff.acceptHint": "{name} möchte Objekte in Ihre Firma übergeben.",
    "handoff.someone": "Jemand",
    "handoff.acceptCreateCompany":
      "Annehmen erstellt die Firma „{company}“ mit Ihnen als Besitzer.",
    "handoff.acceptAttachCompany":
      "Annehmen verschiebt diese Objekte in eine Firma, die Sie bereits besitzen.",
    "handoff.chooseCompany": "Firma, die die Objekte erhält",
    "handoff.mustSignInAs": "Als {email} anmelden, um anzunehmen.",
    "handoff.signInToAccept": "Anmelden zum Annehmen",
    "handoff.createAccount": "Konto erstellen",
    "handoff.wrongAccount":
      "Angemeldet als {current}. Abmelden und {expected} verwenden.",
    "handoff.accept": "Übergabe annehmen",
    "handoff.acceptError": "Übergabe konnte nicht angenommen werden.",
  },
  fr: {
    "settings.yourCompanies": "Vos entreprises",
    "settings.yourCompaniesHint":
      "Un compte peut travailler dans plusieurs entreprises plus votre liste personnelle. Touchez pour changer d'espace actif.",
    "settings.myPersonal": "Mon personnel",
    "settings.workspaceActive": "Actif",
    "settings.workspaceSwitch": "Changer",
    "settings.workspaceSwitched": "Espace changé.",
    "settings.workspaceSwitchError": "Impossible de changer d'espace.",
    "handoff.title": "Remettre à un propriétaire",
    "handoff.hint":
      "Déplacer des propriétés personnelles sélectionnées dans une entreprise. Vous restez manager; ils deviennent propriétaire.",
    "handoff.open": "Inviter le propriétaire",
    "handoff.pickVillas": "Propriétés à déplacer",
    "handoff.pickVillasHint":
      "Ne rien cocher pour déplacer chaque propriété personnelle de cette liste.",
    "handoff.ownerEmail": "E-mail du propriétaire",
    "handoff.ownerName": "Nom du propriétaire (optionnel)",
    "handoff.modeCreate": "Créer une nouvelle entreprise",
    "handoff.modeAttach": "Leur entreprise existante",
    "handoff.modeAttachHint":
      "Ils doivent déjà posséder un espace entreprise, puis le choisir à l'acceptation.",
    "handoff.companyName": "Nom de la nouvelle entreprise",
    "handoff.companyNamePh": "ex. Samui Coastal Villas",
    "handoff.send": "Créer le lien de passation",
    "handoff.createError": "Impossible de créer la passation.",
    "handoff.linkReady": "Partagez ce lien avec le propriétaire:",
    "handoff.loading": "Chargement de la passation…",
    "handoff.unavailable": "Ce lien de passation est invalide ou expiré.",
    "handoff.unavailableTitle": "Passation indisponible",
    "handoff.alreadyDoneTitle": "Déjà acceptée",
    "handoff.alreadyDoneHint": "Ces propriétés sont déjà dans une entreprise.",
    "handoff.goToVillas": "Aller aux propriétés",
    "handoff.acceptTitle": "Prendre la propriété",
    "handoff.acceptHint":
      "{name} veut remettre des propriétés dans votre entreprise.",
    "handoff.someone": "Quelqu'un",
    "handoff.acceptCreateCompany":
      "Accepter crée l'entreprise «{company}» avec vous comme propriétaire.",
    "handoff.acceptAttachCompany":
      "Accepter déplace ces propriétés dans une entreprise que vous possédez déjà.",
    "handoff.chooseCompany": "Entreprise qui reçoit les propriétés",
    "handoff.mustSignInAs": "Connectez-vous en tant que {email} pour accepter.",
    "handoff.signInToAccept": "Se connecter pour accepter",
    "handoff.createAccount": "Créer un compte",
    "handoff.wrongAccount":
      "Connecté en tant que {current}. Déconnectez-vous et utilisez {expected}.",
    "handoff.accept": "Accepter la passation",
    "handoff.acceptError": "Impossible d'accepter la passation.",
  },
  es: {
    "settings.yourCompanies": "Tus empresas",
    "settings.yourCompaniesHint":
      "Un acceso puede trabajar en varias empresas más tu lista personal. Toca para cambiar el espacio activo.",
    "settings.myPersonal": "Mi personal",
    "settings.workspaceActive": "Activo",
    "settings.workspaceSwitch": "Cambiar",
    "settings.workspaceSwitched": "Espacio cambiado.",
    "settings.workspaceSwitchError": "No se pudo cambiar de espacio.",
    "handoff.title": "Entregar a un dueño",
    "handoff.hint":
      "Mueve propiedades personales seleccionadas a una empresa. Tú sigues como manager; ellos pasan a ser dueños.",
    "handoff.open": "Invitar dueño",
    "handoff.pickVillas": "Propiedades a mover",
    "handoff.pickVillasHint":
      "Deja todo sin marcar para mover cada propiedad personal de esta lista.",
    "handoff.ownerEmail": "Correo del dueño",
    "handoff.ownerName": "Nombre del dueño (opcional)",
    "handoff.modeCreate": "Crear empresa nueva",
    "handoff.modeAttach": "Su empresa existente",
    "handoff.modeAttachHint":
      "Deben poseer ya un espacio de empresa y elegirlo al aceptar.",
    "handoff.companyName": "Nombre de la empresa nueva",
    "handoff.companyNamePh": "p. ej. Samui Coastal Villas",
    "handoff.send": "Crear enlace de entrega",
    "handoff.createError": "No se pudo crear la entrega.",
    "handoff.linkReady": "Comparte este enlace con el dueño:",
    "handoff.loading": "Cargando entrega…",
    "handoff.unavailable": "Este enlace de entrega no es válido o ha caducado.",
    "handoff.unavailableTitle": "Entrega no disponible",
    "handoff.alreadyDoneTitle": "Ya aceptada",
    "handoff.alreadyDoneHint": "Estas propiedades ya están en una empresa.",
    "handoff.goToVillas": "Ir a propiedades",
    "handoff.acceptTitle": "Tomar la propiedad",
    "handoff.acceptHint":
      "{name} quiere entregar propiedades a tu empresa.",
    "handoff.someone": "Alguien",
    "handoff.acceptCreateCompany":
      "Aceptar crea la empresa “{company}” con usted como dueño.",
    "handoff.acceptAttachCompany":
      "Aceptar mueve estas propiedades a una empresa que ya posees.",
    "handoff.chooseCompany": "Empresa que recibe las propiedades",
    "handoff.mustSignInAs": "Inicia sesión como {email} para aceptar.",
    "handoff.signInToAccept": "Iniciar sesión para aceptar",
    "handoff.createAccount": "Crear una cuenta",
    "handoff.wrongAccount":
      "Sesión iniciada como {current}. Cierra sesión y usa {expected}.",
    "handoff.accept": "Aceptar entrega",
    "handoff.acceptError": "No se pudo aceptar la entrega.",
  },
  it: {
    "settings.yourCompanies": "Le tue aziende",
    "settings.yourCompaniesHint":
      "Un accesso può lavorare in più aziende più la tua lista personale. Tocca per cambiare lo spazio attivo.",
    "settings.myPersonal": "Il mio personale",
    "settings.workspaceActive": "Attivo",
    "settings.workspaceSwitch": "Cambia",
    "settings.workspaceSwitched": "Spazio cambiato.",
    "settings.workspaceSwitchError": "Impossibile cambiare spazio.",
    "handoff.title": "Passa a un proprietario",
    "handoff.hint":
      "Sposta proprietà personali selezionate in un'azienda. Tu resti manager; loro diventano proprietario.",
    "handoff.open": "Invita proprietario",
    "handoff.pickVillas": "Proprietà da spostare",
    "handoff.pickVillasHint":
      "Lascia tutto deselezionato per spostare ogni proprietà personale di questo elenco.",
    "handoff.ownerEmail": "Email del proprietario",
    "handoff.ownerName": "Nome del proprietario (opzionale)",
    "handoff.modeCreate": "Crea nuova azienda",
    "handoff.modeAttach": "La loro azienda esistente",
    "handoff.modeAttachHint":
      "Devono già possedere uno spazio azienda e sceglierlo all'accettazione.",
    "handoff.companyName": "Nome della nuova azienda",
    "handoff.companyNamePh": "es. Samui Coastal Villas",
    "handoff.send": "Crea link di passaggio",
    "handoff.createError": "Impossibile creare il passaggio.",
    "handoff.linkReady": "Condividi questo link con il proprietario:",
    "handoff.loading": "Caricamento passaggio…",
    "handoff.unavailable": "Questo link di passaggio non è valido o è scaduto.",
    "handoff.unavailableTitle": "Passaggio non disponibile",
    "handoff.alreadyDoneTitle": "Già accettato",
    "handoff.alreadyDoneHint": "Queste proprietà sono già in un'azienda.",
    "handoff.goToVillas": "Vai alle proprietà",
    "handoff.acceptTitle": "Prendi la proprietà",
    "handoff.acceptHint":
      "{name} vuole passare proprietà alla tua azienda.",
    "handoff.someone": "Qualcuno",
    "handoff.acceptCreateCompany":
      "Accettare crea l'azienda “{company}” con te come proprietario.",
    "handoff.acceptAttachCompany":
      "Accettare sposta queste proprietà in un'azienda che già possiedi.",
    "handoff.chooseCompany": "Azienda che riceve le proprietà",
    "handoff.mustSignInAs": "Accedi come {email} per accettare.",
    "handoff.signInToAccept": "Accedi per accettare",
    "handoff.createAccount": "Crea un account",
    "handoff.wrongAccount":
      "Accesso come {current}. Esci e usa {expected}.",
    "handoff.accept": "Accetta passaggio",
    "handoff.acceptError": "Impossibile accettare il passaggio.",
  },
  tr: {
    "settings.yourCompanies": "Şirketleriniz",
    "settings.yourCompaniesHint":
      "Tek giriş birkaç şirket artı kişisel listenizde çalışabilir. Aktif alanı değiştirmek için dokunun.",
    "settings.myPersonal": "Kişisel alanım",
    "settings.workspaceActive": "Aktif",
    "settings.workspaceSwitch": "Değiştir",
    "settings.workspaceSwitched": "Alan değiştirildi.",
    "settings.workspaceSwitchError": "Alan değiştirilemedi.",
    "handoff.title": "Bir sahibe devret",
    "handoff.hint":
      "Seçili kişisel mülkleri bir şirkete taşıyın. Siz yönetici kalırsınız; onlar sahip olur.",
    "handoff.open": "Sahip davet et",
    "handoff.pickVillas": "Taşınacak mülkler",
    "handoff.pickVillasHint":
      "Bu listedeki her kişisel mülkü taşımak için hiçbirini işaretlemeyin.",
    "handoff.ownerEmail": "Sahip e-postası",
    "handoff.ownerName": "Sahip adı (isteğe bağlı)",
    "handoff.modeCreate": "Yeni şirket oluştur",
    "handoff.modeAttach": "Mevcut şirketleri",
    "handoff.modeAttachHint":
      "Zaten bir şirket alanına sahip olmalı ve kabul ederken onu seçmeli.",
    "handoff.companyName": "Yeni şirket adı",
    "handoff.companyNamePh": "örn. Samui Coastal Villas",
    "handoff.send": "Devir bağlantısı oluştur",
    "handoff.createError": "Devir oluşturulamadı.",
    "handoff.linkReady": "Bu bağlantıyı sahiple paylaşın:",
    "handoff.loading": "Devir yükleniyor…",
    "handoff.unavailable": "Bu devir bağlantısı geçersiz veya süresi dolmuş.",
    "handoff.unavailableTitle": "Devir kullanılamıyor",
    "handoff.alreadyDoneTitle": "Zaten kabul edildi",
    "handoff.alreadyDoneHint": "Bu mülkler zaten bir şirkette.",
    "handoff.goToVillas": "Mülklere git",
    "handoff.acceptTitle": "Sahipliği al",
    "handoff.acceptHint":
      "{name} mülkleri şirketinize devretmek istiyor.",
    "handoff.someone": "Birisi",
    "handoff.acceptCreateCompany":
      "Kabul, sizi sahip yaparak “{company}” şirketini oluşturur.",
    "handoff.acceptAttachCompany":
      "Kabul, bu mülkleri zaten sahip olduğunuz bir şirkete taşır.",
    "handoff.chooseCompany": "Mülkleri alan şirket",
    "handoff.mustSignInAs": "Kabul etmek için {email} olarak giriş yapın.",
    "handoff.signInToAccept": "Kabul etmek için giriş yap",
    "handoff.createAccount": "Hesap oluştur",
    "handoff.wrongAccount":
      "{current} olarak giriş yapıldı. Çıkış yapıp {expected} kullanın.",
    "handoff.accept": "Devri kabul et",
    "handoff.acceptError": "Devir kabul edilemedi.",
  },
  ru: {
    "settings.yourCompanies": "Ваши компании",
    "settings.yourCompaniesHint":
      "Один вход может работать в нескольких компаниях плюс ваш личный список. Нажмите, чтобы сменить активное пространство.",
    "settings.myPersonal": "Моё личное",
    "settings.workspaceActive": "Активно",
    "settings.workspaceSwitch": "Сменить",
    "settings.workspaceSwitched": "Пространство сменено.",
    "settings.workspaceSwitchError": "Не удалось сменить пространство.",
    "handoff.title": "Передать владельцу",
    "handoff.hint":
      "Перенесите выбранные личные объекты в компанию. Вы остаётесь управляющим; они становятся владельцем.",
    "handoff.open": "Пригласить владельца",
    "handoff.pickVillas": "Объекты для переноса",
    "handoff.pickVillasHint":
      "Ничего не отмечать, чтобы перенести каждый личный объект в этом списке.",
    "handoff.ownerEmail": "Email владельца",
    "handoff.ownerName": "Имя владельца (необязательно)",
    "handoff.modeCreate": "Создать новую компанию",
    "handoff.modeAttach": "Их существующая компания",
    "handoff.modeAttachHint":
      "Они уже должны владеть пространством компании и выбрать его при принятии.",
    "handoff.companyName": "Название новой компании",
    "handoff.companyNamePh": "напр. Samui Coastal Villas",
    "handoff.send": "Создать ссылку передачи",
    "handoff.createError": "Не удалось создать передачу.",
    "handoff.linkReady": "Поделитесь этой ссылкой с владельцем:",
    "handoff.loading": "Загрузка передачи…",
    "handoff.unavailable": "Эта ссылка передачи недействительна или устарела.",
    "handoff.unavailableTitle": "Передача недоступна",
    "handoff.alreadyDoneTitle": "Уже принято",
    "handoff.alreadyDoneHint": "Эти объекты уже в компании.",
    "handoff.goToVillas": "К объектам",
    "handoff.acceptTitle": "Принять владение",
    "handoff.acceptHint":
      "{name} хочет передать объекты в вашу компанию.",
    "handoff.someone": "Кто-то",
    "handoff.acceptCreateCompany":
      "Принятие создаёт компанию «{company}» с вами как владельцем.",
    "handoff.acceptAttachCompany":
      "Принятие переносит эти объекты в компанию, которой вы уже владеете.",
    "handoff.chooseCompany": "Компания, которая получает объекты",
    "handoff.mustSignInAs": "Войдите как {email}, чтобы принять.",
    "handoff.signInToAccept": "Войти, чтобы принять",
    "handoff.createAccount": "Создать аккаунт",
    "handoff.wrongAccount":
      "Вход выполнен как {current}. Выйдите и используйте {expected}.",
    "handoff.accept": "Принять передачу",
    "handoff.acceptError": "Не удалось принять передачу.",
  },
  he: {
    "settings.yourCompanies": "החברות שלך",
    "settings.yourCompaniesHint":
      "התחברות אחת יכולה לעבוד בכמה חברות וברשימה האישית. הקישו כדי להחליף סביבה פעילה.",
    "settings.myPersonal": "האישי שלי",
    "settings.workspaceActive": "פעיל",
    "settings.workspaceSwitch": "החלף",
    "settings.workspaceSwitched": "הסביבה הוחלפה.",
    "settings.workspaceSwitchError": "לא ניתן להחליף סביבה.",
    "handoff.title": "מסירה לבעלים",
    "handoff.hint":
      "העבירו נכסים אישיים נבחרים לחברה. אתם נשארים מנהלים; הם הופכים לבעלים.",
    "handoff.open": "הזמנת בעלים",
    "handoff.pickVillas": "נכסים להעברה",
    "handoff.pickVillasHint":
      "השאירו הכול לא מסומן כדי להעביר כל נכס אישי ברשימה זו.",
    "handoff.ownerEmail": "אימייל הבעלים",
    "handoff.ownerName": "שם הבעלים (אופציונלי)",
    "handoff.modeCreate": "יצירת חברה חדשה",
    "handoff.modeAttach": "החברה הקיימת שלהם",
    "handoff.modeAttachHint":
      "עליהם כבר להיות בעלים של סביבת חברה ולבחור אותה בקבלה.",
    "handoff.companyName": "שם החברה החדשה",
    "handoff.companyNamePh": "למשל Samui Coastal Villas",
    "handoff.send": "יצירת קישור מסירה",
    "handoff.createError": "לא ניתן ליצור מסירה.",
    "handoff.linkReady": "שתפו את הקישור עם הבעלים:",
    "handoff.loading": "טוען מסירה…",
    "handoff.unavailable": "קישור המסירה אינו תקף או שפג תוקפו.",
    "handoff.unavailableTitle": "מסירה אינה זמינה",
    "handoff.alreadyDoneTitle": "כבר התקבלה",
    "handoff.alreadyDoneHint": "הנכסים האלה כבר בחברה.",
    "handoff.goToVillas": "לנכסים",
    "handoff.acceptTitle": "קבלת בעלות",
    "handoff.acceptHint": "{name} רוצה למסור נכסים לחברה שלכם.",
    "handoff.someone": "מישהו",
    "handoff.acceptCreateCompany":
      "קבלה יוצרת את החברה “{company}” עםכם כבעלים.",
    "handoff.acceptAttachCompany":
      "קבלה מעבירה את הנכסים לחברה שכבר בבעלותכם.",
    "handoff.chooseCompany": "החברה שמקבלת את הנכסים",
    "handoff.mustSignInAs": "התחברו כ־{email} כדי לקבל.",
    "handoff.signInToAccept": "התחברות לקבלה",
    "handoff.createAccount": "יצירת חשבון",
    "handoff.wrongAccount":
      "מחוברים כ־{current}. התנתקו והשתמשו ב־{expected}.",
    "handoff.accept": "קבלת מסירה",
    "handoff.acceptError": "לא ניתן לקבל את המסירה.",
  },
  ar: {
    "settings.yourCompanies": "شركاتك",
    "settings.yourCompaniesHint":
      "تسجيل دخول واحد يمكنه العمل في عدة شركات إضافة إلى قائمتك الشخصية. المس للتبديل إلى المساحة النشطة.",
    "settings.myPersonal": "شخصي",
    "settings.workspaceActive": "نشط",
    "settings.workspaceSwitch": "تبديل",
    "settings.workspaceSwitched": "تم تبديل المساحة.",
    "settings.workspaceSwitchError": "تعذر تبديل المساحة.",
    "handoff.title": "تسليم لمالك",
    "handoff.hint":
      "انقل عقارات شخصية محددة إلى شركة. تبقى مديراً؛ يصبحون المالك.",
    "handoff.open": "دعوة المالك",
    "handoff.pickVillas": "عقارات للنقل",
    "handoff.pickVillasHint":
      "اترك الكل بلا تحديد لنقل كل عقار شخصي في هذه القائمة.",
    "handoff.ownerEmail": "بريد المالك",
    "handoff.ownerName": "اسم المالك (اختياري)",
    "handoff.modeCreate": "إنشاء شركة جديدة",
    "handoff.modeAttach": "شركتهم الحالية",
    "handoff.modeAttachHint":
      "يجب أن يمتلكوا مسبقاً مساحة شركة ثم يختاروها عند القبول.",
    "handoff.companyName": "اسم الشركة الجديدة",
    "handoff.companyNamePh": "مثال Samui Coastal Villas",
    "handoff.send": "إنشاء رابط التسليم",
    "handoff.createError": "تعذر إنشاء التسليم.",
    "handoff.linkReady": "شارك هذا الرابط مع المالك:",
    "handoff.loading": "جارٍ تحميل التسليم…",
    "handoff.unavailable": "رابط التسليم غير صالح أو منتهٍ.",
    "handoff.unavailableTitle": "التسليم غير متاح",
    "handoff.alreadyDoneTitle": "مقبول مسبقاً",
    "handoff.alreadyDoneHint": "هذه العقارات موجودة أصلاً في شركة.",
    "handoff.goToVillas": "إلى العقارات",
    "handoff.acceptTitle": "تولي الملكية",
    "handoff.acceptHint": "{name} يريد تسليم عقارات إلى شركتك.",
    "handoff.someone": "شخص ما",
    "handoff.acceptCreateCompany":
      "القبول ينشئ شركة “{company}” وأنت المالك.",
    "handoff.acceptAttachCompany":
      "القبول ينقل هذه العقارات إلى شركة تملكها مسبقاً.",
    "handoff.chooseCompany": "الشركة التي تستلم العقارات",
    "handoff.mustSignInAs": "سجّل الدخول كـ {email} للقبول.",
    "handoff.signInToAccept": "تسجيل الدخول للقبول",
    "handoff.createAccount": "إنشاء حساب",
    "handoff.wrongAccount":
      "مسجّل الدخول كـ {current}. سجّل الخروج واستخدم {expected}.",
    "handoff.accept": "قبول التسليم",
    "handoff.acceptError": "تعذر قبول التسليم.",
  },
  th: {
    "settings.yourCompanies": "บริษัทของคุณ",
    "settings.yourCompaniesHint":
      "ล็อกอินเดียวทำงานได้หลายบริษัทบวกรายการส่วนตัวของคุณ แตะเพื่อสลับพื้นที่ที่ใช้งาน",
    "settings.myPersonal": "ส่วนตัวของฉัน",
    "settings.workspaceActive": "ใช้งานอยู่",
    "settings.workspaceSwitch": "สลับ",
    "settings.workspaceSwitched": "สลับพื้นที่แล้ว",
    "settings.workspaceSwitchError": "สลับพื้นที่ไม่ได้",
    "handoff.title": "ส่งมอบให้เจ้าของ",
    "handoff.hint":
      "ย้ายทรัพย์สินส่วนตัวที่เลือกเข้าบริษัท คุณอยู่เป็นผู้จัดการ พวกเขาเป็นเจ้าของ",
    "handoff.open": "เชิญเจ้าของ",
    "handoff.pickVillas": "ทรัพย์สินที่ย้าย",
    "handoff.pickVillasHint":
      "ไม่เลือกอะไรเลยเพื่อย้ายทรัพย์สินส่วนตัวทุกหลังในรายการนี้",
    "handoff.ownerEmail": "อีเมลเจ้าของ",
    "handoff.ownerName": "ชื่อเจ้าของ (ไม่บังคับ)",
    "handoff.modeCreate": "สร้างบริษัทใหม่",
    "handoff.modeAttach": "บริษัทที่มีอยู่ของพวกเขา",
    "handoff.modeAttachHint":
      "พวกเขาต้องมีพื้นที่บริษัทอยู่แล้ว แล้วเลือกตอนยอมรับ",
    "handoff.companyName": "ชื่อบริษัทใหม่",
    "handoff.companyNamePh": "เช่น Samui Coastal Villas",
    "handoff.send": "สร้างลิงก์ส่งมอบ",
    "handoff.createError": "สร้างการส่งมอบไม่ได้",
    "handoff.linkReady": "แชร์ลิงก์นี้กับเจ้าของ:",
    "handoff.loading": "กำลังโหลดการส่งมอบ…",
    "handoff.unavailable": "ลิงก์ส่งมอบนี้ไม่ถูกต้องหรือหมดอายุ",
    "handoff.unavailableTitle": "การส่งมอบไม่พร้อมใช้",
    "handoff.alreadyDoneTitle": "ยอมรับแล้ว",
    "handoff.alreadyDoneHint": "ทรัพย์สินเหล่านี้อยู่ในบริษัทแล้ว",
    "handoff.goToVillas": "ไปที่ทรัพย์สิน",
    "handoff.acceptTitle": "รับความเป็นเจ้าของ",
    "handoff.acceptHint": "{name} ต้องการส่งมอบทรัพย์สินเข้าบริษัทของคุณ",
    "handoff.someone": "ใครบางคน",
    "handoff.acceptCreateCompany":
      "การยอมรับจะสร้างบริษัท “{company}” โดยคุณเป็นเจ้าของ",
    "handoff.acceptAttachCompany":
      "การยอมรับจะย้ายทรัพย์สินเหล่านี้เข้าบริษัทที่คุณเป็นเจ้าของอยู่แล้ว",
    "handoff.chooseCompany": "บริษัทที่รับทรัพย์สิน",
    "handoff.mustSignInAs": "เข้าสู่ระบบเป็น {email} เพื่อยอมรับ",
    "handoff.signInToAccept": "เข้าสู่ระบบเพื่อยอมรับ",
    "handoff.createAccount": "สร้างบัญชี",
    "handoff.wrongAccount":
      "เข้าสู่ระบบเป็น {current} ออกจากระบบแล้วใช้ {expected}",
    "handoff.accept": "ยอมรับการส่งมอบ",
    "handoff.acceptError": "ยอมรับการส่งมอบไม่ได้",
  },
  my: {
    "settings.yourCompanies": "သင့်ကုမ္ပဏီများ",
    "settings.yourCompaniesHint":
      "လော့ဂ်အင်တစ်ခုသည် ကုမ္ပဏီအများနှင့် ကိုယ်ပိုင်စာရင်းတွင် အလုပ်လုပ်နိုင်သည်။ တက်ကြွသောလုပ်ငန်းခွင်ပြောင်းရန် တို့ပါ။",
    "settings.myPersonal": "ကျွန်ုပ်၏ကိုယ်ပိုင်",
    "settings.workspaceActive": "တက်ကြွ",
    "settings.workspaceSwitch": "ပြောင်း",
    "settings.workspaceSwitched": "လုပ်ငန်းခွင်ပြောင်းပြီး။",
    "settings.workspaceSwitchError": "လုပ်ငန်းခွင်ပြောင်း၍မရပါ။",
    "handoff.title": "ပိုင်ရှင်ထံ လွှဲပါ",
    "handoff.hint":
      "ရွေးထားသော ကိုယ်ပိုင်ပိုင်ဆိုင်မှုများကို ကုမ္ပဏီသို့ ရွှေ့ပါ။ သင်မန်နေဂျာအဖြစ် ဆက်ရှိပြီး သူတို့ပိုင်ရှင်ဖြစ်သည်။",
    "handoff.open": "ပိုင်ရှင်ဖိတ်ပါ",
    "handoff.pickVillas": "ရွှေ့မည့်ပိုင်ဆိုင်မှုများ",
    "handoff.pickVillasHint":
      "ဤစာရင်းရှိ ကိုယ်ပိုင်ပိုင်ဆိုင်မှုအားလုံး ရွှေ့ရန် မရွေးဘဲ ထားပါ။",
    "handoff.ownerEmail": "ပိုင်ရှင်အီးမေးလ်",
    "handoff.ownerName": "ပိုင်ရှင်အမည် (ရွေးချယ်နိုင်)",
    "handoff.modeCreate": "ကုမ္ပဏီအသစ်ဖန်တီး",
    "handoff.modeAttach": "သူတို့၏ရှိပြီးသားကုမ္ပဏီ",
    "handoff.modeAttachHint":
      "ကုမ္ပဏီလုပ်ငန်းခွင်ကို အရင်ပိုင်ပြီး လက်ခံချိန်တွင် ရွေးရမည်။",
    "handoff.companyName": "ကုမ္ပဏီအသစ်အမည်",
    "handoff.companyNamePh": "ဥပမာ Samui Coastal Villas",
    "handoff.send": "လွှဲလင့်ခ်ဖန်တီး",
    "handoff.createError": "လွှဲပြောင်းဖန်တီး၍မရပါ။",
    "handoff.linkReady": "ဤလင့်ခ်ကို ပိုင်ရှင်နှင့် မျှဝေပါ:",
    "handoff.loading": "လွှဲပြောင်းတင်နေသည်…",
    "handoff.unavailable": "ဤလွှဲလင့်ခ် မမှန်ကန် သို့မဟုတ် သက်တမ်းကုန်သည်။",
    "handoff.unavailableTitle": "လွှဲပြောင်းမရနိုင်",
    "handoff.alreadyDoneTitle": "လက်ခံပြီး",
    "handoff.alreadyDoneHint": "ဤပိုင်ဆိုင်မှုများသည် ကုမ္ပဏီတွင် ရှိပြီးသား။",
    "handoff.goToVillas": "ပိုင်ဆိုင်မှုများသို့",
    "handoff.acceptTitle": "ပိုင်ဆိုင်မှုယူပါ",
    "handoff.acceptHint":
      "{name} က ပိုင်ဆိုင်မှုများကို သင့်ကုမ္ပဏီသို့ လွှဲလိုသည်။",
    "handoff.someone": "တစ်ဦးဦး",
    "handoff.acceptCreateCompany":
      "လက်ခံခြင်းသည် သင်ပိုင်ရှင်အဖြစ် “{company}” ကုမ္ပဏီကို ဖန်တီးသည်။",
    "handoff.acceptAttachCompany":
      "လက်ခံခြင်းသည် ဤပိုင်ဆိုင်မှုများကို သင်ပိုင်ပြီးသားကုမ္ပဏီသို့ ရွှေ့သည်။",
    "handoff.chooseCompany": "ပိုင်ဆိုင်မှုများလက်ခံမည့်ကုမ္ပဏီ",
    "handoff.mustSignInAs": "လက်ခံရန် {email} အဖြစ် ဝင်ပါ။",
    "handoff.signInToAccept": "လက်ခံရန် ဝင်ပါ",
    "handoff.createAccount": "အကောင့်ဖန်တီး",
    "handoff.wrongAccount":
      "{current} အဖြစ် ဝင်ထားသည်။ ထွက်ပြီး {expected} သုံးပါ။",
    "handoff.accept": "လွှဲပြောင်းလက်ခံ",
    "handoff.acceptError": "လွှဲပြောင်းလက်ခံ၍မရပါ။",
  },
};

function replaceKey(src, key, value) {
  const re = new RegExp(
    `(\\s${JSON.stringify(key)}:\\s)([\`"'])([\\s\\S]*?)\\2`,
    "m",
  );
  if (!re.test(src)) {
    throw new Error(`missing key ${key}`);
  }
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return src.replace(re, `$1"${escaped}"`);
}

for (const [locale, map] of Object.entries(patches)) {
  const file = path.join(dictDir, `${locale}.ts`);
  let src = fs.readFileSync(file, "utf8");
  for (const [key, value] of Object.entries(map)) {
    const clean = value.replace(/[—–]/g, ", ");
    src = replaceKey(src, key, clean);
  }
  fs.writeFileSync(file, src);
  console.log("patched", locale, Object.keys(map).length);
}
