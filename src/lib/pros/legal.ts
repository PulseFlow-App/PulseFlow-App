import { prosLang } from "@/lib/pros/catalog";
import type { ProsLang } from "@/lib/pros/types";

export const LEGAL_UPDATED = "1 November 2026";

type Copy = Record<ProsLang, string>;

export type LegalAudience = "staff" | "customer";

export type LegalSection = {
  id: string;
  audience: LegalAudience;
  doc: "terms" | "privacy";
  heading: Copy;
  body: Copy;
};

const n = (en: string, th: string, ru: string, he: string): Copy => ({ en, th, ru, he });

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: "what",
    audience: "staff",
    doc: "terms",
    heading: n("What Pulse Flow Services is", "Pulse Flow Services คืออะไร", "Что такое Pulse Flow Services", "מה זה Pulse Flow Services"),
    body: n(
      "Pulse Flow Services introduces you to people who do house maintenance. The first places are Koh Phangan, Koh Samui, and Koh Tao. Other places can be added. We are not the person who does the work.",
      "Pulse Flow Services แนะนำคุณให้รู้จักคนทำงานซ่อมบำรุงบ้าน พื้นที่แรกคือเกาะพะงัน เกาะสมุย และเกาะเต่า เพิ่มพื้นที่อื่นได้ เราไม่ใช่คนที่ทำงานนั้น",
      "Pulse Flow Services знакомит вас с людьми, которые делают домашний ремонт. Первые места — Ко Панган, Ко Самуи и Ко Тао. Другие места можно добавить. Мы не тот человек, который выполняет работу.",
      "Pulse Flow Services מציג אתכם לאנשים שעושים תחזוקת בית. המקומות הראשונים הם קו פנגן, קו סמוי וקו טאו. אפשר להוסיף מקומות אחרים. אנחנו לא האדם שמבצע את העבודה.",
    ),
  },
  {
    id: "accounts",
    audience: "staff",
    doc: "terms",
    heading: n("Accounts", "บัญชี", "Аккаунты", "חשבונות"),
    body: n(
      "You need an account to send a request, open a full profile, or list yourself as maintenance staff. Use your own name and a real email.",
      "ต้องมีบัญชีเพื่อส่งคำขอ เปิดโปรไฟล์เต็ม หรือลงประกาศเป็นช่างบำรุง ใช้ชื่อและอีเมลจริงของคุณ",
      "Аккаунт нужен, чтобы отправить заявку, открыть полный профиль или разместить себя как мастера. Укажите своё имя и настоящую почту.",
      "צריך חשבון כדי לשלוח בקשה, לפתוח פרופיל מלא או להירשם כצוות תחזוקה. השתמשו בשם שלכם ובדוא״ל אמיתי.",
    ),
  },
  {
    id: "orders",
    audience: "staff",
    doc: "terms",
    heading: n("Orders", "คำสั่ง", "Заказы", "הזמנות"),
    body: n(
      "The trial is 3 free orders. Each next order opens after a review of the finished job. After those 3, everyone gets 1 free order a month. Premium is 9 USD a month. Pro is 14 USD a month and includes the AI agent. Payment is not collected yet. Turning a plan on does not charge you.",
      "ทดลองใช้ได้ 3 คำสั่งฟรี คำสั่งถัดไปเปิดหลังรีวิวงานที่เสร็จ หลังจากนั้นทุกคนได้ 1 คำสั่งฟรีต่อเดือน Premium 9 ดอลลาร์ต่อเดือน Pro 14 ดอลลาร์ต่อเดือน รวมผู้ช่วย AI ยังไม่เก็บเงิน การเปิดแผนไม่เรียกเก็บเงิน",
      "Пробный период — 3 бесплатных заказа. Следующий открывается после отзыва о законченной работе. Затем у всех 1 бесплатный заказ в месяц. Premium — 9 USD в месяц. Pro — 14 USD в месяц и включает ИИ-агента. Оплату пока не берём. Включение плана ничего не списывает.",
      "הניסיון הוא 3 הזמנות חינם. ההזמנה הבאה נפתחת אחרי ביקורת על העבודה שנגמרה. אחר כך לכל אחד הזמנה חינם אחת בחודש. Premium הוא 9 דולר לחודש. Pro הוא 14 דולר לחודש וכולל את סוכן ה-AI. התשלום עדיין לא נגבה. הפעלת תוכנית לא מחייבת.",
    ),
  },
  {
    id: "payment",
    audience: "staff",
    doc: "terms",
    heading: n("Payment", "การชำระเงิน", "Оплата", "תשלום"),
    body: n(
      "Pulse Flow Services does not take payment and does not hold money. You pay the professional directly. We do not guarantee the work will be accepted or how it turns out.",
      "Pulse Flow Services ไม่รับชำระเงินและไม่ถือเงิน คุณจ่ายให้ช่างโดยตรง เราไม่รับประกันว่างานจะได้รับการตอบรับหรือผลงานจะเป็นอย่างไร",
      "Pulse Flow Services не принимает оплату и не хранит деньги. Вы платите специалисту напрямую. Мы не гарантируем, что работу примут, и не гарантируем результат.",
      "Pulse Flow Services לא גובה תשלום ולא מחזיק כסף. אתם משלמים לבעל המקצוע ישירות. אנחנו לא ערבים לכך שהעבודה תתקבל או לתוצאה.",
    ),
  },
  {
    id: "listings",
    audience: "staff",
    doc: "terms",
    heading: n("Listings", "ประกาศ", "Объявления", "מודעות"),
    body: n(
      "A maintenance listing stays hidden until that person opens it. Phone, WhatsApp, and LINE are not on the public list. We do not invent ratings or job counts. If nobody is listed in an area, the page says so.",
      "ประกาศช่างจะซ่อนไว้จนกว่าคนนั้นจะเปิดเอง โทรศัพท์ WhatsApp และ LINE ไม่แสดงในรายชื่อสาธารณะ เราไม่สร้างคะแนนหรือจำนวนงานขึ้นมา ถ้ายังไม่มีคนในพื้นที่ หน้าจะบอกอย่างนั้น",
      "Объявление мастера скрыто, пока он сам его не откроет. Телефон, WhatsApp и LINE нет в публичном списке. Мы не придумываем оценки и число работ. Если в районе никого нет, страница так и говорит.",
      "מודעת תחזוקה נשארת מוסתרת עד שהאדם פותח אותה. טלפון, וואטסאפ ו-LINE לא מופיעים ברשימה הציבורית. אנחנו לא ממציאים דירוגים או מספר עבודות. אם אין אף אחד באזור, הדף אומר זאת.",
    ),
  },
  {
    id: "your-part",
    audience: "staff",
    doc: "terms",
    heading: n("Your part", "ส่วนของคุณ", "Ваша часть", "החלק שלכם"),
    body: n(
      "Do not post anything unlawful, and do not pretend to be someone else. Photos you add should be of the job.",
      "อย่าโพสต์สิ่งผิดกฎหมาย และอย่าแอบอ้างเป็นคนอื่น รูปที่เพิ่มควรเป็นรูปของงาน",
      "Не публикуйте ничего незаконного и не выдавайте себя за другого человека. Фото должны относиться к работе.",
      "אל תפרסמו דבר שאינו חוקי ואל תתחזו למישהו אחר. תמונות שמוסיפים צריכות להיות של העבודה.",
    ),
  },
  {
    id: "ending",
    audience: "staff",
    doc: "terms",
    heading: n("Ending", "การปิด", "Закрытие", "סיום"),
    body: n(
      "You can hide a listing in Settings. To close an account, write to services@pulseflow.site.",
      "ซ่อนประกาศได้ในตั้งค่า หากต้องการปิดบัญชี เขียนถึง services@pulseflow.site",
      "Объявление можно скрыть в настройках. Чтобы закрыть аккаунт, напишите на services@pulseflow.site.",
      "אפשר להסתיר מודעה בהגדרות. כדי לסגור חשבון כתבו אל services@pulseflow.site.",
    ),
  },
  {
    id: "store",
    audience: "staff",
    doc: "privacy",
    heading: n("What we store", "สิ่งที่เราเก็บ", "Что мы храним", "מה אנחנו שומרים"),
    body: n(
      "We store your name, email, and password for the account. Phone, WhatsApp, and LINE only if you type them. We store the text and photos of a request, the area, and the language. We store the time you accepted these terms, and whether you asked for email.",
      "เราเก็บชื่อ อีเมล และรหัสผ่านของบัญชี โทรศัพท์ WhatsApp และ LINE เฉพาะเมื่อคุณกรอก เราเก็บข้อความและรูปของคำขอ พื้นที่ และภาษา เราเก็บเวลาที่ยอมรับข้อกำหนด และว่าคุณขอรับอีเมลหรือไม่",
      "Мы храним имя, почту и пароль аккаунта. Телефон, WhatsApp и LINE — только если вы их ввели. Мы храним текст и фото заявки, район и язык. Мы храним время согласия с условиями и то, просили ли вы письма.",
      "אנחנו שומרים שם, דוא״ל וסיסמה לחשבון. טלפון, וואטסאפ ו-LINE רק אם הקלדתם אותם. אנחנו שומרים את הטקסט והתמונות של בקשה, את האזור ואת השפה. אנחנו שומרים את הזמן שבו קיבלתם את התנאים, ואם ביקשתם דוא״ל.",
    ),
  },
  {
    id: "see",
    audience: "staff",
    doc: "privacy",
    heading: n("Who can see it", "ใครเห็นได้", "Кто это видит", "מי יכול לראות"),
    body: n(
      "Guests see a name, a profession, and a rating when one exists. They do not see phone, WhatsApp, or LINE. A signed-in person can open a profile that was made public.",
      "ผู้เยี่ยมชมเห็นชื่อ อาชีพ และคะแนนถ้ามี ไม่เห็นโทรศัพท์ WhatsApp หรือ LINE คนที่เข้าสู่ระบบเปิดโปรไฟล์ที่ถูกตั้งเป็นสาธารณะได้",
      "Гости видят имя, профессию и оценку, если она есть. Телефон, WhatsApp и LINE им не видны. Вошедший человек может открыть профиль, который сделали публичным.",
      "אורחים רואים שם, מקצוע ודירוג אם יש. הם לא רואים טלפון, וואטסאפ או LINE. אדם מחובר יכול לפתוח פרופיל שהוגדר כציבורי.",
    ),
  },
  {
    id: "email",
    audience: "staff",
    doc: "privacy",
    heading: n("Email", "อีเมล", "Почта", "דוא״ל"),
    body: n(
      "We send optional email only if you tick that you want it. Leave the box empty and we will not send that email.",
      "เราจะส่งอีเมลที่ไม่จำเป็นเฉพาะเมื่อคุณติ๊กว่าต้องการ ถ้าไม่ติ๊ก เราจะไม่ส่งอีเมลนั้น",
      "Необязательные письма отправляем только если вы отметили, что хотите их. Пустая отметка значит, что такое письмо не отправим.",
      "נשלח דוא״ל שאינו הכרחי רק אם סימנתם שאתם רוצים. אם התיבה ריקה, לא נשלח את הדוא״ל הזה.",
    ),
  },
  {
    id: "photos",
    audience: "staff",
    doc: "privacy",
    heading: n("Photos", "รูป", "Фото", "תמונות"),
    body: n(
      "Photos you add are stored with the request so the professional can see the job.",
      "รูปที่คุณเพิ่มจะเก็บไว้กับคำขอ เพื่อให้ช่างเห็นงาน",
      "Фото, которые вы добавляете, хранятся вместе с заявкой, чтобы специалист видел работу.",
      "תמונות שמוסיפים נשמרות עם הבקשה כדי שבעל המקצוע יראה את העבודה.",
    ),
  },
  {
    id: "ask",
    audience: "staff",
    doc: "privacy",
    heading: n("Asking us", "การขอข้อมูล", "Запрос к нам", "פנייה אלינו"),
    body: n(
      "Write to services@pulseflow.site to see or delete what we keep about you. We do not sell your details.",
      "เขียนถึง services@pulseflow.site เพื่อขอดูหรือลบข้อมูลที่เราเก็บเกี่ยวกับคุณ เราไม่ขายข้อมูลของคุณ",
      "Напишите на services@pulseflow.site, чтобы увидеть или удалить то, что мы храним о вас. Мы не продаём ваши данные.",
      "כתבו אל services@pulseflow.site כדי לראות או למחוק את מה שאנחנו שומרים עליכם. אנחנו לא מוכרים את הפרטים שלכם.",
    ),
  },
  {
    id: "c-service",
    audience: "customer",
    doc: "terms",
    heading: n("The service", "บริการ", "Сервис", "השירות"),
    body: n(
      "These terms govern a person who registers with Pulse Flow Services in order to request work from an independent professional. Pulse Flow Services provides the directory and the means to send a request. It does not employ the professional, and it does not carry out the work.",
      "ข้อกำหนดนี้ใช้กับบุคคลที่ลงทะเบียนกับ Pulse Flow Services เพื่อขอรับงานจากผู้ประกอบอาชีพอิสระ Pulse Flow Services ให้สารบบและช่องทางส่งคำขอ ไม่ได้จ้างผู้ประกอบอาชีพ และไม่ได้เป็นผู้ทำงานนั้น",
      "Эти условия относятся к человеку, который регистрируется в Pulse Flow Services, чтобы запросить работу у независимого специалиста. Pulse Flow Services предоставляет каталог и способ отправить заявку. Сервис не нанимает специалиста и не выполняет работу.",
      "תנאים אלה חלים על אדם שנרשם ל-Pulse Flow Services כדי לבקש עבודה מבעל מקצוע עצמאי. Pulse Flow Services מספק את המדריך ואת הדרך לשלוח בקשה. השירות אינו מעסיק את בעל המקצוע ואינו מבצע את העבודה.",
    ),
  },
  {
    id: "c-account",
    audience: "customer",
    doc: "terms",
    heading: n("Your account", "บัญชีของคุณ", "Ваш аккаунт", "החשבון שלכם"),
    body: n(
      "An account is required before a request can be sent and before a full profile can be opened. You agree to provide your own name and a working email address, and to keep the password confidential.",
      "ต้องมีบัญชีก่อนจึงจะส่งคำขอได้ และก่อนจึงจะเปิดโปรไฟล์เต็มได้ คุณตกลงให้ชื่อของตนเองและอีเมลที่ใช้ได้จริง และเก็บรหัสผ่านเป็นความลับ",
      "Аккаунт нужен, прежде чем можно отправить заявку и открыть полный профиль. Вы соглашаетесь указать своё имя и действующую почту и хранить пароль в тайне.",
      "נדרש חשבון לפני שאפשר לשלוח בקשה ולפני שאפשר לפתוח פרופיל מלא. אתם מסכימים למסור את שמכם וכתובת דוא״ל פעילה, ולשמור על הסיסמה בסוד.",
    ),
  },
  {
    id: "c-orders",
    audience: "customer",
    doc: "terms",
    heading: n("Orders", "คำสั่ง", "Заказы", "הזמנות"),
    body: n(
      "A new account may send three orders. The next order becomes available only after a review of the finished job. After those three, one further order is available in each calendar month. Premium is 9 US dollars a month and removes that monthly limit. Pro is 14 US dollars a month and includes the AI assistant. Payment is not collected at this time. Choosing a plan does not create a charge.",
      "บัญชีใหม่อาจส่งคำสั่งได้สามครั้ง คำสั่งถัดไปจะเปิดเมื่อมีการรีวิวงานที่เสร็จแล้วเท่านั้น หลังจากสามครั้งนั้น จะมีคำสั่งเพิ่มได้อีกหนึ่งครั้งในแต่ละเดือนปฏิทิน Premium คือ 9 ดอลลาร์สหรัฐต่อเดือน และยกเลิกขีดจำกัดรายเดือนนั้น Pro คือ 14 ดอลลาร์สหรัฐต่อเดือน และรวมผู้ช่วย AI ขณะนี้ยังไม่มีการเรียกเก็บเงิน การเลือกแผนไม่ทำให้เกิดการเรียกเก็บ",
      "Новый аккаунт может отправить три заказа. Следующий заказ открывается только после отзыва о выполненной работе. После этих трёх в каждом календарном месяце доступен ещё один заказ. Premium — 9 долларов США в месяц и снимает этот месячный предел. Pro — 14 долларов США в месяц и включает ИИ-помощника. Оплата сейчас не взимается. Выбор плана не создаёт списания.",
      "חשבון חדש יכול לשלוח שלוש הזמנות. ההזמנה הבאה נפתחת רק אחרי ביקורת על העבודה שהסתיימה. אחרי שלוש אלה, הזמנה נוספת אחת זמינה בכל חודש קלנדרי. Premium הוא 9 דולר ארה״ב לחודש ומסיר את המגבלה החודשית. Pro הוא 14 דולר ארה״ב לחודש וכולל את עוזר הבינה המלאכותית. בשלב זה לא נגבה תשלום. בחירת מסלול אינה יוצרת חיוב.",
    ),
  },
  {
    id: "c-payment",
    audience: "customer",
    doc: "terms",
    heading: n("Payment for the work", "การชำระค่างาน", "Оплата работы", "תשלום עבור העבודה"),
    body: n(
      "Pulse Flow Services does not take, hold, or transfer the price of the work. You agree the price with the professional and pay that person directly. Pulse Flow Services does not guarantee that a professional will accept a request, or the quality, timing, or result of the work.",
      "Pulse Flow Services ไม่รับ ไม่ถือ และไม่โอนค่างาน คุณตกลงราคากับผู้ประกอบอาชีพและชำระให้บุคคลนั้นโดยตรง Pulse Flow Services ไม่รับประกันว่าผู้ประกอบอาชีพจะรับคำขอ หรือคุณภาพ เวลา หรือผลของงาน",
      "Pulse Flow Services не принимает, не удерживает и не переводит стоимость работы. Цену вы согласовываете со специалистом и платите ему напрямую. Pulse Flow Services не гарантирует, что специалист примет заявку, а также качество, срок или результат работы.",
      "Pulse Flow Services אינו גובה, אינו מחזיק ואינו מעביר את מחיר העבודה. אתם מסכמים את המחיר עם בעל המקצוע ומשלמים לאותו אדם ישירות. Pulse Flow Services אינו ערב לכך שבעל מקצוע יקבל בקשה, וגם לא לאיכות, למועד או לתוצאת העבודה.",
    ),
  },
  {
    id: "c-conduct",
    audience: "customer",
    doc: "terms",
    heading: n("Use of the service", "การใช้บริการ", "Пользование сервисом", "שימוש בשירות"),
    body: n(
      "You agree not to submit unlawful content and not to misrepresent who you are. A photograph should show the job you are asking about.",
      "คุณตกลงว่าจะไม่ส่งเนื้อหาที่ผิดกฎหมาย และจะไม่แอบอ้างว่าเป็นบุคคลอื่น รูปถ่ายควรแสดงงานที่คุณขอ",
      "Вы соглашаетесь не отправлять противоправные материалы и не выдавать себя за другое лицо. Фотография должна показывать работу, о которой вы просите.",
      "אתם מסכימים שלא לשלוח תוכן בלתי חוקי ושלא להתחזות לאדם אחר. תצלום צריך להראות את העבודה שעליה אתם שואלים.",
    ),
  },
  {
    id: "c-closing",
    audience: "customer",
    doc: "terms",
    heading: n("Closing the account", "การปิดบัญชี", "Закрытие аккаунта", "סגירת החשבון"),
    body: n(
      "You may stop using the account at any time. To ask for the account to be closed, write to services@pulseflow.site.",
      "คุณอาจหยุดใช้บัญชีได้ทุกเมื่อ หากต้องการให้ปิดบัญชี เขียนถึง services@pulseflow.site",
      "Вы можете прекратить пользоваться аккаунтом в любой момент. Чтобы попросить закрыть его, напишите на services@pulseflow.site.",
      "אפשר להפסיק להשתמש בחשבון בכל עת. כדי לבקש סגירה, כתבו אל services@pulseflow.site.",
    ),
  },
  {
    id: "c-information",
    audience: "customer",
    doc: "privacy",
    heading: n("Information we process", "ข้อมูลที่เราประมวลผล", "Какие данные мы обрабатываем", "מידע שאנחנו מעבדים"),
    body: n(
      "When you register in order to look for a service, we process your name, email address, and password, the time you accepted these terms, and whether you asked to receive email. If you send a request, we also process the description, photographs, area, preferred time, and language.",
      "เมื่อคุณลงทะเบียนเพื่อมองหาบริการ เราประมวลผลชื่อ อีเมล และรหัสผ่าน เวลาที่ยอมรับข้อกำหนด และว่าคุณขอรับอีเมลหรือไม่ หากคุณส่งคำขอ เราประมวลผลคำอธิบาย รูป พื้นที่ เวลาที่สะดวก และภาษาด้วย",
      "Когда вы регистрируетесь, чтобы найти услугу, мы обрабатываем имя, почту и пароль, время принятия этих условий и то, просили ли вы письма. Если вы отправляете заявку, мы также обрабатываем описание, фотографии, район, удобное время и язык.",
      "כשאתם נרשמים כדי לחפש שירות, אנחנו מעבדים את השם, כתובת הדוא״ל והסיסמה, את המועד שבו קיבלתם תנאים אלה, ואם ביקשתם לקבל דוא״ל. אם אתם שולחים בקשה, אנחנו מעבדים גם את התיאור, התצלומים, האזור, השעה המועדפת והשפה.",
    ),
  },
  {
    id: "c-purpose",
    audience: "customer",
    doc: "privacy",
    heading: n("Why we process it", "เหตุผลที่ประมวลผล", "Зачем мы это обрабатываем", "למה אנחנו מעבדים זאת"),
    body: n(
      "We use this information to create the account, to deliver your request to the professionals you contact, and to apply the order allowance. We do not sell personal information.",
      "เราใช้ข้อมูลนี้เพื่อสร้างบัญชี เพื่อส่งคำขอของคุณถึงผู้ประกอบอาชีพที่คุณติดต่อ และเพื่อนับจำนวนคำสั่งที่เปิดได้ เราไม่ขายข้อมูลส่วนบุคคล",
      "Мы используем эти данные, чтобы создать аккаунт, передать заявку специалистам, которым вы пишете, и применить лимит заказов. Мы не продаём персональные данные.",
      "אנחנו משתמשים במידע זה כדי ליצור את החשבון, כדי להעביר את הבקשה לבעלי המקצוע שאליהם פניתם, וכדי להחיל את מכסת ההזמנות. אנחנו לא מוכרים מידע אישי.",
    ),
  },
  {
    id: "c-visibility",
    audience: "customer",
    doc: "privacy",
    heading: n("Who can see it", "ใครเห็นได้", "Кто это видит", "מי יכול לראות"),
    body: n(
      "A guest browsing the directory does not receive your telephone number. A request is visible to you and to the professionals it is sent to. Contact details on a professional profile are shown only after an account is signed in, and only where that profile has been opened.",
      "ผู้เยี่ยมชมที่ดูสารบบไม่ได้รับหมายเลขโทรศัพท์ของคุณ คำขอเห็นได้โดยคุณและโดยผู้ประกอบอาชีพที่ได้รับคำขอนั้น รายละเอียดการติดต่อบนโปรไฟล์จะแสดงหลังเข้าสู่ระบบ และเฉพาะโปรไฟล์ที่ถูกเปิดแล้ว",
      "Гость, который смотрит каталог, не получает ваш номер телефона. Заявка видна вам и специалистам, которым она отправлена. Контакты в профиле специалиста показываются только после входа в аккаунт и только если профиль открыт.",
      "אורח שמדפדף במדריך אינו מקבל את מספר הטלפון שלכם. בקשה גלויה לכם ולבעלי המקצוע שאליהם נשלחה. פרטי קשר בפרופיל של בעל מקצוע מוצגים רק אחרי התחברות לחשבון, ורק אם הפרופיל נפתח.",
    ),
  },
  {
    id: "c-email",
    audience: "customer",
    doc: "privacy",
    heading: n("Email", "อีเมล", "Почта", "דוא״ל"),
    body: n(
      "Optional messages are sent only if you tick the box asking for email. If you leave it unticked, those messages are not sent.",
      "ข้อความที่ไม่จำเป็นจะถูกส่งเฉพาะเมื่อคุณติ๊กช่องขอรับอีเมล หากไม่ติ๊ก ข้อความเหล่านั้นจะไม่ถูกส่ง",
      "Необязательные сообщения отправляются только если вы отметили просьбу о письмах. Если отметка пуста, такие сообщения не отправляются.",
      "הודעות שאינן הכרחיות נשלחות רק אם סימנתם את התיבה שמבקשת דוא״ל. אם התיבה לא מסומנת, ההודעות האלה לא נשלחות.",
    ),
  },
  {
    id: "c-ask",
    audience: "customer",
    doc: "privacy",
    heading: n("Your request to us", "คำขอถึงเรา", "Ваш запрос к нам", "הבקשה שלכם אלינו"),
    body: n(
      "You may write to services@pulseflow.site to ask what we hold about you, or to ask for it to be deleted.",
      "คุณอาจเขียนถึง services@pulseflow.site เพื่อถามว่าเราเก็บข้อมูลใดเกี่ยวกับคุณ หรือเพื่อขอให้ลบ",
      "Вы можете написать на services@pulseflow.site и спросить, какие данные о вас мы храним, или попросить их удалить.",
      "אפשר לכתוב אל services@pulseflow.site כדי לשאול מה אנחנו מחזיקים עליכם, או כדי לבקש למחוק זאת.",
    ),
  },
];

export function legalSections(doc: "terms" | "privacy", locale: string, audience: LegalAudience) {
  const lang = prosLang(locale);
  return LEGAL_SECTIONS.filter((section) => section.doc === doc && section.audience === audience).map((section) => ({
    id: section.id,
    heading: section.heading[lang],
    body: section.body[lang],
  }));
}

export function legalGroupTitle(audience: LegalAudience, locale: string) {
  const lang = prosLang(locale);
  if (audience === "staff") {
    return {
      en: "For maintenance staff",
      th: "สำหรับช่างซ่อมบำรุง",
      ru: "Для сотрудников по обслуживанию",
      he: "לצוות תחזוקה",
    }[lang];
  }
  return {
    en: "For people looking for a service",
    th: "สำหรับผู้ที่มองหาบริการ",
    ru: "Для тех, кто ищет услугу",
    he: "למי שמחפש שירות",
  }[lang];
}

export function legalTitle(doc: "terms" | "privacy", locale: string) {
  const lang = prosLang(locale);
  if (doc === "terms") {
    return { en: "Terms", th: "ข้อกำหนด", ru: "Условия", he: "תנאים" }[lang];
  }
  return { en: "Privacy", th: "ความเป็นส่วนตัว", ru: "Конфиденциальность", he: "פרטיות" }[lang];
}
