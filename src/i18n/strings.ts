// Diccionario i18n (T3.6) — chrome de la UI + líneas de veredicto por reasonCode.
// El contenido pedagógico por nivel (title/desc/hint/explanation) vive bilingüe en
// src/data/levels.js; la guía por reasonCode, en src/lib/explanations.js.
//
// Convención de claves: namespace.punto.minúsculas. Interpolación con {var}.
// ES es el idioma fuente (audiencia hispanohablante); EN es la traducción.

import type { Lang } from '../types/domain.js';

export const STRINGS: Record<Lang, Record<string, string>> = {
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
    'done.stat.streak': 'Mejor racha',
    'score.aria': 'Puntuación {score}, racha {streak}',
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

    // Track navigation
    'track.all': 'Todos',
    'track.ngfw-engineer': 'NGFW Engineer',
    'track.netsec-architect': 'NetSec Architect',

    // Tier headers
    'tier.F.label': 'Fundamentals',
    'tier.N.label': 'NGFW Engineer',
    'tier.A.label': 'NetSec Architect',

    // Badges
    'badge.ngfw-ready': '🎓 NGFW Engineer Ready',
    'badge.architect-ready': '🏆 NetSec Architect Ready',

    // Progress
    'progress.ngfw': 'NGFW Engineer: {done}/{total}',
    'progress.architect': 'NetSec Architect: {done}/{total}',

    // Multi-rule editor
    'multirule.add': 'Añadir regla',
    'multirule.rule': 'Regla {n}',
    'multirule.shadow.warning': '⚠️ La regla {shadowed} está oculta por la regla {shadowing}',

    // Management Console
    'console.open': 'Consola',
    'console.title': 'Consola de Gestión',
    'console.back': 'Volver al juego',
    'console.level': 'Nivel',
    'console.attempts': 'intentos',
    'console.empty':
      'Aún no hay datos de juego. Completa niveles en el simulador para poblar la analítica.',
    'console.metric.completed': 'Niveles completados',
    'console.metric.attempts': 'Intentos totales',
    'console.metric.score': 'Puntuación',
    'console.metric.beststreak': 'Mejor racha',
    'console.heatmap.title': 'Mapa de dificultad por nivel',
    'console.heatmap.subtitle':
      'Color según los intentos reales para completar cada nivel (datos de tu progreso local).',
    'console.heatmap.aria': 'Mapa de calor de los 43 niveles por dificultad',
    'console.diff.easy': 'Fácil',
    'console.diff.medium': 'Media',
    'console.diff.hard': 'Difícil',
    'console.diff.attempted': 'Intentado',
    'console.diff.untried': 'Sin intentar',

    // Console — navegación de vistas
    'console.nav.dashboard': 'Dashboard',
    'console.nav.students': 'Alumnos',
    'console.nav.catalog': 'Niveles',
    'console.nav.builder': 'Level Builder',

    // Console — cohorts (Instructor Mode)
    'console.cohorts.new': 'Nuevo cohort',
    'console.cohorts.name': 'Nombre del cohort',
    'console.cohorts.namePlaceholder': 'Ej: Bootcamp NGFW Q3',
    'console.cohorts.track': 'Track asignado',
    'console.cohorts.changeTrack': 'Cambiar track del cohort',
    'console.cohorts.add': 'Crear',
    'console.cohorts.delete': 'Eliminar cohort',
    'console.cohorts.empty': 'Aún no hay cohorts. Crea el primero para asignar un track.',
    'console.cohorts.listAria': 'Lista de cohorts',
    'console.cohorts.levels': 'niveles en el track',

    // Console — catálogo de niveles
    'console.catalog.levels': 'niveles',
    'console.catalog.aria': 'Catálogo de niveles con estado de revisión SME',
    'console.sme.verified': 'Verificado',
    'console.sme.corrected': 'Corregido',
    'console.sme.pending': 'Matiz pendiente',

    // Console — Level Builder
    'console.builder.meta': 'Metadatos',
    'console.builder.texts': 'Textos bilingües (ES / EN)',
    'console.builder.policy': 'Paquete y solución',
    'console.builder.titleEs': 'Título (ES)',
    'console.builder.titleEn': 'Título (EN)',
    'console.builder.descEs': 'Descripción (ES)',
    'console.builder.descEn': 'Descripción (EN)',
    'console.builder.hintEs': 'Pista (ES)',
    'console.builder.hintEn': 'Pista (EN)',
    'console.builder.explEs': 'Explicación (ES)',
    'console.builder.explEn': 'Explicación (EN)',
    'console.builder.validate': 'Validar nivel',
    'console.builder.valid': '✓ Nivel válido: la solución gana en el motor',
    'console.builder.invalid': 'Nivel inválido',
    'console.builder.missing': 'Campos faltantes',
    'console.builder.engine': 'El motor rechaza la solución',
    'console.builder.copy': 'Copiar JSON',
    'console.builder.download': 'Descargar JSON',

    // Adaptive Policy Tutor (5.1)
    'tutor.title': 'Tutor de políticas',
    'tutor.noDiff': 'Tu política coincide con la solución en los campos clave; revisa el orden o el detalle del escenario.',
    'tutor.askAi': 'Pedir explicación al tutor IA',
    'tutor.thinking': 'El tutor está analizando…',
    'tutor.aiError': 'El tutor IA no está disponible ahora; usa el análisis de arriba.',
    'tutor.fix.srcZone': 'Zona origen: cambiaste a "{your}", pero la regla debe usar "{correct}".',
    'tutor.fix.dstZone': 'Zona destino: pusiste "{your}". En PAN-OS la Security Policy usa la zona post-NAT: debe ser "{correct}".',
    'tutor.fix.app': 'App-ID: elegiste "{your}". App-ID inspecciona el contenido real, no el puerto: usa "{correct}".',
    'tutor.fix.service': 'Servicio: "{your}" no es correcto. Debe ser "{correct}" para acotar los puertos permitidos.',
    'tutor.fix.action': 'Acción: configuraste "{your}", pero el escenario requiere "{correct}".',
    'tutor.fix.nat': 'NAT: usaste "{your}". El NAT Rulebase es una tabla aparte: este escenario necesita "{correct}".',
    'tutor.fix.profile': 'Perfil de seguridad: "{your}" es insuficiente. Aplica al menos "{correct}" para inspeccionar el tráfico permitido.',

    // MITRE ATT&CK Mapper (5.2)
    'mitre.title': 'MITRE ATT&CK · técnica bloqueada',

    // Collaborative War Room (5.3)
    'warroom.title': 'War Room',
    'warroom.subtitle': 'Sesión colaborativa · multi-pestaña, mismo origen',
    'warroom.join': 'Unirse a la sala',
    'warroom.name': 'Tu nombre',
    'warroom.namePlaceholder': 'Ej: Ana',
    'warroom.role': 'Rol',
    'warroom.role.security': 'Security Policy',
    'warroom.role.nat': 'NAT',
    'warroom.role.validator': 'Validador',
    'warroom.role.instructor': 'Instructor',
    'warroom.enter': 'Entrar',
    'warroom.inRoom': 'Ya hay {count} jugador(es) en la sala.',
    'warroom.players': 'Jugadores',
    'warroom.you': 'tú',
    'warroom.ticket': 'Ticket',
    'warroom.policy': 'Política colaborativa',
    'warroom.youEdit': 'Tú editas',
    'warroom.commit': 'Commit y validar',
    'warroom.onlyValidator': 'Solo el Validador o el Instructor pueden hacer commit',
    'warroom.pause': 'Pausar',
    'warroom.resume': 'Reanudar',
    'warroom.pausedBanner': 'El instructor pausó la sesión: edición congelada.',
    'warroom.newTicket': 'Nuevo ticket',
    'warroom.result.win': '✓ Configuración correcta',
    'warroom.result.fail': 'Configuración incorrecta',
    'warroom.validatedBy': 'Validado por {name}',

    // Console Settings + SLO (WBS 6.3 / 6.2)
    'console.nav.settings': 'Configuración',
    'settings.telemetry.title': 'Telemetría anónima',
    'settings.telemetry.desc':
      'Acumula contadores agregados de aprendizaje (aciertos/fallos por nivel y motivo) en tu navegador. Sin datos personales, sin envío a ningún servidor. Desactivada por defecto.',
    'settings.telemetry.toggle': 'Activar telemetría anónima (opt-in)',
    'settings.telemetry.commits': 'Commits',
    'settings.telemetry.wins': 'Aciertos',
    'settings.telemetry.rate': 'Tasa de éxito',
    'settings.telemetry.clear': 'Borrar datos de telemetría',
    'settings.export.title': 'Exportar analítica',
    'settings.export.desc': 'Descarga el progreso por nivel como CSV para análisis externo.',
    'settings.export.csv': 'Descargar CSV',
    'settings.slo.title': 'SLO Dashboard',
    'settings.slo.engineering': 'Ingeniería',
    'settings.slo.pedagogical': 'Pedagógicos (requieren telemetría)',
    'settings.slo.tests': 'Tests verdes',
    'settings.slo.wcag': 'WCAG AA',
    'settings.slo.lighthouse': 'Lighthouse',
    'settings.slo.levels': 'Niveles activos',
    'settings.slo.gate': 'gate activo',
    'settings.slo.workflow': 'workflow CI',
    'settings.slo.tierRate': 'Éxito Tier {tier} (1er intento)',
    'settings.slo.noData': 'sin datos',
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
    'done.stat.streak': 'Best streak',
    'score.aria': 'Score {score}, streak {streak}',
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

    // Track navigation
    'track.all': 'All',
    'track.ngfw-engineer': 'NGFW Engineer',
    'track.netsec-architect': 'NetSec Architect',

    // Tier headers
    'tier.F.label': 'Fundamentals',
    'tier.N.label': 'NGFW Engineer',
    'tier.A.label': 'NetSec Architect',

    // Badges
    'badge.ngfw-ready': '🎓 NGFW Engineer Ready',
    'badge.architect-ready': '🏆 NetSec Architect Ready',

    // Progress
    'progress.ngfw': 'NGFW Engineer: {done}/{total}',
    'progress.architect': 'NetSec Architect: {done}/{total}',

    // Multi-rule editor
    'multirule.add': 'Add rule',
    'multirule.rule': 'Rule {n}',
    'multirule.shadow.warning': '⚠️ Rule {shadowed} is shadowed by rule {shadowing}',

    // Management Console
    'console.open': 'Console',
    'console.title': 'Management Console',
    'console.back': 'Back to game',
    'console.level': 'Level',
    'console.attempts': 'attempts',
    'console.empty':
      'No gameplay data yet. Complete levels in the simulator to populate the analytics.',
    'console.metric.completed': 'Levels completed',
    'console.metric.attempts': 'Total attempts',
    'console.metric.score': 'Score',
    'console.metric.beststreak': 'Best streak',
    'console.heatmap.title': 'Difficulty heatmap by level',
    'console.heatmap.subtitle':
      'Color reflects the real number of attempts to complete each level (from your local progress).',
    'console.heatmap.aria': 'Heatmap of all 43 levels by difficulty',
    'console.diff.easy': 'Easy',
    'console.diff.medium': 'Medium',
    'console.diff.hard': 'Hard',
    'console.diff.attempted': 'Attempted',
    'console.diff.untried': 'Untried',

    // Console — view navigation
    'console.nav.dashboard': 'Dashboard',
    'console.nav.students': 'Students',
    'console.nav.catalog': 'Levels',
    'console.nav.builder': 'Level Builder',

    // Console — cohorts (Instructor Mode)
    'console.cohorts.new': 'New cohort',
    'console.cohorts.name': 'Cohort name',
    'console.cohorts.namePlaceholder': 'e.g. NGFW Bootcamp Q3',
    'console.cohorts.track': 'Assigned track',
    'console.cohorts.changeTrack': 'Change cohort track',
    'console.cohorts.add': 'Create',
    'console.cohorts.delete': 'Delete cohort',
    'console.cohorts.empty': 'No cohorts yet. Create the first one to assign a track.',
    'console.cohorts.listAria': 'Cohort list',
    'console.cohorts.levels': 'levels in track',

    // Console — level catalog
    'console.catalog.levels': 'levels',
    'console.catalog.aria': 'Level catalog with SME review status',
    'console.sme.verified': 'Verified',
    'console.sme.corrected': 'Corrected',
    'console.sme.pending': 'Pending nuance',

    // Console — Level Builder
    'console.builder.meta': 'Metadata',
    'console.builder.texts': 'Bilingual text (ES / EN)',
    'console.builder.policy': 'Packet and solution',
    'console.builder.titleEs': 'Title (ES)',
    'console.builder.titleEn': 'Title (EN)',
    'console.builder.descEs': 'Description (ES)',
    'console.builder.descEn': 'Description (EN)',
    'console.builder.hintEs': 'Hint (ES)',
    'console.builder.hintEn': 'Hint (EN)',
    'console.builder.explEs': 'Explanation (ES)',
    'console.builder.explEn': 'Explanation (EN)',
    'console.builder.validate': 'Validate level',
    'console.builder.valid': '✓ Valid level: the solution wins in the engine',
    'console.builder.invalid': 'Invalid level',
    'console.builder.missing': 'Missing fields',
    'console.builder.engine': 'The engine rejects the solution',
    'console.builder.copy': 'Copy JSON',
    'console.builder.download': 'Download JSON',

    // Adaptive Policy Tutor (5.1)
    'tutor.title': 'Policy Tutor',
    'tutor.noDiff': 'Your policy matches the solution on the key fields; review the order or the scenario detail.',
    'tutor.askAi': 'Ask the AI tutor for an explanation',
    'tutor.thinking': 'The tutor is analyzing…',
    'tutor.aiError': 'The AI tutor is unavailable right now; use the analysis above.',
    'tutor.fix.srcZone': 'Source zone: you set "{your}", but the rule must use "{correct}".',
    'tutor.fix.dstZone': 'Destination zone: you set "{your}". In PAN-OS the Security Policy uses the post-NAT zone: it must be "{correct}".',
    'tutor.fix.app': 'App-ID: you chose "{your}". App-ID inspects actual content, not the port: use "{correct}".',
    'tutor.fix.service': 'Service: "{your}" is not correct. It must be "{correct}" to scope the allowed ports.',
    'tutor.fix.action': 'Action: you set "{your}", but the scenario requires "{correct}".',
    'tutor.fix.nat': 'NAT: you used "{your}". The NAT Rulebase is a separate table: this scenario needs "{correct}".',
    'tutor.fix.profile': 'Security profile: "{your}" is insufficient. Apply at least "{correct}" to inspect the allowed traffic.',

    // MITRE ATT&CK Mapper (5.2)
    'mitre.title': 'MITRE ATT&CK · technique blocked',

    // Collaborative War Room (5.3)
    'warroom.title': 'War Room',
    'warroom.subtitle': 'Collaborative session · multi-tab, same origin',
    'warroom.join': 'Join the room',
    'warroom.name': 'Your name',
    'warroom.namePlaceholder': 'e.g. Ana',
    'warroom.role': 'Role',
    'warroom.role.security': 'Security Policy',
    'warroom.role.nat': 'NAT',
    'warroom.role.validator': 'Validator',
    'warroom.role.instructor': 'Instructor',
    'warroom.enter': 'Enter',
    'warroom.inRoom': '{count} player(s) already in the room.',
    'warroom.players': 'Players',
    'warroom.you': 'you',
    'warroom.ticket': 'Ticket',
    'warroom.policy': 'Collaborative policy',
    'warroom.youEdit': 'You edit',
    'warroom.commit': 'Commit & validate',
    'warroom.onlyValidator': 'Only the Validator or Instructor can commit',
    'warroom.pause': 'Pause',
    'warroom.resume': 'Resume',
    'warroom.pausedBanner': 'The instructor paused the session: editing frozen.',
    'warroom.newTicket': 'New ticket',
    'warroom.result.win': '✓ Correct configuration',
    'warroom.result.fail': 'Incorrect configuration',
    'warroom.validatedBy': 'Validated by {name}',

    // Console Settings + SLO (WBS 6.3 / 6.2)
    'console.nav.settings': 'Settings',
    'settings.telemetry.title': 'Anonymous telemetry',
    'settings.telemetry.desc':
      'Accumulates aggregate learning counters (wins/failures per level and reason) in your browser. No personal data, nothing sent to any server. Off by default.',
    'settings.telemetry.toggle': 'Enable anonymous telemetry (opt-in)',
    'settings.telemetry.commits': 'Commits',
    'settings.telemetry.wins': 'Wins',
    'settings.telemetry.rate': 'Success rate',
    'settings.telemetry.clear': 'Clear telemetry data',
    'settings.export.title': 'Export analytics',
    'settings.export.desc': 'Download per-level progress as CSV for external analysis.',
    'settings.export.csv': 'Download CSV',
    'settings.slo.title': 'SLO Dashboard',
    'settings.slo.engineering': 'Engineering',
    'settings.slo.pedagogical': 'Pedagogical (require telemetry)',
    'settings.slo.tests': 'Green tests',
    'settings.slo.wcag': 'WCAG AA',
    'settings.slo.lighthouse': 'Lighthouse',
    'settings.slo.levels': 'Active levels',
    'settings.slo.gate': 'gate active',
    'settings.slo.workflow': 'CI workflow',
    'settings.slo.tierRate': 'Tier {tier} success (1st try)',
    'settings.slo.noData': 'no data',
  },
};
