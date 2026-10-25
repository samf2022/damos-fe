// User-facing copy (Spanish, Venezuela). Keep every visible string here.
import type { CertificateStatus, CertificateTypeCode } from '#lib/types.ts';

export const es = {
	app: {
		name: 'Damos Fe',
		tagline: 'Constancias del consejo comunal'
	},
	nav: {
		home: 'Inicio',
		request: 'Solicitar constancia',
		admin: 'Administración'
	},
	home: {
		title: 'Solicita tu constancia',
		description:
			'Pide en línea tu constancia de residencia, de residencia y buena conducta o de buena conducta. El consejo comunal revisará tu solicitud y te avisará cuando esté lista.',
		cta: 'Comenzar solicitud'
	},
	request: {
		title: 'Solicitud de constancia',
		description: 'Completa tus datos tal como aparecen en tu cédula de identidad.',
		certificateType: 'Tipo de constancia',
		selectType: 'Selecciona un tipo',
		resident: {
			nationalId: 'Cédula de identidad',
			nationalIdHint: 'Ejemplo: V-12345678',
			firstNames: 'Nombres',
			lastNames: 'Apellidos',
			gender: 'Sexo',
			maritalStatus: 'Estado civil',
			occupation: 'Ocupación',
			streetAddress: 'Calle o avenida',
			houseNumber: 'Número o nombre de casa',
			phone: 'Teléfono (WhatsApp)',
			phoneHint: 'Ejemplo: 0412-1234567'
		},
		knownSince: 'Tiempo viviendo en la comunidad',
		knownSinceHint: 'Ejemplo: más de 20 años',
		submit: 'Enviar solicitud',
		notAvailable: 'El envío de solicitudes estará disponible muy pronto.',
		noTypes: 'Por ahora no hay tipos de constancia disponibles.'
	},
	requestSent: {
		title: '¡Solicitud enviada!',
		description:
			'Recibimos tu solicitud. El consejo comunal la revisará y te contactará por WhatsApp cuando tu constancia esté lista.',
		back: 'Volver al inicio'
	},
	verify: {
		title: 'Verificación de constancia',
		notFound: 'No encontramos ninguna constancia con este código.',
		holder: 'Titular',
		type: 'Tipo',
		status: 'Estado',
		issuedAt: 'Emitida el',
		expiresAt: 'Vigente hasta',
		valid: 'Constancia válida y vigente',
		expired: 'Constancia vencida',
		notIssued: 'Esta constancia no ha sido emitida'
	},
	gender: {
		F: 'Femenino',
		M: 'Masculino'
	},
	maritalStatus: {
		single: 'Soltero(a)',
		married: 'Casado(a)',
		divorced: 'Divorciado(a)',
		widowed: 'Viudo(a)',
		cohabiting: 'Unión estable de hecho'
	},
	certificateType: {
		residence: 'Constancia de residencia',
		residence_conduct: 'Constancia de residencia y buena conducta',
		conduct: 'Constancia de buena conducta'
	} satisfies Record<CertificateTypeCode, string>,
	certificateStatus: {
		pending: 'Pendiente',
		approved: 'Aprobada',
		rejected: 'Rechazada'
	} satisfies Record<CertificateStatus, string>,
	admin: {
		title: 'Panel administrativo',
		nav: {
			dashboard: 'Inicio',
			certificates: 'Solicitudes',
			residents: 'Residentes',
			signers: 'Firmantes',
			certificateTypes: 'Tipos de constancia',
			settings: 'Datos del consejo',
			users: 'Usuarios'
		},
		dashboard: {
			title: 'Resumen',
			pending: 'Pendientes por revisar',
			approved: 'Aprobadas',
			rejected: 'Rechazadas'
		},
		certificates: {
			title: 'Solicitudes de constancias',
			detailTitle: 'Revisión de solicitud',
			empty: 'No hay solicitudes todavía.'
		},
		residents: { title: 'Residentes' },
		signers: { title: 'Firmantes' },
		certificateTypes: { title: 'Tipos de constancia' },
		settings: { title: 'Datos del consejo comunal' },
		users: { title: 'Usuarios administradores' },
		placeholder: 'Esta sección se construirá en el próximo hito.',
		signedInAs: 'Sesión iniciada como',
		logout: 'Cerrar sesión'
	},
	login: {
		title: 'Iniciar sesión',
		username: 'Usuario',
		password: 'Contraseña',
		submit: 'Entrar',
		invalidCredentials: 'Usuario o contraseña incorrectos.',
		missingFields: 'Ingresa tu usuario y contraseña.'
	},
	errors: {
		notFound: 'Página no encontrada',
		forbidden: 'No tienes permiso para ver esta página.',
		unauthorized: 'Debes iniciar sesión.',
		generic: 'Ocurrió un error inesperado. Intenta de nuevo.',
		backHome: 'Volver al inicio'
	}
} as const;
