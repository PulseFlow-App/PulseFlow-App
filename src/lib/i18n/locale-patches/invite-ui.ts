import type { Dictionary } from "../dictionaries/en";
import type { Locale } from "../types";

/** Invite / join / merge profile UI — overrides English stubs in locale dictionaries. */
export const inviteUiPatches: Record<
  Exclude<Locale, "en">,
  Partial<Dictionary>
> = {
  de: {
    "guest.joinTitle": "Du bist als Gast eingeladen",
    "guest.joinHint":
      "Neu hier? Konto erstellen. Schon bei Pulse Flow mit einem anderen Unternehmen? Dieselbe E-Mail nutzen — wir fügen diesen Host zu demselben Profil hinzu.",
    "guest.joinContinue": "Weiter",
    "join.staffTitle": "Du bist zum Team eingeladen",
    "join.staffHint":
      "Neu hier? Daten ausfüllen. Schon bei einem anderen Unternehmen? Dieselbe E-Mail nutzen, damit beide Firmen unter einem Login bleiben.",
    "join.accountNote":
      "Ein Profil kann mehreren Unternehmen gehören. Wir ersetzen dein erstes Unternehmen nie — wir fügen das neue hinzu.",
    "join.passwordLabel": "Passwort",
    "join.passwordConfirm": "Passwort bestätigen",
    "join.signedInHint":
      "Du bist als {email} angemeldet. {org} zu diesem Konto hinzufügen — du behältst beide Unternehmen.",
    "join.addToAccount": "Dieses Unternehmen zu meinem Konto hinzufügen",
    "join.addingToAccount": "Wird hinzugefügt…",
    "join.orNewAccount": "Oder unten eine andere E-Mail erstellen / verwenden.",
    "join.loading": "Einladung wird geladen…",
    "join.unavailableTitle": "Einladung nicht verfügbar",
    "join.unavailableHint":
      "Dieser Link ist ungültig oder wurde bereits verwendet. Bitte deinen Eigentümer oder Manager um eine neue Einladung.",
    "join.backToSignIn": "Zurück zur Anmeldung",
    "join.jobTitle": "Stellenbezeichnung",
    "join.fullName": "Vollständiger Name",
    "join.phoneOptional": "Telefon (optional)",
    "join.joining": "Beitritt…",
    "join.accept": "Einladung annehmen & beitreten",
    "join.nameEmailRequired": "Name und E-Mail sind erforderlich.",
    "join.passwordMin": "Das Passwort muss mindestens 6 Zeichen haben.",
    "join.passwordMismatch": "Passwörter stimmen nicht überein.",
    "join.couldNotJoin": "Beitritt fehlgeschlagen.",
    "join.thisOrganization": "diese Organisation",
    "join.thisCompany": "dieses Unternehmen",
    "guest.mergeTitle": "Dieses Unternehmen zu deinem Konto hinzufügen",
    "guest.mergeHint":
      "{org} hat diese E-Mail ({email}) eingeladen. Gib dein Passwort ein, um deren Objekte zu deinem bestehenden Profil hinzuzufügen. Du behältst beide Unternehmen unter einem Login.",
    "guest.mergePassword": "Dein Passwort",
    "guest.mergeNeedPassword": "Gib dein Passwort zur Bestätigung ein.",
    "guest.mergeConfirm": "Unternehmen hinzufügen",
    "guest.mergeConfirming": "Wird hinzugefügt…",
    "guest.mergeInvalidTitle": "Link nicht verfügbar",
    "guest.mergeInvalid": "Dieser Link ist ungültig oder wurde bereits verwendet.",
    "guest.mergeUnavailable":
      "Unternehmen auf diesem Weg hinzuzufügen ist im Demo-Modus nicht verfügbar.",
    "guest.mergeEmailTitle": "Prüfe deine E-Mails",
    "guest.mergeEmailHint":
      "Für {email} existiert bereits ein Profil. Wir haben einen Link gesendet, um {org} hinzuzufügen. Öffne ihn und gib dein Passwort ein. Wenn du ihn ignorierst, ändert sich nichts.",
    "guest.mergeEmailFallback":
      "E-Mail konnte in dieser Umgebung nicht gesendet werden. Bestätige über diesen Link:",
    "guest.mergeOpenLink": "Dieses Unternehmen hinzufügen",
  },
  fr: {
    "guest.joinTitle": "Vous êtes invité en tant qu’invité",
    "guest.joinHint":
      "Nouveau ? Créez un compte. Déjà sur Pulse Flow avec une autre entreprise ? Utilisez le même e-mail — nous ajouterons cet hôte au même profil.",
    "guest.joinContinue": "Continuer",
    "join.staffTitle": "Vous êtes invité dans l’équipe",
    "join.staffHint":
      "Nouveau ? Remplissez vos infos. Déjà dans une autre entreprise ? Utilisez le même e-mail pour garder les deux sous un seul login.",
    "join.accountNote":
      "Un profil peut appartenir à plusieurs entreprises. Nous ne remplaçons jamais la première — nous ajoutons la nouvelle.",
    "join.passwordLabel": "Mot de passe",
    "join.passwordConfirm": "Confirmer le mot de passe",
    "join.signedInHint":
      "Connecté en tant que {email}. Ajoutez {org} à ce compte — vous conservez les deux entreprises.",
    "join.addToAccount": "Ajouter cette entreprise à mon compte",
    "join.addingToAccount": "Ajout…",
    "join.orNewAccount": "Ou créez / utilisez un autre e-mail ci-dessous.",
    "join.loading": "Chargement de l’invitation…",
    "join.unavailableTitle": "Invitation indisponible",
    "join.unavailableHint":
      "Ce lien est invalide ou déjà utilisé. Demandez une nouvelle invitation à votre propriétaire ou manager.",
    "join.backToSignIn": "Retour à la connexion",
    "join.jobTitle": "Intitulé du poste",
    "join.fullName": "Nom complet",
    "join.phoneOptional": "Téléphone (facultatif)",
    "join.joining": "Inscription…",
    "join.accept": "Accepter l’invitation et rejoindre",
    "join.nameEmailRequired": "Le nom et l’e-mail sont obligatoires.",
    "join.passwordMin": "Le mot de passe doit contenir au moins 6 caractères.",
    "join.passwordMismatch": "Les mots de passe ne correspondent pas.",
    "join.couldNotJoin": "Impossible de rejoindre.",
    "join.thisOrganization": "cette organisation",
    "join.thisCompany": "cette entreprise",
    "guest.mergeTitle": "Ajouter cette entreprise à votre compte",
    "guest.mergeHint":
      "{org} a invité cet e-mail ({email}). Entrez votre mot de passe pour ajouter leurs biens à votre profil existant. Vous gardez les deux entreprises sous un seul login.",
    "guest.mergePassword": "Votre mot de passe",
    "guest.mergeNeedPassword": "Entrez votre mot de passe pour confirmer.",
    "guest.mergeConfirm": "Ajouter l’entreprise",
    "guest.mergeConfirming": "Ajout…",
    "guest.mergeInvalidTitle": "Lien indisponible",
    "guest.mergeInvalid": "Ce lien est invalide ou déjà utilisé.",
    "guest.mergeUnavailable":
      "Ajouter une entreprise ainsi n’est pas disponible en mode démo.",
    "guest.mergeEmailTitle": "Vérifiez votre e-mail",
    "guest.mergeEmailHint":
      "Un profil existe déjà pour {email}. Nous avons envoyé un lien pour ajouter {org}. Ouvrez-le et entrez votre mot de passe. Si vous l’ignorez, rien ne change.",
    "guest.mergeEmailFallback":
      "L’e-mail n’a pas pu être envoyé dans cet environnement. Confirmez via ce lien :",
    "guest.mergeOpenLink": "Ajouter cette entreprise",
  },
  es: {
    "guest.joinTitle": "Estás invitado como huésped",
    "guest.joinHint":
      "¿Nuevo? Crea una cuenta. ¿Ya en Pulse Flow con otra empresa? Usa el mismo correo — añadiremos este anfitrión al mismo perfil.",
    "guest.joinContinue": "Continuar",
    "join.staffTitle": "Estás invitado al equipo",
    "join.staffHint":
      "¿Nuevo? Completa tus datos. ¿Ya en otra empresa? Usa el mismo correo para mantener ambas en un solo inicio de sesión.",
    "join.accountNote":
      "Un perfil puede pertenecer a varias empresas. Nunca reemplazamos la primera — añadimos la nueva.",
    "join.passwordLabel": "Contraseña",
    "join.passwordConfirm": "Confirmar contraseña",
    "join.signedInHint":
      "Has iniciado sesión como {email}. Añade {org} a esta cuenta — conservarás ambas empresas.",
    "join.addToAccount": "Añadir esta empresa a mi cuenta",
    "join.addingToAccount": "Añadiendo…",
    "join.orNewAccount": "O crea / usa otro correo abajo.",
    "join.loading": "Cargando invitación…",
    "join.unavailableTitle": "Invitación no disponible",
    "join.unavailableHint":
      "Este enlace no es válido o ya se usó. Pide una nueva invitación a tu propietario o manager.",
    "join.backToSignIn": "Volver a iniciar sesión",
    "join.jobTitle": "Puesto",
    "join.fullName": "Nombre completo",
    "join.phoneOptional": "Teléfono (opcional)",
    "join.joining": "Uniéndose…",
    "join.accept": "Aceptar invitación y unirse",
    "join.nameEmailRequired": "El nombre y el correo son obligatorios.",
    "join.passwordMin": "La contraseña debe tener al menos 6 caracteres.",
    "join.passwordMismatch": "Las contraseñas no coinciden.",
    "join.couldNotJoin": "No se pudo unir.",
    "join.thisOrganization": "esta organización",
    "join.thisCompany": "esta empresa",
    "guest.mergeTitle": "Añadir esta empresa a tu cuenta",
    "guest.mergeHint":
      "{org} invitó este correo ({email}). Introduce tu contraseña para añadir sus propiedades a tu perfil. Conservas ambas empresas en un solo inicio de sesión.",
    "guest.mergePassword": "Tu contraseña",
    "guest.mergeNeedPassword": "Introduce tu contraseña para confirmar.",
    "guest.mergeConfirm": "Añadir empresa",
    "guest.mergeConfirming": "Añadiendo…",
    "guest.mergeInvalidTitle": "Enlace no disponible",
    "guest.mergeInvalid": "Este enlace no es válido o ya se usó.",
    "guest.mergeUnavailable":
      "Añadir una empresa así no está disponible en modo demo.",
    "guest.mergeEmailTitle": "Revisa tu correo",
    "guest.mergeEmailHint":
      "Ya existe un perfil para {email}. Enviamos un enlace para añadir {org}. Ábrelo e introduce tu contraseña. Si lo ignoras, no cambia nada.",
    "guest.mergeEmailFallback":
      "No se pudo enviar el correo en este entorno. Confirma con este enlace:",
    "guest.mergeOpenLink": "Añadir esta empresa",
  },
  it: {
    "guest.joinTitle": "Sei invitato come ospite",
    "guest.joinHint":
      "Nuovo? Crea un account. Già su Pulse Flow con un’altra azienda? Usa la stessa email — aggiungeremo questo host allo stesso profilo.",
    "guest.joinContinue": "Continua",
    "join.staffTitle": "Sei invitato nel team",
    "join.staffHint":
      "Nuovo? Compila i tuoi dati. Già in un’altra azienda? Usa la stessa email così entrambe restano con un solo accesso.",
    "join.accountNote":
      "Un profilo può appartenere a più aziende. Non sostituiamo mai la prima — aggiungiamo la nuova.",
    "join.passwordLabel": "Password",
    "join.passwordConfirm": "Conferma password",
    "join.signedInHint":
      "Accesso come {email}. Aggiungi {org} a questo account — terrai entrambe le aziende.",
    "join.addToAccount": "Aggiungi questa azienda al mio account",
    "join.addingToAccount": "Aggiunta…",
    "join.orNewAccount": "Oppure crea / usa un’altra email qui sotto.",
    "join.loading": "Caricamento invito…",
    "join.unavailableTitle": "Invito non disponibile",
    "join.unavailableHint":
      "Questo link non è valido o è già stato usato. Chiedi un nuovo invito al proprietario o al manager.",
    "join.backToSignIn": "Torna all’accesso",
    "join.jobTitle": "Mansione",
    "join.fullName": "Nome completo",
    "join.phoneOptional": "Telefono (facoltativo)",
    "join.joining": "Accesso in corso…",
    "join.accept": "Accetta invito e unisciti",
    "join.nameEmailRequired": "Nome ed email sono obbligatori.",
    "join.passwordMin": "La password deve avere almeno 6 caratteri.",
    "join.passwordMismatch": "Le password non coincidono.",
    "join.couldNotJoin": "Impossibile unirsi.",
    "join.thisOrganization": "questa organizzazione",
    "join.thisCompany": "questa azienda",
    "guest.mergeTitle": "Aggiungi questa azienda al tuo account",
    "guest.mergeHint":
      "{org} ha invitato questa email ({email}). Inserisci la password per aggiungere le loro proprietà al profilo esistente. Mantieni entrambe le aziende con un solo accesso.",
    "guest.mergePassword": "La tua password",
    "guest.mergeNeedPassword": "Inserisci la password per confermare.",
    "guest.mergeConfirm": "Aggiungi azienda",
    "guest.mergeConfirming": "Aggiunta…",
    "guest.mergeInvalidTitle": "Link non disponibile",
    "guest.mergeInvalid": "Questo link non è valido o è già stato usato.",
    "guest.mergeUnavailable":
      "Aggiungere un’azienda in questo modo non è disponibile in modalità demo.",
    "guest.mergeEmailTitle": "Controlla la tua email",
    "guest.mergeEmailHint":
      "Esiste già un profilo per {email}. Abbiamo inviato un link per aggiungere {org}. Aprilo e inserisci la password. Se lo ignori, non cambia nulla.",
    "guest.mergeEmailFallback":
      "L’email non è stata inviata in questo ambiente. Conferma con questo link:",
    "guest.mergeOpenLink": "Aggiungi questa azienda",
  },
  th: {
    "guest.joinTitle": "คุณได้รับเชิญในฐานะแขก",
    "guest.joinHint":
      "ใหม่ที่นี่? สร้างบัญชี หากมี Pulse Flow กับบริษัทอื่นแล้ว ใช้ อีเมลเดิม — เราจะเพิ่มโฮสต์นี้ในโปรไฟล์เดียวกัน",
    "guest.joinContinue": "ดำเนินการต่อ",
    "join.staffTitle": "คุณได้รับเชิญเข้าทีม",
    "join.staffHint":
      "ใหม่ที่นี่? กรอกข้อมูล หากอยู่กับบริษัทอื่นแล้ว ใช้ อีเมลเดิมเพื่อให้ทั้งสองบริษัทใช้ล็อกอินเดียว",
    "join.accountNote":
      "โปรไฟล์หนึ่งสามารถอยู่หลายบริษัทได้ เราไม่แทนที่บริษัทแรก — เราเพิ่มบริษัทใหม่",
    "join.passwordLabel": "รหัสผ่าน",
    "join.passwordConfirm": "ยืนยันรหัสผ่าน",
    "join.signedInHint":
      "คุณลงชื่อเข้าใช้เป็น {email} เพิ่ม {org} ในบัญชีนี้ — คุณจะมีทั้งสองบริษัท",
    "join.addToAccount": "เพิ่มบริษัทนี้ในบัญชีของฉัน",
    "join.addingToAccount": "กำลังเพิ่ม…",
    "join.orNewAccount": "หรือสร้าง / ใช้อีเมลอื่นด้านล่าง",
    "join.loading": "กำลังโหลดคำเชิญ…",
    "join.unavailableTitle": "คำเชิญไม่พร้อมใช้งาน",
    "join.unavailableHint":
      "ลิงก์นี้ไม่ถูกต้องหรือถูกใช้แล้ว ขอคำเชิญใหม่จากเจ้าของหรือผู้จัดการ",
    "join.backToSignIn": "กลับไปลงชื่อเข้าใช้",
    "join.jobTitle": "ตำแหน่งงาน",
    "join.fullName": "ชื่อเต็ม",
    "join.phoneOptional": "โทรศัพท์ (ไม่บังคับ)",
    "join.joining": "กำลังเข้าร่วม…",
    "join.accept": "ยอมรับคำเชิญและเข้าร่วม",
    "join.nameEmailRequired": "ต้องระบุชื่อและอีเมล",
    "join.passwordMin": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    "join.passwordMismatch": "รหัสผ่านไม่ตรงกัน",
    "join.couldNotJoin": "เข้าร่วมไม่สำเร็จ",
    "join.thisOrganization": "องค์กรนี้",
    "join.thisCompany": "บริษัทนี้",
    "guest.mergeTitle": "เพิ่มบริษัทนี้ในบัญชีของคุณ",
    "guest.mergeHint":
      "{org} ได้เชิญอีเมลนี้ ({email}) กรอกรหัสผ่านเพื่อเพิ่มที่พักของพวกเขาในโปรไฟล์ที่มีอยู่ คุณจะมีทั้งสองบริษัทภายใต้ล็อกอินเดียว",
    "guest.mergePassword": "รหัสผ่านของคุณ",
    "guest.mergeNeedPassword": "กรอกรหัสผ่านเพื่อยืนยัน",
    "guest.mergeConfirm": "เพิ่มบริษัท",
    "guest.mergeConfirming": "กำลังเพิ่ม…",
    "guest.mergeInvalidTitle": "ลิงก์ไม่พร้อมใช้งาน",
    "guest.mergeInvalid": "ลิงก์นี้ไม่ถูกต้องหรือถูกใช้แล้ว",
    "guest.mergeUnavailable":
      "การเพิ่มบริษัทด้วยวิธีนี้ไม่พร้อมในโหมดเดโม",
    "guest.mergeEmailTitle": "ตรวจสอบอีเมลของคุณ",
    "guest.mergeEmailHint":
      "มีโปรไฟล์สำหรับ {email} อยู่แล้ว เราส่งลิงก์เพื่อเพิ่ม {org} แล้ว เปิดแล้วกรอกรหัสผ่าน หากเพิกเฉย จะไม่มีการเปลี่ยนแปลง",
    "guest.mergeEmailFallback":
      "ส่งอีเมลไม่ได้ในสภาพแวดล้อมนี้ ยืนยันด้วยลิงก์นี้:",
    "guest.mergeOpenLink": "เพิ่มบริษัทนี้",
  },
  my: {
    "guest.joinTitle": "ဧည့်သည်အဖြစ် ဖိတ်ကြားထားသည်",
    "guest.joinHint":
      "အသစ်လား? အကောင့်ဖန်တီးပါ။ အခြားကုမ္ပဏီနှင့် Pulse Flow ရှိပြီးသားဆိုရင် အီးမေးလ်တူသုံးပါ — ဤအိမ်ရှင်ကို တူညီသော ပရိုဖိုင်သို့ ထည့်ပါမည်။",
    "guest.joinContinue": "ဆက်လုပ်ရန်",
    "join.staffTitle": "အဖွဲ့သို့ ဖိတ်ကြားထားသည်",
    "join.staffHint":
      "အသစ်လား? အချက်အလက်ဖြည့်ပါ။ အခြားကုမ္ပဏီရှိပြီးသားဆိုရင် အီးမေးလ်တူသုံးပြီး ကုမ္ပဏီနှစ်ခုကို login တစ်ခုတည်းဖြင့် ထားပါ။",
    "join.accountNote":
      "ပရိုဖိုင်တစ်ခုသည် ကုမ္ပဏီများစွာနှင့် ချိတ်ဆက်နိုင်သည်။ ပထမကုမ္ပဏီကို မအစားထိုးပါ — အသစ်ကို ထည့်ပါသည်။",
    "join.passwordLabel": "စကားဝှက်",
    "join.passwordConfirm": "စကားဝှက် အတည်ပြုရန်",
    "join.signedInHint":
      "{email} ဖြင့် ဝင်ရောက်ထားသည်။ {org} ကို ဤအကောင့်သို့ ထည့်ပါ — ကုမ္ပဏီနှစ်ခုလုံး ထားရှိမည်။",
    "join.addToAccount": "ဤကုမ္ပဏီကို ကျွန်ုပ်၏ အကောင့်သို့ ထည့်ရန်",
    "join.addingToAccount": "ထည့်နေသည်…",
    "join.orNewAccount": "သို့မဟုတ် အောက်တွင် အီးမေးလ်အသစ် ဖန်တီး / သုံးပါ။",
    "join.loading": "ဖိတ်ကြားချက် တင်နေသည်…",
    "join.unavailableTitle": "ဖိတ်ကြားချက် မရနိုင်ပါ",
    "join.unavailableHint":
      "ဤလင့်ခ် မမှန်ကန် သို့မဟုတ် သုံးပြီးသားဖြစ်သည်။ ပိုင်ရှင် သို့မဟုတ် မန်နေဂျာထံ ဖိတ်ကြားချက်အသစ် တောင်းပါ။",
    "join.backToSignIn": "လက်မှတ်ထိုးဝင်ရန် ပြန်သွားမည်",
    "join.jobTitle": "ရာထူး",
    "join.fullName": "အမည်အပြည့်အစုံ",
    "join.phoneOptional": "ဖုန်း (ရွေးချယ်နိုင်)",
    "join.joining": "ပါဝင်နေသည်…",
    "join.accept": "ဖိတ်ကြားချက် လက်ခံပြီး ပါဝင်မည်",
    "join.nameEmailRequired": "အမည်နှင့် အီးမေးလ် လိုအပ်သည်။",
    "join.passwordMin": "စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံး ရှိရမည်။",
    "join.passwordMismatch": "စကားဝှက်များ မတူညီပါ။",
    "join.couldNotJoin": "ပါဝင်၍ မရပါ။",
    "join.thisOrganization": "ဤအဖွဲ့အစည်း",
    "join.thisCompany": "ဤကုမ္ပဏီ",
    "guest.mergeTitle": "ဤကုမ္ပဏီကို သင့်အကောင့်သို့ ထည့်ရန်",
    "guest.mergeHint":
      "{org} သည် ဤအီးမေးလ် ({email}) ကို ဖိတ်ကြားထားသည်။ စကားဝှက်ထည့်ပြီး ၎င်းတို့၏ ပိုင်ဆိုင်မှုများကို ရှိပြီးသား ပရိုဖိုင်သို့ ထည့်ပါ။ ကုမ္ပဏီနှစ်ခုလုံးကို login တစ်ခုတည်းဖြင့် ထားရှိမည်။",
    "guest.mergePassword": "သင့်စကားဝှက်",
    "guest.mergeNeedPassword": "အတည်ပြုရန် စကားဝှက် ထည့်ပါ။",
    "guest.mergeConfirm": "ကုမ္ပဏီ ထည့်ရန်",
    "guest.mergeConfirming": "ထည့်နေသည်…",
    "guest.mergeInvalidTitle": "လင့်ခ် မရနိုင်ပါ",
    "guest.mergeInvalid": "ဤလင့်ခ် မမှန်ကန် သို့မဟုတ် သုံးပြီးသားဖြစ်သည်။",
    "guest.mergeUnavailable":
      "ဒီမိုမုဒ်တွင် ဤနည်းဖြင့် ကုမ္ပဏီ ထည့်၍ မရပါ။",
    "guest.mergeEmailTitle": "သင့်အီးမေးလ်ကို စစ်ဆေးပါ",
    "guest.mergeEmailHint":
      "{email} အတွက် ပရိုဖိုင် ရှိပြီးသားဖြစ်သည်။ {org} ထည့်ရန် လင့်ခ် ပို့ထားသည်။ ဖွင့်ပြီး စကားဝှက် ထည့်ပါ။ လျစ်လျူရှုပါက ဘာမှ မပြောင်းလဲပါ။",
    "guest.mergeEmailFallback":
      "ဤပတ်ဝန်းကျင်တွင် အီးမေးလ် ပို့မရပါ။ ဤလင့်ခ်ဖြင့် အတည်ပြုပါ:",
    "guest.mergeOpenLink": "ဤကုမ္ပဏီကို ထည့်ရန်",
  },
  he: {
    "guest.joinTitle": "הוזמנת כאורח",
    "guest.joinHint":
      "חדש כאן? צור חשבון. כבר ב-Pulse Flow עם חברה אחרת? השתמש באותו אימייל — נוסיף את המארח הזה לאותו פרופיל.",
    "guest.joinContinue": "המשך",
    "join.staffTitle": "הוזמנת לצוות",
    "join.staffHint":
      "חדש כאן? מלא את הפרטים. כבר בחברה אחרת? השתמש באותו אימייל כדי ששתי החברות יישארו תחת התחברות אחת.",
    "join.accountNote":
      "פרופיל אחד יכול להיות שייך לכמה חברות. לעולם לא מחליפים את החברה הראשונה — מוסיפים את החדשה.",
    "join.passwordLabel": "סיסמה",
    "join.passwordConfirm": "אימות סיסמה",
    "join.signedInHint":
      "מחובר כ-{email}. הוסף את {org} לחשבון הזה — תשמור על שתי החברות.",
    "join.addToAccount": "הוסף את החברה הזו לחשבון שלי",
    "join.addingToAccount": "מוסיף…",
    "join.orNewAccount": "או צור / השתמש באימייל אחר למטה.",
    "join.loading": "טוען הזמנה…",
    "join.unavailableTitle": "ההזמנה אינה זמינה",
    "join.unavailableHint":
      "הקישור אינו תקף או שכבר נעשה בו שימוש. בקש הזמנה חדשה מהבעלים או מהמנהל.",
    "join.backToSignIn": "חזרה להתחברות",
    "join.jobTitle": "תפקיד",
    "join.fullName": "שם מלא",
    "join.phoneOptional": "טלפון (אופציונלי)",
    "join.joining": "מצטרף…",
    "join.accept": "קבל הזמנה והצטרף",
    "join.nameEmailRequired": "שם ואימייל נדרשים.",
    "join.passwordMin": "הסיסמה חייבת להכיל לפחות 6 תווים.",
    "join.passwordMismatch": "הסיסמאות אינן תואמות.",
    "join.couldNotJoin": "לא ניתן להצטרף.",
    "join.thisOrganization": "הארגון הזה",
    "join.thisCompany": "החברה הזו",
    "guest.mergeTitle": "הוסף את החברה הזו לחשבון שלך",
    "guest.mergeHint":
      "{org} הזמין את האימייל הזה ({email}). הזן את הסיסמה כדי להוסיף את הנכסים שלהם לפרופיל הקיים. שתי החברות נשארות תחת התחברות אחת.",
    "guest.mergePassword": "הסיסמה שלך",
    "guest.mergeNeedPassword": "הזן את הסיסמה לאישור.",
    "guest.mergeConfirm": "הוסף חברה",
    "guest.mergeConfirming": "מוסיף…",
    "guest.mergeInvalidTitle": "הקישור אינו זמין",
    "guest.mergeInvalid": "הקישור אינו תקף או שכבר נעשה בו שימוש.",
    "guest.mergeUnavailable":
      "הוספת חברה כך אינה זמינה במצב הדגמה.",
    "guest.mergeEmailTitle": "בדוק את האימייל שלך",
    "guest.mergeEmailHint":
      "כבר קיים פרופיל עבור {email}. שלחנו קישור להוספת {org}. פתח אותו והזן סיסמה. אם תתעלם, שום דבר לא משתנה.",
    "guest.mergeEmailFallback":
      "לא ניתן לשלוח אימייל בסביבה זו. אשר באמצעות הקישור:",
    "guest.mergeOpenLink": "הוסף את החברה הזו",
  },
  ar: {
    "guest.joinTitle": "أنت مدعو كضيف",
    "guest.joinHint":
      "جديد هنا؟ أنشئ حسابًا. لديك بالفعل Pulse Flow مع شركة أخرى؟ استخدم نفس البريد — سنضيف هذا المضيف إلى نفس الملف.",
    "guest.joinContinue": "متابعة",
    "join.staffTitle": "أنت مدعو إلى الفريق",
    "join.staffHint":
      "جديد هنا؟ أدخل بياناتك. لديك شركة أخرى؟ استخدم نفس البريد ليبقى كلاهما بتسجيل دخول واحد.",
    "join.accountNote":
      "يمكن لملف واحد أن ينتمي لعدة شركات. لا نستبدل شركتك الأولى أبدًا — نضيف الجديدة.",
    "join.passwordLabel": "كلمة المرور",
    "join.passwordConfirm": "تأكيد كلمة المرور",
    "join.signedInHint":
      "أنت مسجّل الدخول كـ {email}. أضف {org} إلى هذا الحساب — ستحتفظ بالشركتين.",
    "join.addToAccount": "أضف هذه الشركة إلى حسابي",
    "join.addingToAccount": "جارٍ الإضافة…",
    "join.orNewAccount": "أو أنشئ / استخدم بريدًا آخر أدناه.",
    "join.loading": "جارٍ تحميل الدعوة…",
    "join.unavailableTitle": "الدعوة غير متاحة",
    "join.unavailableHint":
      "هذا الرابط غير صالح أو مستخدم بالفعل. اطلب دعوة جديدة من المالك أو المدير.",
    "join.backToSignIn": "العودة لتسجيل الدخول",
    "join.jobTitle": "المسمى الوظيفي",
    "join.fullName": "الاسم الكامل",
    "join.phoneOptional": "الهاتف (اختياري)",
    "join.joining": "جارٍ الانضمام…",
    "join.accept": "قبول الدعوة والانضمام",
    "join.nameEmailRequired": "الاسم والبريد مطلوبان.",
    "join.passwordMin": "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    "join.passwordMismatch": "كلمتا المرور غير متطابقتين.",
    "join.couldNotJoin": "تعذّر الانضمام.",
    "join.thisOrganization": "هذه المنظمة",
    "join.thisCompany": "هذه الشركة",
    "guest.mergeTitle": "أضف هذه الشركة إلى حسابك",
    "guest.mergeHint":
      "دعت {org} هذا البريد ({email}). أدخل كلمة المرور لإضافة عقاراتهم إلى ملفك الحالي. تحتفظ بالشركتين بتسجيل دخول واحد.",
    "guest.mergePassword": "كلمة مرورك",
    "guest.mergeNeedPassword": "أدخل كلمة المرور للتأكيد.",
    "guest.mergeConfirm": "إضافة الشركة",
    "guest.mergeConfirming": "جارٍ الإضافة…",
    "guest.mergeInvalidTitle": "الرابط غير متاح",
    "guest.mergeInvalid": "هذا الرابط غير صالح أو مستخدم بالفعل.",
    "guest.mergeUnavailable":
      "إضافة شركة بهذه الطريقة غير متاحة في وضع العرض التوضيحي.",
    "guest.mergeEmailTitle": "تحقق من بريدك",
    "guest.mergeEmailHint":
      "يوجد ملف لـ {email} بالفعل. أرسلنا رابطًا لإضافة {org}. افتحه وأدخل كلمة المرور. إن تجاهلته فلن يتغير شيء.",
    "guest.mergeEmailFallback":
      "تعذّر إرسال البريد في هذه البيئة. أكّد عبر هذا الرابط:",
    "guest.mergeOpenLink": "أضف هذه الشركة",
  },
  ru: {
    "guest.joinTitle": "Вас пригласили как гостя",
    "guest.joinHint":
      "Впервые здесь? Создайте аккаунт. Уже в Pulse Flow с другой компанией? Используйте тот же email — мы добавим этого хоста к тому же профилю.",
    "guest.joinContinue": "Продолжить",
    "join.staffTitle": "Вас пригласили в команду",
    "join.staffHint":
      "Впервые здесь? Заполните данные. Уже в другой компании? Используйте тот же email, чтобы обе компании остались под одним входом.",
    "join.accountNote":
      "Один профиль может относиться к нескольким компаниям. Мы никогда не заменяем первую — добавляем новую.",
    "join.passwordLabel": "Пароль",
    "join.passwordConfirm": "Подтвердите пароль",
    "join.signedInHint":
      "Вы вошли как {email}. Добавьте {org} к этому аккаунту — обе компании останутся у вас.",
    "join.addToAccount": "Добавить эту компанию в мой аккаунт",
    "join.addingToAccount": "Добавление…",
    "join.orNewAccount": "Или создайте / используйте другой email ниже.",
    "join.loading": "Загрузка приглашения…",
    "join.unavailableTitle": "Приглашение недоступно",
    "join.unavailableHint":
      "Эта ссылка недействительна или уже использована. Попросите новое приглашение у владельца или менеджера.",
    "join.backToSignIn": "Вернуться ко входу",
    "join.jobTitle": "Должность",
    "join.fullName": "Полное имя",
    "join.phoneOptional": "Телефон (необязательно)",
    "join.joining": "Присоединение…",
    "join.accept": "Принять приглашение и присоединиться",
    "join.nameEmailRequired": "Имя и email обязательны.",
    "join.passwordMin": "Пароль должен содержать не менее 6 символов.",
    "join.passwordMismatch": "Пароли не совпадают.",
    "join.couldNotJoin": "Не удалось присоединиться.",
    "join.thisOrganization": "эта организация",
    "join.thisCompany": "эта компания",
    "guest.mergeTitle": "Добавить эту компанию в аккаунт",
    "guest.mergeHint":
      "{org} пригласил этот email ({email}). Введите пароль, чтобы добавить их объекты к существующему профилю. Обе компании останутся под одним входом.",
    "guest.mergePassword": "Ваш пароль",
    "guest.mergeNeedPassword": "Введите пароль для подтверждения.",
    "guest.mergeConfirm": "Добавить компанию",
    "guest.mergeConfirming": "Добавление…",
    "guest.mergeInvalidTitle": "Ссылка недоступна",
    "guest.mergeInvalid": "Эта ссылка недействительна или уже использована.",
    "guest.mergeUnavailable":
      "Добавление компании таким способом недоступно в демо-режиме.",
    "guest.mergeEmailTitle": "Проверьте почту",
    "guest.mergeEmailHint":
      "Профиль для {email} уже существует. Мы отправили ссылку, чтобы добавить {org}. Откройте её и введите пароль. Если проигнорировать — ничего не изменится.",
    "guest.mergeEmailFallback":
      "Не удалось отправить письмо в этой среде. Подтвердите по этой ссылке:",
    "guest.mergeOpenLink": "Добавить эту компанию",
  },
};
