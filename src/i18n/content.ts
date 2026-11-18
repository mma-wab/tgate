import type { Lang } from '../types/proxy';

export type PlatformId = 'android' | 'ios' | 'windows' | 'desktop';

export interface GuideStep {
  title: string;
  body: string;
}

export interface PlatformGuide {
  intro: string;
  steps: GuideStep[];
  note: string;
}

export const platformGuides: Record<PlatformId, Record<Lang, PlatformGuide>> = {
  android: {
    ar: {
      intro: 'أسرع طريقة هي فتح رابط البروكسي من صفحة التفاصيل، ثم تأكيده داخل تلغرام.',
      steps: [
        {
          title: 'افتح صفحة البروكسي',
          body: 'اضغط «الاتصال بتلغرام» بجانب البروكسي الذي اخترته. سيفتح رابط t.me الرسمي في المتصفح أو مباشرة في تطبيق تلغرام.',
        },
        {
          title: 'أكّد التفعيل',
          body: 'يعرض تلغرام نافذة تُظهر اسم البروتوكول والخادم. راجع البيانات ثم اضغط «تمكين» أو «اتصال».',
        },
        {
          title: 'تحقق من الإعداد',
          body: 'اذهب إلى الإعدادات ← البيانات والتخزين ← إعدادات البروكسي. يجب أن يظهر البروكسي مفعّلًا، مع إمكانية إيقافه في أي وقت.',
        },
        {
          title: 'للإضافة اليدوية',
          body: 'من إعدادات البروكسي اختر «إضافة بروكسي» ← MTProto، ثم أدخل الخادم والمنفذ والمفتاح المنشورين في صفحة التفاصيل.',
        },
      ],
      note: 'قد تختلف تسميات القوائم قليلًا بحسب إصدار أندرويد ونسخة تلغرام. حدّث التطبيق إن لم تجد الخيار.',
    },
    en: {
      intro: 'The quickest route is opening the proxy link from its details page, then confirming it inside Telegram.',
      steps: [
        {
          title: 'Open the proxy page',
          body: 'Tap “Connect to Telegram” next to the proxy you chose. The official t.me link opens in your browser or directly in Telegram.',
        },
        {
          title: 'Confirm activation',
          body: 'Telegram shows the protocol and server details. Review them, then tap Enable or Connect.',
        },
        {
          title: 'Verify the setting',
          body: 'Go to Settings → Data and Storage → Proxy Settings. The proxy should be enabled, and you can disable it at any time.',
        },
        {
          title: 'Add it manually instead',
          body: 'From proxy settings, choose Add Proxy → MTProto, then enter the server, port, and secret shown on the details page.',
        },
      ],
      note: 'Menu labels can vary by Android version and Telegram release. Update the app if a setting is not where you expect.',
    },
  },
  ios: {
    ar: {
      intro: 'يفتح رابط t.me نافذة تأكيد أصلية على iOS قبل تفعيل أي بروكسي.',
      steps: [
        {
          title: 'اضغط زر الاتصال',
          body: 'من صفحة التفاصيل، اضغط «الاتصال بتلغرام». إن سألك النظام عن التطبيق الذي يفتح الرابط، اختر تلغرام.',
        },
        {
          title: 'راجع النافذة ووافق',
          body: 'يظهر اسم البروتوكول والخادم والمنفذ. لا تتابع إذا كانت البيانات لا تطابق الصفحة التي راجعتها.',
        },
        {
          title: 'تأكد من الحالة',
          body: 'افتح الإعدادات ← البيانات والتخزين ← البروكسي. يظهر البروكسي الفعّال هناك، ويمكنك تعطيله أو حذفه.',
        },
        {
          title: 'الإضافة اليدوية',
          body: 'من شاشة البروكسي اضغط «إضافة بروكسي» ← MTProto، ثم أدخل الخادم والمنفذ والمفتاح.',
        },
      ],
      note: 'إذا لم يفتح الرابط، انسخه وألصقه في محادثة «الرسائل المحفوظة» داخل تلغرام، ثم اضغط عليه من هناك.',
    },
    en: {
      intro: 'A t.me link opens a native iOS confirmation sheet before any proxy is enabled.',
      steps: [
        {
          title: 'Tap Connect',
          body: 'On the details page, tap “Connect to Telegram.” If iOS asks which app should open the link, choose Telegram.',
        },
        {
          title: 'Review and confirm',
          body: 'The sheet shows the protocol, server, and port. Stop if these do not match the page you reviewed.',
        },
        {
          title: 'Check the status',
          body: 'Open Settings → Data and Storage → Proxy. The active proxy appears there and can be disabled or removed.',
        },
        {
          title: 'Manual setup',
          body: 'On the Proxy screen, tap Add Proxy → MTProto, then enter the server, port, and secret.',
        },
      ],
      note: 'If the link does not open, copy it into a Telegram Saved Messages chat and tap it there.',
    },
  },
  windows: {
    ar: {
      intro: 'على ويندوز، تأكد من وجود تلغرام سطح المكتب أولًا، ثم افتح رابط البروكسي.',
      steps: [
        {
          title: 'افتح الرابط من المتصفح',
          body: 'اضغط «الاتصال بتلغرام». قد يسألك المتصفح عن التطبيق الذي يفتح رابط t.me؛ اختر Telegram Desktop.',
        },
        {
          title: 'وافق داخل التطبيق',
          body: 'يعرض تلغرام سطح المكتب طلب تفعيل البروكسي. راجع الخادم والمنفذ ثم وافق.',
        },
        {
          title: 'تحقق من نوع الاتصال',
          body: 'من الإعدادات ← المتقدم ← نوع الاتصال، يجب أن يظهر البروكسي ضمن الاتصال المخصص. أوقفه من هناك عند الحاجة.',
        },
        {
          title: 'إذا لم يعمل الرابط',
          body: 'حدّث تلغرام سطح المكتب، أو استخدم الإضافة اليدوية إذا كان إصدارك يعرض إعدادات MTProto في نافذة الاتصال.',
        },
      ],
      note: 'هذا الموقع لا يشغّل بروكسيًا ولا يحتاج صلاحيات إضافية على جهازك؛ هو يفتح رابط تلغرام الرسمي فقط.',
    },
    en: {
      intro: 'On Windows, install Telegram Desktop first, then open the proxy link.',
      steps: [
        {
          title: 'Open the link in your browser',
          body: 'Tap “Connect to Telegram.” Your browser may ask which app should handle the t.me link; choose Telegram Desktop.',
        },
        {
          title: 'Approve it in the app',
          body: 'Telegram Desktop asks whether to enable the proxy. Verify the server and port, then confirm.',
        },
        {
          title: 'Check the connection type',
          body: 'Under Settings → Advanced → Connection type, the proxy should appear as the custom connection. You can disable it there.',
        },
        {
          title: 'If the link fails',
          body: 'Update Telegram Desktop. If your build exposes MTProto fields, use manual setup from the connection settings.',
        },
      ],
      note: 'This site does not run a proxy and requests no permissions on your device; it only opens Telegram’s official link.',
    },
  },
  desktop: {
    ar: {
      intro: 'ينطبق هذا على تلغرام سطح المكتب على macOS وLinux، مع خطوات مشابهة لنظام ويندوز.',
      steps: [
        {
          title: 'افتح رابط البروكسي',
          body: 'اضغط زر الاتصال. يُمرَّر رابط t.me إلى تلغرام سطح المكتب عبر نظام التشغيل.',
        },
        {
          title: 'أكّد الطلب',
          body: 'راجع بيانات البروتوكول والخادم في النافذة المنبثقة، ثم فعّل البروكسي.',
        },
        {
          title: 'راجع الإعدادات',
          body: 'افتح الإعدادات ← المتقدم ← نوع الاتصال للتأكد من أن البروكسي مفعّل، ولتعطيله لاحقًا.',
        },
        {
          title: 'للإعداد اليدوي',
          body: 'استخدم بيانات الخادم والمنفذ والمفتاح من صفحة التفاصيل، إن كان إصدارك يدعم إدخال MTProto يدويًا.',
        },
      ],
      note: 'الإصدارات القديمة قد لا تدعم بعض أنواع البروكسيات. حدّث التطبيق من المصدر الرسمي دائمًا.',
    },
    en: {
      intro: 'This applies to Telegram Desktop on macOS and Linux; Windows steps are nearly identical.',
      steps: [
        {
          title: 'Open the proxy link',
          body: 'Tap Connect. The operating system passes the t.me link to Telegram Desktop.',
        },
        {
          title: 'Confirm the request',
          body: 'Review the protocol and server details in the prompt, then enable the proxy.',
        },
        {
          title: 'Review settings',
          body: 'Open Settings → Advanced → Connection type to confirm the proxy is active and to disable it later.',
        },
        {
          title: 'Manual setup',
          body: 'Use the server, port, and secret from the details page if your build supports entering MTProto proxies manually.',
        },
      ],
      note: 'Older builds may not support every proxy type. Always update from an official source.',
    },
  },
};

export const howContent: Record<
  Lang,
  {
    what: string[];
    why: string[];
    manual: string;
    linkFirst: string;
  }
> = {
  ar: {
    what: [
      'بروكسي MTProto هو خادم وسيط يفهم بروتوكول تلغرام. يمرّر حركة التطبيق المشفّرة بين جهازك وخوادم تلغرام، بدل اتصال مباشر قد يكون محجوبًا أو بطيئًا.',
      'يُستخدم المفتاح السري لتعريف نقطة النهاية وتمويه حركة الاتصال. المفتاح ليس كلمة مرور لحسابك، بل جزء من رابط البروكسي نفسه.',
      'بروكسي MTProto ليس VPN. لا يوجّه إلا حركة تلغرام، ولا يضيف تشفيرًا من طرف إلى طرف. التشفير يأتي من بروتوكول تلغرام.',
    ],
    why: [
      'تجاوز حجب أو تقييد شبكي يمنع الوصول إلى خوادم تلغرام.',
      'تحسين الاستقرار في شبكات بطيئة أو غير موثوقة.',
      'إخفاء عنوان IP عن خوادم تلغرام نفسها، مع بقائه ظاهرًا لمشغّل البروكسي.',
      'الوصول إلى تلغرام في بيئات تُراقب فيها حركة الشبكة، ضمن حدود ما يسمح به القانون المحلي.',
    ],
    manual:
      'تختلف تسمية الإعدادات بين الإصدارات. ابحث عن «البروكسي» داخل إعدادات البيانات والتخزين، أو «نوع الاتصال» في الإعدادات المتقدمة على سطح المكتب.',
    linkFirst:
      'ابدأ دائمًا من رابط t.me/proxy الذي تنشئه صفحة التفاصيل، لأن تلغرام يعرض ملخصًا قبل التفعيل ويسمح لك بالتراجع.',
  },
  en: {
    what: [
      'An MTProto proxy is an intermediary that understands Telegram’s protocol. It forwards the app’s encrypted traffic between your device and Telegram’s servers instead of a direct connection that may be blocked or slow.',
      'The secret identifies the endpoint and helps obfuscate the transport. It is not a password for your account; it is part of the proxy link itself.',
      'An MTProto proxy is not a VPN. It routes Telegram traffic only and does not add end-to-end encryption. Encryption comes from Telegram’s protocol.',
    ],
    why: [
      'Reaching Telegram on networks that block or throttle its servers.',
      'Improving stability on slow or unreliable connections.',
      'Hiding your IP address from Telegram’s servers while exposing it to the proxy operator.',
      'Accessing Telegram on monitored networks, within the limits of local law.',
    ],
    manual:
      'Settings labels vary by release. Look for Proxy under Data and Storage, or Connection type under Advanced settings on desktop.',
    linkFirst:
      'Always start from the t.me/proxy link built by the details page. Telegram shows a summary before activation and lets you reverse it.',
  },
};

export const faqItems: Record<Lang, Array<{ q: string; a: string }>> = {
  ar: [
    {
      q: 'ما هو بروكسي MTProto؟',
      a: 'خادم وسيط مخصص لتلغرام يمرّر حركة MTProto المشفّرة بين تطبيقك وخوادم تلغرام. يساعد عند حجب تلغرام أو بطء الاتصال، ولا يوجّه بقية تطبيقات جهازك مثل VPN.',
    },
    {
      q: 'هل استخدام بروكسي تلغرام مجاني؟',
      a: 'هذا الدليل مجاني ولا يتطلب حسابًا. معظم البروكسيات المدرجة يقدمها مشغّلون مجانًا، وقد يحصلون على دخل عبر رسائل ممولة أو تبرعات. كن حذرًا من أي جهة تطلب دفعًا مقابل «ضمان أمان» أو تطلب بيانات حسابك.',
    },
    {
      q: 'كيف أتصل ببروكسي؟',
      a: 'افتح صفحة البروكسي واضغط «الاتصال بتلغرام»، ثم أكّد التفعيل داخل تلغرام. يمكنك أيضًا نسخ الخادم والمنفذ والمفتاح وإضافتها من إعدادات البروكسي. تجد خطوات كل منصة في صفحة «كيف يعمل».',
    },
    {
      q: 'لماذا يظهر بروكسي كغير متصل أحيانًا؟',
      a: 'قد يتوقف المشغّل عن الخدمة، أو تنفد سعة الخادم، أو يحدث انقطاع شبكي أو حجب مؤقت. يعلن المراقب حالة «غير متصل» فقط بعد تكرار الفشل وفق حد قابل للضبط، ويعيد الحالة إلى «متصل» بعد فحص MTProto ناجح.',
    },
    {
      q: 'ما الفرق بين MTProto وSOCKS5؟',
      a: 'MTProto مصمم خصيصًا لتلغرام ويضيف طبقة تمويه ومقاومة للحجب، مع مفتاح سري خاص. SOCKS5 نفق شبكي عام لا يفهم تلغرام تحديدًا، وغالبًا يكون أسهل في الاكتشاف. كلاهما لا يمنح خصوصية مطلقة، وكلاهما يرى بيانات وصفية.',
    },
    {
      q: 'هل يمكن لمشغّل البروكسي قراءة رسائلي؟',
      a: 'محتوى رسائل تلغرام مشفّر بين تطبيقك وخوادم تلغرام، ولا يضيف البروكسي مفتاحًا يسمح له بفك التشفير في التشغيل الطبيعي. لكن المشغّل قد يرى عنوان IP والتوقيت وحجم البيانات ووجهة الخادم، ويمكنه تعطيل الخدمة أو إبطاءها. المحادثات السرية تبقى مشفّرة من طرف إلى طرف، بينما محادثات السحابة مشفّرة بينك وبين خوادم تلغرام.',
    },
    {
      q: 'كم مرة تُفحص البروكسيات؟',
      a: 'يعمل الفحص عبر GitHub Actions وفق جدول يحدده المشرف في المستودع. الإعداد الافتراضي كل ساعتين، مع مهلة زمنية وحد فشل قبل إعلان الانقطاع. راجع ملف سير العمل في المستودع لمعرفة الجدول الحالي، ولا تفترض أن الفحص لحظي.',
    },
    {
      q: 'هل البروكسي مضمون أنه آمن؟',
      a: 'لا. التحقق من التوفر يعني أن نقطة النهاية استجابت لبروتوكول MTProto في وقت معيّن، وليس تدقيقًا أمنيًا. «مصدر موثوق» يعني وجود دليل على المصدر، وليس ضمانًا مطلقًا. استخدم مصادر تعرفها، وابقِ تلغرام محدثًا، ولا تشارك رموز تسجيل الدخول مع أي جهة.',
    },
  ],
  en: [
    {
      q: 'What is an MTProto proxy?',
      a: 'A Telegram-specific relay that forwards encrypted MTProto traffic between your app and Telegram’s servers. It helps when Telegram is blocked or slow, and unlike a VPN it does not route your other apps.',
    },
    {
      q: 'Is using a Telegram proxy free?',
      a: 'This directory is free and requires no account. Most listed proxies are offered at no charge, and operators may earn revenue through sponsored messages or donations. Be cautious with anyone charging for a “security guarantee” or asking for account details.',
    },
    {
      q: 'How do I connect?',
      a: 'Open a proxy page, tap “Connect to Telegram,” and confirm inside Telegram. You can also copy the server, port, and secret and add them in Telegram’s proxy settings. Platform guides are on the How It Works page.',
    },
    {
      q: 'Why is a proxy sometimes offline?',
      a: 'The operator may stop the service, run out of capacity, or hit a network outage or temporary block. The monitor marks an endpoint offline only after repeated failures cross a configurable threshold, and returns it to online after a successful MTProto check.',
    },
    {
      q: 'What is the difference between MTProto and SOCKS5?',
      a: 'MTProto is purpose-built for Telegram with obfuscation and censorship resistance plus a proxy secret. SOCKS5 is a generic network tunnel that does not understand Telegram specifically and is often easier to detect. Neither provides absolute privacy or hides metadata from the operator.',
    },
    {
      q: 'Can a proxy operator read my messages?',
      a: 'Telegram message content is encrypted between your app and Telegram’s servers, and a proxy does not receive a key that decrypts it in normal operation. The operator can still observe your IP address, timing, data volume, and Telegram destination, and can block or slow the service. Secret chats remain end-to-end encrypted; cloud chats are encrypted between you and Telegram’s servers.',
    },
    {
      q: 'How often are proxies checked?',
      a: 'Checks run through GitHub Actions on a schedule set by the maintainer. The default configuration runs every two hours, with a timeout and a failure threshold before marking an endpoint offline. See the repository workflow for the current schedule; never assume a result is real-time.',
    },
    {
      q: 'Is a proxy guaranteed to be safe?',
      a: 'No. An availability check means the endpoint answered MTProto at a particular time; it is not a security audit. “Trusted source” means there is evidence about provenance, not an absolute guarantee. Use sources you know, keep Telegram updated, and never share login codes with anyone.',
    },
  ],
};

export const securityContent: Record<
  Lang,
  {
    comparison: Array<{ label: string; mtproto: string; socks5: string }>;
    visibility: string[];
    levels: Array<{ label: string; description: string }>;
    encryption: string[];
    practices: string[];
  }
> = {
  ar: {
    comparison: [
      {
        label: 'الغرض',
        mtproto: 'مخصص لتلغرام، مع تمويه حركة الاتصال ومقاومة الحجب.',
        socks5: 'نفق شبكي عام لأي تطبيق يدعمه، وليس خاصًا بتلغرام.',
      },
      {
        label: 'المصادقة',
        mtproto: 'مفتاح سري منشور ضمن رابط البروكسي.',
        socks5: 'قد يتطلب اسم مستخدم وكلمة مرور، أو يعمل بلا مصادقة.',
      },
      {
        label: 'نطاق المرور',
        mtproto: 'حركة تلغرام فقط.',
        socks5: 'أي حركة يوجّهها التطبيق عبر النفق.',
      },
      {
        label: 'التشفير',
        mtproto: 'لا يضيف تشفيرًا من طرف إلى طرف؛ يعتمد على تشفير تلغرام.',
        socks5: 'لا يضيف تشفيرًا بحد ذاته؛ يعتمد على البروتوكول الأعلى.',
      },
      {
        label: 'ما يراه المشغّل',
        mtproto: 'عنوان IP، التوقيت، الحجم، ووجهة خوادم تلغرام.',
        socks5: 'بيانات اتصال بالخادم الوجهة، وقد يرى أسماء النطاقات.',
      },
    ],
    visibility: [
      'عنوان IP الخاص بك، ووقت الاتصال ومدته، وحجم البيانات المنقولة.',
      'أنك تستخدم تلغرام، وربما منطقة الخادم الذي تتصل به.',
      'مؤشرات عن جودة اتصالك وسرعته، لأن الحركة تمر عبر خادمه.',
      'لا يرى عادةً نص رسائلك أو وسائطك، لأنها مشفّرة قبل أن تصل إليه.',
      'قد يتحكم في التوفر والسرعة، ويمكنه إيقاف الخدمة أو تقييدها.',
    ],
    levels: [
      {
        label: 'التوفر مُتحقق منه',
        description: 'نجح فحص MTProto مؤخرًا. يثبت الاستجابة فقط، ولا يقيّم أمان المشغّل.',
      },
      {
        label: 'مصدر موثوق',
        description: 'يوجد دليل على هوية المصدر أو سمعته، مثل قناة رسمية موثقة أو مشغّل معروف. ليس ضمانًا مطلقًا.',
      },
      {
        label: 'مُرسَل من المجتمع',
        description: 'راجعنا صحة البيانات يدويًا، لكن المصدر غير معروف بما يكفي لرفع مستوى الثقة.',
      },
      {
        label: 'غير مُتحقق منه أمنيًا',
        description: 'لم يُقيّم المشغّل. تعامل معه كخيار مجهول الهوية، حتى لو كان متصلًا الآن.',
      },
    ],
    encryption: [
      'تمويه النقل: يجعل حركة MTProto أقل وضوحًا أمام أنظمة الحجب، ولا يحمي محتوى الرسائل بحد ذاته.',
      'تشفير تلغرام بين العميل والخادم: يحمي محادثات السحابة أثناء النقل، لكن خوادم تلغرام تملك مفاتيحها.',
      'المحادثات السرية: تشفير من طرف إلى طرف، ولا يملك المشغّل أو خوادم تلغرام مفتاحه.',
      'البروكسي لا يغيّر طبقات التشفير هذه. إذا كنت تحتاج حماية لحركة الجهاز كاملة، ففكّر في VPN موثوق بدل بروكسي تلغرام فقط.',
    ],
    practices: [
      'لا تفعّل بروكسيًا من رابط مجهول المصدر. تحقق من النطاق t.me ومن تفاصيل الخادم.',
      'استخدم بروكسيًا واحدًا من مصدر تثق به، وأوقفه عند عدم الحاجة.',
      'حدّث تلغرام من المتجر الرسمي، ولا تثبّت نسخًا معدّلة من مصادر غير معروفة.',
      'لا تشارك رمز تسجيل الدخول أو كلمة مرور التحقق بخطوتين مع أي شخص أو موقع، بما في ذلك هذا الموقع.',
      'تذكّر أن البروكسي ليس أداة إخفاء هوية. إن كانت خصوصية الشبكة الكاملة مطلوبة، استخدم أدوات مناسبة لذلك.',
      'أبلغ عن بروكسي مسيء أو بيانات خاطئة عبر قائمة طلبات المستودع.',
    ],
  },
  en: {
    comparison: [
      {
        label: 'Purpose',
        mtproto: 'Built for Telegram, with transport obfuscation and censorship resistance.',
        socks5: 'A generic tunnel for any supporting app; not Telegram-specific.',
      },
      {
        label: 'Authentication',
        mtproto: 'A public secret embedded in the proxy link.',
        socks5: 'May use a username and password, or run without authentication.',
      },
      {
        label: 'Scope',
        mtproto: 'Telegram traffic only.',
        socks5: 'Any traffic an application routes through the tunnel.',
      },
      {
        label: 'Encryption',
        mtproto: 'Adds no end-to-end encryption; it relies on Telegram’s encryption.',
        socks5: 'Adds no encryption by itself; it relies on the higher-level protocol.',
      },
      {
        label: 'Operator visibility',
        mtproto: 'IP address, timing, volume, and the Telegram destination.',
        socks5: 'Destination connection data; may expose requested hostnames.',
      },
    ],
    visibility: [
      'Your IP address, connection time and duration, and transferred data volume.',
      'That you use Telegram, and possibly which server region you connect to.',
      'Signals about connection quality and speed, since traffic passes through their host.',
      'It generally cannot read message text or media, which are encrypted before reaching it.',
      'It controls availability and speed, and can stop or throttle the service.',
    ],
    levels: [
      {
        label: 'Availability verified',
        description: 'A recent MTProto check succeeded. This proves reachability only, not operator security.',
      },
      {
        label: 'Trusted source',
        description: 'There is evidence about the source’s identity or reputation, such as a verified official channel or known operator. Not an absolute guarantee.',
      },
      {
        label: 'Community submitted',
        description: 'We manually reviewed the data, but the source is not known well enough to raise the trust level.',
      },
      {
        label: 'Not security-audited',
        description: 'The operator has not been assessed. Treat it as an unknown entity, even if it is online now.',
      },
    ],
    encryption: [
      'Transport obfuscation: makes MTProto traffic less obvious to blocking systems; it does not protect message content by itself.',
      'Telegram client-to-server encryption: protects cloud chats in transit, but Telegram’s servers hold the keys.',
      'Secret chats: end-to-end encrypted, with keys unavailable to the proxy or Telegram’s servers.',
      'A proxy does not change these layers. If you need to protect all device traffic, consider a trusted VPN rather than a Telegram-only proxy.',
    ],
    practices: [
      'Do not enable a proxy from an unknown link. Verify the t.me domain and the server details.',
      'Use one proxy from a source you trust, and disable it when you no longer need it.',
      'Update Telegram from the official store, and avoid modified clients from unknown sources.',
      'Never share your login code or two-step verification password with anyone or any website, including this one.',
      'Remember that a proxy is not an anonymity tool. If full network privacy is required, use tools designed for it.',
      'Report abusive proxies or inaccurate records through the repository issue tracker.',
    ],
  },
};

export interface ArticleSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const legalContent: Record<
  'privacy' | 'terms' | 'guidelines',
  Record<Lang, ArticleSection[]>
> = {
  privacy: {
    ar: [
      {
        heading: 'باختصار',
        paragraphs: [
          'هذا موقع ثابت يعرض دليلًا عامًا لبروكسيات تلغرام. لا يوجد تسجيل دخول، ولا نجمع رسائل تلغرام أو جهات الاتصال أو رمز التحقق. لا نستخدم أدوات تحليلات أو إعلانات تتبّع.',
        ],
      },
      {
        heading: 'ما نخزّنه على جهازك',
        paragraphs: [
          'نستخدم التخزين المحلي في المتصفح لحفظ تفضيلاتك فقط: اللغة، والوضع الفاتح أو الداكن، ووقت آخر إرسال لمنع الإرسال المتكرر. لا تُرسل هذه القيم إلى خادمنا، ويمكنك حذفها بمسح بيانات الموقع.',
        ],
      },
      {
        heading: 'ما لا نجمعه',
        bullets: [
          'لا حسابات، ولا كلمات مرور، ولا رموز تسجيل دخول تلغرام.',
          'لا رسائل، ولا جهات اتصال، ولا قوائم محادثات.',
          'لا ملفات تعريف إعلانية ولا أدوات تتبّع خارجية.',
          'لا نطلب صلاحية الوصول إلى جهازك أو شبكتك.',
        ],
      },
      {
        heading: 'استضافة وسجلات تقنية',
        paragraphs: [
          'يُستضاف الموقع على Cloudflare Pages. قد تعالج Cloudflare بيانات تقنية قياسية مثل عنوان IP ووكيل المستخدم لأغراض التوصيل والأمان، وفق سياسة الخصوصية الخاصة بها. لا نستخدم هذه السجلات لبناء ملفات تعريف شخصية.',
          'عند تحميل ملف البروكسيات، يجلبه متصفحك مباشرة من موقع الاستضافة أو من رابط بيانات عام مُعدّ. لا يتضمن الملف أي بيانات شخصية.',
        ],
      },
      {
        heading: 'الإرسال عبر GitHub',
        paragraphs: [
          'مسار «أضف بروكسيًا» يُنشئ طلبًا عامًا في GitHub. محتوى الطلب واسم حساب GitHub الخاص بك يكونان مرئيين للعامة وفق سياسة GitHub. لا تضع معلومات شخصية في الملاحظات. لا تُنشر البروكسيات المعلّقة أو المرفوضة في هذا الدليل.',
        ],
      },
      {
        heading: 'روابط خارجية',
        paragraphs: [
          'روابط t.me وتلغرام وGitHub تفتح مواقع تابعة لأطراف أخرى وتخضع لسياساتها. لا نتحكم في هذه الخدمات ولا في بياناتها.',
        ],
      },
      {
        heading: 'التغييرات والتواصل',
        paragraphs: [
          'قد نحدّث هذه السياسة عند تغيّر آلية العمل. يظهر تاريخ التحديث أعلى الصفحة. للاستفسارات، استخدم قائمة طلبات المستودع العام.',
        ],
      },
    ],
    en: [
      {
        heading: 'In short',
        paragraphs: [
          'This is a static site that publishes a public Telegram proxy directory. There is no login, and we do not collect Telegram messages, contacts, or login codes. We use no analytics or advertising trackers.',
        ],
      },
      {
        heading: 'What is stored on your device',
        paragraphs: [
          'Browser local storage keeps your preferences only: language, light or dark mode, and the time of your last submission to prevent repeated sends. These values are not sent to our server and can be removed by clearing site data.',
        ],
      },
      {
        heading: 'What we do not collect',
        bullets: [
          'No accounts, passwords, or Telegram login codes.',
          'No messages, contacts, or chat lists.',
          'No advertising profiles or third-party trackers.',
          'No access to your device or network beyond opening links.',
        ],
      },
      {
        heading: 'Hosting and technical logs',
        paragraphs: [
          'The site is hosted on Cloudflare Pages. Cloudflare may process standard technical data such as IP address and user agent for delivery and security, under its own privacy policy. We do not use these logs to build personal profiles.',
          'When the proxy file loads, your browser requests it from the host or from a configured public data URL. The file contains no personal data.',
        ],
      },
      {
        heading: 'Submissions through GitHub',
        paragraphs: [
          'The “Add a proxy” flow creates a public GitHub issue. The request content and your GitHub username are public under GitHub’s policy. Do not include personal information in the notes. Pending or rejected proxies are never published in this directory.',
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          't.me, Telegram, and GitHub links open third-party services governed by their own policies. We do not control those services or their data practices.',
        ],
      },
      {
        heading: 'Changes and contact',
        paragraphs: [
          'We may update this policy if the project changes. The revision date appears at the top of the page. For questions, use the public repository issue tracker.',
        ],
      },
    ],
  },
  terms: {
    ar: [
      {
        heading: 'قبول الشروط',
        paragraphs: [
          'باستخدامك هذا الموقع، فإنك توافق على هذه الشروط. إذا لم توافق، لا تستخدم الموقع أو روابط البروكسيات المنشورة.',
        ],
      },
      {
        heading: 'طبيعة الخدمة',
        paragraphs: [
          'هذا الموقع دليل معلوماتي مستقل. لا نشغّل أي بروكسي، ولا نتحكم في خوادم المشغّلين، ولا نستضيف حركة تلغرام. البروكسيات المدرجة يقدمها أطراف ثالثة، وقد تتغير أو تتوقف في أي وقت.',
          'لا توجد علاقة رسمية بين هذا المشروع وتلغرام. جميع العلامات التجارية مملوكة لأصحابها.',
        ],
      },
      {
        heading: 'لا ضمانات',
        paragraphs: [
          'تُقدّم المعلومات «كما هي». نجتهد في التحقق من التنسيق والتوفر، لكننا لا نضمن دقة النتائج أو استمرارية الخدمة أو أمان المشغّل أو ملاءمتها لغرض معين. فحص التوفر ليس تدقيقًا أمنيًا.',
        ],
      },
      {
        heading: 'مسؤولية المستخدم',
        bullets: [
          'تتحمل مسؤولية اختيار البروكسي وتقييم مخاطره.',
          'يلتزم استخدامك بالقوانين واللوائح المحلية، وبشروط تلغرام.',
          'لا تستخدم الموقع أو البيانات المنشورة لأي نشاط غير قانوني أو مسيء.',
          'لا تحاول تعطيل الموقع أو فرض حمل غير معقول عليه أو على مصادره.',
        ],
      },
      {
        heading: 'الإرسال',
        paragraphs: [
          'عند إرسال بروكسي، تقر بأن لديك الحق في مشاركة بياناته، وأنك توافق على نشرها علنًا إذا اعتُمد الطلب. تخضع الطلبات للمراجعة، وقد تُرفض دون إبداء أسباب. لا تُنشر تفاصيل الطلبات المعلّقة أو المرفوضة.',
        ],
      },
      {
        heading: 'أطراف ثالثة',
        paragraphs: [
          'الروابط الخارجية إلى تلغرام أو GitHub أو مواقع المشغّلين ليست تحت سيطرتنا. لا نتحمل مسؤولية محتواها أو ممارساتها.',
        ],
      },
      {
        heading: 'حدود المسؤولية',
        paragraphs: [
          'إلى الحد الذي يسمح به القانون، لا يتحمل المشروع أو المساهمون مسؤولية أضرار مباشرة أو غير مباشرة تنشأ عن استخدام الموقع أو البروكسيات أو الاعتماد على بياناته.',
        ],
      },
      {
        heading: 'الملكية الفكرية والتغييرات',
        paragraphs: [
          'شفرة المصدر متاحة تحت رخصة MIT. أسماء تلغرام وشعاراتها مملوكة لتلغرام. قد نغيّر هذه الشروط، ويُعد استمرار استخدامك بعد النشر موافقة على النسخة المحدثة.',
        ],
      },
    ],
    en: [
      {
        heading: 'Acceptance',
        paragraphs: [
          'By using this site, you agree to these terms. If you do not agree, do not use the site or the published proxy links.',
        ],
      },
      {
        heading: 'What this service is',
        paragraphs: [
          'This is an independent informational directory. We do not operate any proxy, control operator servers, or host Telegram traffic. Listed proxies are provided by third parties and may change or disappear at any time.',
          'This project has no official relationship with Telegram. All trademarks belong to their owners.',
        ],
      },
      {
        heading: 'No warranties',
        paragraphs: [
          'Information is provided “as is.” We make reasonable efforts to validate format and availability, but we do not guarantee accuracy, uptime, operator security, or fitness for a particular purpose. An availability check is not a security audit.',
        ],
      },
      {
        heading: 'Your responsibility',
        bullets: [
          'You choose a proxy and accept the associated risks.',
          'Your use must comply with local law and Telegram’s terms.',
          'Do not use the site or its data for unlawful or abusive activity.',
          'Do not attempt to disrupt the site or place unreasonable load on it or its sources.',
        ],
      },
      {
        heading: 'Submissions',
        paragraphs: [
          'By submitting a proxy, you confirm that you have the right to share its details and agree that they may be published if approved. Submissions are reviewed and may be rejected without explanation. Pending or rejected details are not published.',
        ],
      },
      {
        heading: 'Third-party links',
        paragraphs: [
          'External Telegram, GitHub, and operator links are outside our control. We are not responsible for their content or practices.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'To the extent permitted by law, the project and its contributors are not liable for direct or indirect damages arising from use of the site, the proxies, or reliance on its data.',
        ],
      },
      {
        heading: 'Intellectual property and changes',
        paragraphs: [
          'Source code is available under the MIT license. Telegram names and marks belong to Telegram. We may update these terms; continued use after publication constitutes acceptance of the revised version.',
        ],
      },
    ],
  },
  guidelines: {
    ar: [
      {
        heading: 'قبل التفعيل',
        bullets: [
          'افتح صفحات البروكسي من هذا الدليل أو من مصدر تعرفه، ولا تفعّل روابط وردت في رسائل مجهولة.',
          'تأكد أن الرابط يبدأ بـ https://t.me/proxy وأن الخادم والمنفذ يطابقان ما راجعته.',
          'اقرأ تصنيف المصدر وسجل التوفر. لا تعتبر اللون الأخضر دليلًا على الثقة.',
        ],
      },
      {
        heading: 'عند الاتصال',
        bullets: [
          'راجع نافذة التأكيد داخل تلغرام قبل الموافقة.',
          'لا يحتاج البروكسي إلى رمز تسجيل الدخول أو كلمة مرور التحقق بخطوتين. أي طلب لهذه البيانات مشبوه.',
          'فعّل بروكسيًا واحدًا فقط من مصدر تثق به، وأوقفه عند عدم الحاجة لتقليل تعرّض بياناتك الوصفية.',
        ],
      },
      {
        heading: 'افهم حدود الخصوصية',
        bullets: [
          'المشغّل يرى عنوان IP والتوقيت وحجم البيانات، حتى لو لم يستطع قراءة الرسائل.',
          'البروكسي ليس VPN ولا أداة إخفاء هوية شاملة.',
          'المحادثات السحرية فقط مشفّرة من طرف إلى طرف؛ محادثات السحابة مشفّرة بينك وبين خوادم تلغرام.',
          'احترم قوانين بلدك عند استخدام وسائل تجاوز الحجب.',
        ],
      },
      {
        heading: 'على جهازك',
        bullets: [
          'ثبّت تلغرام من متجر التطبيقات الرسمي أو موقعه الرسمي، وحدّثه بانتظام.',
          'فعّل التحقق بخطوتين لحماية حسابك، ولا تشارك رمز الدخول مع أي شخص.',
          'راجع قائمة البروكسيات النشطة دوريًا وأزل ما لا تستخدمه.',
        ],
      },
      {
        heading: 'الإبلاغ عن مشكلة',
        paragraphs: [
          'إذا لاحظت بروكسيًا مسيئًا أو بيانات غير صحيحة أو رابط اتصال لا يعمل، افتح طلبًا في مستودع GitHub مع تفاصيل قابلة للتحقق. لا تنشر معلومات شخصية في البلاغ.',
        ],
      },
    ],
    en: [
      {
        heading: 'Before enabling',
        bullets: [
          'Open proxy pages from this directory or a source you know. Do not enable links from unsolicited messages.',
          'Check that the link starts with https://t.me/proxy and that the server and port match what you reviewed.',
          'Read the source label and availability history. A green status is not proof of trust.',
        ],
      },
      {
        heading: 'While connecting',
        bullets: [
          'Review Telegram’s confirmation sheet before approving.',
          'A proxy never needs your login code or two-step verification password. Any request for them is suspicious.',
          'Enable one proxy from a source you trust, and disable it when you no longer need it to limit metadata exposure.',
        ],
      },
      {
        heading: 'Understand privacy limits',
        bullets: [
          'The operator can see your IP address, timing, and traffic volume, even when message content stays encrypted.',
          'A proxy is not a VPN or a complete anonymity tool.',
          'Only secret chats are end-to-end encrypted; cloud chats are encrypted between you and Telegram’s servers.',
          'Follow the laws that apply to you when using circumvention tools.',
        ],
      },
      {
        heading: 'On your device',
        bullets: [
          'Install Telegram from the official app store or website, and keep it updated.',
          'Enable two-step verification and never share your login code.',
          'Review your active proxies periodically and remove ones you no longer use.',
        ],
      },
      {
        heading: 'Reporting a problem',
        paragraphs: [
          'If you find an abusive proxy, inaccurate record, or broken connection link, open an issue in the GitHub repository with verifiable details. Do not post personal information.',
        ],
      },
    ],
  },
};
