// Diccionario i18n (T3.6) — chrome de la UI + líneas de veredicto por reasonCode.
// El contenido pedagógico por nivel (title/desc/hint/explanation) vive bilingüe en
// src/data/levels.js; la guía por reasonCode, en src/lib/explanations.js.
//
// Convención de claves: namespace.punto.minúsculas. Interpolación con {var}.
// ES es el idioma fuente (audiencia hispanohablante); EN es la traducción.

export const STRINGS = {
  es: {
    // Idioma
    'lang.label': 'Idioma',
    'lang.es': 'ES',
    'lang.en': 'EN',
    'lang.switchTo': 'Cambiar a English',

    // TopBar
    'top.console': 'CONSOLA DE GESTIÓN',
    'top.device': 'DISPOSITIVO',

    // Sidebar
    'side.dashboard': 'Panel',
    'side.monitor': 'Monitor',
    'side.policies': 'Políticas',
    'side.network': 'Red',
    'side.levels': 'Niveles',
    'side.incident': 'Incidente',
    'side.hint': 'Pista',

    // PolicyEditor / NatEditor
    'editor.tab.security': 'Security Policy',
    'editor.tab.nat': 'NAT',
    'editor.col.name': 'Nombre',
    'editor.col.source': 'Origen',
    'editor.col.dest': 'Destino',
    'editor.col.app': 'App',
    'editor.col.service': 'Servicio',
    'editor.col.action': 'Acción',
    'editor.col.profile': 'Perfil',
    'editor.action.allow': 'Allow',
    'editor.action.deny': 'Deny',
    'editor.aria.ruleName': 'Nombre de la regla',
    'editor.aria.srcZone': 'Zona origen',
    'editor.aria.dstZone': 'Zona destino',
    'editor.aria.app': 'Aplicación',
    'editor.aria.service': 'Servicio',
    'editor.aria.action': 'Acción',
    'editor.aria.profile': 'Perfil de seguridad',
    'nat.col.original': 'Paquete original',
    'nat.col.type': 'Tipo de NAT',
    'nat.translated': 'Paquete traducido',
    'nat.dir.source': 'Origen',
    'nat.dir.dest': 'Destino',
    'nat.badge.translated': 'traducido',
    'nat.aria.type': 'Tipo de NAT (NAT rulebase)',
    'nat.none.note': 'Sin NAT: el paquete cruza el firewall con sus IPs originales.',
    'nat.explainer':
      'En PAN-OS el NAT Rulebase es una tabla independiente de la Security Policy. Aquí defines la traducción de direcciones; la Security Policy evalúa las IPs originales (pre-NAT).',
    'nat.opt.none': 'No NAT',
    'nat.opt.snat': 'Source NAT (SNAT)',
    'nat.opt.dnat': 'Destination NAT (DNAT)',
    'nat.opt.uturn': 'U-Turn (DNAT+SNAT)',

    // CommitButton
    'commit.idle': 'Aplicar cambios',
    'commit.busy': 'Aplicando…',

    // TrafficLog / LogModal
    'log.title': 'REGISTROS DE TRÁFICO (CLIC EN UNA FILA PARA DETALLE)',
    'log.col.time': 'Hora',
    'log.col.source': 'Origen',
    'log.col.dest': 'Destino',
    'log.col.app': 'App',
    'log.col.action': 'Acción',
    'log.detail.title': 'Detalle del registro',
    'log.detail.close': 'Cerrar',
    'log.detail.source': 'Origen',
    'log.detail.destination': 'Destino',
    'log.detail.bytes': 'Bytes',
    'log.detail.flags': 'Flags',
    'log.detail.reason': 'Motivo',
    'log.aria.close': 'Cerrar detalle de registro',

    // Onboarding
    'onb.title': 'Bienvenido, Admin de Red',
    'onb.p1':
      'Eres Administrador de Red/IT y llegan tickets en la esquina inferior izquierda de la página.',
    'onb.p2':
      'Configura las reglas de firewall para resolver cada ticket. Analiza el tráfico, define el Origen, Destino y Acción correctos, ¡y mantén la red segura!',
    'onb.start': 'Empezar',
    'onb.tickets': 'TICKETS AQUÍ',
    'onb.aria.close': 'Cerrar bienvenida',

    // ResultOverlay
    'result.allow': 'TRÁFICO PERMITIDO',
    'result.block': 'TRÁFICO BLOQUEADO (correcto)',
    'result.fail': 'POLÍTICA BLOQUEADA',
    'result.next': 'Siguiente escenario',
    'result.reconfigure': 'Reconfigurar',
    'result.why': 'Por qué',

    // SetCommandPanel
    'set.title': 'Comando set (PAN-OS)',
    'set.copy': 'Copiar',
    'set.copied': 'Copiado',
    'set.aria.copy': 'Copiar comandos set al portapapeles',
    'set.security': '# Security rulebase',
    'set.nat': '# NAT rulebase (tabla separada)',
    'set.disclaimer.prefix': 'Sintaxis orientativa:',
    'set.disclaimer.bold': 'valida contra tu versión de PAN-OS',
    'set.disclaimer.suffix': '(PAN-OS / Panorama).',

    // LevelSelect
    'select.title': 'Elegir escenario',
    'select.aria.close': 'Cerrar selector de escenarios',
    'select.level': 'Nivel',
    'select.current': 'actual',
    'select.completed': 'completado',
    'select.attempt': 'intento',
    'select.attempts': 'intentos',

    // CompletionScreen
    'done.title': '¡Certificación PCNSE!',
    'done.subtitle': 'Todos los escenarios completados',
    'done.stat.completed': 'Escenarios completados',
    'done.stat.attempts': 'Total de intentos',
    'done.stat.score': 'Puntuación',
    'done.body':
      'Has demostrado dominar la configuración de políticas de seguridad y NAT en PAN-OS. Puedes repetir cualquier escenario para practicar.',
    'done.choose': 'Elegir nivel',
    'done.repeat': 'Repetir desde el inicio',

    // Veredicto por reasonCode (lo muestra el ResultOverlay; interpola desde solution)
    'reason.OK_ALLOW': 'La regla permite el tráfico legítimo e inspecciona amenazas.',
    'reason.OK_BLOCK': 'La regla descarta el tráfico no deseado en la Security Policy.',
    'reason.ZONE_MISMATCH':
      'Zonas incorrectas: la regla no coincide con el origen/destino del paquete.',
    'reason.APP_MISMATCH': "App-ID incorrecto: este escenario requiere la aplicación '{app}'.",
    'reason.SERVICE_MISMATCH': "Servicio incorrecto: se requiere '{service}'.",
    'reason.ACTION_MISMATCH': 'Acción incorrecta para la intención de este escenario.',
    'reason.NAT_MISMATCH': 'NAT incorrecto en el NAT rulebase: se requiere {nat}.',
    'reason.PROFILE_MISSING': "Falta perfil de seguridad: se requiere al menos '{profile}'.",
    'reason.PROFILE_INSUFFICIENT': "Perfil insuficiente: se requiere al menos '{profile}'.",
    'reason.SPECIAL_DROPPED': 'El paquete cae por diseño: configuración correcta que bloquea.',
    'reason.SPECIAL_WARNING': 'Funciona, pero viola la buena práctica de seguridad.',
    'reason.SPECIAL_MISMATCH': 'Configuración incorrecta para este escenario.',
  },

  en: {
    'lang.label': 'Language',
    'lang.es': 'ES',
    'lang.en': 'EN',
    'lang.switchTo': 'Cambiar a Español',

    'top.console': 'MANAGEMENT CONSOLE',
    'top.device': 'DEVICE',

    'side.dashboard': 'Dashboard',
    'side.monitor': 'Monitor',
    'side.policies': 'Policies',
    'side.network': 'Network',
    'side.levels': 'Levels',
    'side.incident': 'Incident',
    'side.hint': 'Hint',

    'editor.tab.security': 'Security Policy',
    'editor.tab.nat': 'NAT',
    'editor.col.name': 'Name',
    'editor.col.source': 'Source',
    'editor.col.dest': 'Dest',
    'editor.col.app': 'App',
    'editor.col.service': 'Service',
    'editor.col.action': 'Action',
    'editor.col.profile': 'Profile',
    'editor.action.allow': 'Allow',
    'editor.action.deny': 'Deny',
    'editor.aria.ruleName': 'Rule name',
    'editor.aria.srcZone': 'Source zone',
    'editor.aria.dstZone': 'Destination zone',
    'editor.aria.app': 'Application',
    'editor.aria.service': 'Service',
    'editor.aria.action': 'Action',
    'editor.aria.profile': 'Security profile',
    'nat.col.original': 'Original Packet',
    'nat.col.type': 'NAT Type',
    'nat.translated': 'Translated Packet',
    'nat.dir.source': 'Source',
    'nat.dir.dest': 'Dest',
    'nat.badge.translated': 'translated',
    'nat.aria.type': 'NAT type (NAT rulebase)',
    'nat.none.note': 'No NAT: the packet crosses the firewall with its original IPs.',
    'nat.explainer':
      'In PAN-OS the NAT Rulebase is a table separate from the Security Policy. Here you define address translation; the Security Policy evaluates the original (pre-NAT) IPs.',
    'nat.opt.none': 'No NAT',
    'nat.opt.snat': 'Source NAT (SNAT)',
    'nat.opt.dnat': 'Destination NAT (DNAT)',
    'nat.opt.uturn': 'U-Turn (DNAT+SNAT)',

    'commit.idle': 'Commit Changes',
    'commit.busy': 'Committing…',

    'log.title': 'TRAFFIC LOGS (CLICK A ROW FOR DETAILS)',
    'log.col.time': 'Time',
    'log.col.source': 'Source',
    'log.col.dest': 'Dest',
    'log.col.app': 'App',
    'log.col.action': 'Action',
    'log.detail.title': 'Traffic Log Detail',
    'log.detail.close': 'Close',
    'log.detail.source': 'Source',
    'log.detail.destination': 'Destination',
    'log.detail.bytes': 'Bytes',
    'log.detail.flags': 'Flags',
    'log.detail.reason': 'Reason',
    'log.aria.close': 'Close log detail',

    'onb.title': 'Welcome, Network Admin',
    'onb.p1':
      "You're a Network/IT Admin, and tickets are coming in at the bottom-left corner of the page.",
    'onb.p2':
      'Configure the firewall rules to resolve each ticket. Analyze the traffic, set the correct Source, Destination and Action, and keep the network secure!',
    'onb.start': "Let's Start",
    'onb.tickets': 'TICKETS HERE',
    'onb.aria.close': 'Close welcome',

    'result.allow': 'TRAFFIC ALLOWED',
    'result.block': 'TRAFFIC BLOCKED (correct)',
    'result.fail': 'POLICY BLOCKED',
    'result.next': 'Next Scenario',
    'result.reconfigure': 'Reconfigure',
    'result.why': 'Why',

    'set.title': 'set command (PAN-OS)',
    'set.copy': 'Copy',
    'set.copied': 'Copied',
    'set.aria.copy': 'Copy set commands to clipboard',
    'set.security': '# Security rulebase',
    'set.nat': '# NAT rulebase (separate table)',
    'set.disclaimer.prefix': 'Indicative syntax:',
    'set.disclaimer.bold': 'validate against your PAN-OS version',
    'set.disclaimer.suffix': '(PAN-OS / Panorama).',

    'select.title': 'Choose a scenario',
    'select.aria.close': 'Close scenario selector',
    'select.level': 'Level',
    'select.current': 'current',
    'select.completed': 'completed',
    'select.attempt': 'attempt',
    'select.attempts': 'attempts',

    'done.title': 'PCNSE Certified!',
    'done.subtitle': 'All scenarios completed',
    'done.stat.completed': 'Scenarios completed',
    'done.stat.attempts': 'Total attempts',
    'done.stat.score': 'Score',
    'done.body':
      'You have shown mastery of security policy and NAT configuration in PAN-OS. You can replay any scenario to practice.',
    'done.choose': 'Choose level',
    'done.repeat': 'Restart from the beginning',

    'reason.OK_ALLOW': 'The rule allows the legitimate traffic and inspects for threats.',
    'reason.OK_BLOCK': 'The rule drops the unwanted traffic in the Security Policy.',
    'reason.ZONE_MISMATCH': "Wrong zones: the rule doesn't match the packet's source/destination.",
    'reason.APP_MISMATCH': "Wrong App-ID: this scenario requires the '{app}' application.",
    'reason.SERVICE_MISMATCH': "Wrong service: '{service}' is required.",
    'reason.ACTION_MISMATCH': "Wrong action for this scenario's intent.",
    'reason.NAT_MISMATCH': 'Wrong NAT in the NAT rulebase: {nat} is required.',
    'reason.PROFILE_MISSING': "Missing security profile: at least '{profile}' is required.",
    'reason.PROFILE_INSUFFICIENT': "Insufficient profile: at least '{profile}' is required.",
    'reason.SPECIAL_DROPPED': 'The packet drops by design: a correct configuration that blocks.',
    'reason.SPECIAL_WARNING': 'It works, but it violates security best practice.',
    'reason.SPECIAL_MISMATCH': 'Incorrect configuration for this scenario.',
  },
};
